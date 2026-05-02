import { pgTable, text, serial, integer, real, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profilesTable = pgTable("profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  weightKg: real("weight_kg").notNull(),
  heightCm: real("height_cm").notNull(),
  activityLevel: text("activity_level").notNull(),
  goal: text("goal").notNull().default("maintenance"),
  conditions: jsonb("conditions").$type<string[]>().notNull().default([]),
  allergies: jsonb("allergies").$type<string[]>().notNull().default([]),
  medications: jsonb("medications").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dietPlansTable = pgTable("diet_plans", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  targetConditions: jsonb("target_conditions").$type<string[]>().notNull().default([]),
  calorieTarget: integer("calorie_target").notNull(),
  notes: text("notes").notNull().default(""),
  meals: jsonb("meals").$type<object[]>().notNull().default([]),
  weeklyPlan: jsonb("weekly_plan").$type<object>().notNull().default({}),
  warnings: jsonb("warnings").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicationsTable = pgTable("medications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  genericName: text("generic_name").notNull(),
  category: text("category").notNull(),
});

export const foodDrugInteractionsTable = pgTable("food_drug_interactions", {
  id: serial("id").primaryKey(),
  medicationId: integer("medication_id").notNull(),
  food: text("food").notNull(),
  severity: text("severity").notNull(),
  description: text("description").notNull(),
  recommendation: text("recommendation").notNull(),
});

export const foodSafetyTipsTable = pgTable("food_safety_tips", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  keyPoints: jsonb("key_points").$type<string[]>().notNull().default([]),
});

export const nutritionArticlesTable = pgTable("nutrition_articles", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  keyFacts: jsonb("key_facts").$type<string[]>().notNull().default([]),
});

export const dailyLogsTable = pgTable("daily_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  mealType: text("meal_type").notNull(),
  foodName: text("food_name").notNull(),
  calories: integer("calories").notNull().default(0),
  proteinG: real("protein_g").notNull().default(0),
  carbsG: real("carbs_g").notNull().default(0),
  fatG: real("fat_g").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const waterLogsTable = pgTable("water_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  amountMl: integer("amount_ml").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Goals & Streaks plugin ────────────────────────────────────────────────────
// One row per user — upserted on every save.
export const goalConfigsTable = pgTable("goal_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  calorieGoal: integer("calorie_goal").notNull().default(2000),
  proteinGoalG: integer("protein_goal_g").notNull().default(50),
  waterGoalMl: integer("water_goal_ml").notNull().default(2500),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
