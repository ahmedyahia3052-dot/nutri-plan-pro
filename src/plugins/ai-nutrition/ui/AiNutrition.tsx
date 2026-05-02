import { useState, useMemo } from "react";
import { useGetProfile } from "@/api/hooks";
import { calculateMacroTargets, generateInsights, generateWeeklyPlan } from "../service";
import type { NutritionInsight } from "../service";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { cn } from "@/lib/utils";

const INSIGHT_STYLES: Record<string, { border: string; bg: string; icon: string; iconClass: string }> = {
  warning: { border: "border-red-200", bg: "bg-red-50", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", iconClass: "text-destructive" },
  info: { border: "border-blue-200", bg: "bg-blue-50", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", iconClass: "text-blue-600" },
  success: { border: "border-green-200", bg: "bg-green-50", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", iconClass: "text-primary" },
  tip: { border: "border-amber-200", bg: "bg-amber-50", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z", iconClass: "text-amber-600" },
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  morning_snack: "Morning Snack",
  lunch: "Lunch",
  afternoon_snack: "Afternoon Snack",
  dinner: "Dinner",
};

const MACRO_COLORS = ["#10b981", "#3b82f6", "#f59e0b"];

export function AiNutrition() {
  const { data: profile, isLoading } = useGetProfile();
  const [activeDay, setActiveDay] = useState(0);
  const [planGenerated, setPlanGenerated] = useState(false);

  const targets = useMemo(() => profile ? calculateMacroTargets(profile) : null, [profile]);
  const insights = useMemo(() => profile ? generateInsights(profile) : [], [profile]);
  const weeklyPlan = useMemo(() => (planGenerated && profile && targets) ? generateWeeklyPlan(profile, targets) : [], [planGenerated, profile, targets]);

  const caloriePct = targets ? Math.min(100, Math.round((targets.calories / 3000) * 100)) : 0;

  const macroData = targets ? [
    { name: "Protein", value: targets.proteinG, unit: "g" },
    { name: "Carbs", value: targets.carbsG, unit: "g" },
    { name: "Fat", value: targets.fatG, unit: "g" },
  ] : [];

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-72 mb-6" />
        <div className="grid grid-cols-2 gap-4 mb-8">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center mt-12">
        <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Profile Required</h2>
        <p className="text-muted-foreground text-sm mb-6">Complete your health profile to get personalised nutrition analysis and meal plans.</p>
        <Link href="/profile"><Button>Set Up My Profile</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium tracking-wide uppercase">
          <span>Plugins</span>
          <span>/</span>
          <span>AI Nutrition Assistant</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">AI Nutrition Assistant</h1>
        <p className="text-muted-foreground mt-1">Rule-based personalised analysis for {profile.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-card-border rounded-xl p-5 flex flex-col items-center shadow-sm">
          <h3 className="font-semibold text-foreground mb-3 self-start text-sm">Daily Calorie Target</h3>
          <ResponsiveContainer width={120} height={120}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="100%" data={[{ value: caloriePct }]} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" fill="#10b981" cornerRadius={6} background={{ fill: "hsl(var(--muted))" }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="-mt-14 text-center mb-4">
            <div className="text-2xl font-bold text-foreground">{targets?.calories}</div>
            <div className="text-xs text-muted-foreground">kcal / day</div>
          </div>
          <div className="w-full space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Goal</span><span className="font-medium text-foreground capitalize">{profile.goal?.replace(/_/g, " ")}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Activity</span><span className="font-medium text-foreground capitalize">{profile.activityLevel.replace(/_/g, " ")}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Water</span><span className="font-medium text-foreground">{targets?.waterMl} ml</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Fibre</span><span className="font-medium text-foreground">{targets?.fiberG}g</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3 text-sm">Macro Targets</h3>
          {targets && (
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
              <div className="flex justify-around mt-2 text-xs">
                {macroData.map((m, i) => (
                  <div key={m.name} className="text-center">
                    <div className="font-bold" style={{ color: MACRO_COLORS[i] }}>{m.value}g</div>
                    <div className="text-muted-foreground">{m.name}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-3 text-sm">Profile Summary</h3>
          <div className="space-y-2 text-xs">
            {[
              { label: "Age / Gender", value: `${profile.age} years / ${profile.gender}` },
              { label: "Weight", value: `${profile.weightKg} kg` },
              { label: "Height", value: `${profile.heightCm} cm` },
              { label: "BMI", value: `${(profile.weightKg / ((profile.heightCm / 100) ** 2)).toFixed(1)}` },
            ].map(row => (
              <div key={row.label} className="flex justify-between">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium text-foreground">{row.value}</span>
              </div>
            ))}
            {profile.conditions.length > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="text-muted-foreground mb-1">Conditions</div>
                <div className="flex flex-wrap gap-1">
                  {profile.conditions.map(c => <span key={c} className="px-1.5 py-0.5 bg-accent text-accent-foreground rounded text-[10px]">{c}</span>)}
                </div>
              </div>
            )}
            {profile.allergies.length > 0 && (
              <div className="pt-1">
                <div className="text-muted-foreground mb-1">Allergies</div>
                <div className="flex flex-wrap gap-1">
                  {profile.allergies.map(a => <span key={a} className="px-1.5 py-0.5 bg-destructive/10 text-destructive rounded text-[10px]">{a}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="font-semibold text-foreground mb-4">
          Clinical Insights
          <span className="ml-2 text-xs font-normal text-muted-foreground">({insights.length} recommendation{insights.length !== 1 ? "s" : ""})</span>
        </h2>
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const style = INSIGHT_STYLES[insight.type] ?? INSIGHT_STYLES.info;
            return (
              <div key={i} className={cn("rounded-xl border p-5", style.border, style.bg)}>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className={cn("w-4 h-4", style.iconClass)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.icon} />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{insight.category}</span>
                    </div>
                    <div className="font-semibold text-foreground mb-1">{insight.title}</div>
                    <p className="text-sm text-foreground/80 leading-relaxed mb-3">{insight.detail}</p>
                    <div className="space-y-1">
                      {insight.actions.map((a, ai) => (
                        <div key={ai} className="flex items-center gap-2 text-xs text-foreground/70">
                          <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0" />
                          {a}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Weekly Meal Plan</h2>
          {!planGenerated && (
            <Button size="sm" onClick={() => setPlanGenerated(true)}>Generate 7-Day Plan</Button>
          )}
        </div>

        {!planGenerated ? (
          <div className="bg-card border border-card-border rounded-xl p-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">Generate a personalised 7-day meal plan tailored to your conditions and allergies.</p>
            <Button onClick={() => setPlanGenerated(true)}>Generate Plan</Button>
          </div>
        ) : (
          <>
            <div className="flex gap-1 mb-4 flex-wrap">
              {weeklyPlan.map((dayPlan, i) => (
                <button key={dayPlan.day} onClick={() => setActiveDay(i)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all border", activeDay === i ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50 text-foreground")}>
                  {dayPlan.day.slice(0, 3)}
                </button>
              ))}
            </div>

            {weeklyPlan[activeDay] && (
              <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 bg-muted/30 border-b border-border flex items-center justify-between">
                  <div className="font-semibold text-foreground">{weeklyPlan[activeDay].day}</div>
                  <div className="text-sm font-semibold text-primary">{weeklyPlan[activeDay].totalCalories} kcal</div>
                </div>
                <div className="divide-y divide-border">
                  {Object.entries(weeklyPlan[activeDay].meals).map(([mealType, items]) => (
                    <div key={mealType} className="px-5 py-4">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{MEAL_LABELS[mealType] ?? mealType}</div>
                      <div className="space-y-2">
                        {items.map((item, ii) => (
                          <div key={ii} className="flex items-start justify-between">
                            <div>
                              <span className="text-sm font-medium text-foreground">{item.name}</span>
                              <span className="text-xs text-muted-foreground ml-2">— {item.portion}</span>
                              {item.notes && <span className="ml-2 text-xs text-primary">{item.notes}</span>}
                            </div>
                            <div className="text-xs text-muted-foreground flex-shrink-0 ml-4 text-right">
                              <span className="font-semibold text-foreground">{item.calories} kcal</span>
                              <span className="ml-2">P:{item.proteinG}g C:{item.carbsG}g F:{item.fatG}g</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-8 bg-muted rounded-xl p-4">
        <p className="text-xs text-muted-foreground text-center">Recommendations are rule-based and for educational purposes only. Consult a registered dietitian for personalised clinical nutrition guidance.</p>
      </div>
    </div>
  );
}
