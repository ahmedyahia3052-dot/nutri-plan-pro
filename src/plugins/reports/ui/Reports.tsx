import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { pluginFetch } from "@/plugins/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, ResponsiveContainer, PieChart, Pie, Legend } from "recharts";

interface ReportSummary {
  generatedAt: string;
  profile: {
    name: string; age: number; gender: string; weightKg: number; heightCm: number;
    activityLevel: string; goal: string; conditions: string[]; allergies: string[]; medications: string[];
  } | null;
  dietPlans: { total: number; latest: { title: string; calorieTarget: number } | null };
  nutrition: {
    trackedDays: number; avgCaloriesPerDay: number; avgProteinG: number; avgCarbsG: number;
    avgFatG: number; avgWaterMl: number;
    dailyStats: Array<{ date: string; calories: number; proteinG: number; carbsG: number; fatG: number; waterMl: number }>;
  };
  safety: { totalInteractions: number; majorInteractions: number };
}

const MACRO_COLORS = ["#10b981", "#3b82f6", "#f59e0b"];

function usePrintCSS() {
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "nutri-report-print-css";
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #report-print-area, #report-print-area * { visibility: visible !important; }
        #report-print-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 24px !important; }
        .no-print { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => { document.getElementById("nutri-report-print-css")?.remove(); };
  }, []);
}

export function Reports() {
  usePrintCSS();
  const { data, isLoading, error } = useQuery<ReportSummary>({
    queryKey: ["plugins", "reports", "summary"],
    queryFn: () => pluginFetch("reports/summary"),
    retry: 1,
  });

  const macroData = data ? [
    { name: "Protein", value: data.nutrition.avgProteinG },
    { name: "Carbs", value: data.nutrition.avgCarbsG },
    { name: "Fat", value: data.nutrition.avgFatG },
  ].filter(m => m.value > 0) : [];

  const chartData = data?.nutrition.dailyStats.map(d => ({
    label: new Date(d.date + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" }),
    calories: d.calories,
    water: Math.round(d.waterMl / 100),
  })) ?? [];

  const bmi = data?.profile ? +(data.profile.weightKg / ((data.profile.heightCm / 100) ** 2)).toFixed(1) : null;
  const bmiCategory = bmi === null ? "" : bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-8">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center mt-12">
        <p className="text-muted-foreground mb-4">Unable to generate report. Make sure you have a completed profile and some tracking data.</p>
        <Link href="/profile"><Button variant="outline">Go to Profile</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="no-print mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium tracking-wide uppercase">
            <span>Plugins</span><span>/</span><span>Professional Reports</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Health & Nutrition Report</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Generated {new Date(data.generatedAt).toLocaleDateString("en", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <Button onClick={() => window.print()} className="flex items-center gap-2 no-print">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Export PDF
        </Button>
      </div>

      <div id="report-print-area">
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold">Nutri Plan Pro — Health Report</h1>
          <p className="text-sm text-muted-foreground">Generated {new Date(data.generatedAt).toLocaleDateString()}</p>
        </div>

        {data.profile && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">Patient Profile</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: "Name", value: data.profile.name },
                { label: "Age", value: `${data.profile.age} years` },
                { label: "BMI", value: `${bmi} (${bmiCategory})` },
                { label: "Goal", value: data.profile.goal.replace(/_/g, " ") },
              ].map(item => (
                <div key={item.label} className="bg-card border border-card-border rounded-xl p-4 text-center shadow-sm">
                  <div className="font-semibold text-foreground">{item.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Medical Conditions", items: data.profile.conditions, color: "text-destructive", emptyText: "None recorded" },
                { label: "Allergies", items: data.profile.allergies, color: "text-amber-600", emptyText: "None recorded" },
                { label: "Current Medications", items: data.profile.medications, color: "text-blue-600", emptyText: "None recorded" },
              ].map(section => (
                <div key={section.label} className="bg-card border border-card-border rounded-xl p-4 shadow-sm">
                  <div className="font-medium text-foreground text-sm mb-2">{section.label}</div>
                  {section.items.length === 0 ? (
                    <span className="text-xs text-muted-foreground">{section.emptyText}</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {section.items.map(item => (
                        <span key={item} className="px-2 py-0.5 rounded-full bg-muted text-foreground text-xs font-medium">{item}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">Nutrition Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Days Tracked", value: data.nutrition.trackedDays },
              { label: "Avg Calories", value: `${data.nutrition.avgCaloriesPerDay} kcal` },
              { label: "Diet Plans", value: data.dietPlans.total },
              { label: "Avg Water", value: `${data.nutrition.avgWaterMl} ml` },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-card-border rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {chartData.length > 0 && (
            <div className="bg-card border border-card-border rounded-xl p-5 mb-4 shadow-sm">
              <div className="font-medium text-foreground mb-3 text-sm">Daily Calorie History (Last 14 Days)</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="repCalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11 }} formatter={(v) => [`${v} kcal`]} />
                  <Area type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2} fill="url(#repCalGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {macroData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
                <div className="font-medium text-foreground mb-3 text-sm">Average Daily Macros</div>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={macroData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: 11 }} formatter={(v) => [`${v}g`]} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {macroData.map((_, i) => <Cell key={i} fill={MACRO_COLORS[i]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
                <div className="font-medium text-foreground mb-1 text-sm">Macro Distribution</div>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={macroData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} paddingAngle={3}>
                      {macroData.map((_, i) => <Cell key={i} fill={MACRO_COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}g`]} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">Safety Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-xl border p-5 text-center ${data.safety.majorInteractions > 0 ? "bg-red-50 border-red-200" : "bg-card border-card-border"}`}>
              <div className={`text-3xl font-bold ${data.safety.majorInteractions > 0 ? "text-destructive" : "text-foreground"}`}>{data.safety.majorInteractions}</div>
              <div className="text-sm font-medium text-foreground mt-1">Major Interactions</div>
              <div className="text-xs text-muted-foreground">Require immediate review</div>
            </div>
            <div className="bg-card border border-card-border rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-foreground">{data.safety.totalInteractions}</div>
              <div className="text-sm font-medium text-foreground mt-1">Total Interactions</div>
              <div className="text-xs text-muted-foreground">Across all medications</div>
            </div>
          </div>
        </section>

        <div className="bg-muted rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground">This report is generated for educational and informational purposes only. It does not constitute medical advice. Always consult qualified healthcare professionals for medical decisions.</p>
        </div>
      </div>
    </div>
  );
}
