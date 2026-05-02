import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateUserProfileBody } from "@workspace/api-zod";

const router = Router();

const requireAuth = (req: any, res: any, next: any) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
};

// GET /api/users/profile
router.get("/users/profile", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId as string;
    let user = await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });

    if (!user) {
      const auth = getAuth(req);
      const email = auth?.sessionClaims?.email as string || `${userId}@unknown.com`;
      const [created] = await db
        .insert(usersTable)
        .values({ id: userId, email })
        .onConflictDoNothing()
        .returning();
      user = created ?? await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) });
    }

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/profile
router.put("/users/profile", requireAuth, async (req: any, res: any) => {
  try {
    const userId = req.userId as string;
    const parsed = UpdateUserProfileBody.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid request body" });

    const [updated] = await db
      .update(usersTable)
      .set({ role: parsed.data.role })
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updated) return res.status(404).json({ error: "User not found" });

    res.json({
      id: updated.id,
      email: updated.email,
      role: updated.role,
      createdAt: updated.createdAt,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
