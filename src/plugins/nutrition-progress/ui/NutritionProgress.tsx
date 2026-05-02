import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useGetProfile } from "@/api/hooks";
import { calculateMacroTargets } from "@/plugins/ai-nutrition/service";
import {
  fetchGoalStatus,
  fetchTodayFoodLogs,
  buildProgress,
} from "../service";
import type { MacroBar, MacroStatus } from "../service";

// ── Status colours ─────────────────────────────────────────────────────────────

const STATUS_TRACK: Record<MacroStatus, string> = {
  on_track:   "bg-emerald-500",
  near_limit: "bg-amber-400",
  exceeded:   "bg-destructive",
};

const STATUS_TEXT: Record<MacroStatus, string> = {
  on_track:   "text-emerald-600",
  near_limit: "text-amber-600",
  exceeded:   "text-destructive",
};

const STATUS_BADGE: Record<MacroStatus, { bg: string; text: string; label: string }> = {
  on_track:   { bg: "bg-emerald-50 border-emerald-200",   text: "text-emerald-700", label: "On Track"   },
  near_limit: { bg: "bg-amber-50  border-amber-200",      text: "text-amber-700",   label: "Near Limit" },
  exceeded:   { bg: "bg-red-50    border-red-200",         text: "text-destructive", label: "Exceeded"   },
};

// ── MacroBar component ─────────────────────────────────────────────────────────

function MacroBarRow({
  label,
  icon,
  bar,
  unit,
}: {
  label: string;
  icon: string;
  bar: MacroBar;
  unit: string;
}) {
  const badge = STATUS_BADGE[bar.status];
  const cappedPct = Math.min(100, bar.pct);

  return (
    <div className="bg-card border border-card-border rounded-xl p-5 shadow-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg select-none leading-none">{icon}</span>
          <span className="font-semibold text-sm text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">
            {bar.current.toLocaleString()} / {bar.target.toLocaleString()} {unit}
          </span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Track */}
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${STATUS_TRACK[bar.status]}`}
          style={{ width: `${cappedPct}%` }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs ${bar.status === "on_track" ? "text-muted-foreground" : STATUS_TEXT[bar.status]}`}>
          {bar.status === "exceeded"
            ? `${(bar.current - bar.target).toLocaleString()} ${unit} over target`
            : bar.status === "near_limit"
            ? `${bar.remaining.toLocaleString()} ${unit} remaining — almost there!`
            : `${bar.remaining.toLocaleString()} ${unit} remaining`}
        </span>
        <span className={`text-xs font-bold tabular-nums ${STATUS_TEXT[bar.status]}`}>
          {bar.pct}%
        </span>
      </div>
    </div>
  );
}

// ── Summary pills ──────────────────────────────────────────────────────────────

function SummaryPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center bg-muted/40 rounded-xl px-4 py-3 flex-1 min-w-0">
      <span className={`text-lg font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-[11px] text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function NutritionProgress() {
  const { data: profile, isLoading: profileLoading } = useGetProfile();

  const {
    data: goalStatus,
    isLoading: goalLoading,
    error: goalError,
  } = useQuery({
    queryKey: ["nutrition-progress-goals"],
    queryFn: fetchGoalStatus,
    refetchInterval: 30_000,
  });

  const {
    data: foodLogs = [],
    isLoading: logsLoading,
  } = useQuery({
    queryKey: ["nutrition-progress-logs"],
    queryFn: fetchTodayFoodLogs,
    refetchInterval: 30_000,
  });

  const aiTargets = useMemo(
    () => (profile ? calculateMacroTargets(profile) : null),
    [profile]
  );

  const carbTarget = aiTargets?.carbsG ?? 250;
  const fatTarget  = aiTargets?.fatG   ?? 65;

  const progress = useMemo(() => {
    if (!goalStatus) return null;
    return buildProgress(goalStatus, foodLogs, carbTarget, fatTarget);
  }, [goalStatus, foodLogs, carbTarget, fatTarget]);

  const isLoading = profileLoading || goalLoading || logsLoading;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-72 mb-8" />
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // ── Error / no goals ───────────────────────────────────────────────────────
  if (goalError) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="font-semibold text-destructive mb-1">Unable to load goals</p>
          <p className="text-sm text-destructive/80">{(goalError as Error).message}</p>
          <p className="text-sm text-muted-foreground mt-2">
            If this is your first time, visit{" "}
            <Link href="/plugins/goals-streaks" className="text-primary underline">Goals &amp; Streaks</Link>{" "}
            to set your daily targets.
          </p>
        </div>
      </div>
    );
  }

  if (!progress) return null;

  // Count statuses
  const bars = [progress.calories, progress.protein, progress.carbs, progress.fat, progress.water];
  const onTrack  = bars.filter(b => b.status === "on_track").length;
  const exceeded = bars.filter(b => b.status === "exceeded").length;
  const nearLimit = bars.filter(b => b.status === "near_limit").length;

  const overallPct = Math.round(
    bars.reduce((s, b) => s + Math.min(100, b.pct), 0) / bars.length
  );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Nutrition Progress</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Real-time macro progress for today —{" "}
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Summary strip */}
      <div className="flex gap-3 mb-6">
        <SummaryPill label="On Track"   value={String(onTrack)}   color="text-emerald-600" />
        <SummaryPill label="Near Limit" value={String(nearLimit)} color="text-amber-600" />
        <SummaryPill label="Exceeded"   value={String(exceeded)}  color="text-destructive" />
        <SummaryPill label="Overall"    value={`${overallPct}%`}  color="text-primary" />
      </div>

      {/* Progress bars */}
      <div className="space-y-4">
        <MacroBarRow label="Calories" icon="🔥" bar={progress.calories} unit="kcal" />
        <MacroBarRow label="Protein"  icon="💪" bar={progress.protein}  unit="g" />
        <MacroBarRow label="Carbs"    icon="🌾" bar={progress.carbs}    unit="g" />
        <MacroBarRow label="Fat"      icon="🥑" bar={progress.fat}      unit="g" />
        <MacroBarRow label="Water"    icon="💧" bar={progress.water}    unit="ml" />
      </div>

      {/* Target source note */}
      <div className="mt-6 bg-muted rounded-xl p-4 text-xs text-muted-foreground text-center leading-relaxed">
        Calorie, protein &amp; water targets come from your{" "}
        <Link href="/plugins/goals-streaks" className="underline hover:text-foreground">Goals &amp; Streaks</Link> settings.
        Carb &amp; fat targets are{" "}
        {aiTargets
          ? "calculated from your health profile using Mifflin–St Jeor."
          : <>estimated (set up your <Link href="/profile" className="underline hover:text-foreground">profile</Link> for personalised targets).</>
        }
      </div>

      {/* CTA */}
      <div className="mt-4 flex gap-3 justify-center flex-wrap">
        <Link href="/tracker">
          <Button size="sm" variant="outline">Log Food &amp; Water</Button>
        </Link>
        <Link href="/plugins/goals-streaks">
          <Button size="sm" variant="outline">Edit Goals</Button>
        </Link>
      </div>
    </div>
  );
}
