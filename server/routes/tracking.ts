import { Router } from "express";
import { db, dailyLogsTable, waterLogsTable } from "../db/index";
import { and, eq, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { z } from "zod";

const router = Router();

router.use(requireAuth);

const todayStr = () => new Date().toISOString().slice(0, 10);

function dateStr(d?: string): string {
  return d ?? todayStr();
}

// ── Food Logs ──────────────────────────────────────────────────────────────────

const FoodLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  mealType: z.enum(["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "other"]),
  foodName: z.string().min(1).max(200),
  calories: z.number().int().min(0),
  proteinG: z.number().min(0),
  carbsG: z.number().min(0),
  fatG: z.number().min(0),
});

router.get("/tracking/food", async (req, res) => {
  const userId = req.user!.id;
  const date = dateStr(req.query.date as string | undefined);
  try {
    const logs = await db
      .select()
      .from(dailyLogsTable)
      .where(and(eq(dailyLogsTable.userId, userId), eq(dailyLogsTable.date, date)))
      .orderBy(dailyLogsTable.createdAt);
    res.json(logs);
  } catch (err) {
    console.error("Failed to get food logs:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/tracking/food", async (req, res) => {
  const userId = req.user!.id;
  const parsed = FoodLogSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.errors[0].message });
    return;
  }
  const { date, mealType, foodName, calories, proteinG, carbsG, fatG } = parsed.data;
  try {
    const inserted = await db.insert(dailyLogsTable).values({
      userId,
      date: dateStr(date),
      mealType,
      foodName,
      calories,
      proteinG,
      carbsG,
      fatG,
    }).returning();
    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error("Failed to log food:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.delete("/tracking/food/:id", async (req, res) => {
  const userId = req.user!.id;
  const id = Number(req.params.id);
  try {
    await db
      .delete(dailyLogsTable)
      .where(and(eq(dailyLogsTable.id, id), eq(dailyLogsTable.userId, userId)));
    res.status(204).send();
  } catch (err) {
    console.error("Failed to delete food log:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ── Water Logs ─────────────────────────────────────────────────────────────────

router.get("/tracking/water", async (req, res) => {
  const userId = req.user!.id;
  const date = dateStr(req.query.date as string | undefined);
  try {
    const logs = await db
      .select()
      .from(waterLogsTable)
      .where(and(eq(waterLogsTable.userId, userId), eq(waterLogsTable.date, date)));
    const totalMl = logs.reduce((s, l) => s + l.amountMl, 0);
    res.json({ date, totalMl, logs });
  } catch (err) {
    console.error("Failed to get water logs:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/tracking/water", async (req, res) => {
  const userId = req.user!.id;
  const amountMl = Number(req.body.amountMl);
  const date = dateStr(req.body.date);
  if (!amountMl || amountMl <= 0) {
    res.status(400).json({ error: "amountMl must be a positive number." });
    return;
  }
  try {
    const inserted = await db.insert(waterLogsTable).values({ userId, date, amountMl }).returning();
    res.status(201).json(inserted[0]);
  } catch (err) {
    console.error("Failed to log water:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ── Weekly Trend ───────────────────────────────────────────────────────────────

router.get("/tracking/weekly", async (req, res) => {
  const userId = req.user!.id;
  try {
    const logs = await db
      .select()
      .from(dailyLogsTable)
      .where(eq(dailyLogsTable.userId, userId))
      .orderBy(desc(dailyLogsTable.date));

    const byDate: Record<string, { calories: number; proteinG: number; carbsG: number; fatG: number }> = {};
    for (const log of logs) {
      if (!byDate[log.date]) byDate[log.date] = { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 };
      byDate[log.date].calories += log.calories;
      byDate[log.date].proteinG += log.proteinG;
      byDate[log.date].carbsG += log.carbsG;
      byDate[log.date].fatG += log.fatG;
    }

    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    const trend = days.map(date => ({
      date,
      label: new Date(date + "T12:00:00").toLocaleDateString("en", { weekday: "short" }),
      ...(byDate[date] ?? { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }),
    }));

    res.json(trend);
  } catch (err) {
    console.error("Failed to get weekly trend:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
