import { Router } from "express";
import { db, profilesTable } from "../db/index";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

const router = Router();

router.use(requireAuth);

const ProfileSchema = z.object({
  name: z.string().min(1).max(100),
  age: z.number().int().min(1).max(120),
  gender: z.string(),
  weightKg: z.number().min(1).max(500),
  heightCm: z.number().min(50).max(250),
  activityLevel: z.string(),
  goal: z.string().default("maintenance"),
  conditions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
});

function fmt(p: typeof profilesTable.$inferSelect) {
  return {
    id: p.id,
    userId: p.userId,
    name: p.name,
    age: p.age,
    gender: p.gender,
    weightKg: p.weightKg,
    heightCm: p.heightCm,
    activityLevel: p.activityLevel,
    goal: p.goal,
    conditions: p.conditions,
    allergies: p.allergies,
    medications: p.medications,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/profile", async (req, res) => {
  try {
    const rows = await db.select().from(profilesTable).where(eq(profilesTable.userId, req.user!.id)).limit(1);
    if (rows.length === 0) {
      res.status(404).json({ error: "No profile found" });
      return;
    }
    res.json(fmt(rows[0]));
  } catch (err) {
    console.error("Failed to get profile:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/profile", async (req, res) => {
  const parsed = ProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  const data = parsed.data;
  const userId = req.user!.id;
  try {
    const existing = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
    let result;
    if (existing.length > 0) {
      const updated = await db.update(profilesTable).set({
        name: data.name,
        age: data.age,
        gender: data.gender,
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        activityLevel: data.activityLevel,
        goal: data.goal,
        conditions: data.conditions,
        allergies: data.allergies,
        medications: data.medications,
        updatedAt: new Date(),
      }).where(eq(profilesTable.userId, userId)).returning();
      result = updated[0];
    } else {
      const inserted = await db.insert(profilesTable).values({
        userId,
        name: data.name,
        age: data.age,
        gender: data.gender,
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        activityLevel: data.activityLevel,
        goal: data.goal,
        conditions: data.conditions,
        allergies: data.allergies,
        medications: data.medications,
      }).returning();
      result = inserted[0];
    }
    res.json(fmt(result));
  } catch (err) {
    console.error("Failed to upsert profile:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
