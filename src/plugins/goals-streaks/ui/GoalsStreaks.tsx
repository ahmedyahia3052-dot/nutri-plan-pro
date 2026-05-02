import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

// ── Types ─────────────────────────────────────────────────────────────────────

type GoalConfig = {
  calorieGoal: number;
  proteinGoalG: number;
  waterGoalMl: number;
};

type DayHistory = {
  date: string;
  label: string;
  complete: boolean;
  calories: number;
  protein: number;
  water: number;
};

type GoalStatus = {
  config: GoalConfig;
  today: {
    calories: number;
    protein: number;
    water: number;
    caloriesComplete: boolean;
    proteinComplete: boolean;
    waterComplete: boolean;
    allComplete: boolean;
  };
  currentStreak: number;
  longestStreak: number;
  streakAtRisk: boolean;
  history: DayHistory[];
};

// ── API helpers ───────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem("nutri_plan_token");
}

async function fetchGoalStatus(): Promise<GoalStatus> {
  const res = await fetch("/api/plugins/goals-streaks/status", {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? `Error ${res.status}`);
  }
  return res.json();
}

async function saveGoalConfig(config: GoalConfig): Promise<GoalConfig> {
  const res = await fetch("/api/plugins/goals-streaks/config", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error((j as { error?: string }).error ?? `Error ${res.status}`);
  }
  return res.json();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GoalBar({
  label,
  icon,
  current,
  goal,
  unit,
  complete,
}: {
  label: string;
  icon: string;
  current: number;
  goal: number;
  unit: string;
  complete: boolean;
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0;
  const remaining = Math.max(0, goal - current);
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none select-none">{icon}</span>
          <span className="font-semibold text-sm text-foreground">{label}</span>
          {complete && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-bold">
              ✓
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {current.toLocaleString()} / {goal.toLocaleString()} {unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            complete
              ? "bg-emerald-500"
              : pct >= 80
              ? "bg-amber-500"
              : "bg-primary"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span
          className={`text-xs ${
            complete ? "text-emerald-600 font-medium" : "text-muted-foreground"
          }`}
        >
          {complete
            ? "Goal reached!"
            : `${remaining.toLocaleString()} ${unit} remaining`}
        </span>
        <span
          className={`text-xs font-semibold tabular-nums ${
            complete ? "text-emerald-600" : "text-primary"
          }`}
        >
          {pct}%
        </span>
      </div>
    </div>
  );
}

function DayDot({ day }: { day: DayHistory }) {
  const isToday = day.date === new Date().toISOString().slice(0, 10);
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      <div
        title={`${day.date}: ${day.calories} kcal, ${day.protein}g protein, ${day.water}ml water`}
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
          day.complete
            ? "bg-emerald-500 border-emerald-500 text-white"
            : isToday
            ? "border-primary/60 text-primary bg-accent/60"
            : "border-border text-muted-foreground/40 bg-muted/30"
        }`}
      >
        {day.complete ? "✓" : isToday ? "·" : ""}
      </div>
      <span
        className={`text-xs font-medium truncate ${
          isToday ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {day.label}
      </span>
    </div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  let numberColor = "text-muted-foreground";
  if (streak >= 30) numberColor = "text-red-500";
  else if (streak >= 14) numberColor = "text-orange-600";
  else if (streak >= 7) numberColor = "text-orange-500";
  else if (streak >= 1) numberColor = "text-amber-500";

  return (
    <div className="flex items-center gap-4">
      <span
        className={`text-5xl leading-none select-none ${
          streak === 0 ? "grayscale opacity-30" : ""
        }`}
      >
        🔥
      </span>
      <div>
        <div className={`text-6xl font-bold leading-none tabular-nums ${numberColor}`}>
          {streak}
        </div>
        <div className="text-sm text-muted-foreground font-medium mt-1">
          {streak === 1 ? "day streak" : "day streak"}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function GoalsStreaks() {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["goals-streak-status"],
    queryFn: fetchGoalStatus,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const {
    mutate: saveConfig,
    isPending: saving,
    isError: saveError,
    reset: resetSave,
  } = useMutation({
    mutationFn: saveGoalConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals-streak-status"] });
      setEditing(false);
    },
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<GoalConfig>({
    calorieGoal: 2000,
    proteinGoalG: 50,
    waterGoalMl: 2500,
  });

  useEffect(() => {
    if (data?.config && !editing) {
      setForm(data.config);
    }
  }, [data?.config, editing]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig(form);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    resetSave();
    if (data?.config) setForm(data.config);
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-72 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <Skeleton className="h-5 w-40 mb-3" />
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-32 rounded-xl" />
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="alert-error">
          <p className="font-semibold mb-1">Unable to load Goals & Streaks</p>
          <p className="text-sm opacity-80">{(error as Error).message}</p>
          <p className="text-sm mt-2">
            If this is your first time, run:{" "}
            <code className="bg-red-100 px-1.5 py-0.5 rounded text-xs font-mono">
              npm run db:push
            </code>{" "}
            to create the required table.
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { today, currentStreak, longestStreak, streakAtRisk, history, config } = data;
  const goalsMetToday = [today.caloriesComplete, today.proteinComplete, today.waterComplete].filter(Boolean).length;
  const completionPct = Math.round((goalsMetToday / 3) * 100);

  // ── Streak card background style ────────────────────────────────────────────
  const streakCardClass = today.allComplete
    ? "bg-emerald-50 border-2 border-emerald-200"
    : streakAtRisk
    ? "bg-amber-50 border-2 border-amber-200"
    : "bg-card border border-card-border shadow-card";

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="page-header">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Goals &amp; Streaks
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Hit your daily nutrition targets and build healthy streaks.
        </p>
      </div>

      {/* Streak + summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Streak card */}
        <div className={`rounded-2xl p-6 ${streakCardClass}`}>
          <StreakBadge streak={currentStreak} />
          <div className="mt-5 text-sm leading-relaxed">
            {today.allComplete && (
              <p className="text-emerald-700 font-semibold">
                All goals met today — great work!
              </p>
            )}
            {streakAtRisk && !today.allComplete && (
              <p className="text-amber-700 font-semibold">
                Complete today's goals to keep your streak alive!
              </p>
            )}
            {!today.allComplete && !streakAtRisk && currentStreak === 0 && (
              <p className="text-muted-foreground">
                Log meals and water to start building your streak.
              </p>
            )}
            {!today.allComplete && !streakAtRisk && currentStreak > 0 && (
              <p className="text-muted-foreground">
                {goalsMetToday} of 3 goals met so far today — keep going!
              </p>
            )}
            {currentStreak >= 7 && (
              <p className={`mt-1 text-xs font-medium ${today.allComplete ? "text-emerald-600" : "text-muted-foreground"}`}>
                {currentStreak >= 30
                  ? "Extraordinary consistency — 30+ days!"
                  : currentStreak >= 14
                  ? "Two weeks strong — incredible!"
                  : "One full week — you're building real habits!"}
              </p>
            )}
          </div>
        </div>

        {/* Stats card */}
        <div className="bg-card border border-card-border rounded-2xl p-6 shadow-card flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-muted-foreground">Today's completion</span>
                <span className="text-sm font-bold text-foreground">
                  {goalsMetToday} / 3 goals
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    completionPct === 100 ? "bg-emerald-500" : "bg-primary"
                  }`}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current streak</span>
              <span className="font-bold text-foreground tabular-nums">
                {currentStreak} day{currentStreak !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Longest streak</span>
              <span className="font-bold text-foreground tabular-nums">
                {longestStreak} day{longestStreak !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="mt-5">
            <Link href="/tracker">
              <Button size="sm" variant="outline" className="w-full text-xs h-8">
                <svg
                  className="w-3.5 h-3.5 mr-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Log food or water
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Today's Progress */}
      <h2 className="font-semibold text-foreground mb-3">Today's Progress</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <GoalBar
          label="Calories"
          icon="🔥"
          current={today.calories}
          goal={config.calorieGoal}
          unit="kcal"
          complete={today.caloriesComplete}
        />
        <GoalBar
          label="Protein"
          icon="💪"
          current={today.protein}
          goal={config.proteinGoalG}
          unit="g"
          complete={today.proteinComplete}
        />
        <GoalBar
          label="Water"
          icon="💧"
          current={today.water}
          goal={config.waterGoalMl}
          unit="ml"
          complete={today.waterComplete}
        />
      </div>

      {/* 7-day history */}
      <div className="bg-card border border-card-border rounded-xl p-5 shadow-card mb-6">
        <h2 className="font-semibold text-foreground mb-4">7-Day History</h2>
        <div className="flex items-start gap-2">
          {history.map((day) => (
            <DayDot key={day.date} day={day} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          A day is complete when all three goals are met. Hover a circle to see
          details.
        </p>
      </div>

      {/* Goal config */}
      <div className="bg-card border border-card-border rounded-xl p-5 shadow-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Your Daily Goals</h2>
          {!editing && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              className="text-xs h-8"
            >
              Edit Goals
            </Button>
          )}
        </div>

        {!editing ? (
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { label: "Calories", value: config.calorieGoal, unit: "kcal / day", icon: "🔥" },
                { label: "Protein",  value: config.proteinGoalG,  unit: "g / day",   icon: "💪" },
                { label: "Water",    value: config.waterGoalMl,   unit: "ml / day",  icon: "💧" },
              ] as const
            ).map((g) => (
              <div
                key={g.label}
                className="text-center py-4 px-3 bg-muted/40 rounded-lg"
              >
                <div className="text-xl mb-1 leading-none select-none">{g.icon}</div>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {g.value.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{g.unit}</div>
                <div className="text-xs font-semibold text-foreground mt-1">
                  {g.label}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="cal-goal">Daily Calories (kcal)</Label>
                <Input
                  id="cal-goal"
                  type="number"
                  min={500}
                  max={10000}
                  step={50}
                  value={form.calorieGoal}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, calorieGoal: Number(e.target.value) }))
                  }
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="prot-goal">Daily Protein (g)</Label>
                <Input
                  id="prot-goal"
                  type="number"
                  min={10}
                  max={500}
                  step={5}
                  value={form.proteinGoalG}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, proteinGoalG: Number(e.target.value) }))
                  }
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="water-goal">Daily Water (ml)</Label>
                <Input
                  id="water-goal"
                  type="number"
                  min={500}
                  max={10000}
                  step={100}
                  value={form.waterGoalMl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, waterGoalMl: Number(e.target.value) }))
                  }
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            {saveError && (
              <p className="text-sm text-destructive">
                Failed to save goals. Please try again.
              </p>
            )}

            <div className="flex items-center gap-3 justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Saving…" : "Save Goals"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-6 bg-muted rounded-xl p-4 text-center">
        <p className="text-xs text-muted-foreground">
          Streak is calculated from your logged food and water entries in the{" "}
          <Link href="/tracker" className="underline hover:text-foreground">
            Daily Tracker
          </Link>
          . All goals are met when calories, protein, and water reach your targets.
        </p>
      </div>
    </div>
  );
}
