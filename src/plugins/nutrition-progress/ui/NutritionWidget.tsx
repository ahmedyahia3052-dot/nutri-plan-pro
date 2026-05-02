/**
 * NutritionWidget — compact Dashboard card
 *
 * Registered via widget-registry. Reuses the same service functions and React
 * Query keys as the full NutritionProgress page, so data is served from cache
 * when both are mounted — no extra API calls.
 */
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link } from "wouter";
import { useGetProfile } from "@/api/hooks";
import { calculateMacroTargets } from "@/plugins/ai-nutrition/service";
import { fetchGoalStatus, fetchTodayFoodLogs, buildProgress } from "../service";
import type { MacroBar, MacroStatus } from "../service";

// ── Colour maps ───────────────────────────────────────────────────────────────

const TRACK_COLOR: Record<MacroStatus, string> = {
  on_track:   "bg-emerald-500",
  near_limit: "bg-amber-400",
  exceeded:   "bg-destructive",
};

const PCT_COLOR: Record<MacroStatus, string> = {
  on_track:   "text-emerald-600",
  near_limit: "text-amber-600",
  exceeded:   "text-destructive",
};

// ── Mini bar row ──────────────────────────────────────────────────────────────

function MiniBar({
  icon,
  label,
  bar,
  unit,
}: {
  icon: string;
  label: string;
  bar: MacroBar;
  unit: string;
}) {
  const cappedPct = Math.min(100, bar.pct);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm leading-none select-none">{icon}</span>
          <span className="text-xs font-medium text-foreground truncate">{label}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ms-2">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {bar.current.toLocaleString()}
            <span className="text-[10px]"> / {bar.target.toLocaleString()} {unit}</span>
          </span>
          <span className={`text-[11px] font-bold tabular-nums ${PCT_COLOR[bar.status]}`}>
            {bar.pct}%
          </span>
        </div>
      </div>
      {/* Track */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${TRACK_COLOR[bar.status]}`}
          style={{ width: `${cappedPct}%` }}
        />
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function MiniSkeleton() {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 animate-pulse">
      <div className="h-3 bg-muted rounded w-40 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-2.5 bg-muted rounded w-full mb-1.5" />
            <div className="h-1.5 bg-muted/50 rounded-full w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Widget ────────────────────────────────────────────────────────────────────

export function NutritionWidget() {
  const { data: profile } = useGetProfile();

  const { data: goalStatus, isLoading: goalLoading } = useQuery({
    queryKey: ["nutrition-progress-goals"],
    queryFn: fetchGoalStatus,
    refetchInterval: 60_000,
    retry: 1,
  });

  const { data: foodLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["nutrition-progress-logs"],
    queryFn: fetchTodayFoodLogs,
    refetchInterval: 60_000,
  });

  const aiTargets = useMemo(
    () => (profile ? calculateMacroTargets(profile) : null),
    [profile]
  );

  const progress = useMemo(() => {
    if (!goalStatus) return null;
    return buildProgress(
      goalStatus,
      foodLogs,
      aiTargets?.carbsG ?? 250,
      aiTargets?.fatG   ?? 65
    );
  }, [goalStatus, foodLogs, aiTargets]);

  if (goalLoading || logsLoading) return <MiniSkeleton />;

  // If goals haven't been configured yet, show a quiet prompt
  if (!progress) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Today's Macro Progress</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Set your daily calorie and protein targets to see progress here.
        </p>
        <Link href="/plugins/goals-streaks" className="text-xs text-primary hover:underline font-medium">
          Set up Goals →
        </Link>
      </div>
    );
  }

  // Overall health indicator
  const bars = [progress.calories, progress.protein, progress.carbs, progress.fat];
  const exceeded  = bars.filter(b => b.status === "exceeded").length;
  const nearLimit = bars.filter(b => b.status === "near_limit").length;
  const overallLabel =
    exceeded  > 0 ? `${exceeded} exceeded`
    : nearLimit > 0 ? `${nearLimit} near limit`
    : "All on track";
  const overallColor =
    exceeded  > 0 ? "text-destructive"
    : nearLimit > 0 ? "text-amber-600"
    : "text-emerald-600";

  return (
    <div className="bg-card border border-card-border rounded-xl p-4 shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Today's Macro Progress</h3>
          <span className={`text-[11px] font-medium ${overallColor}`}>· {overallLabel}</span>
        </div>
        <Link
          href="/plugins/nutrition-progress"
          className="text-[11px] text-primary hover:underline font-medium flex items-center gap-0.5"
        >
          Full view
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* 4 macro bars */}
      <div className="space-y-3">
        <MiniBar icon="🔥" label="Calories" bar={progress.calories} unit="kcal" />
        <MiniBar icon="💪" label="Protein"  bar={progress.protein}  unit="g" />
        <MiniBar icon="🌾" label="Carbs"    bar={progress.carbs}    unit="g" />
        <MiniBar icon="🥑" label="Fat"      bar={progress.fat}      unit="g" />
      </div>

      {/* Log CTA */}
      <div className="mt-3.5 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          Updates every minute
        </span>
        <Link href="/tracker" className="text-[11px] text-primary hover:underline font-medium">
          + Log food
        </Link>
      </div>
    </div>
  );
}
