import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, interviewsTable, evaluationsTable } from "@workspace/db";
import { eq, count, avg, desc, gte, and } from "drizzle-orm";

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

export default router;
