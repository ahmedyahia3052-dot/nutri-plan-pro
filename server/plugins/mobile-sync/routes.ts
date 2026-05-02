import { Router } from "express";
import { db, profilesTable, dietPlansTable, dailyLogsTable, waterLogsTable } from "../../db/index";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/sync", async (req, res) => {
  const userId = req.user!.id;
  const syncedAt = new Date().toISOString();

  try {
    const profiles = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
    const profile = profiles[0] ?? null;

    const plans = await db.select().from(dietPlansTable)
      .where(eq(dietPlansTable.userId, userId))
      .orderBy(desc(dietPlansTable.createdAt))
      .limit(10);

    const recentLogs = await db.select().from(dailyLogsTable)
      .where(eq(dailyLogsTable.userId, userId))
      .orderBy(desc(dailyLogsTable.createdAt))
      .limit(50);

    const recentWater = await db.select().from(waterLogsTable)
      .where(eq(waterLogsTable.userId, userId))
      .orderBy(desc(waterLogsTable.createdAt))
      .limit(50);

    const today = new Date().toISOString().slice(0, 10);
    const todayLogs = recentLogs.filter(l => l.date === today);
    const todayCalories = todayLogs.reduce((s, l) => s + l.calories, 0);
    const todayWater = recentWater.filter(l => l.date === today).reduce((s, l) => s + l.amountMl, 0);

    res.json({
      meta: {
        syncedAt,
        userId,
        schemaVersion: "2.0.0",
        platform: "nutri-plan-pro",
      },
      profile: profile ? {
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        weightKg: profile.weightKg,
        heightCm: profile.heightCm,
        activityLevel: profile.activityLevel,
        goal: profile.goal,
        conditions: profile.conditions,
        allergies: profile.allergies,
        medications: profile.medications,
      } : null,
      dietPlans: plans.map(p => ({
        id: p.id,
        title: p.title,
        targetConditions: p.targetConditions,
        calorieTarget: p.calorieTarget,
        meals: p.meals,
        weeklyPlan: p.weeklyPlan,
        createdAt: p.createdAt.toISOString(),
      })),
      tracking: {
        today: {
          date: today,
          calories: todayCalories,
          waterMl: todayWater,
          foodEntries: todayLogs,
        },
        recentFoodLogs: recentLogs.slice(0, 30),
        recentWaterLogs: recentWater.slice(0, 30),
      },
    });
  } catch (err) {
    console.error("Mobile sync error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/status", (_req, res) => {
  res.json({
    status: "ready",
    syncEndpoint: "/api/plugins/mobile-sync/sync",
    method: "GET",
    auth: "Bearer token required",
    description: "Returns complete user data bundle for React Native / mobile app integration.",
  });
});

export default router;
