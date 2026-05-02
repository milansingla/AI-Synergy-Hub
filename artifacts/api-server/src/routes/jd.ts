import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable, jobDescriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UploadJDBody } from "@workspace/api-zod";
import { parseJD } from "../lib/aiPrompts";

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

// POST /api/jd/upload
router.post("/jd/upload", requireAuth, async (req: any, res: any) => {
  try {
    const parsed = UploadJDBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body" });

    const userId = req.userId as string;
    const auth = getAuth(req);
    await ensureUser(userId, auth);

    const jdText = parsed.data.text;
    const parsedData = await parseJD(jdText);

    const [jd] = await db
      .insert(jobDescriptionsTable)
      .values({
        userId,
        rawText: jdText,
        role: parsedData.role,
        skills: parsedData.skills,
        experienceLevel: parsedData.experienceLevel,
      })
      .returning();

    res.status(201).json({
      id: jd.id,
      role: jd.role,
      skills: jd.skills,
      experienceLevel: jd.experienceLevel,
      rawText: jd.rawText,
      createdAt: jd.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Failed to process job description" });
  }
});

export default router;
