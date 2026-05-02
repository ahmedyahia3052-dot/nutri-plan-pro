import { Router } from "express";

const router = Router();

const CONDITIONS = [
  { id: "diabetes", name: "Diabetes (Type 2)", description: "A metabolic disorder characterized by high blood sugar levels.", dietaryNotes: "Focus on low glycemic index foods, limit refined carbohydrates and added sugars, monitor carbohydrate intake." },
  { id: "diabetes_type1", name: "Diabetes (Type 1)", description: "An autoimmune condition where the pancreas produces little or no insulin.", dietaryNotes: "Consistent carbohydrate counting, coordinate meals with insulin administration." },
  { id: "hypertension", name: "Hypertension (High Blood Pressure)", description: "Persistently elevated blood pressure in the arteries.", dietaryNotes: "Follow DASH diet, limit sodium to less than 2300mg/day, increase potassium-rich foods." },
  { id: "obesity", name: "Obesity", description: "Excess body fat that increases risk of other health conditions.", dietaryNotes: "Calorie deficit diet, high fiber foods for satiety, lean proteins, portion control." },
  { id: "kidney_disease", name: "Chronic Kidney Disease", description: "Gradual loss of kidney function over time.", dietaryNotes: "Restrict phosphorus, potassium, sodium, and protein. Fluid restriction may be needed." },
  { id: "liver_disease", name: "Liver Disease", description: "Conditions affecting liver structure or function.", dietaryNotes: "Limit alcohol, reduce saturated fat, maintain adequate protein, restrict sodium for cirrhosis." },
  { id: "heart_disease", name: "Heart Disease", description: "Various conditions affecting the heart's structure and function.", dietaryNotes: "Mediterranean diet, limit saturated and trans fats, increase omega-3 fatty acids, reduce sodium." },
  { id: "gerd", name: "GERD / Acid Reflux", description: "Chronic acid reflux causing heartburn and esophageal irritation.", dietaryNotes: "Avoid trigger foods (spicy, acidic, fatty), small frequent meals, avoid eating before bed." },
  { id: "ibs", name: "Irritable Bowel Syndrome (IBS)", description: "A functional gastrointestinal disorder affecting the large intestine.", dietaryNotes: "Low FODMAP diet, increase soluble fiber, identify and avoid trigger foods." },
  { id: "celiac", name: "Celiac Disease", description: "An autoimmune disorder triggered by gluten consumption.", dietaryNotes: "Strict gluten-free diet, avoid wheat, barley, rye, and cross-contaminated products." },
  { id: "pregnancy", name: "Pregnancy", description: "The period of fetal development requiring increased nutritional needs.", dietaryNotes: "Increase folate, iron, calcium, DHA. Avoid raw fish, high-mercury fish, unpasteurized products, alcohol." },
  { id: "lactation", name: "Lactation / Breastfeeding", description: "Nutritional needs during breastfeeding.", dietaryNotes: "Increase calorie intake by 300-500 kcal, stay hydrated, maintain calcium and vitamin D." },
  { id: "pediatric", name: "Pediatric Nutrition (Children 2-12)", description: "Special nutritional needs during childhood growth and development.", dietaryNotes: "Balanced macronutrients, adequate calcium and vitamin D for bone growth, iron for cognitive development." },
  { id: "elderly", name: "Elderly Nutrition (65+)", description: "Nutritional considerations for older adults.", dietaryNotes: "Adequate protein to prevent sarcopenia, calcium and vitamin D for bone health, stay hydrated." },
  { id: "dyslipidemia", name: "Dyslipidemia (High Cholesterol)", description: "Abnormal levels of lipids in the blood.", dietaryNotes: "Reduce saturated fats, increase soluble fiber, add plant sterols, omega-3 fatty acids." },
];

const ALLERGIES = [
  { id: "peanuts", name: "Peanut Allergy", type: "allergy", avoidFoods: ["peanuts", "peanut butter", "peanut oil", "mixed nuts", "groundnuts"] },
  { id: "tree_nuts", name: "Tree Nut Allergy", type: "allergy", avoidFoods: ["almonds", "cashews", "walnuts", "pecans", "pistachios", "macadamia nuts", "brazil nuts", "hazelnuts"] },
  { id: "dairy", name: "Dairy Allergy", type: "allergy", avoidFoods: ["milk", "cheese", "butter", "cream", "yogurt", "ice cream", "whey protein"] },
  { id: "eggs", name: "Egg Allergy", type: "allergy", avoidFoods: ["eggs", "mayonnaise", "egg-based baked goods", "egg noodles", "quiche"] },
  { id: "fish", name: "Fish Allergy", type: "allergy", avoidFoods: ["salmon", "tuna", "cod", "tilapia", "halibut", "anchovies", "fish sauce"] },
  { id: "shellfish", name: "Shellfish Allergy", type: "allergy", avoidFoods: ["shrimp", "crab", "lobster", "clams", "oysters", "mussels", "scallops"] },
  { id: "wheat", name: "Wheat Allergy", type: "allergy", avoidFoods: ["bread", "pasta", "cereals", "flour", "couscous", "semolina"] },
  { id: "soy", name: "Soy Allergy", type: "allergy", avoidFoods: ["soybeans", "tofu", "tempeh", "edamame", "soy milk", "soy sauce", "miso"] },
  { id: "gluten", name: "Gluten Intolerance / Celiac", type: "intolerance", avoidFoods: ["wheat", "barley", "rye", "bread", "pasta", "beer", "most cereals"] },
  { id: "lactose", name: "Lactose Intolerance", type: "intolerance", avoidFoods: ["regular milk", "ice cream", "soft cheeses", "cream", "butter (large amounts)"] },
  { id: "fructose", name: "Fructose Intolerance", type: "intolerance", avoidFoods: ["apples", "pears", "honey", "high-fructose corn syrup", "fruit juices", "dried fruits"] },
  { id: "sulfites", name: "Sulfite Sensitivity", type: "intolerance", avoidFoods: ["wine", "dried fruits", "canned vegetables", "pickled foods", "deli meats"] },
  { id: "sesame", name: "Sesame Allergy", type: "allergy", avoidFoods: ["sesame seeds", "tahini", "hummus", "sesame oil", "breadsticks with sesame"] },
];

router.get("/reference/conditions", (_req, res) => res.json(CONDITIONS));
router.get("/reference/allergies", (_req, res) => res.json(ALLERGIES));

export default router;
