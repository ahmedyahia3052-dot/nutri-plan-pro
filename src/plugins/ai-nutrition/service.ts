import type { ProfileData } from "@/api/hooks";

export interface MacroTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterMl: number;
}

export interface NutritionInsight {
  type: "warning" | "info" | "success" | "tip";
  category: string;
  title: string;
  detail: string;
  actions: string[];
}

export interface MealItem {
  name: string;
  portion: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  notes?: string;
}

export interface DayPlan {
  day: string;
  totalCalories: number;
  meals: Record<string, MealItem[]>;
}

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

const GOAL_ADJUSTMENTS: Record<string, number> = {
  lose_weight: -500,
  gain_muscle: +300,
  maintenance: 0,
};

export function calculateMacroTargets(profile: ProfileData): MacroTargets {
  const weightKg = profile.weightKg;
  const heightCm = profile.heightCm;
  const age = profile.age;
  const isMale = profile.gender === "male";
  const activityKey = profile.activityLevel.toLowerCase().replace(" ", "_");
  const goal = profile.goal ?? "maintenance";

  const bmr = isMale
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const multiplier = ACTIVITY_MULTIPLIERS[activityKey] ?? 1.375;
  let tdee = Math.round(bmr * multiplier);

  const goalKey = goal.toLowerCase().replace(" ", "_").replace("-", "_");
  tdee += GOAL_ADJUSTMENTS[goalKey] ?? 0;

  if (profile.conditions.includes("obesity")) tdee = Math.min(tdee, 1800);
  if (profile.conditions.includes("kidney_disease")) tdee = Math.min(tdee, 2000);

  let proteinRatio = 0.25;
  if (goal.includes("muscle") || goal.includes("gain")) proteinRatio = 0.30;
  if (profile.conditions.includes("kidney_disease")) proteinRatio = 0.15;

  let carbRatio = 0.45;
  if (profile.conditions.includes("diabetes")) carbRatio = 0.35;
  if (goal.includes("lose") || goal.includes("weight")) carbRatio = 0.40;

  const fatRatio = 1 - proteinRatio - carbRatio;

  return {
    calories: tdee,
    proteinG: Math.round((tdee * proteinRatio) / 4),
    carbsG: Math.round((tdee * carbRatio) / 4),
    fatG: Math.round((tdee * fatRatio) / 9),
    fiberG: 25 + (profile.conditions.includes("diabetes") ? 10 : 0),
    waterMl: Math.round(weightKg * 35),
  };
}

