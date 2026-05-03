import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, interviewsTable, evaluationsTable, jobDescriptionsTable, invitesTable } from "@workspace/db";
import { eq, count, avg, desc, gte, and, asc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { parseJD } from "../lib/aiPrompts";

const router = Router();

const requireFacility = async (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!user || (user.role !== "facility" && user.role !== "admin")) {
    return res.status(403).json({ error: "Forbidden" });
  }
  req.userId = userId;
  next();
};

// GET /api/facility/students
router.get("/facility/students", requireFacility, async (req: any, res: any) => {
  try {
    const students = await db.query.usersTable.findMany({
      where: eq(usersTable.role, "student"),
      orderBy: (t) => [desc(t.createdAt)],
    });

    const result = await Promise.all(
      students.map(async (student) => {
        const [{ count: total }] = await db
          .select({ count: count() })
          .from(interviewsTable)
          .where(eq(interviewsTable.userId, student.id));

        const [{ count: completed }] = await db
          .select({ count: count() })
          .from(interviewsTable)
          .where(
            and(
              eq(interviewsTable.userId, student.id),
              eq(interviewsTable.status, "completed")
            )
          );

        const avgResult = await db
          .select({ avg: avg(evaluationsTable.overallScore) })
          .from(evaluationsTable)
          .innerJoin(interviewsTable, eq(evaluationsTable.interviewId, interviewsTable.id))
          .where(eq(interviewsTable.userId, student.id));

        const lastInterview = await db.query.interviewsTable.findFirst({
          where: eq(interviewsTable.userId, student.id),
          orderBy: (t) => [desc(t.createdAt)],
        });

        return {
          id: student.id,
          email: student.email,
          fullName: student.fullName,
          department: student.department,
          yearOfStudy: student.yearOfStudy,
          totalInterviews: Number(total),
          completedInterviews: Number(completed),
          averageScore: avgResult[0]?.avg ? Number(avgResult[0].avg) : null,
          lastActive: lastInterview?.createdAt ?? null,
          createdAt: student.createdAt,
        };
      })
    );

    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/facility/stats
router.get("/facility/stats", requireFacility, async (req: any, res: any) => {
  try {
    const [{ count: totalStudents }] = await db
      .select({ count: count() })
      .from(usersTable)
      .where(eq(usersTable.role, "student"));

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentStudentIds = await db
      .select({ userId: interviewsTable.userId })
      .from(interviewsTable)
      .innerJoin(usersTable, eq(interviewsTable.userId, usersTable.id))
      .where(
        and(eq(usersTable.role, "student"), gte(interviewsTable.createdAt, oneWeekAgo))
      );
    const activeThisWeek = new Set(recentStudentIds.map((r) => r.userId)).size;

    const avgResult = await db
      .select({ avg: avg(evaluationsTable.overallScore) })
      .from(evaluationsTable)
      .innerJoin(interviewsTable, eq(evaluationsTable.interviewId, interviewsTable.id))
      .innerJoin(usersTable, eq(interviewsTable.userId, usersTable.id))
      .where(eq(usersTable.role, "student"));

    const [{ count: totalInterviews }] = await db
      .select({ count: count() })
      .from(interviewsTable)
      .innerJoin(usersTable, eq(interviewsTable.userId, usersTable.id))
      .where(eq(usersTable.role, "student"));

    const [{ count: completedInterviews }] = await db
      .select({ count: count() })
      .from(interviewsTable)
      .innerJoin(usersTable, eq(interviewsTable.userId, usersTable.id))
      .where(
        and(eq(usersTable.role, "student"), eq(interviewsTable.status, "completed"))
      );

    const total = Number(totalInterviews);
    const completed = Number(completedInterviews);

    res.json({
      totalStudents: Number(totalStudents),
      activeThisWeek,
      averageScore: avgResult[0]?.avg ? Number(avgResult[0].avg) : 0,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/facility/jds
router.get("/facility/jds", requireFacility, async (req: any, res: any) => {
  try {
    const userId = req.userId as string;
    const jds = await db.query.jobDescriptionsTable.findMany({
      where: eq(jobDescriptionsTable.userId, userId),
      orderBy: (t) => [desc(t.createdAt)],
    });
    res.json(
      jds.map((jd) => ({
        id: jd.id,
        role: jd.role,
        company: jd.company,
        skills: jd.skills,
        experienceLevel: jd.experienceLevel,
        createdAt: jd.createdAt,
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/facility/bulk-students
router.post("/facility/bulk-students", requireFacility, async (req: any, res: any) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: "students must be a non-empty array" });
    }
    if (students.length > 500) {
      return res.status(400).json({ error: "Maximum 500 students per upload" });
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const entry of students) {
      const email = typeof entry.email === "string" ? entry.email.toLowerCase().trim() : "";
      if (!email || !email.includes("@") || !email.includes(".")) {
        errors.push(`Invalid email: "${entry.email}"`);
        continue;
      }

      const existing = await db.query.usersTable.findFirst({
        where: eq(usersTable.email, email),
      });
      if (existing) { skipped++; continue; }

      const existingInvite = await db.query.invitesTable.findFirst({
        where: eq(invitesTable.email, email),
      });
      if (existingInvite) { skipped++; continue; }

      try {
        const token = randomBytes(16).toString("hex");
        await db.insert(invitesTable).values({ email, role: "student", token }).onConflictDoNothing();
        created++;
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

// POST /api/facility/bulk-jds
router.post("/facility/bulk-jds", requireFacility, async (req: any, res: any) => {
  try {
    const { jds } = req.body;
    if (!Array.isArray(jds) || jds.length === 0) {
      return res.status(400).json({ error: "jds must be a non-empty array of strings" });
    }
    if (jds.length > 20) {
      return res.status(400).json({ error: "Maximum 20 JDs per upload" });
    }

    const userId = req.userId as string;
    const created: object[] = [];
    const errors: string[] = [];

    for (const rawText of jds) {
      if (typeof rawText !== "string" || rawText.trim().length < 50) {
        errors.push("Skipped: JD text too short (minimum 50 characters)");
        continue;
      }
      try {
        const parsed = await parseJD(rawText.trim());
        const [jd] = await db
          .insert(jobDescriptionsTable)
          .values({
            userId,
            rawText: rawText.trim(),
            role: parsed.role,
            company: parsed.company ?? "",
            skills: parsed.skills,
            experienceLevel: parsed.experienceLevel,
            responsibilities: parsed.responsibilities ?? [],
          })
          .returning();
        created.push({
          id: jd.id,
          role: jd.role,
          company: jd.company,
          skills: jd.skills,
          experienceLevel: jd.experienceLevel,
          createdAt: jd.createdAt,
        });
      } catch (e) {
        errors.push(`Failed to parse JD: ${e instanceof Error ? e.message : "Unknown error"}`);
      }
    }

    res.json({ created, errors });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/facility/schedule
router.post("/facility/schedule", requireFacility, async (req: any, res: any) => {
  try {
    const { jdId, studentIds } = req.body;
    if (!jdId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ error: "jdId and studentIds are required" });
    }

    const jd = await db.query.jobDescriptionsTable.findFirst({
      where: eq(jobDescriptionsTable.id, Number(jdId)),
    });
    if (!jd) return res.status(404).json({ error: "Job description not found" });

    let scheduled = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const studentId of studentIds) {
      const student = await db.query.usersTable.findFirst({
        where: eq(usersTable.id, studentId),
      });
      if (!student || student.role !== "student") {
        errors.push(`User ${studentId} is not a student`);
        continue;
      }

      const existing = await db.query.interviewsTable.findFirst({
        where: and(
          eq(interviewsTable.userId, studentId),
          eq(interviewsTable.jdId, Number(jdId))
        ),
      });
      if (existing) { skipped++; continue; }

      try {
        await db.insert(interviewsTable).values({
          userId: studentId,
          jdId: Number(jdId),
          status: "scheduled",
        });
        scheduled++;
      } catch {
        errors.push(`Failed to schedule for student ${studentId}`);
      }
    }

    res.json({ scheduled, skipped, errors });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/facility/report
router.get("/facility/report", requireFacility, async (req: any, res: any) => {
  try {
    const students = await db.query.usersTable.findMany({
      where: eq(usersTable.role, "student"),
      orderBy: (t) => [asc(t.email)],
    });

    const rows = await Promise.all(
      students.map(async (student) => {
        const [{ count: total }] = await db
          .select({ count: count() })
          .from(interviewsTable)
          .where(eq(interviewsTable.userId, student.id));

        const [{ count: completed }] = await db
          .select({ count: count() })
          .from(interviewsTable)
          .where(and(eq(interviewsTable.userId, student.id), eq(interviewsTable.status, "completed")));

        const avgResult = await db
          .select({ avg: avg(evaluationsTable.overallScore) })
          .from(evaluationsTable)
          .innerJoin(interviewsTable, eq(evaluationsTable.interviewId, interviewsTable.id))
          .where(eq(interviewsTable.userId, student.id));

        const lastInterview = await db.query.interviewsTable.findFirst({
          where: eq(interviewsTable.userId, student.id),
          orderBy: (t) => [desc(t.createdAt)],
        });

        const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
        return [
          esc(student.email),
          esc(student.fullName ?? ""),
          esc(student.department ?? ""),
          esc(student.yearOfStudy ?? ""),
          esc(String(Number(total))),
          esc(String(Number(completed))),
          esc(avgResult[0]?.avg ? String(Math.round(Number(avgResult[0].avg))) : ""),
          esc(lastInterview?.createdAt ? new Date(lastInterview.createdAt).toISOString().slice(0, 10) : ""),
        ].join(",");
      })
    );

    const header = "Email,Full Name,Department,Year of Study,Total Interviews,Completed,Avg Score (%),Last Active";
    const csv = [header, ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="cohort-report-${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.send(csv);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

export default router;
