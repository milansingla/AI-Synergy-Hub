import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, interviewsTable, interviewMessagesTable, jobDescriptionsTable, evaluationsTable } from "@workspace/db";
import { eq, and, count, avg, desc } from "drizzle-orm";
import { CreateInterviewBody, RespondToInterviewBody, GetInterviewParams, RespondToInterviewParams, CompleteInterviewParams } from "@workspace/api-zod";
import { generateQuestions, getNextQuestion, evaluateInterview } from "../lib/aiPrompts";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

const ensureUser = async (userId: string, auth: any) => {
  const existing = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
  if (!existing) {
    const email = auth?.sessionClaims?.email as string || `${userId}@unknown.com`;
    await db.insert(usersTable).values({ id: userId, email }).onConflictDoNothing();
  }
};

// GET /api/interviews
router.get("/interviews", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId as string;
    const interviews = await db
      .select({
        id: interviewsTable.id,
        jdId: interviewsTable.jdId,
        status: interviewsTable.status,
        createdAt: interviewsTable.createdAt,
        role: jobDescriptionsTable.role,
      })
      .from(interviewsTable)
      .leftJoin(jobDescriptionsTable, eq(interviewsTable.jdId, jobDescriptionsTable.id))
      .where(eq(interviewsTable.userId, userId))
      .orderBy(desc(interviewsTable.createdAt));

    const result = await Promise.all(
      interviews.map(async (interview) => {
        const [msgCount] = await db
          .select({ count: count() })
          .from(interviewMessagesTable)
          .where(eq(interviewMessagesTable.interviewId, interview.id));

        const evaluation = await db.query.evaluationsTable.findFirst({
          where: eq(evaluationsTable.interviewId, interview.id),
        });

        return {
          id: interview.id,
          jdId: interview.jdId,
          role: interview.role ?? "Unknown Role",
          status: interview.status,
          score: evaluation?.overallScore ?? null,
          messageCount: Number(msgCount?.count ?? 0),
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

// POST /api/interviews
router.post("/interviews", requireAuth, async (req: any, res: any) => {
  try {
    const parsed = CreateInterviewBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body" });

    const userId = req.userId as string;
    const auth = getAuth(req);
    await ensureUser(userId, auth);

    const jd = await db.query.jobDescriptionsTable.findFirst({
      where: and(eq(jobDescriptionsTable.id, parsed.data.jdId), eq(jobDescriptionsTable.userId, userId)),
    });
    if (!jd) return res.status(404).json({ error: "Job description not found" });

    const [interview] = await db
      .insert(interviewsTable)
      .values({ userId, jdId: parsed.data.jdId, status: "in_progress" })
      .returning();

    const questions = await generateQuestions({ role: jd.role, skills: jd.skills as string[], experienceLevel: jd.experienceLevel });
    const firstQuestion = await getNextQuestion(jd.role, jd.skills as string[], [], questions.all, 0);

    await db.insert(interviewMessagesTable).values({
      interviewId: interview.id,
      role: "ai",
      content: firstQuestion.content,
    });

    res.status(201).json({
      id: interview.id,
      userId: interview.userId,
      jdId: interview.jdId,
      status: interview.status,
      createdAt: interview.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to create interview" });
  }
});

// GET /api/interviews/stats
router.get("/interviews/stats", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId as string;

    const allInterviews = await db
      .select({
        id: interviewsTable.id,
        jdId: interviewsTable.jdId,
        status: interviewsTable.status,
        createdAt: interviewsTable.createdAt,
        role: jobDescriptionsTable.role,
      })
      .from(interviewsTable)
      .leftJoin(jobDescriptionsTable, eq(interviewsTable.jdId, jobDescriptionsTable.id))
      .where(eq(interviewsTable.userId, userId))
      .orderBy(desc(interviewsTable.createdAt));

    const completed = allInterviews.filter((i) => i.status === "completed");

    let totalScore = 0;
    let scoredCount = 0;
    const recentWithScores = await Promise.all(
      allInterviews.slice(0, 5).map(async (interview) => {
        const [msgCount] = await db
          .select({ count: count() })
          .from(interviewMessagesTable)
          .where(eq(interviewMessagesTable.interviewId, interview.id));

        const evaluation = await db.query.evaluationsTable.findFirst({
          where: eq(evaluationsTable.interviewId, interview.id),
        });

        if (evaluation) {
          totalScore += evaluation.overallScore;
          scoredCount++;
        }

        return {
          id: interview.id,
          jdId: interview.jdId,
          role: interview.role ?? "Unknown Role",
          status: interview.status,
          score: evaluation?.overallScore ?? null,
          messageCount: Number(msgCount?.count ?? 0),
          createdAt: interview.createdAt,
        };
      })
    );

    res.json({
      totalInterviews: allInterviews.length,
      completedInterviews: completed.length,
      averageScore: scoredCount > 0 ? totalScore / scoredCount : 0,
      recentInterviews: recentWithScores,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/interviews/:id
router.get("/interviews/:id", requireAuth, async (req: any, res: any) => {
  try {
    const paramsParsed = GetInterviewParams.safeParse({ id: Number(req.params.id) });
    if (!paramsParsed.success) return res.status(400).json({ error: "Invalid interview ID" });

    const userId = req.userId as string;
    const interviewId = paramsParsed.data.id;

    const interview = await db
      .select({
        id: interviewsTable.id,
        jdId: interviewsTable.jdId,
        status: interviewsTable.status,
        createdAt: interviewsTable.createdAt,
        role: jobDescriptionsTable.role,
        userId: interviewsTable.userId,
      })
      .from(interviewsTable)
      .leftJoin(jobDescriptionsTable, eq(interviewsTable.jdId, jobDescriptionsTable.id))
      .where(eq(interviewsTable.id, interviewId))
      .then((rows) => rows[0]);

    if (!interview || interview.userId !== userId) {
      return res.status(404).json({ error: "Interview not found" });
    }

    const messages = await db.query.interviewMessagesTable.findMany({
      where: eq(interviewMessagesTable.interviewId, interviewId),
      orderBy: (t) => [t.createdAt],
    });

    const evaluation = await db.query.evaluationsTable.findFirst({
      where: eq(evaluationsTable.interviewId, interviewId),
    });

    res.json({
      id: interview.id,
      jdId: interview.jdId,
      role: interview.role ?? "Unknown Role",
      status: interview.status,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
      evaluation: evaluation
        ? {
            id: evaluation.id,
            interviewId: evaluation.interviewId,
            overallScore: evaluation.overallScore,
            feedback: evaluation.feedback,
            strengths: evaluation.strengths,
            improvements: evaluation.improvements,
            questionEvals: evaluation.questionEvals,
            createdAt: evaluation.createdAt,
          }
        : null,
      createdAt: interview.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/interviews/:id/respond
router.post("/interviews/:id/respond", requireAuth, async (req: any, res: any) => {
  try {
    const paramsParsed = RespondToInterviewParams.safeParse({ id: Number(req.params.id) });
    const bodyParsed = RespondToInterviewBody.safeParse(req.body);
    if (!paramsParsed.success || !bodyParsed.success) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const userId = req.userId as string;
    const interviewId = paramsParsed.data.id;

    const interview = await db
      .select({
        id: interviewsTable.id,
        jdId: interviewsTable.jdId,
        status: interviewsTable.status,
        userId: interviewsTable.userId,
      })
      .from(interviewsTable)
      .where(eq(interviewsTable.id, interviewId))
      .then((rows) => rows[0]);

    if (!interview || interview.userId !== userId) {
      return res.status(404).json({ error: "Interview not found" });
    }
    if (interview.status === "completed") {
      return res.status(400).json({ error: "Interview is already completed" });
    }

    const jd = await db.query.jobDescriptionsTable.findFirst({
      where: eq(jobDescriptionsTable.id, interview.jdId),
    });
    if (!jd) return res.status(404).json({ error: "Job description not found" });

    await db.insert(interviewMessagesTable).values({
      interviewId,
      role: "user",
      content: bodyParsed.data.content,
    });

    const allMessages = await db.query.interviewMessagesTable.findMany({
      where: eq(interviewMessagesTable.interviewId, interviewId),
      orderBy: (t) => [t.createdAt],
    });

    const conversationHistory = allMessages.map((m) => ({ role: m.role as "ai" | "user", content: m.content }));
    const userAnswerCount = allMessages.filter((m) => m.role === "user").length;

    const questions = await generateQuestions({
      role: jd.role,
      skills: jd.skills as string[],
      experienceLevel: jd.experienceLevel,
    });

    const aiResponse = await getNextQuestion(
      jd.role,
      jd.skills as string[],
      conversationHistory,
      questions.all,
      userAnswerCount
    );

    const [aiMsg] = await db
      .insert(interviewMessagesTable)
      .values({
        interviewId,
        role: "ai",
        content: aiResponse.content,
      })
      .returning();

    if (aiResponse.isComplete) {
      await db.update(interviewsTable).set({ status: "completed" }).where(eq(interviewsTable.id, interviewId));
    }

    res.json({
      id: aiMsg.id,
      content: aiMsg.content,
      isComplete: aiResponse.isComplete,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to process response" });
  }
});

// POST /api/interviews/:id/complete
router.post("/interviews/:id/complete", requireAuth, async (req: any, res: any) => {
  try {
    const paramsParsed = CompleteInterviewParams.safeParse({ id: Number(req.params.id) });
    if (!paramsParsed.success) return res.status(400).json({ error: "Invalid interview ID" });

    const userId = req.userId as string;
    const interviewId = paramsParsed.data.id;

    const interview = await db
      .select({
        id: interviewsTable.id,
        jdId: interviewsTable.jdId,
        status: interviewsTable.status,
        userId: interviewsTable.userId,
      })
      .from(interviewsTable)
      .where(eq(interviewsTable.id, interviewId))
      .then((rows) => rows[0]);

    if (!interview || interview.userId !== userId) {
      return res.status(404).json({ error: "Interview not found" });
    }

    const existingEval = await db.query.evaluationsTable.findFirst({
      where: eq(evaluationsTable.interviewId, interviewId),
    });
    if (existingEval) {
      return res.json({
        id: existingEval.id,
        interviewId: existingEval.interviewId,
        overallScore: existingEval.overallScore,
        feedback: existingEval.feedback,
        strengths: existingEval.strengths,
        improvements: existingEval.improvements,
        questionEvals: existingEval.questionEvals,
        createdAt: existingEval.createdAt,
      });
    }

    const jd = await db.query.jobDescriptionsTable.findFirst({
      where: eq(jobDescriptionsTable.id, interview.jdId),
    });
    if (!jd) return res.status(404).json({ error: "Job description not found" });

    const allMessages = await db.query.interviewMessagesTable.findMany({
      where: eq(interviewMessagesTable.interviewId, interviewId),
      orderBy: (t) => [t.createdAt],
    });

    const conversationHistory = allMessages.map((m) => ({ role: m.role as "ai" | "user", content: m.content }));
    const evaluation = await evaluateInterview(jd.role, jd.skills as string[], conversationHistory);

    await db.update(interviewsTable).set({ status: "completed" }).where(eq(interviewsTable.id, interviewId));

    const [savedEval] = await db
      .insert(evaluationsTable)
      .values({
        interviewId,
        overallScore: evaluation.overallScore,
        feedback: evaluation.feedback,
        strengths: evaluation.strengths,
        improvements: evaluation.improvements,
        questionEvals: evaluation.questionEvals,
      })
      .returning();

    res.json({
      id: savedEval.id,
      interviewId: savedEval.interviewId,
      overallScore: savedEval.overallScore,
      feedback: savedEval.feedback,
      strengths: savedEval.strengths,
      improvements: savedEval.improvements,
      questionEvals: savedEval.questionEvals,
      createdAt: savedEval.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to complete interview" });
  }
});

export default router;
