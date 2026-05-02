import { Router } from "express";
import { db, dietPlansTable, profilesTable } from "../db/index";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

const CONDITION_FOODS: Record<string, { foods: { name: string; portion: string; calories: number; proteinG: number; carbsG: number; fatG: number; notes?: string }[] }> = {
  diabetes: {
    foods: [
      { name: "Steel-cut oatmeal", portion: "1/2 cup dry", calories: 150, proteinG: 5, carbsG: 27, fatG: 3, notes: "Low GI" },
      { name: "Grilled chicken breast", portion: "4 oz", calories: 185, proteinG: 35, carbsG: 0, fatG: 4 },
      { name: "Quinoa", portion: "1/2 cup cooked", calories: 111, proteinG: 4, carbsG: 20, fatG: 2, notes: "Complete protein, low GI" },
      { name: "Steamed broccoli", portion: "1 cup", calories: 55, proteinG: 4, carbsG: 11, fatG: 1 },
      { name: "Greek yogurt (plain)", portion: "6 oz", calories: 100, proteinG: 17, carbsG: 6, fatG: 0 },
      { name: "Almonds", portion: "1 oz", calories: 164, proteinG: 6, carbsG: 6, fatG: 14 },
      { name: "Salmon", portion: "4 oz", calories: 200, proteinG: 28, carbsG: 0, fatG: 9, notes: "Rich in omega-3" },
      { name: "Lentil soup", portion: "1 cup", calories: 230, proteinG: 18, carbsG: 40, fatG: 1 },
    ],
  },
  hypertension: {
    foods: [
      { name: "Banana", portion: "1 medium", calories: 105, proteinG: 1, carbsG: 27, fatG: 0, notes: "High potassium" },
      { name: "Spinach salad", portion: "2 cups", calories: 14, proteinG: 2, carbsG: 2, fatG: 0 },
      { name: "Baked potato (with skin)", portion: "1 medium", calories: 161, proteinG: 4, carbsG: 37, fatG: 0, notes: "Excellent potassium" },
      { name: "Low-fat milk", portion: "1 cup", calories: 102, proteinG: 8, carbsG: 12, fatG: 3 },
      { name: "Oatmeal", portion: "1 cup cooked", calories: 166, proteinG: 6, carbsG: 28, fatG: 4 },
      { name: "Roasted beets", portion: "1/2 cup", calories: 37, proteinG: 1, carbsG: 8, fatG: 0, notes: "Natural nitrates" },
      { name: "Grilled turkey breast", portion: "4 oz", calories: 177, proteinG: 34, carbsG: 0, fatG: 3 },
      { name: "Kidney beans", portion: "1/2 cup", calories: 112, proteinG: 8, carbsG: 20, fatG: 0 },
    ],
  },
  heart_disease: {
    foods: [
      { name: "Wild salmon", portion: "4 oz", calories: 200, proteinG: 28, carbsG: 0, fatG: 9, notes: "Omega-3 fatty acids" },
      { name: "Walnuts", portion: "1 oz", calories: 185, proteinG: 4, carbsG: 4, fatG: 18, notes: "Heart-healthy ALA" },
      { name: "Olive oil drizzle", portion: "1 tbsp", calories: 119, proteinG: 0, carbsG: 0, fatG: 14 },
      { name: "Avocado", portion: "1/2 medium", calories: 114, proteinG: 1, carbsG: 6, fatG: 10 },
      { name: "Whole wheat bread", portion: "2 slices", calories: 160, proteinG: 8, carbsG: 28, fatG: 2 },
      { name: "Black beans", portion: "1/2 cup", calories: 114, proteinG: 8, carbsG: 20, fatG: 0 },
      { name: "Blueberries", portion: "1 cup", calories: 84, proteinG: 1, carbsG: 21, fatG: 0, notes: "Antioxidants" },
      { name: "Steamed broccoli", portion: "1 cup", calories: 55, proteinG: 4, carbsG: 11, fatG: 1 },
    ],
  },
  kidney_disease: {
    foods: [
      { name: "Egg whites", portion: "2 large", calories: 34, proteinG: 7, carbsG: 0, fatG: 0, notes: "Low phosphorus" },
      { name: "White rice", portion: "1/2 cup cooked", calories: 102, proteinG: 2, carbsG: 22, fatG: 0 },
      { name: "Cabbage", portion: "1 cup", calories: 22, proteinG: 1, carbsG: 5, fatG: 0 },
      { name: "Cauliflower", portion: "1 cup", calories: 25, proteinG: 2, carbsG: 5, fatG: 0 },
      { name: "Apple", portion: "1 medium", calories: 95, proteinG: 0, carbsG: 25, fatG: 0, notes: "Low potassium" },
      { name: "Chicken breast", portion: "3 oz", calories: 140, proteinG: 26, carbsG: 0, fatG: 3 },
      { name: "White bread", portion: "2 slices", calories: 134, proteinG: 4, carbsG: 26, fatG: 1 },
      { name: "Cranberry juice (unsweetened)", portion: "1/2 cup", calories: 46, proteinG: 0, carbsG: 12, fatG: 0 },
    ],
  },
  obesity: {
    foods: [
      { name: "Grilled chicken breast", portion: "5 oz", calories: 231, proteinG: 44, carbsG: 0, fatG: 5 },
      { name: "Mixed green salad", portion: "3 cups", calories: 45, proteinG: 3, carbsG: 8, fatG: 1, notes: "High fiber, filling" },
      { name: "Brown rice", portion: "1/2 cup cooked", calories: 108, proteinG: 3, carbsG: 22, fatG: 1 },
      { name: "Lentils", portion: "1/2 cup cooked", calories: 115, proteinG: 9, carbsG: 20, fatG: 0 },
      { name: "Apple with skin", portion: "1 medium", calories: 95, proteinG: 0, carbsG: 25, fatG: 0 },
      { name: "Low-fat cottage cheese", portion: "1/2 cup", calories: 90, proteinG: 12, carbsG: 5, fatG: 2 },
      { name: "Steamed vegetables", portion: "2 cups", calories: 70, proteinG: 4, carbsG: 14, fatG: 0 },
      { name: "Boiled eggs", portion: "2 large", calories: 143, proteinG: 13, carbsG: 1, fatG: 10 },
    ],
  },
  default: {
    foods: [
      { name: "Oatmeal with berries", portion: "1 cup cooked + 1/2 cup berries", calories: 250, proteinG: 8, carbsG: 45, fatG: 4 },
      { name: "Grilled chicken breast", portion: "4 oz", calories: 185, proteinG: 35, carbsG: 0, fatG: 4 },
      { name: "Brown rice", portion: "1/2 cup cooked", calories: 108, proteinG: 3, carbsG: 22, fatG: 1 },
      { name: "Mixed salad", portion: "2 cups", calories: 50, proteinG: 3, carbsG: 9, fatG: 1 },
      { name: "Greek yogurt", portion: "6 oz", calories: 100, proteinG: 17, carbsG: 6, fatG: 0 },
      { name: "Almonds", portion: "1 oz", calories: 164, proteinG: 6, carbsG: 6, fatG: 14 },
      { name: "Salmon", portion: "4 oz", calories: 200, proteinG: 28, carbsG: 0, fatG: 9 },
      { name: "Steamed broccoli", portion: "1 cup", calories: 55, proteinG: 4, carbsG: 11, fatG: 1 },
    ],
  },
};

