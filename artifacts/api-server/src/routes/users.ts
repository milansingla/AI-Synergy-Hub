import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, invitesTable, accessCodesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { UpdateUserProfileBody, CompleteProfileBody } from "@workspace/api-zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

function serializeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName ?? null,
    university: user.university ?? null,
    department: user.department ?? null,
    yearOfStudy: user.yearOfStudy ?? null,
    profileCompleted: user.profileCompleted ?? false,
    createdAt: user.createdAt,
  };
}

// GET /api/users/profile
router.get("/users/profile", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId as string;
    let user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });

    if (!user) {
      const auth = getAuth(req);
      const email = (auth?.sessionClaims?.email as string) || `${userId}@unknown.com`;

      // Check for a pending invite matching this email
      const invite = await db.query.invitesTable.findFirst({
        where: eq(invitesTable.email, email.toLowerCase()),
      });
      const role = invite && !invite.used ? invite.role : "student";

      const [created] = await db
        .insert(usersTable)
        .values({ id: userId, email, role })
        .onConflictDoNothing()
        .returning();

      // Mark invite used
      if (invite && !invite.used) {
        await db.update(invitesTable).set({ used: true }).where(eq(invitesTable.id, invite.id));
      }

      user = created ?? (await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) }));
    }

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(serializeUser(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/profile — admin-only role change
router.put("/users/profile", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId as string;
    const parsed = UpdateUserProfileBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body" });

    const currentUser = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    if (!currentUser) return res.status(404).json({ error: "User not found" });

    if (currentUser.role !== "admin") {
      return res.status(403).json({ error: "Only admins can change roles. Ask your administrator or use an access code." });
    }

    const [updated] = await db
      .update(usersTable)
      .set({ role: parsed.data.role })
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updated) return res.status(404).json({ error: "User not found" });

    res.json(serializeUser(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/profile/complete — set profile info and mark complete
router.put("/users/profile/complete", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId as string;
    const parsed = CompleteProfileBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "fullName and university are required" });
    }

    const [updated] = await db
      .update(usersTable)
      .set({
        fullName: parsed.data.fullName.trim(),
        university: parsed.data.university.trim(),
        department: parsed.data.department?.trim() ?? null,
        yearOfStudy: parsed.data.yearOfStudy?.trim() ?? null,
        profileCompleted: true,
      })
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updated) return res.status(404).json({ error: "User not found" });

    res.json(serializeUser(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users/redeem-code
router.post("/users/redeem-code", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId as string;
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Code is required" });
    }

    const accessCode = await db.query.accessCodesTable.findFirst({
      where: eq(accessCodesTable.code, code.toUpperCase().trim()),
    });

    if (!accessCode) return res.status(400).json({ error: "Invalid code" });
    if (!accessCode.active) return res.status(400).json({ error: "This code has been deactivated" });
    if (accessCode.usedCount >= accessCode.maxUses) {
      return res.status(400).json({ error: "This code has reached its usage limit" });
    }

    // Update user role
    const [updated] = await db
      .update(usersTable)
      .set({ role: accessCode.role })
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updated) return res.status(404).json({ error: "User not found" });

    // Increment usedCount
    await db
      .update(accessCodesTable)
      .set({ usedCount: sql`${accessCodesTable.usedCount} + 1` })
      .where(eq(accessCodesTable.id, accessCode.id));

    res.json(serializeUser(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
