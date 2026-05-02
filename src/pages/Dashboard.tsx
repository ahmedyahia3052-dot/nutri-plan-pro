import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useGetDashboardSummary, useGetWeeklyTrend } from "@/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { DashboardWidgetZone } from "@/components/DashboardWidgetZone";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";

const MACRO_COLORS = ["#10b981", "#3b82f6", "#f59e0b"];

function CalorieRing({ current, target }: { current: number; target: number }) {
  const { t } = useTranslation();
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={140} height={140}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" data={[{ value: pct }]} startAngle={90} endAngle={-270}>
          <RadialBar dataKey="value" fill="#10b981" cornerRadius={8} background={{ fill: "hsl(var(--muted))" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="-mt-16 text-center">
        <div className="text-2xl font-bold text-foreground">{current}</div>
        <div className="text-xs text-muted-foreground">{t("dashboard.calories.of")} {target} kcal</div>
      </div>
      <div className="mt-2 text-xs font-medium text-primary">{pct}{t("dashboard.calories.ofGoal")}</div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { data: trend = [] } = useGetWeeklyTrend();

  const hour = new Date().getHours();
  const greeting = hour < 12
    ? t("dashboard.greeting.morning")
    : hour < 17
    ? t("dashboard.greeting.afternoon")
    : t("dashboard.greeting.evening");

  const macroData = summary ? [
    { name: t("dashboard.macros.protein"), value: summary.todayProtein },
    { name: t("dashboard.macros.carbs"),   value: summary.todayCarbs },
    { name: t("dashboard.macros.fat"),     value: summary.todayFat },
  ] : [];

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl mb-6" />
      </div>
    );
  }

  const locale = i18n.language === "ar" ? "ar-SA" : "en-US";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {greeting}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
      </div>

      {!summary?.hasProfile && (
        <div className="mb-6 bg-accent border border-accent-border rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="font-semibold text-accent-foreground">{t("dashboard.completeProfile.title")}</div>
            <div className="text-sm text-accent-foreground/70 mt-0.5">{t("dashboard.completeProfile.desc")}</div>
          </div>
          <Link href="/profile">
            <Button size="sm" className="ms-4 flex-shrink-0">{t("dashboard.completeProfile.cta")}</Button>
          </Link>
        </div>
      )}

      {(summary?.interactionWarnings ?? 0) > 0 && (
        <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-destructive/15 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-destructive">
                {t("dashboard.interactions.title_one", { count: summary!.interactionWarnings })}
              </div>
              <div className="text-sm text-destructive/70 mt-0.5">{t("dashboard.interactions.desc")}</div>
            </div>
          </div>
          <Link href="/interactions">
            <Button variant="destructive" size="sm" className="ms-4 flex-shrink-0">{t("dashboard.interactions.cta")}</Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: t("dashboard.stats.dietPlans"),  value: summary?.totalDietPlans ?? 0 },
          { label: t("dashboard.stats.conditions"), value: summary?.activeConditions ?? 0 },
          { label: t("dashboard.stats.allergies"),  value: summary?.activeAllergies ?? 0 },
          { label: t("dashboard.stats.medications"),value: summary?.activeMedications ?? 0 },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-card-border rounded-xl p-5 shadow-sm text-center">
            <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-card-border rounded-xl p-5 flex flex-col items-center shadow-sm">
          <h2 className="font-semibold text-foreground mb-4 self-start">{t("dashboard.calories.title")}</h2>
          <CalorieRing current={summary?.todayCalories ?? 0} target={summary?.calorieTarget ?? 2000} />
          <Link href="/tracker" className="mt-4 text-xs text-primary hover:underline">{t("dashboard.calories.logFood")}</Link>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-3">{t("dashboard.macros.title")}</h2>
          {macroData.every(m => m.value === 0) ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">{t("dashboard.macros.empty")}</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={macroData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 12 }} formatter={(v) => [`${v}g`]} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {macroData.map((_, i) => <Cell key={i} fill={MACRO_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-around text-xs mt-2">
                {macroData.map((m, i) => (
                  <div key={m.name} className="text-center">
                    <div className="font-semibold" style={{ color: MACRO_COLORS[i] }}>{m.value}g</div>
                    <div className="text-muted-foreground">{m.name}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">{t("dashboard.water.title")}</h2>
            <span className="text-xs text-muted-foreground">{summary?.todayWaterMl ?? 0} {t("dashboard.water.of")}</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-4">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(100, ((summary?.todayWaterMl ?? 0) / 2500) * 100)}%` }} />
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            {(summary?.todayWaterMl ?? 0) >= 2500
              ? t("dashboard.water.reached")
              : t("dashboard.water.remaining", { amount: 2500 - (summary?.todayWaterMl ?? 0) })}
          </div>
          <Link href="/tracker" className="mt-3 block text-xs text-primary hover:underline">{t("dashboard.water.logWater")}</Link>
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5 mb-8 shadow-sm">
        <h2 className="font-semibold text-foreground mb-4">{t("dashboard.trend.title")}</h2>
        {trend.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">{t("dashboard.trend.empty")}</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="dashCalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v) => [`${v} kcal`, t("dashboard.trend.calories")]} />
              <Area type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2} fill="url(#dashCalGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <DashboardWidgetZone />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">{t("dashboard.recentPlans.title")}</h2>
          <Link href="/diet-plans" className="text-sm text-primary hover:underline">{t("common.viewAll")}</Link>
        </div>
        {(!summary?.recentPlans || summary.recentPlans.length === 0) ? (
          <div className="bg-card border border-card-border rounded-xl p-8 text-center">
            <div className="text-muted-foreground text-sm">{t("dashboard.recentPlans.empty")}</div>
            <Link href="/diet-plans">
              <Button size="sm" className="mt-3">{t("dashboard.recentPlans.createFirst")}</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {summary.recentPlans.map(plan => (
              <Link key={plan.id} href={`/diet-plans/${plan.id}`} className="flex items-center justify-between bg-card border border-card-border rounded-xl px-5 py-4 hover:border-primary/40 hover:shadow-sm transition-all">
                <div>
                  <div className="font-medium text-foreground">{plan.title}</div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {plan.targetConditions.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                  </div>
                </div>
                <div className="text-end ms-4 flex-shrink-0">
                  <div className="text-sm font-semibold text-primary">{plan.calorieTarget} kcal</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(plan.createdAt).toLocaleDateString(locale)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold text-foreground mb-4">{t("dashboard.quickActions.title")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/tracker",             label: t("dashboard.quickActions.logMeal"),          icon: "M12 4v16m8-8H4" },
            { href: "/diet-plans",          label: t("dashboard.quickActions.newPlan"),           icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
            { href: "/interactions",        label: t("dashboard.quickActions.checkInteractions"), icon: "M12 9v2m0 4h.01" },
            { href: "/calorie-calculator",  label: t("dashboard.quickActions.calorieCalc"),       icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
          ].map(action => (
            <Link key={action.href} href={action.href} className="bg-card border border-card-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/40 hover:shadow-sm transition-all text-center">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center">
                <svg className="w-5 h-5 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                </svg>
              </div>
              <span className="text-sm font-medium text-foreground">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 bg-muted rounded-xl p-4 text-center">
        <p className="text-xs text-muted-foreground">{t("common.educational_long")}</p>
      </div>
    </div>
  );
}
