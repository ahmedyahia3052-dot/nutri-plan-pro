import { Router } from "express";
import { db, profilesTable, dietPlansTable, foodDrugInteractionsTable, medicationsTable, dailyLogsTable, waterLogsTable } from "../db/index";
import { eq, inArray, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/dashboard/summary", async (req, res) => {
  const userId = req.user!.id;
  const today = new Date().toISOString().slice(0, 10);

  try {
    const profiles = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
    const profile = profiles[0];

    const plans = await db.select({
      id: dietPlansTable.id,
      title: dietPlansTable.title,
      targetConditions: dietPlansTable.targetConditions,
      calorieTarget: dietPlansTable.calorieTarget,
      createdAt: dietPlansTable.createdAt,
    }).from(dietPlansTable).where(eq(dietPlansTable.userId, userId)).orderBy(dietPlansTable.createdAt);

    let interactionWarnings = 0;
    if (profile?.medications?.length) {
      const meds = await db.select().from(medicationsTable).where(inArray(medicationsTable.name, profile.medications));
      if (meds.length > 0) {
        const rows = await db.select().from(foodDrugInteractionsTable).where(inArray(foodDrugInteractionsTable.medicationId, meds.map(m => m.id)));
        interactionWarnings = rows.filter(r => r.severity === "major").length;
      }
    }

    const todayFoodLogs = await db.select().from(dailyLogsTable)
      .where(and(eq(dailyLogsTable.userId, userId), eq(dailyLogsTable.date, today)));
    const todayCalories = todayFoodLogs.reduce((s, l) => s + l.calories, 0);
    const todayProtein = todayFoodLogs.reduce((s, l) => s + l.proteinG, 0);
    const todayCarbs = todayFoodLogs.reduce((s, l) => s + l.carbsG, 0);
    const todayFat = todayFoodLogs.reduce((s, l) => s + l.fatG, 0);

    const todayWaterLogs = await db.select().from(waterLogsTable)
      .where(and(eq(waterLogsTable.userId, userId), eq(waterLogsTable.date, today)));
    const todayWaterMl = todayWaterLogs.reduce((s, l) => s + l.amountMl, 0);

    res.json({
      totalDietPlans: plans.length,
      activeConditions: profile?.conditions?.length ?? 0,
      activeAllergies: profile?.allergies?.length ?? 0,
      activeMedications: profile?.medications?.length ?? 0,
      interactionWarnings,
      hasProfile: !!profile,
      recentPlans: plans.slice(-3).map(p => ({ ...p, createdAt: p.createdAt.toISOString() })),
      todayCalories,
      todayProtein: Math.round(todayProtein),
      todayCarbs: Math.round(todayCarbs),
      todayFat: Math.round(todayFat),
      todayWaterMl,
      calorieTarget: profile ? plans.find(p => true)?.calorieTarget ?? 2000 : 2000,
    });
  } catch (err) {
    console.error("Failed to get dashboard summary:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
