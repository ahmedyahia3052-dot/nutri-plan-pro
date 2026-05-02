import "dotenv/config";
import { db } from "./index";
import { medicationsTable, foodDrugInteractionsTable, foodSafetyTipsTable, nutritionArticlesTable } from "./schema";

async function seed() {
  console.log("Seeding database...");

  // Medications
  const meds = await db.insert(medicationsTable).values([
    { name: "Warfarin", genericName: "warfarin sodium", category: "anticoagulant" },
    { name: "Metformin", genericName: "metformin hydrochloride", category: "antidiabetic" },
    { name: "Lisinopril", genericName: "lisinopril", category: "ACE inhibitor" },
    { name: "Atorvastatin", genericName: "atorvastatin calcium", category: "statin" },
    { name: "Levothyroxine", genericName: "levothyroxine sodium", category: "thyroid hormone" },
    { name: "Omeprazole", genericName: "omeprazole", category: "proton pump inhibitor" },
    { name: "Metoprolol", genericName: "metoprolol succinate", category: "beta blocker" },
    { name: "Amlodipine", genericName: "amlodipine besylate", category: "calcium channel blocker" },
    { name: "Sertraline", genericName: "sertraline hydrochloride", category: "SSRI antidepressant" },
    { name: "Furosemide", genericName: "furosemide", category: "loop diuretic" },
    { name: "Ciprofloxacin", genericName: "ciprofloxacin hydrochloride", category: "fluoroquinolone antibiotic" },
    { name: "Doxycycline", genericName: "doxycycline hyclate", category: "tetracycline antibiotic" },
    { name: "Simvastatin", genericName: "simvastatin", category: "statin" },
    { name: "Spironolactone", genericName: "spironolactone", category: "potassium-sparing diuretic" },
    { name: "Phenelzine", genericName: "phenelzine sulfate", category: "MAOI antidepressant" },
  ]).returning();

  const medMap: Record<string, number> = {};
  for (const m of meds) medMap[m.name] = m.id;

  // Food-Drug Interactions
  await db.insert(foodDrugInteractionsTable).values([
    { medicationId: medMap["Warfarin"], food: "Grapefruit and grapefruit juice", severity: "major", description: "Grapefruit inhibits CYP3A4 enzymes, dramatically increasing warfarin blood levels and risk of dangerous bleeding.", recommendation: "Avoid grapefruit and grapefruit juice entirely while on warfarin." },
    { medicationId: medMap["Warfarin"], food: "Vitamin K-rich foods (kale, spinach, broccoli)", severity: "major", description: "Vitamin K directly counteracts warfarin's anticoagulant effect. Large changes in vitamin K intake can destabilize INR.", recommendation: "Maintain a consistent, moderate intake of vitamin K-rich foods. Do not suddenly increase or decrease consumption." },
    { medicationId: medMap["Warfarin"], food: "Alcohol", severity: "major", description: "Alcohol affects warfarin metabolism and can increase bleeding risk. Heavy drinking may also cause liver damage affecting clotting.", recommendation: "Limit alcohol to 1-2 drinks occasionally. Avoid binge drinking entirely." },
    { medicationId: medMap["Warfarin"], food: "Cranberry juice", severity: "moderate", description: "Cranberry juice may enhance warfarin's anticoagulant effect through unknown mechanisms.", recommendation: "Limit cranberry juice to small amounts and monitor INR closely." },
    { medicationId: medMap["Metformin"], food: "Alcohol", severity: "moderate", description: "Alcohol combined with metformin significantly increases the risk of lactic acidosis, a rare but potentially life-threatening condition.", recommendation: "Avoid excessive alcohol consumption. Limit to 1-2 drinks on special occasions." },
    { medicationId: medMap["Metformin"], food: "High-carbohydrate foods", severity: "minor", description: "Large carbohydrate loads can temporarily worsen blood sugar control and reduce metformin's effectiveness.", recommendation: "Maintain consistent carbohydrate intake spread throughout the day. Avoid large high-carb meals." },
    { medicationId: medMap["Lisinopril"], food: "High-potassium foods (bananas, oranges, potatoes)", severity: "moderate", description: "Lisinopril reduces potassium excretion. Combined with high-potassium foods, this may cause hyperkalemia (high blood potassium).", recommendation: "Moderate your intake of high-potassium foods. Avoid potassium salt substitutes. Regular blood tests advised." },
    { medicationId: medMap["Lisinopril"], food: "Salt substitutes containing potassium chloride", severity: "major", description: "Potassium chloride salt substitutes can cause dangerous hyperkalemia when combined with ACE inhibitors like lisinopril.", recommendation: "Avoid salt substitutes containing potassium chloride. Use herbs for flavoring instead." },
    { medicationId: medMap["Atorvastatin"], food: "Grapefruit and grapefruit juice", severity: "major", description: "Grapefruit inhibits CYP3A4, increasing atorvastatin blood levels up to 83%, raising the risk of muscle damage (myopathy/rhabdomyolysis).", recommendation: "Avoid all grapefruit products while taking atorvastatin. Choose other citrus fruits." },
    { medicationId: medMap["Atorvastatin"], food: "Alcohol", severity: "moderate", description: "Both atorvastatin and alcohol are processed by the liver. Combined use increases the risk of liver damage.", recommendation: "Limit alcohol to occasional moderate consumption. Report any muscle pain or weakness to your doctor." },
    { medicationId: medMap["Levothyroxine"], food: "High-fiber foods (bran, fiber supplements)", severity: "moderate", description: "High dietary fiber can bind levothyroxine in the gut, reducing absorption by up to 30%.", recommendation: "Take levothyroxine on an empty stomach, 30-60 minutes before eating. Separate from high-fiber foods." },
    { medicationId: medMap["Levothyroxine"], food: "Soy products (tofu, soy milk, edamame)", severity: "moderate", description: "Soy isoflavones can interfere with levothyroxine absorption and thyroid hormone synthesis.", recommendation: "Take levothyroxine at least 4 hours before or after consuming soy products." },
    { medicationId: medMap["Levothyroxine"], food: "Coffee", severity: "moderate", description: "Coffee significantly reduces levothyroxine absorption when taken simultaneously.", recommendation: "Take levothyroxine with water only, at least 30-60 minutes before coffee or food." },
    { medicationId: medMap["Omeprazole"], food: "Alcohol", severity: "minor", description: "Alcohol can worsen acid reflux and gastritis symptoms, reducing the effectiveness of omeprazole treatment.", recommendation: "Avoid or minimize alcohol consumption for best results and symptom control." },
    { medicationId: medMap["Metoprolol"], food: "High-fat meals", severity: "minor", description: "High-fat meals increase metoprolol absorption, potentially causing stronger blood pressure lowering and bradycardia.", recommendation: "Take metoprolol consistently with or without food, but not with unusually large high-fat meals." },
    { medicationId: medMap["Amlodipine"], food: "Grapefruit and grapefruit juice", severity: "moderate", description: "Grapefruit juice inhibits amlodipine metabolism, increasing drug levels and risk of low blood pressure.", recommendation: "Avoid grapefruit products while taking amlodipine. Choose other juices." },
    { medicationId: medMap["Sertraline"], food: "Alcohol", severity: "moderate", description: "Alcohol enhances sertraline's sedating effects and may worsen depression. Alcohol itself is a CNS depressant that can counter antidepressant effects.", recommendation: "Avoid alcohol while taking sertraline, especially when starting or adjusting the dose." },
    { medicationId: medMap["Furosemide"], food: "Licorice (real licorice root)", severity: "moderate", description: "Real licorice contains glycyrrhizin which causes sodium retention and potassium loss, counteracting furosemide and causing hypokalemia.", recommendation: "Avoid real licorice products. Licorice-flavored candy made with artificial flavoring is generally safe." },
    { medicationId: medMap["Furosemide"], food: "High-sodium foods (processed foods, canned soups)", severity: "moderate", description: "High sodium intake counteracts furosemide's ability to remove excess fluid from the body.", recommendation: "Follow a low-sodium diet (less than 2000mg/day). Read food labels carefully." },
    { medicationId: medMap["Ciprofloxacin"], food: "Dairy products (milk, yogurt, cheese)", severity: "major", description: "Calcium in dairy products chelates (binds) ciprofloxacin in the gut, reducing absorption by up to 50%.", recommendation: "Take ciprofloxacin 2 hours before or 6 hours after dairy products." },
    { medicationId: medMap["Ciprofloxacin"], food: "Calcium-fortified foods and juices", severity: "moderate", description: "Calcium fortification in foods and juices similarly reduces ciprofloxacin absorption.", recommendation: "Avoid calcium-fortified products within 2 hours of taking ciprofloxacin." },
    { medicationId: medMap["Doxycycline"], food: "Dairy products and calcium-rich foods", severity: "moderate", description: "Calcium binds doxycycline, reducing absorption. However, the interaction is less severe than with other tetracyclines.", recommendation: "Take doxycycline 1 hour before or 2 hours after meals and dairy for best absorption. Food may be needed to reduce stomach upset." },
    { medicationId: medMap["Simvastatin"], food: "Grapefruit and grapefruit juice", severity: "major", description: "Grapefruit inhibits CYP3A4 metabolism of simvastatin, raising drug levels up to 16-fold and dramatically increasing myopathy risk.", recommendation: "Completely avoid all grapefruit products while taking simvastatin." },
    { medicationId: medMap["Spironolactone"], food: "High-potassium foods and salt substitutes", severity: "major", description: "Spironolactone is a potassium-sparing diuretic. Combined with high potassium foods or substitutes, dangerous hyperkalemia can occur.", recommendation: "Avoid potassium salt substitutes. Moderate high-potassium foods like bananas, oranges, and potatoes." },
    { medicationId: medMap["Phenelzine"], food: "Tyramine-rich foods (aged cheese, cured meats, fermented foods, wine)", severity: "major", description: "MAOIs like phenelzine block tyramine breakdown. Eating tyramine-rich foods can cause a hypertensive crisis — a sudden, severe blood pressure spike that can be life-threatening.", recommendation: "Strict avoidance of all aged cheeses, cured/smoked meats, fermented foods, red wine, beer, soy sauce, and overripe fruits. Follow your doctor's detailed dietary list." },
  ]);

  // Food Safety Tips
  await db.insert(foodSafetyTipsTable).values([
    {
      category: "haccp",
      title: "HACCP: The 7 Principles of Food Safety",
      content: "HACCP (Hazard Analysis and Critical Control Points) is a systematic preventive approach to food safety that identifies physical, chemical, and biological hazards in production processes. It was developed in the 1960s for NASA astronauts and is now the gold standard for food safety worldwide.",
      keyPoints: ["Conduct a Hazard Analysis — identify all potential food safety hazards", "Identify Critical Control Points (CCPs) — steps where controls can prevent hazards", "Establish Critical Limits — the maximum/minimum values to control each CCP", "Establish Monitoring Procedures — how to measure each CCP", "Establish Corrective Actions — steps to take when a CCP is out of control", "Establish Verification Procedures — confirm the system is working effectively", "Establish Record-Keeping and Documentation — maintain all HACCP records"],
    },
    {
      category: "cross_contamination",
      title: "Preventing Cross-Contamination in the Kitchen",
      content: "Cross-contamination occurs when harmful bacteria transfer from one food or surface to another. It is one of the leading causes of foodborne illness. Raw meats, poultry, and seafood are the primary sources of dangerous pathogens like Salmonella, E. coli, and Campylobacter.",
      keyPoints: ["Use separate cutting boards for raw meats and ready-to-eat foods", "Store raw meats below cooked and ready-to-eat foods in the refrigerator", "Never place cooked food on a plate that held raw meat", "Wash hands with soap and water for at least 20 seconds after handling raw meat", "Clean and sanitize surfaces and utensils between uses", "Keep raw seafood, meat, and poultry in sealed containers in the refrigerator", "Use a food thermometer to ensure proper internal cooking temperatures"],
    },
    {
      category: "storage",
      title: "Safe Food Storage: Temperatures and Timelines",
      content: "The 'Danger Zone' for bacterial growth is between 40°F (4°C) and 140°F (60°C). In this temperature range, bacteria can double every 20 minutes. Proper food storage prevents pathogen growth and maintains food quality.",
      keyPoints: ["Refrigerator should be at or below 40°F (4°C); freezer at 0°F (-18°C)", "Never leave perishable foods at room temperature for more than 2 hours (1 hour above 90°F/32°C)", "Refrigerate cooked leftovers within 2 hours; use within 3-4 days", "Raw ground meat: use or freeze within 1-2 days; whole cuts: 3-5 days", "Frozen foods are safe indefinitely but quality deteriorates — use within recommended timelines", "Date and label all stored foods", "Keep the refrigerator at 35-38°F for optimal freshness without freezing"],
    },
    {
      category: "hygiene",
      title: "Personal Hygiene for Food Handlers",
      content: "Personal hygiene is the foundation of food safety. Human contact is one of the most common ways pathogens reach food. Proper handwashing, clean clothing, and health monitoring by food handlers prevent most contamination incidents.",
      keyPoints: ["Wash hands for 20+ seconds with soap: before handling food, after using the toilet, after touching face, after handling raw meat", "Wear clean clothing and hair restraints when handling food", "Do not handle food if you have vomiting, diarrhea, jaundice, or infected wounds", "Cover cuts and wounds with waterproof bandages and gloves", "Avoid touching your face, hair, or phone during food preparation", "Remove jewelry (watches, rings) before food preparation — bacteria hide in crevices", "Report illness to a supervisor if you are a professional food handler"],
    },
    {
      category: "diseases",
      title: "Common Foodborne Illnesses: Symptoms and Sources",
      content: "Foodborne illness (food poisoning) affects an estimated 48 million Americans annually. Understanding common pathogens, their sources, and symptoms helps in both prevention and early recognition. Most foodborne illnesses resolve within days but some can be life-threatening.",
      keyPoints: ["Salmonella: raw poultry, eggs, contaminated produce — symptoms in 6-72 hours (diarrhea, fever, cramps)", "E. coli O157:H7: undercooked beef, unpasteurized juice — can cause kidney failure in vulnerable populations", "Listeria: deli meats, soft cheeses, sprouts — particularly dangerous in pregnancy (causes miscarriage)", "Norovirus: contaminated water, shellfish, infected food handlers — spreads rapidly", "Campylobacter: undercooked poultry, unpasteurized milk — most common bacterial foodborne illness worldwide", "Staphylococcus aureus: improper temperature control of cooked foods — rapid onset 30 min-8 hours", "Seek medical attention immediately for bloody diarrhea, high fever, severe dehydration, or neurological symptoms"],
    },
    {
      category: "storage",
      title: "Understanding Food Labels: Use-By, Best-By, and Sell-By Dates",
      content: "Date labels on food packaging are confusing and often lead to unnecessary food waste. Understanding what each label means helps make informed decisions about food safety versus food quality.",
      keyPoints: ["'Use By' date: the last day the manufacturer guarantees peak quality AND safety — do not consume after this date for high-risk foods", "'Best By' or 'Best Before': peak quality date — food is often still safe after this date but quality may decline", "'Sell By': for store inventory management — not a safety date for consumers", "Eggs: safe 3-5 weeks after purchase if refrigerated; float test (floats = discard) is unreliable for safety", "Infant formula: the only product where 'Use By' is a strict safety and nutrition date by law", "When in doubt about safety, use your senses: off smell, unusual color, or slimy texture signal spoilage", "Trust your nose — putrefaction and many spoilage organisms produce obvious odors before becoming dangerous"],
    },
    {
      category: "haccp",
      title: "Safe Cooking Temperatures: A Complete Guide",
      content: "Cooking to the correct internal temperature destroys harmful pathogens. Using a calibrated food thermometer is the only reliable way to confirm food safety — color and texture alone are not reliable indicators.",
      keyPoints: ["Poultry (chicken, turkey, duck): 165°F (74°C) — insert thermometer into thickest part away from bone", "Ground meats (beef, pork, lamb): 160°F (71°C)", "Whole cuts of beef, pork, lamb, veal: 145°F (63°C) with 3-minute rest", "Fish and shellfish: 145°F (63°C) or until opaque and flakes easily", "Egg dishes: 160°F (71°C)", "Casseroles and leftovers: 165°F (74°C)", "Thermometers should be calibrated regularly — verify in ice water (32°F) and boiling water (212°F at sea level)"],
    },
    {
      category: "cross_contamination",
      title: "Allergen Control: Preventing Cross-Contact",
      content: "For people with food allergies, cross-contact — the unintentional transfer of allergen proteins from one food to another — can cause severe reactions including anaphylaxis. The 9 major allergens in the US are: milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soybeans, and sesame.",
      keyPoints: ["Use dedicated equipment (pots, utensils, cutting boards) for allergen-free cooking", "Deep clean and sanitize all surfaces before preparing allergen-free meals", "Train all food handlers on the difference between cross-contamination and cross-contact", "Read all ingredient labels every time — formulations change", "Cooking does not destroy all allergens — some (like peanut protein) remain allergenic after heating", "Keep epinephrine (EpiPen) available for individuals with severe allergies", "Communicate clearly with restaurants about life-threatening allergies; ask about shared fryers and prep surfaces"],
    },
  ]);

  // Nutrition Articles
  await db.insert(nutritionArticlesTable).values([
    {
      category: "macronutrients",
      title: "Understanding Macronutrients: Carbohydrates",
      content: "Carbohydrates are the body's primary energy source, providing 4 calories per gram. They are classified as simple (sugars) or complex (starches and fiber). Complex carbohydrates from whole grains, legumes, and vegetables provide sustained energy and fiber. The brain alone requires approximately 130g of glucose daily to function optimally.",
      keyFacts: ["Carbohydrates provide 4 calories per gram", "Recommended intake: 45-65% of total daily calories", "Complex carbs (whole grains, legumes) are preferable to refined carbs", "Dietary fiber (a type of carb) aids digestion and reduces disease risk", "Aim for 25-38g of fiber per day depending on age and gender"],
    },
    {
      category: "macronutrients",
      title: "Understanding Macronutrients: Proteins",
      content: "Protein is essential for building and repairing tissues, making enzymes and hormones, and supporting immune function. It provides 4 calories per gram. Complete proteins (containing all 9 essential amino acids) come from animal sources and some plant foods like quinoa and soy. Protein needs increase with age, physical activity, illness, and pregnancy.",
      keyFacts: ["Protein provides 4 calories per gram", "Recommended intake: 0.8g per kg body weight for sedentary adults", "Athletes may need 1.2-2.0g per kg body weight", "Complete protein sources: meat, poultry, fish, eggs, dairy, quinoa, soy", "Excess protein is not stored — it is converted to energy or fat"],
    },
    {
      category: "macronutrients",
      title: "Understanding Macronutrients: Fats",
      content: "Dietary fats provide 9 calories per gram — more than double carbohydrates or protein. They are essential for absorbing fat-soluble vitamins (A, D, E, K), hormone production, brain function, and cell membrane integrity. Unsaturated fats (olive oil, avocado, nuts, fatty fish) are cardioprotective, while trans fats increase cardiovascular disease risk.",
      keyFacts: ["Fat provides 9 calories per gram", "Recommended intake: 20-35% of total daily calories", "Unsaturated fats (mono and poly): cardioprotective", "Saturated fat: limit to less than 10% of calories", "Trans fat: avoid entirely — strongly linked to heart disease", "Omega-3 fatty acids: anti-inflammatory, found in fatty fish, flaxseed, walnuts"],
    },
    {
      category: "micronutrients",
      title: "Essential Vitamins: Fat-Soluble Vitamins A, D, E, K",
      content: "Fat-soluble vitamins are stored in the body's fatty tissues and liver. Unlike water-soluble vitamins, they do not need to be consumed daily. However, they can accumulate to toxic levels if taken in excess. Each has unique roles: Vitamin A for vision and immunity, Vitamin D for calcium absorption and bone health, Vitamin E as an antioxidant, and Vitamin K for blood clotting.",
      keyFacts: ["Vitamin A: vision, immune function — found in liver, eggs, orange/yellow vegetables", "Vitamin D: bone health, calcium absorption — sunlight, fatty fish, fortified foods", "Vitamin E: antioxidant protection — nuts, seeds, vegetable oils, leafy greens", "Vitamin K: blood clotting, bone metabolism — leafy greens, fermented foods", "Fat-soluble vitamins require dietary fat for absorption", "Deficiency of Vitamin D is extremely common, especially in northern latitudes"],
    },
    {
      category: "micronutrients",
      title: "Essential Minerals: Calcium, Iron, Magnesium, and Zinc",
      content: "Minerals are inorganic elements essential for hundreds of biological processes. Calcium builds bones and teeth. Iron carries oxygen in hemoglobin. Magnesium participates in over 300 enzymatic reactions. Zinc supports immune function and wound healing. Iron deficiency anemia affects over 2 billion people worldwide.",
      keyFacts: ["Calcium: bone and teeth health — dairy, fortified plant milks, leafy greens, tofu. RDA: 1000-1200mg/day", "Iron: oxygen transport — red meat, beans, lentils, fortified cereals. RDA: 8mg (men), 18mg (women)", "Magnesium: enzyme function — nuts, seeds, whole grains, leafy greens. RDA: 310-420mg/day", "Zinc: immunity, wound healing — meat, shellfish, legumes, seeds. RDA: 8mg (women), 11mg (men)", "Vitamin C enhances non-heme (plant) iron absorption", "Calcium inhibits iron absorption — separate high-calcium and high-iron meals by 2 hours"],
    },
    {
      category: "daily_requirements",
      title: "Daily Nutritional Requirements by Life Stage",
      content: "Nutritional needs vary significantly throughout the lifespan. Children need adequate calcium and vitamin D for bone development. Teenagers have increased needs for iron (girls) and calcium. Adults need to maintain muscle mass with adequate protein. Older adults often need more vitamin D, calcium, and B12.",
      keyFacts: ["Children (2-8): 1000-1400 kcal, emphasize calcium, vitamin D, iron", "Adolescents (9-18): peak bone-building phase — maximize calcium intake", "Adults (19-50): 1600-3000 kcal depending on size and activity level", "Older adults (51+): decreased calorie needs but increased vitamin D, calcium, B12 needs", "Pregnant women: add 300-500 kcal, increase folate (600mcg), iron (27mg), DHA", "Athletes: protein 1.2-2.0g/kg, increased carbohydrates, adequate hydration"],
    },
    {
      category: "healthy_eating",
      title: "The Mediterranean Diet: Evidence-Based Healthy Eating",
      content: "The Mediterranean diet consistently ranks as one of the healthiest dietary patterns in the world. It emphasizes whole grains, vegetables, legumes, fruits, nuts, olive oil, and fish — with limited red meat, processed foods, and added sugars. Studies show it reduces risk of cardiovascular disease by 30%.",
      keyFacts: ["Base every meal on vegetables, fruits, whole grains, and legumes", "Use olive oil as the primary cooking fat", "Eat fish and seafood at least twice per week", "Limit red meat to 1-2 times per week maximum", "Include nuts and seeds daily", "Minimize added sugars, processed foods, and sugar-sweetened beverages"],
    },
    {
      category: "healthy_eating",
      title: "Practical Meal Planning for Optimal Nutrition",
      content: "Meal planning reduces reliance on fast food, saves money, reduces food waste, and supports health goals. The plate method is a simple guide: half the plate vegetables, one quarter protein, one quarter whole grains. Batch cooking key ingredients on weekends simplifies weekday preparation.",
      keyFacts: ["Use the plate method: 1/2 vegetables, 1/4 lean protein, 1/4 whole grains", "Plan meals for the week on Sunday — shop once with a complete list", "Batch cook grains (rice, quinoa) and proteins to use throughout the week", "Always include a protein source at every meal to maintain satiety", "Stay hydrated — sometimes perceived hunger is actually thirst", "Allow one flexible meal per week to prevent feelings of deprivation"],
    },
  ]);

  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
