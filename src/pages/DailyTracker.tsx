import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  useGetTodayFoodLogs, useLogFood, useDeleteFoodLog,
  useGetWaterLog, useLogWater,
  useGetWeeklyTrend,
  getGetTodayFoodLogsQueryKey, getGetWaterLogQueryKey, getGetWeeklyTrendQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const WATER_PRESETS = [150, 250, 330, 500];
const MACRO_COLORS = ["#10b981", "#3b82f6", "#f59e0b"];

export function DailyTracker() {
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);
  const locale = i18n.language === "ar" ? "ar-SA" : "en-US";

  const MEAL_LABELS: Record<string, string> = {
    breakfast:        t("tracker.meals.breakfast"),
    morning_snack:    t("tracker.meals.morning_snack"),
    lunch:            t("tracker.meals.lunch"),
    afternoon_snack:  t("tracker.meals.afternoon_snack"),
    dinner:           t("tracker.meals.dinner"),
    other:            t("tracker.meals.other"),
  };

  const { data: foodLogs = [], isLoading: logsLoading } = useGetTodayFoodLogs();
  const { data: waterData, isLoading: waterLoading } = useGetWaterLog();
  const { data: weeklyTrend = [], isLoading: trendLoading } = useGetWeeklyTrend();
  const { mutate: logFood, isPending: logging } = useLogFood();
  const { mutate: deleteLog } = useDeleteFoodLog();
  const { mutate: logWater } = useLogWater();

  const [foodOpen, setFoodOpen] = useState(false);
  const [foodForm, setFoodForm] = useState({
    mealType: "lunch" as const,
    foodName: "",
    calories: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetTodayFoodLogsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetWaterLogQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetWeeklyTrendQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };

  const handleLogFood = (e: React.FormEvent) => {
    e.preventDefault();
    logFood({ data: { ...foodForm, date: today } }, {
      onSuccess: () => { setFoodOpen(false); invalidate(); },
    });
  };

  const totalCalories = foodLogs.reduce((s, l) => s + l.calories, 0);
  const totalProtein  = foodLogs.reduce((s, l) => s + l.proteinG, 0);
  const totalCarbs    = foodLogs.reduce((s, l) => s + l.carbsG, 0);
  const totalFat      = foodLogs.reduce((s, l) => s + l.fatG, 0);
  const waterMl       = waterData?.totalMl ?? 0;
  const waterPct      = Math.min(100, Math.round((waterMl / 2500) * 100));

  const macroData = [
    { name: t("tracker.stats.protein"), value: Math.round(totalProtein) },
    { name: t("tracker.stats.carbs"),   value: Math.round(totalCarbs) },
    { name: t("tracker.stats.fat"),     value: Math.round(totalFat) },
  ].filter(d => d.value > 0);

  const byMeal: Record<string, typeof foodLogs> = {};
  for (const log of foodLogs) {
    if (!byMeal[log.mealType]) byMeal[log.mealType] = [];
    byMeal[log.mealType].push(log);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("tracker.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <Button onClick={() => setFoodOpen(true)}>{t("tracker.logFood")}</Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: t("tracker.stats.calories"), value: totalCalories,            unit: "kcal", color: "text-primary" },
          { label: t("tracker.stats.protein"),  value: Math.round(totalProtein), unit: "g",    color: "text-blue-600" },
          { label: t("tracker.stats.carbs"),    value: Math.round(totalCarbs),   unit: "g",    color: "text-amber-600" },
          { label: t("tracker.stats.fat"),      value: Math.round(totalFat),     unit: "g",    color: "text-primary" },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-card-border rounded-xl p-5 text-center shadow-sm">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{stat.unit}</div>
            <div className="text-sm font-medium text-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Water */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">{t("tracker.water.title")}</h2>
            <span className="text-sm text-muted-foreground">{waterMl} / 2500 ml</span>
          </div>
          {waterLoading ? <Skeleton className="h-4 w-full" /> : (
            <>
              <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${waterPct}%` }} />
              </div>
              <div className="flex flex-wrap gap-2">
                {WATER_PRESETS.map(ml => (
                  <button key={ml} onClick={() => logWater({ data: { amountMl: ml, date: today } }, { onSuccess: invalidate })}
                    className="px-3 py-1.5 rounded-lg text-sm border border-border bg-background hover:bg-accent hover:border-primary/40 transition-all font-medium">
                    +{ml} ml
                  </button>
                ))}
                <button onClick={() => {
                  const v = prompt(t("tracker.water.prompt"));
                  if (v && Number(v) > 0) logWater({ data: { amountMl: Number(v), date: today } }, { onSuccess: invalidate });
                }} className="px-3 py-1.5 rounded-lg text-sm border border-border bg-background hover:bg-accent hover:border-primary/40 transition-all font-medium">
                  {t("tracker.water.custom")}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Macros */}
        {macroData.length > 0 ? (
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h2 className="font-semibold text-foreground mb-1">{t("tracker.macros.title")}</h2>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={macroData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} paddingAngle={3}>
                  {macroData.map((_, i) => <Cell key={i} fill={MACRO_COLORS[i % MACRO_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}g`]} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded-xl p-5 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">{t("tracker.macros.empty")}</p>
          </div>
        )}
      </div>

      {/* 7-day trend */}
      <div className="bg-card border border-card-border rounded-xl p-5 mb-8">
        <h2 className="font-semibold text-foreground mb-4">{t("tracker.trend.title")}</h2>
        {trendLoading ? <Skeleton className="h-40 w-full" /> : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={weeklyTrend} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v) => [`${v} kcal`, t("tracker.trend.calories")]} />
              <Area type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2} fill="url(#calGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Food log */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-foreground">{t("tracker.foodLog.title")}</h2>
        <span className="text-sm text-muted-foreground">
          {t("tracker.items", { count: foodLogs.length })}
        </span>
      </div>

      {logsLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : foodLogs.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-10 text-center">
          <div className="text-muted-foreground text-sm mb-3">{t("tracker.foodLog.empty")}</div>
          <Button size="sm" onClick={() => setFoodOpen(true)}>{t("tracker.foodLog.logFirst")}</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byMeal).map(([mealType, items]) => (
            <div key={mealType} className="bg-card border border-card-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
                <span className="font-semibold text-foreground text-sm">{MEAL_LABELS[mealType] ?? mealType}</span>
                <span className="text-sm text-primary font-semibold">{items.reduce((s, i) => s + i.calories, 0)} kcal</span>
              </div>
              <div className="divide-y divide-border">
                {items.map(item => (
                  <div key={item.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-medium text-foreground text-sm">{item.foodName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        P: {item.proteinG}g · C: {item.carbsG}g · F: {item.fatG}g
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold text-foreground">{item.calories} kcal</span>
                      <button onClick={() => deleteLog({ id: item.id }, { onSuccess: invalidate })}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded hover:bg-destructive/10">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log food dialog */}
      <Dialog open={foodOpen} onOpenChange={setFoodOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("tracker.dialog.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogFood} className="space-y-4 py-2">
            <div>
              <Label>{t("tracker.dialog.mealType")}</Label>
              <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                {Object.entries(MEAL_LABELS).map(([val, label]) => (
                  <button key={val} type="button"
                    onClick={() => setFoodForm(f => ({ ...f, mealType: val as typeof foodForm.mealType }))}
                    className={`px-2 py-1.5 rounded-lg text-xs border font-medium transition-all ${foodForm.mealType === val ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="food-name">{t("tracker.dialog.foodName")}</Label>
              <Input id="food-name" value={foodForm.foodName}
                onChange={e => setFoodForm(f => ({ ...f, foodName: e.target.value }))}
                required placeholder={t("tracker.dialog.foodNamePlaceholder")} className="mt-1.5" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cal">{t("tracker.dialog.calories")}</Label>
                <Input id="cal" type="number" min={0} value={foodForm.calories || ""}
                  onChange={e => setFoodForm(f => ({ ...f, calories: Number(e.target.value) }))} required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="prot">{t("tracker.dialog.protein")}</Label>
                <Input id="prot" type="number" min={0} step={0.1} value={foodForm.proteinG || ""}
                  onChange={e => setFoodForm(f => ({ ...f, proteinG: Number(e.target.value) }))} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="carb">{t("tracker.dialog.carbs")}</Label>
                <Input id="carb" type="number" min={0} step={0.1} value={foodForm.carbsG || ""}
                  onChange={e => setFoodForm(f => ({ ...f, carbsG: Number(e.target.value) }))} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="fat">{t("tracker.dialog.fat")}</Label>
                <Input id="fat" type="number" min={0} step={0.1} value={foodForm.fatG || ""}
                  onChange={e => setFoodForm(f => ({ ...f, fatG: Number(e.target.value) }))} className="mt-1.5" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFoodOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={logging}>
                {logging ? t("tracker.dialog.submitting") : t("tracker.dialog.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
