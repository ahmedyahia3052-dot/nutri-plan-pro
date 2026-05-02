import { Router } from "express";
import { db, nutritionArticlesTable } from "../db/index";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/nutrition/info", async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const articles = category
      ? await db.select().from(nutritionArticlesTable).where(eq(nutritionArticlesTable.category, category))
      : await db.select().from(nutritionArticlesTable);
    res.json(articles);
  } catch (err) {
    console.error("Failed to get nutrition articles:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/nutrition/calorie-calculator", (req, res) => {
  const { age, gender, weightKg, heightCm, activityLevel, goal } = req.body;

  let bmr: number;
  if (gender === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };
  const tdee = bmr * (activityMultipliers[activityLevel] ?? 1.2);

  let targetCalories = tdee;
  if (goal === "lose_weight") targetCalories = tdee - 500;
  if (goal === "gain_weight") targetCalories = tdee + 300;

  const proteinG = (targetCalories * 0.3) / 4;
  const carbsG = (targetCalories * 0.4) / 4;
  const fatG = (targetCalories * 0.3) / 9;

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let bmiCategory = "Normal weight";
  if (bmi < 18.5) bmiCategory = "Underweight";
  else if (bmi >= 25 && bmi < 30) bmiCategory = "Overweight";
  else if (bmi >= 30) bmiCategory = "Obese";

  res.json({
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    proteinG: Math.round(proteinG),
    carbsG: Math.round(carbsG),
    fatG: Math.round(fatG),
    bmi: Math.round(bmi * 10) / 10,
    bmiCategory,
  });
});

export default router;