const DISEASE_INSIGHTS: Record<string, NutritionInsight[]> = {
  diabetes: [
    { type: "warning", category: "Blood Sugar", title: "Carbohydrate Management", detail: "Aim for 45–60g carbs per meal. Spread intake evenly across 3 meals and 2 snacks. Avoid simple sugars and refined carbohydrates.", actions: ["Choose low-GI grains (quinoa, barley, steel-cut oats)", "Pair carbs with protein or fat to slow absorption", "Track carbs in the Daily Tracker"] },
    { type: "tip", category: "Meal Timing", title: "Regular Meal Schedule", detail: "Eat every 4–5 hours to maintain stable blood glucose. Never skip meals — it leads to dangerous glucose drops followed by spikes.", actions: ["Set meal reminders", "Prepare snacks in advance", "Eat breakfast within 1 hour of waking"] },
    { type: "info", category: "Glycemic Index", title: "Focus on Low-GI Foods", detail: "Low-GI foods (GI < 55) cause slower, steadier rises in blood glucose. High-GI foods (GI > 70) should be minimised or combined with protein.", actions: ["Swap white rice for brown rice or quinoa", "Choose whole fruit over juice", "Use cinnamon to help lower GI of meals"] },
  ],
  hypertension: [
    { type: "warning", category: "Sodium", title: "Sodium Restriction Critical", detail: "Keep sodium below 2,300 mg/day (ideally 1,500 mg/day). Processed and canned foods are the biggest hidden sources.", actions: ["Read nutrition labels — aim for < 600mg sodium per serving", "Cook at home using herbs and spices instead of salt", "Avoid deli meats, canned soups, and fast food"] },
    { type: "info", category: "DASH Diet", title: "Follow the DASH Eating Pattern", detail: "DASH (Dietary Approaches to Stop Hypertension) is clinically proven to lower blood pressure. It emphasises fruits, vegetables, whole grains, and low-fat dairy.", actions: ["Add a banana or leafy greens daily for potassium", "Include 3–4 servings of low-fat dairy per week", "Aim for 8–10 servings of fruits and vegetables daily"] },
    { type: "tip", category: "Minerals", title: "Increase Potassium and Magnesium", detail: "Potassium helps offset sodium's effect on blood pressure. Magnesium supports vascular relaxation. Both are often low in hypertensive patients.", actions: ["Eat potassium-rich foods: bananas, sweet potatoes, spinach", "Include magnesium sources: dark chocolate, avocado, nuts", "Consider a potassium supplement only with physician approval"] },
  ],
  heart_disease: [
    { type: "warning", category: "Fats", title: "Limit Saturated and Trans Fats", detail: "Saturated fats raise LDL cholesterol. Trans fats (partially hydrogenated oils) are most harmful and should be completely eliminated. Target saturated fat < 7% of total calories.", actions: ["Choose olive oil, avocado, and nuts over butter", "Avoid fried foods, pastries, and margarine", "Select lean meats; remove skin from poultry"] },
    { type: "info", category: "Omega-3", title: "Increase Omega-3 Fatty Acids", detail: "Omega-3s (EPA and DHA) reduce triglycerides, inflammation, and cardiac arrhythmia risk. Aim for at least 2 servings of fatty fish per week.", actions: ["Eat salmon, mackerel, or sardines 2x/week", "Add walnuts or flaxseed to breakfast", "Consider fish oil supplement (discuss with cardiologist)"] },
  ],
  kidney_disease: [
    { type: "warning", category: "Protein", title: "Controlled Protein Intake", detail: "Excess protein generates waste products filtered by kidneys. Reduce protein to 0.6–0.8g/kg body weight unless on dialysis.", actions: ["Track protein in Daily Tracker", "Choose high-quality proteins: eggs, chicken", "Avoid protein supplements unless prescribed"] },
    { type: "warning", category: "Minerals", title: "Monitor Potassium and Phosphorus", detail: "Damaged kidneys cannot filter excess potassium (risk of cardiac arrest) or phosphorus (causes bone disease). Individual limits vary — consult your nephrologist.", actions: ["Avoid high-potassium foods: bananas, oranges, potatoes, tomatoes", "Limit phosphorus: dairy, nuts, cola drinks, whole grains", "Leach vegetables by peeling, cutting small, boiling and discarding water"] },
  ],
  obesity: [
    { type: "info", category: "Calorie Deficit", title: "Sustainable Calorie Reduction", detail: "A 500 kcal/day deficit produces about 0.5 kg/week of weight loss. Avoid crash diets — they trigger muscle loss and metabolic adaptation.", actions: ["Use the Daily Tracker to monitor intake", "Fill half your plate with non-starchy vegetables", "Eat slowly — it takes 20 minutes for satiety signals to reach the brain"] },
    { type: "tip", category: "Volume Eating", title: "Maximise Satiety Per Calorie", detail: "High-volume, low-calorie foods like leafy greens, broth-based soups, and raw vegetables fill the stomach without exceeding calorie targets.", actions: ["Start each meal with a broth-based soup or salad", "Snack on raw vegetables with hummus instead of crackers", "Drink 500ml water before each main meal"] },
  ],
};

const ALLERGY_EXCLUDE: Record<string, string[]> = {
  peanuts: ["peanut"],
  tree_nuts: ["almond", "walnut", "cashew", "pecan", "pistachio"],
  dairy: ["milk", "cheese", "butter", "cream", "yogurt", "cottage cheese"],
  eggs: ["egg"],
  fish: ["salmon", "tuna", "cod", "tilapia", "sardine", "mackerel"],
  shellfish: ["shrimp", "crab", "lobster", "clam"],
  gluten: ["bread", "pasta", "oatmeal", "oat", "wheat", "barley"],
  soy: ["tofu", "edamame", "soy"],
};

const MEAL_TEMPLATES: MealItem[][] = [
  [
    { name: "Steel-cut oatmeal", portion: "½ cup dry", calories: 150, proteinG: 5, carbsG: 27, fatG: 3, notes: "Top with berries" },
    { name: "Boiled egg", portion: "2 large", calories: 143, proteinG: 13, carbsG: 1, fatG: 10 },
    { name: "Black coffee or green tea", portion: "1 cup", calories: 5, proteinG: 0, carbsG: 1, fatG: 0 },
  ],
  [
    { name: "Greek yogurt (plain)", portion: "150g", calories: 100, proteinG: 17, carbsG: 6, fatG: 0 },
    { name: "Mixed berries", portion: "½ cup", calories: 42, proteinG: 0, carbsG: 10, fatG: 0 },
    { name: "Almonds", portion: "1 oz", calories: 164, proteinG: 6, carbsG: 6, fatG: 14 },
  ],
  [
    { name: "Grilled chicken breast", portion: "4 oz", calories: 185, proteinG: 35, carbsG: 0, fatG: 4 },
    { name: "Quinoa", portion: "½ cup cooked", calories: 111, proteinG: 4, carbsG: 20, fatG: 2 },
    { name: "Steamed broccoli", portion: "1 cup", calories: 55, proteinG: 4, carbsG: 11, fatG: 1 },
  ],
  [
    { name: "Baked salmon", portion: "4 oz", calories: 200, proteinG: 28, carbsG: 0, fatG: 9, notes: "Rich in omega-3" },
    { name: "Sweet potato", portion: "1 medium", calories: 103, proteinG: 2, carbsG: 24, fatG: 0 },
    { name: "Spinach salad", portion: "2 cups", calories: 14, proteinG: 2, carbsG: 2, fatG: 0 },
  ],
  [
    { name: "Lentil soup", portion: "1.5 cups", calories: 345, proteinG: 27, carbsG: 60, fatG: 1 },
    { name: "Whole wheat pita", portion: "1 small", calories: 85, proteinG: 3, carbsG: 17, fatG: 1 },
  ],
  [
    { name: "Turkey stir-fry", portion: "5 oz turkey + veg", calories: 290, proteinG: 36, carbsG: 14, fatG: 9 },
    { name: "Brown rice", portion: "½ cup cooked", calories: 108, proteinG: 3, carbsG: 22, fatG: 1 },
  ],
  [
    { name: "Egg white omelette", portion: "4 whites + veg", calories: 120, proteinG: 20, carbsG: 5, fatG: 1 },
    { name: "Whole wheat toast", portion: "1 slice", calories: 80, proteinG: 4, carbsG: 14, fatG: 1 },
    { name: "Avocado", portion: "¼ medium", calories: 57, proteinG: 0, carbsG: 3, fatG: 5 },
  ],
];

