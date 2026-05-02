import { Router } from "express";
import { db, profilesTable, dietPlansTable, dailyLogsTable, waterLogsTable, foodDrugInteractionsTable, medicationsTable } from "../../db/index";
import { eq, and, inArray, desc } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get("/summary", async (req, res) => {
  const userId = req.user!.id;
  const generatedAt = new Date().toISOString();

  try {
    const profiles = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
    const profile = profiles[0] ?? null;

    const plans = await db.select().from(dietPlansTable)
      .where(eq(dietPlansTable.userId, userId))
      .orderBy(desc(dietPlansTable.createdAt));

    const allLogs = await db.select().from(dailyLogsTable)
      .where(eq(dailyLogsTable.userId, userId))
      .orderBy(desc(dailyLogsTable.date));

    const allWater = await db.select().from(waterLogsTable)
      .where(eq(waterLogsTable.userId, userId))
      .orderBy(desc(waterLogsTable.date));

    const byDate: Record<string, { calories: number; proteinG: number; carbsG: number; fatG: number; waterMl: number }> = {};
    for (const log of allLogs) {
      if (!byDate[log.date]) byDate[log.date] = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, waterMl: 0 };
      byDate[log.date].calories += log.calories;
      byDate[log.date].proteinG += log.proteinG;
      byDate[log.date].carbsG += log.carbsG;
      byDate[log.date].fatG += log.fatG;
    }
    for (const log of allWater) {
      if (!byDate[log.date]) byDate[log.date] = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, waterMl: 0 };
      byDate[log.date].waterMl += log.amountMl;
    }

    const trackedDays = Object.keys(byDate).sort().slice(-30);
    const dailyStats = trackedDays.map(date => ({ date, ...byDate[date] }));

    const totalCalories = dailyStats.reduce((s, d) => s + d.calories, 0);
    const avgCalories = dailyStats.length > 0 ? Math.round(totalCalories / dailyStats.length) : 0;
    const avgProtein = dailyStats.length > 0 ? Math.round(dailyStats.reduce((s, d) => s + d.proteinG, 0) / dailyStats.length) : 0;
    const avgCarbs = dailyStats.length > 0 ? Math.round(dailyStats.reduce((s, d) => s + d.carbsG, 0) / dailyStats.length) : 0;
    const avgFat = dailyStats.length > 0 ? Math.round(dailyStats.reduce((s, d) => s + d.fatG, 0) / dailyStats.length) : 0;
    const avgWater = dailyStats.length > 0 ? Math.round(dailyStats.reduce((s, d) => s + d.waterMl, 0) / dailyStats.length) : 0;

    let interactionCount = 0;
    let majorInteractions = 0;
    if (profile?.medications?.length) {
      const meds = await db.select().from(medicationsTable).where(inArray(medicationsTable.name, profile.medications));
      if (meds.length > 0) {
        const interactions = await db.select().from(foodDrugInteractionsTable).where(inArray(foodDrugInteractionsTable.medicationId, meds.map(m => m.id)));
        interactionCount = interactions.length;
        majorInteractions = interactions.filter(i => i.severity === "major").length;
      }
    }

    res.json({
      generatedAt,
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
      dietPlans: { total: plans.length, latest: plans[0] ? { title: plans[0].title, calorieTarget: plans[0].calorieTarget } : null },
      nutrition: {
        trackedDays: dailyStats.length,
        avgCaloriesPerDay: avgCalories,
        avgProteinG: avgProtein,
        avgCarbsG: avgCarbs,
        avgFatG: avgFat,
        avgWaterMl: avgWater,
        dailyStats: dailyStats.slice(-14),
      },
      safety: {
        totalInteractions: interactionCount,
        majorInteractions,
      },
    });
  } catch (err) {
    console.error("Reports summary error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
