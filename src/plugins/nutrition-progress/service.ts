import { getAuthToken } from "@/plugins/utils";

export type MacroStatus = "on_track" | "near_limit" | "exceeded";

export interface MacroBar {
  current: number;
  target: number;
  pct: number;
  status: MacroStatus;
  remaining: number;
}

export interface MacroProgress {
  calories: MacroBar;
  protein: MacroBar;
  carbs: MacroBar;
  fat: MacroBar;
  water: MacroBar;
}

export interface GoalStatus {
  config: { calorieGoal: number; proteinGoalG: number; waterGoalMl: number };
  today: { calories: number; protein: number; water: number };
}

export interface FoodLogEntry {
  carbsG: number;
  fatG: number;
}

export async function fetchGoalStatus(): Promise<GoalStatus> {
  const token = getAuthToken();
  const res = await fetch("/api/plugins/goals-streaks/status", {
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? `Error ${res.status}`);
  }
  return res.json();
}

export async function fetchTodayFoodLogs(): Promise<FoodLogEntry[]> {
  const token = getAuthToken();
  const res = await fetch("/api/tracking/food", {
    headers: { Authorization: `Bearer ${token ?? ""}` },
  });
  if (!res.ok) return [];
  return res.json();
}

function bar(current: number, target: number): MacroBar {
  const safe = target > 0 ? target : 1;
  const pct = Math.round((current / safe) * 100);
  const remaining = Math.max(0, target - current);
  let status: MacroStatus;
  if (pct > 100) status = "exceeded";
  else if (pct >= 80) status = "near_limit";
  else status = "on_track";
  return { current, target, pct, status, remaining };
}

export function buildProgress(
  goal: GoalStatus,
  logs: FoodLogEntry[],
  carbTarget: number,
  fatTarget: number
): MacroProgress {
  const totalCarbs = Math.round(logs.reduce((s, l) => s + (l.carbsG ?? 0), 0));
  const totalFat   = Math.round(logs.reduce((s, l) => s + (l.fatG   ?? 0), 0));

  return {
    calories: bar(Math.round(goal.today.calories), goal.config.calorieGoal),
    protein:  bar(Math.round(goal.today.protein),  goal.config.proteinGoalG),
    carbs:    bar(totalCarbs, carbTarget),
    fat:      bar(totalFat,   fatTarget),
    water:    bar(Math.round(goal.today.water),    goal.config.waterGoalMl),
  };
}