function filterByAllergies(items: MealItem[], allergies: string[]): MealItem[] {
  const excluded = allergies.flatMap(a => ALLERGY_EXCLUDE[a] ?? []);
  if (excluded.length === 0) return items;
  return items.filter(item => !excluded.some(kw => item.name.toLowerCase().includes(kw)));
}

export function generateInsights(profile: ProfileData): NutritionInsight[] {
  const insights: NutritionInsight[] = [];

  for (const condition of profile.conditions) {
    const conditionInsights = DISEASE_INSIGHTS[condition];
    if (conditionInsights) insights.push(...conditionInsights);
  }

  if (profile.allergies.length > 0) {
    insights.push({
      type: "warning",
      category: "Allergens",
      title: `${profile.allergies.length} Active Allergen${profile.allergies.length !== 1 ? "s" : ""}`,
      detail: `Your diet plans automatically exclude: ${profile.allergies.join(", ")}. Always read food labels — manufacturing cross-contamination is common.`,
      actions: ["Check labels for 'may contain' warnings", "Inform restaurant staff of all allergies", "Carry emergency medication if prescribed"],
    });
  }

  if (profile.medications.length > 0) {
    insights.push({
      type: "info",
      category: "Medications",
      title: "Medication-Diet Interactions",
      detail: `You are taking ${profile.medications.length} medication(s). Food-drug interactions can affect how well your medication works. Review the Drug Checker for specific warnings.`,
      actions: ["Check the Drug Checker plugin for your medications", "Take medications at consistent times relative to meals", "Discuss grapefruit restrictions with your pharmacist"],
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "success",
      category: "General Health",
      title: "Balanced Nutrition Foundation",
      detail: "No specific disease restrictions detected. Follow a balanced Mediterranean-style diet for optimal health: plenty of vegetables, whole grains, lean protein, and healthy fats.",
      actions: ["Aim for 5 servings of vegetables daily", "Choose whole grains over refined", "Include 2 servings of fatty fish per week"],
    });
  }

  return insights;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;

export function generateWeeklyPlan(profile: ProfileData, targets: MacroTargets): DayPlan[] {
  const allergies = profile.allergies ?? [];

  return DAYS.map((day, dayIdx) => {
    const templateIdx = dayIdx % MEAL_TEMPLATES.length;
    const nextTemplateIdx = (dayIdx + 3) % MEAL_TEMPLATES.length;
    const dinnerTemplateIdx = (dayIdx + 5) % MEAL_TEMPLATES.length;

    const breakfastItems = filterByAllergies(MEAL_TEMPLATES[templateIdx] ?? [], allergies);
    const lunchItems = filterByAllergies(MEAL_TEMPLATES[nextTemplateIdx] ?? [], allergies);
    const dinnerItems = filterByAllergies(MEAL_TEMPLATES[dinnerTemplateIdx] ?? [], allergies);

    const snack: MealItem = { name: "Apple with almond butter", portion: "1 medium apple + 1 tbsp", calories: 185, proteinG: 4, carbsG: 30, fatG: 8 };
    const snackFiltered = filterByAllergies([snack], allergies);

    const meals: Record<string, MealItem[]> = {
      breakfast: breakfastItems.length > 0 ? breakfastItems : lunchItems,
      morning_snack: snackFiltered.length > 0 ? snackFiltered : [{ name: "Raw vegetables", portion: "1 cup", calories: 50, proteinG: 2, carbsG: 10, fatG: 0 }],
      lunch: lunchItems.length > 0 ? lunchItems : breakfastItems,
      afternoon_snack: [{ name: "Mixed nuts", portion: "1 oz", calories: 170, proteinG: 5, carbsG: 6, fatG: 15 }],
      dinner: dinnerItems.length > 0 ? dinnerItems : lunchItems,
    };

    const totalCalories = Object.values(meals).flat().reduce((s, i) => s + i.calories, 0);
    return { day, totalCalories, meals };
  });
}
