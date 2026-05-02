import { Router } from "express";
import { db, dailyLogsTable, waterLogsTable, goalConfigsTable } from "../../db/index";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "../../middleware/auth";
import { z } from "zod";

const router = Router();
router.use(requireAuth);

const ConfigSchema = z.object({
  calorieGoal: z.number().int().min(500).max(10000),
  proteinGoalG: z.number().int().min(10).max(500),
  waterGoalMl: z.number().int().min(500).max(10000),
});

// ── GET /config ───────────────────────────────────────────────────────────────
router.get("/config", async (req, res) => {
  const userId = req.user!.id;
  try {
    const rows = await db
      .select()
      .from(goalConfigsTable)
      .where(eq(goalConfigsTable.userId, userId))
      .limit(1);
    const cfg = rows[0];
    res.json({
      calorieGoal: cfg?.calorieGoal ?? 2000,
      proteinGoalG: cfg?.proteinGoalG ?? 50,
      waterGoalMl: cfg?.waterGoalMl ?? 2500,
    });
  } catch (err) {
    console.error("goals config get:", err);
    res.status(500).json({ error: "Failed to get goal config. Run: npm run db:push" });
  }
});

// ── PUT /config ───────────────────────────────────────────────────────────────
router.put("/config", async (req, res) => {
  const userId = req.user!.id;
  const parsed = ConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  const { calorieGoal, proteinGoalG, waterGoalMl } = parsed.data;
  try {
    await db
      .insert(goalConfigsTable)
      .values({ userId, calorieGoal, proteinGoalG, waterGoalMl })
      .onConflictDoUpdate({
        target: goalConfigsTable.userId,
        set: { calorieGoal, proteinGoalG, waterGoalMl, updatedAt: new Date() },
      });
    res.json({ calorieGoal, proteinGoalG, waterGoalMl });
  } catch (err) {
    console.error("goals config put:", err);
    res.status(500).json({ error: "Failed to save goal config." });
  }
});

// ── GET /status ───────────────────────────────────────────────────────────────
router.get("/status", async (req, res) => {
  const userId = req.user!.id;
  try {
    // Fetch goal config (use defaults if none saved yet)
    const cfgRows = await db
      .select()
      .from(goalConfigsTable)
      .where(eq(goalConfigsTable.userId, userId))
      .limit(1);
    const cfg = cfgRows[0] ?? { calorieGoal: 2000, proteinGoalG: 50, waterGoalMl: 2500 };

    // Build date array — last 30 days, today first
    const dates: string[] = [];
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().slice(0, 10));
    }

    // Fetch food + water logs for those dates
    const [foodLogs, waterLogs] = await Promise.all([
      db
        .select()
        .from(dailyLogsTable)
        .where(and(eq(dailyLogsTable.userId, userId), inArray(dailyLogsTable.date, dates))),
      db
        .select()
        .from(waterLogsTable)
        .where(and(eq(waterLogsTable.userId, userId), inArray(waterLogsTable.date, dates))),
    ]);

    // Aggregate per date
    const cal: Record<string, number> = {};
    const prot: Record<string, number> = {};
    const water: Record<string, number> = {};

    for (const l of foodLogs) {
      cal[l.date] = (cal[l.date] ?? 0) + l.calories;
      prot[l.date] = (prot[l.date] ?? 0) + l.proteinG;
    }
    for (const l of waterLogs) {
      water[l.date] = (water[l.date] ?? 0) + l.amountMl;
    }

    // Helper: is a given date fully complete?
    const isDayComplete = (date: string) =>
      (cal[date] ?? 0) >= cfg.calorieGoal &&
      (prot[date] ?? 0) >= cfg.proteinGoalG &&
      (water[date] ?? 0) >= cfg.waterGoalMl;

    // Current streak — count from today (if complete) or yesterday
    const todayComplete = isDayComplete(dates[0]);
    const startIdx = todayComplete ? 0 : 1;
    let currentStreak = 0;
    for (let i = startIdx; i < dates.length; i++) {
      if (isDayComplete(dates[i])) currentStreak++;
      else break;
    }

    // Longest streak across 30-day window
    let longestStreak = 0;
    let run = 0;
    for (let i = dates.length - 1; i >= 0; i--) {
      if (isDayComplete(dates[i])) {
        run++;
        if (run > longestStreak) longestStreak = run;
      } else {
        run = 0;
      }
    }
    if (currentStreak > longestStreak) longestStreak = currentStreak;

    // 7-day history (oldest → newest)
    const history = dates
      .slice(0, 7)
      .reverse()
      .map((date) => ({
        date,
        label: new Date(date + "T12:00:00").toLocaleDateString("en", { weekday: "short" }),
        complete: isDayComplete(date),
        calories: Math.round(cal[date] ?? 0),
        protein: Math.round(prot[date] ?? 0),
        water: Math.round(water[date] ?? 0),
      }));

    res.json({
      config: {
        calorieGoal: cfg.calorieGoal,
        proteinGoalG: cfg.proteinGoalG,
        waterGoalMl: cfg.waterGoalMl,
      },
      today: {
        calories: Math.round(cal[dates[0]] ?? 0),
        protein: Math.round(prot[dates[0]] ?? 0),
        water: Math.round(water[dates[0]] ?? 0),
        caloriesComplete: (cal[dates[0]] ?? 0) >= cfg.calorieGoal,
        proteinComplete: (prot[dates[0]] ?? 0) >= cfg.proteinGoalG,
        waterComplete: (water[dates[0]] ?? 0) >= cfg.waterGoalMl,
        allComplete: todayComplete,
      },
      currentStreak,
      longestStreak,
      streakAtRisk: !todayComplete && isDayComplete(dates[1]),
      history,
    });
  } catch (err) {
    console.error("goals status:", err);
    res.status(500).json({ error: "Failed to compute goal status. Run: npm run db:push" });
  }
});

export default router;
