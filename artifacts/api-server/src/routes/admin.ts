import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, interviewsTable, evaluationsTable } from "@workspace/db";
import { eq, count, avg } from "drizzle-orm";

const router = Router();

const requireAdmin = async (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  req.userId = userId;
  next();
};

// GET /api/admin/users
router.get("/admin/users", requireAdmin, async (req: any, res: any) => {
  try {
    const users = await db.query.usersTable.findMany({
      orderBy: (t) => [t.createdAt],
    });

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
    const completedInterviewsResult = await db
      .select({ count: count() })
      .from(interviewsTable)
      .where(eq(interviewsTable.status, "completed"));
    const [{ count: completedInterviews }] = completedInterviewsResult;

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

export default router;