const ALLERGY_EXCLUDE: Record<string, string[]> = {
  peanuts: ["peanut"],
  tree_nuts: ["almonds", "walnuts", "cashews", "pecans", "pistachios"],
  dairy: ["milk", "cheese", "butter", "cream", "yogurt", "cottage cheese"],
  eggs: ["egg", "eggs"],
  fish: ["salmon", "tuna", "cod", "tilapia", "fish"],
  shellfish: ["shrimp", "crab", "lobster", "clams"],
  gluten: ["bread", "pasta", "oatmeal", "whole wheat"],
  lactose: ["milk", "cream", "soft cheeses"],
  soy: ["tofu", "edamame", "soy"],
};

function buildMeals(conditions: string[], allergies: string[], calorieTarget: number) {
  const primaryCondition = conditions.find(c => CONDITION_FOODS[c]) ?? "default";
  const foodPool = CONDITION_FOODS[primaryCondition]?.foods ?? CONDITION_FOODS.default.foods;
  const excludedKeywords = allergies.flatMap(a => ALLERGY_EXCLUDE[a] ?? []);
  const filtered = foodPool.filter(f => !excludedKeywords.some(kw => f.name.toLowerCase().includes(kw.toLowerCase())));
  const foods = filtered.length >= 4 ? filtered : foodPool;

  const mealCalories = [
    Math.round(calorieTarget * 0.25),
    Math.round(calorieTarget * 0.10),
    Math.round(calorieTarget * 0.35),
    Math.round(calorieTarget * 0.10),
    Math.round(calorieTarget * 0.20),
  ];
  const mealTypes = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner"] as const;

  return mealTypes.map((mealType, i) => {
    const target = mealCalories[i];
    let remaining = target;
    const selectedFoods = [];
    const shuffled = [...foods].sort(() => Math.random() - 0.5);
    for (const food of shuffled) {
      if (remaining <= 0) break;
      if (food.calories <= remaining + 80) {
        selectedFoods.push(food);
        remaining -= food.calories;
      }
    }
    if (selectedFoods.length === 0 && shuffled.length > 0) selectedFoods.push(shuffled[0]);
    return { mealType, foods: selectedFoods, totalCalories: selectedFoods.reduce((s, f) => s + f.calories, 0) };
  });
}

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function buildWeeklyPlan(conditions: string[], allergies: string[], calorieTarget: number) {
  return Object.fromEntries(DAY_NAMES.map(day => [day, buildMeals(conditions, allergies, calorieTarget)]));
}

