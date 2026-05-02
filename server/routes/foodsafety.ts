import { Router } from "express";
import { db, foodSafetyTipsTable } from "../db/index";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/food-safety", async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const tips = category
      ? await db.select().from(foodSafetyTipsTable).where(eq(foodSafetyTipsTable.category, category))
      : await db.select().from(foodSafetyTipsTable);
    res.json(tips);
  } catch (err) {
    console.error("Failed to get food safety tips:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
