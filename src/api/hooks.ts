import { useQuery, useMutation } from "@tanstack/react-query";

const API_BASE = "/api";

function getToken(): string | null {
  return localStorage.getItem("nutri_plan_token");
}

async function apiFetch<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${url}`, { headers, ...options });
  if (res.status === 204) return undefined as T;
  if (res.status === 401) throw new Error("UNAUTHORIZED");
  if (res.status === 404) {
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("json")) return res.json() as T;
    return null as T;
  }
  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try { const j = await res.json(); msg = j.error ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as T;
}

// ── Query Keys ───────────────────────────────────────────────────────────────

export const getGetDashboardSummaryQueryKey = () => ["dashboard", "summary"] as const;
export const getGetProfileQueryKey = () => ["profile"] as const;
export const getListDietPlansQueryKey = () => ["diet-plans"] as const;
export const getListFoodDrugInteractionsQueryKey = (p?: { medicationId?: number }) => ["interactions", p ?? {}] as const;
export const getListFoodSafetyTipsQueryKey = (p?: { category?: string }) => ["food-safety", p ?? {}] as const;
export const getListNutritionArticlesQueryKey = (p?: { category?: string }) => ["nutrition", p ?? {}] as const;
export const getGetTodayFoodLogsQueryKey = () => ["tracking", "food", "today"] as const;
export const getGetWaterLogQueryKey = () => ["tracking", "water", "today"] as const;
export const getGetWeeklyTrendQueryKey = () => ["tracking", "weekly"] as const;

// ── Dashboard ─────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  totalDietPlans: number;
  activeConditions: number;
  activeAllergies: number;
  activeMedications: number;
  interactionWarnings: number;
  hasProfile: boolean;
  recentPlans: Array<{ id: number; title: string; targetConditions: string[]; calorieTarget: number; createdAt: string }>;
  todayCalories: number;
  todayProtein: number;
  todayCarbs: number;
  todayFat: number;
  todayWaterMl: number;
  calorieTarget: number;
}

export function useGetDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: getGetDashboardSummaryQueryKey(),
    queryFn: () => apiFetch("/dashboard/summary"),
    retry: (count, err) => err instanceof Error && err.message !== "UNAUTHORIZED" && count < 2,
  });
}

// ── Profile ───────────────────────────────────────────────────────────────────

export interface ProfileData {
  id: number;
  userId: number;
  name: string;
  age: number;
  gender: string;
  weightKg: number;
  heightCm: number;
  activityLevel: string;
  goal: string;
  conditions: string[];
  allergies: string[];
  medications: string[];
  createdAt: string;
  updatedAt: string;
}

export function useGetProfile() {
  return useQuery<ProfileData | null>({
    queryKey: getGetProfileQueryKey(),
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;
      const res = await fetch(`${API_BASE}/profile`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (res.status === 404 || res.status === 401) return null;
      if (!res.ok) throw new Error(`API error ${res.status}`);
      return res.json();
    },
  });
}

export function useUpsertProfile() {
  return useMutation<ProfileData, Error, { data: Omit<ProfileData, "id" | "userId" | "createdAt" | "updatedAt"> }>({
    mutationFn: ({ data }) => apiFetch("/profile", { method: "POST", body: JSON.stringify(data) }),
  });
}

// ── Reference ─────────────────────────────────────────────────────────────────

export interface Condition { id: string; name: string; description: string; dietaryNotes: string; }
export interface Allergy { id: string; name: string; type: string; avoidFoods: string[]; }
export interface Medication { id: number; name: string; genericName: string; category: string; }

export function useListConditions() {
  return useQuery<Condition[]>({ queryKey: ["reference", "conditions"], queryFn: () => apiFetch("/reference/conditions") });
}
export function useListAllergies() {
  return useQuery<Allergy[]>({ queryKey: ["reference", "allergies"], queryFn: () => apiFetch("/reference/allergies") });
}
export function useListMedications() {
  return useQuery<Medication[]>({ queryKey: ["reference", "medications"], queryFn: () => apiFetch("/reference/medications") });
}

// ── Diet Plans ────────────────────────────────────────────────────────────────

export interface DietPlanSummary { id: number; title: string; targetConditions: string[]; calorieTarget: number; createdAt: string; }
export interface DietPlanDetail extends DietPlanSummary { notes: string; meals: unknown[]; weeklyPlan: Record<string, unknown[]>; warnings: string[]; }
export interface GeneratePlanInput { title: string; conditions: string[]; allergies: string[]; calorieTarget: number; age: number; gender: string; weightKg: number; heightCm: number; activityLevel: string; }

export function useListDietPlans() {
  return useQuery<DietPlanSummary[]>({ queryKey: getListDietPlansQueryKey(), queryFn: () => apiFetch("/diet-plans") });
}
export function useGenerateDietPlan() {
  return useMutation<DietPlanDetail, Error, { data: GeneratePlanInput }>({
    mutationFn: ({ data }) => apiFetch("/diet-plans", { method: "POST", body: JSON.stringify(data) }),
  });
}
export function useGetDietPlan(id: number, options?: { query?: { enabled?: boolean } }) {
  return useQuery<DietPlanDetail>({
    queryKey: ["diet-plan", id],
    queryFn: () => apiFetch(`/diet-plans/${id}`),
    enabled: options?.query?.enabled ?? true,
  });
}
export function useDeleteDietPlan() {
  return useMutation<void, Error, { id: number }>({
    mutationFn: ({ id }) => apiFetch(`/diet-plans/${id}`, { method: "DELETE" }),
  });
}

// ── Interactions ──────────────────────────────────────────────────────────────

export interface FoodDrugInteraction { id: number; medicationId: number; food: string; severity: string; description: string; recommendation: string; medicationName: string; }

export function useListFoodDrugInteractions(params?: { medicationId?: number }, options?: { query?: { queryKey?: unknown[] } }) {
  const defaultQK = getListFoodDrugInteractionsQueryKey(params);
  return useQuery<FoodDrugInteraction[]>({
    queryKey: (options?.query?.queryKey as typeof defaultQK) ?? defaultQK,
    queryFn: () => { const qs = params?.medicationId ? `?medicationId=${params.medicationId}` : ""; return apiFetch(`/interactions${qs}`); },
  });
}

// ── Food Safety ───────────────────────────────────────────────────────────────

export interface FoodSafetyTip { id: number; category: string; title: string; content: string; keyPoints: string[]; }

export function useListFoodSafetyTips(params?: { category?: string }, options?: { query?: { queryKey?: unknown[] } }) {
  const defaultQK = getListFoodSafetyTipsQueryKey(params);
  return useQuery<FoodSafetyTip[]>({
    queryKey: (options?.query?.queryKey as typeof defaultQK) ?? defaultQK,
    queryFn: () => { const qs = params?.category ? `?category=${encodeURIComponent(params.category)}` : ""; return apiFetch(`/food-safety${qs}`); },
  });
}

// ── Nutrition ──────────────────────────────────────────────────────────────────

export interface NutritionArticle { id: number; category: string; title: string; content: string; keyFacts: string[]; }

export function useListNutritionArticles(params?: { category?: string }, options?: { query?: { queryKey?: unknown[] } }) {
  const defaultQK = getListNutritionArticlesQueryKey(params);
  return useQuery<NutritionArticle[]>({
    queryKey: (options?.query?.queryKey as typeof defaultQK) ?? defaultQK,
    queryFn: () => { const qs = params?.category ? `?category=${encodeURIComponent(params.category)}` : ""; return apiFetch(`/nutrition/info${qs}`); },
  });
}

// ── Calorie Calculator ────────────────────────────────────────────────────────

export interface CalorieResult { bmr: number; tdee: number; targetCalories: number; proteinG: number; carbsG: number; fatG: number; bmi: number; bmiCategory: string; }
export interface CalorieInput { age: number; gender: string; weightKg: number; heightCm: number; activityLevel: string; goal: string; }

export function useCalculateCalories() {
  return useMutation<CalorieResult, Error, { data: CalorieInput }>({
    mutationFn: ({ data }) => apiFetch("/nutrition/calorie-calculator", { method: "POST", body: JSON.stringify(data) }),
  });
}

// ── Daily Tracking ────────────────────────────────────────────────────────────

export interface FoodLog { id: number; userId: number; date: string; mealType: string; foodName: string; calories: number; proteinG: number; carbsG: number; fatG: number; }
export interface WaterLog { date: string; totalMl: number; logs: Array<{ id: number; amountMl: number }> }
export interface WeeklyTrendPoint { date: string; label: string; calories: number; proteinG: number; carbsG: number; fatG: number; }

export function useGetTodayFoodLogs() {
  return useQuery<FoodLog[]>({ queryKey: getGetTodayFoodLogsQueryKey(), queryFn: () => apiFetch("/tracking/food") });
}
export function useLogFood() {
  return useMutation<FoodLog, Error, { data: Omit<FoodLog, "id" | "userId"> }>({
    mutationFn: ({ data }) => apiFetch("/tracking/food", { method: "POST", body: JSON.stringify(data) }),
  });
}
export function useDeleteFoodLog() {
  return useMutation<void, Error, { id: number }>({
    mutationFn: ({ id }) => apiFetch(`/tracking/food/${id}`, { method: "DELETE" }),
  });
}
export function useGetWaterLog() {
  return useQuery<WaterLog>({ queryKey: getGetWaterLogQueryKey(), queryFn: () => apiFetch("/tracking/water") });
}
export function useLogWater() {
  return useMutation<unknown, Error, { data: { amountMl: number; date: string } }>({
    mutationFn: ({ data }) => apiFetch("/tracking/water", { method: "POST", body: JSON.stringify(data) }),
  });
}
export function useGetWeeklyTrend() {
  return useQuery<WeeklyTrendPoint[]>({ queryKey: getGetWeeklyTrendQueryKey(), queryFn: () => apiFetch("/tracking/weekly") });
}