function buildWarnings(conditions: string[], allergies: string[], medications: string[]): string[] {
  const w: string[] = [];
  if (conditions.includes("diabetes")) w.push("Monitor blood glucose levels regularly. Adjust carbohydrate intake based on your readings.");
  if (conditions.includes("hypertension")) w.push("Keep sodium intake below 2,300 mg per day. Avoid processed and canned foods high in sodium.");
  if (conditions.includes("kidney_disease")) w.push("Consult your nephrologist before making dietary changes. Potassium and phosphorus limits vary per patient.");
  if (conditions.includes("heart_disease")) w.push("Limit saturated fat and trans fat. Choose lean proteins and plant-based fats.");
  if (allergies.length > 0) w.push(`Always check food labels for your allergens: ${allergies.join(", ")}.`);
  if (medications.length > 0) w.push("Review food-drug interactions for your current medications with your pharmacist.");
  w.push("This plan provides educational guidance only. Always consult a registered dietitian or physician.");
  return w;
}

router.get("/diet-plans", async (req, res) => {
  try {
    const plans = await db.select({
      id: dietPlansTable.id,
      title: dietPlansTable.title,
      targetConditions: dietPlansTable.targetConditions,
      calorieTarget: dietPlansTable.calorieTarget,
      createdAt: dietPlansTable.createdAt,
    }).from(dietPlansTable).where(eq(dietPlansTable.userId, req.user!.id)).orderBy(dietPlansTable.createdAt);
    res.json(plans.map(p => ({ ...p, createdAt: p.createdAt.toISOString() })));
  } catch {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/diet-plans", async (req, res) => {
  const { title, conditions, allergies, calorieTarget } = req.body;
  const userId = req.user!.id;
  try {
    const profile = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId)).limit(1);
    const meds = profile[0]?.medications ?? [];
    const meals = buildMeals(conditions ?? [], allergies ?? [], calorieTarget ?? 2000);
    const weeklyPlan = buildWeeklyPlan(conditions ?? [], allergies ?? [], calorieTarget ?? 2000);
    const warnings = buildWarnings(conditions ?? [], allergies ?? [], meds);
    const notes = `Personalized ${calorieTarget} kcal/day plan tailored for ${conditions?.join(", ") || "general health"}.`;
    const inserted = await db.insert(dietPlansTable).values({
      userId,
      title,
      targetConditions: conditions ?? [],
      calorieTarget: calorieTarget ?? 2000,
      notes,
      meals: meals as object[],
      weeklyPlan: weeklyPlan as object,
      warnings,
    }).returning();
    const plan = inserted[0];
    res.json({ ...plan, meals, weeklyPlan, createdAt: plan.createdAt.toISOString() });
  } catch (err) {
    console.error("Failed to generate plan:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/diet-plans/:id", async (req, res) => {
  const id = Number(req.params.id);
  const userId = req.user!.id;
  try {
    const plans = await db.select().from(dietPlansTable)
      .where(and(eq(dietPlansTable.id, id), eq(dietPlansTable.userId, userId)));
    if (plans.length === 0) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...plans[0], createdAt: plans[0].createdAt.toISOString() });
  } catch {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.delete("/diet-plans/:id", async (req, res) => {
  const id = Number(req.params.id);
  const userId = req.user!.id;
  try {
    await db.delete(dietPlansTable).where(and(eq(dietPlansTable.id, id), eq(dietPlansTable.userId, userId)));
    res.status(204).send();
  } catch {
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
