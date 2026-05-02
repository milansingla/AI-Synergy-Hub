import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, interviewsTable, evaluationsTable, interviewMessagesTable, jobDescriptionsTable, invitesTable, accessCodesTable } from "@workspace/db";
import { eq, count, avg, desc } from "drizzle-orm";
import { randomBytes } from "crypto";

const router = Router();

const requireAdmin = async (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!user || user.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  req.userId = userId;
  next();
};

// GET /api/admin/users
router.get("/admin/users", requireAdmin, async (req: any, res: any) => {
  try {
    const users = await db.query.usersTable.findMany({ orderBy: (t) => [t.createdAt] });
    const result = await Promise.all(
      users.map(async (user) => {
        const [{ count: interviewCount }] = await db
          .select({ count: count() })
          .from(interviewsTable)
          .where(eq(interviewsTable.userId, user.id));
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          totalInterviews: Number(interviewCount),
          createdAt: user.createdAt,
        };
      })
    );
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/stats
router.get("/admin/stats", requireAdmin, async (req: any, res: any) => {
  try {
    const [{ count: totalUsers }] = await db.select({ count: count() }).from(usersTable);
    const [{ count: totalInterviews }] = await db.select({ count: count() }).from(interviewsTable);
    const [{ count: completedInterviews }] = await db
      .select({ count: count() })
      .from(interviewsTable)
      .where(eq(interviewsTable.status, "completed"));
    const avgResult = await db.select({ avg: avg(evaluationsTable.overallScore) }).from(evaluationsTable);
    const averageScore = Number(avgResult[0]?.avg ?? 0);
    res.json({
      totalUsers: Number(totalUsers),
      totalInterviews: Number(totalInterviews),
      completedInterviews: Number(completedInterviews),
      averageScore,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/admin/users/:userId/role
router.put("/admin/users/:userId/role", requireAdmin, async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    if (!role || !["student", "admin", "facility"].includes(role)) {
      return res.status(400).json({ error: "Role must be 'student', 'admin', or 'facility'" });
    }
    const [updated] = await db
      .update(usersTable)
      .set({ role })
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated) return res.status(404).json({ error: "User not found" });
    const [{ count: interviewCount }] = await db
      .select({ count: count() })
      .from(interviewsTable)
      .where(eq(interviewsTable.userId, userId));
    res.json({
      id: updated.id,
      email: updated.email,
      role: updated.role,
      totalInterviews: Number(interviewCount),
      createdAt: updated.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/users/:userId
router.delete("/admin/users/:userId", requireAdmin, async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const adminId = req.userId as string;
    if (userId === adminId) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }
    const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    if (!user) return res.status(404).json({ error: "User not found" });

    const userInterviews = await db.query.interviewsTable.findMany({
      where: eq(interviewsTable.userId, userId),
    });
    for (const interview of userInterviews) {
      await db.delete(evaluationsTable).where(eq(evaluationsTable.interviewId, interview.id));
      await db.delete(interviewMessagesTable).where(eq(interviewMessagesTable.interviewId, interview.id));
    }
    await db.delete(interviewsTable).where(eq(interviewsTable.userId, userId));
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    res.json({ error: "User deleted successfully" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/all-interviews
router.get("/admin/all-interviews", requireAdmin, async (req: any, res: any) => {
  try {
    const interviews = await db
      .select({
        id: interviewsTable.id,
        userId: interviewsTable.userId,
        jdId: interviewsTable.jdId,
        status: interviewsTable.status,
        createdAt: interviewsTable.createdAt,
        role: jobDescriptionsTable.role,
        userEmail: usersTable.email,
      })
      .from(interviewsTable)
      .leftJoin(jobDescriptionsTable, eq(interviewsTable.jdId, jobDescriptionsTable.id))
      .leftJoin(usersTable, eq(interviewsTable.userId, usersTable.id))
      .orderBy(desc(interviewsTable.createdAt));

    const result = await Promise.all(
      interviews.map(async (interview) => {
        const [{ count: msgCount }] = await db
          .select({ count: count() })
          .from(interviewMessagesTable)
          .where(eq(interviewMessagesTable.interviewId, interview.id));
        const evaluation = await db.query.evaluationsTable.findFirst({
          where: eq(evaluationsTable.interviewId, interview.id),
        });
        return {
          id: interview.id,
          userId: interview.userId,
          userEmail: interview.userEmail ?? "unknown@unknown.com",
          role: interview.role ?? "Unknown Role",
          status: interview.status,
          score: evaluation?.overallScore ?? null,
          messageCount: Number(msgCount ?? 0),
          createdAt: interview.createdAt,
        };
      })
    );
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/interviews/:id
router.delete("/admin/interviews/:id", requireAdmin, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid interview ID" });
    const interview = await db.query.interviewsTable.findFirst({ where: eq(interviewsTable.id, id) });
    if (!interview) return res.status(404).json({ error: "Interview not found" });
    await db.delete(evaluationsTable).where(eq(evaluationsTable.interviewId, id));
    await db.delete(interviewMessagesTable).where(eq(interviewMessagesTable.interviewId, id));
    await db.delete(interviewsTable).where(eq(interviewsTable.id, id));
    res.json({ error: "Interview deleted successfully" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Invites ────────────────────────────────────────────────────────────────

// GET /api/admin/invites
router.get("/admin/invites", requireAdmin, async (req: any, res: any) => {
  try {
    const invites = await db.query.invitesTable.findMany({ orderBy: (t) => [desc(t.createdAt)] });
    res.json(invites);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/invites
router.post("/admin/invites", requireAdmin, async (req: any, res: any) => {
  try {
    const { email, role } = req.body;
    if (!email || !role || !["student", "admin", "facility"].includes(role)) {
      return res.status(400).json({ error: "Valid email and role required" });
    }
    const token = randomBytes(16).toString("hex");
    const [invite] = await db
      .insert(invitesTable)
      .values({ email: email.toLowerCase().trim(), role, token })
      .returning();
    res.status(201).json(invite);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/invites/:id
router.delete("/admin/invites/:id", requireAdmin, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    await db.delete(invitesTable).where(eq(invitesTable.id, id));
    res.json({ error: "Invite deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Access Codes ───────────────────────────────────────────────────────────

// GET /api/admin/access-codes
router.get("/admin/access-codes", requireAdmin, async (req: any, res: any) => {
  try {
    const codes = await db.query.accessCodesTable.findMany({ orderBy: (t) => [desc(t.createdAt)] });
    res.json(codes);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/access-codes
router.post("/admin/access-codes", requireAdmin, async (req: any, res: any) => {
  try {
    const { role, code, maxUses } = req.body;
    if (!role || !["student", "admin", "facility"].includes(role)) {
      return res.status(400).json({ error: "Valid role required" });
    }
    const finalCode = code
      ? String(code).toUpperCase().trim()
      : `${role.toUpperCase().slice(0, 3)}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const [created] = await db
      .insert(accessCodesTable)
      .values({ code: finalCode, role, maxUses: maxUses ? Number(maxUses) : 100 })
      .returning();
    res.status(201).json(created);
  } catch (err: any) {
    if (err?.code === "23505") {
      return res.status(400).json({ error: "Code already exists, try a different one" });
    }
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/access-codes/:id
router.delete("/admin/access-codes/:id", requireAdmin, async (req: any, res: any) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    await db.delete(accessCodesTable).where(eq(accessCodesTable.id, id));
    res.json({ error: "Access code deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Bulk invite ─────────────────────────────────────────────────────────────

// POST /api/admin/bulk-invite
router.post("/admin/bulk-invite", requireAdmin, async (req: any, res: any) => {
  try {
    const { invites } = req.body;
    if (!Array.isArray(invites) || invites.length === 0) {
      return res.status(400).json({ error: "invites must be a non-empty array" });
    }
    if (invites.length > 500) {
      return res.status(400).json({ error: "Maximum 500 entries per upload" });
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const entry of invites) {
      const email = typeof entry.email === "string" ? entry.email.toLowerCase().trim() : "";
      const role = typeof entry.role === "string" ? entry.role.toLowerCase().trim() : "";

      if (!email || !email.includes("@") || !email.includes(".")) {
        errors.push(`Invalid email: "${entry.email}"`);
        continue;
      }
      if (!["student", "facility"].includes(role)) {
        errors.push(`Invalid role for ${email}: must be "student" or "facility"`);
        continue;
      }

      try {
        const token = randomBytes(16).toString("hex");
        const result = await db
          .insert(invitesTable)
          .values({ email, role, token })
          .onConflictDoNothing()
          .returning();
        if (result.length > 0) {
          created++;
        } else {
          skipped++;
        }
      } catch {
        skipped++;
      }
    }

    res.json({ created, skipped, errors });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
