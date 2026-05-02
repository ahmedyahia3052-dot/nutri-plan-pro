import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCalculateCalories } from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function MacroPill({ label, value, unit, colorClass }: { label: string; value: number; unit: string; colorClass: string }) {
  return (
    <div className={`rounded-xl p-5 text-center border ${colorClass}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-1">{unit}</div>
      <div className="text-xs opacity-70 mt-0.5">{label}</div>
    </div>
  );
}

export function CalorieCalculator() {
  const { t } = useTranslation();
  const { mutate: calculateCalories, data: result, isPending } = useCalculateCalories();

  const ACTIVITY_LABELS: Record<string, string> = {
    sedentary:         t("calorieCalculator.activityOptions.sedentary"),
    lightly_active:    t("calorieCalculator.activityOptions.lightly_active"),
    moderately_active: t("calorieCalculator.activityOptions.moderately_active"),
    very_active:       t("calorieCalculator.activityOptions.very_active"),
    extra_active:      t("calorieCalculator.activityOptions.extra_active"),
  };

  const GOAL_LABELS: Record<string, string> = {
    lose_weight:  t("calorieCalculator.goalOptions.lose_weight"),
    maintain:     t("calorieCalculator.goalOptions.maintain"),
    gain_weight:  t("calorieCalculator.goalOptions.gain_weight"),
  };

  const [form, setForm] = useState({
    age: 30,
    gender: "male",
    weightKg: 70,
    heightCm: 170,
    activityLevel: "moderately_active",
    goal: "maintain",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateCalories({ data: form });
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t("calorieCalculator.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("calorieCalculator.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-xl p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">{t("calorieCalculator.age")}</Label>
                <Input id="age" type="number" min={10} max={120} value={form.age}
                  onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))} required className="mt-1.5" />
              </div>
              <div>
                <Label>{t("calorieCalculator.gender")}</Label>
                <div className="flex gap-2 mt-1.5">
                  {["male", "female"].map(g => (
                    <button key={g} type="button" onClick={() => setForm(f => ({ ...f, gender: g }))}
                      className={`flex-1 py-2 rounded-lg text-sm border font-medium transition-all ${form.gender === g ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}>
                      {t(`calorieCalculator.genderOptions.${g}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight-calc">{t("calorieCalculator.weight")}</Label>
                <Input id="weight-calc" type="number" min={20} max={300} step={0.1} value={form.weightKg}
                  onChange={e => setForm(f => ({ ...f, weightKg: Number(e.target.value) }))} required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="height-calc">{t("calorieCalculator.height")}</Label>
                <Input id="height-calc" type="number" min={50} max={250} value={form.heightCm}
                  onChange={e => setForm(f => ({ ...f, heightCm: Number(e.target.value) }))} required className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label>{t("calorieCalculator.activityLevel")}</Label>
              <div className="space-y-1.5 mt-1.5">
                {Object.entries(ACTIVITY_LABELS).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setForm(f => ({ ...f, activityLevel: val }))}
                    className={`w-full text-start px-3 py-2 rounded-lg text-sm border transition-all ${form.activityLevel === val ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>{t("calorieCalculator.goal")}</Label>
              <div className="space-y-1.5 mt-1.5">
                {Object.entries(GOAL_LABELS).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => setForm(f => ({ ...f, goal: val }))}
                    className={`w-full text-start px-3 py-2 rounded-lg text-sm border transition-all ${form.goal === val ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={isPending} className="w-full h-11">
              {isPending ? t("calorieCalculator.calculating") : t("calorieCalculator.calculate")}
            </Button>
          </form>
        </div>

        <div>
          {result ? (
            <div className="space-y-4">
              <div className="bg-card border border-card-border rounded-xl p-5">
                <div className="text-sm font-medium text-muted-foreground">{t("calorieCalculator.results.bmi")}</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-bold text-foreground">{result.bmi}</span>
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                    result.bmiCategory === "Normal weight" ? "bg-primary/10 text-primary" :
                    result.bmiCategory === "Underweight"   ? "bg-blue-100 text-blue-700" :
                    result.bmiCategory === "Overweight"    ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-destructive"
                  }`}>{result.bmiCategory}</span>
                </div>
              </div>
              <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
                <div>
                  <div className="text-xs text-muted-foreground">{t("calorieCalculator.results.bmr")}</div>
                  <div className="text-xl font-bold text-foreground">{result.bmr} <span className="text-sm font-normal text-muted-foreground">{t("common.kcalPerDay")}</span></div>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="text-xs text-muted-foreground">{t("calorieCalculator.results.tdee")}</div>
                  <div className="text-xl font-bold text-foreground">{result.tdee} <span className="text-sm font-normal text-muted-foreground">{t("common.kcalPerDay")}</span></div>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="text-xs text-muted-foreground">{t("calorieCalculator.results.target")}</div>
                  <div className="text-3xl font-bold text-primary">{result.targetCalories} <span className="text-base font-normal text-muted-foreground">{t("common.kcalPerDay")}</span></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <MacroPill label={t("calorieCalculator.results.protein")} value={result.proteinG} unit="g" colorClass="bg-blue-50 text-blue-700 border-blue-100" />
                <MacroPill label={t("calorieCalculator.results.carbs")}   value={result.carbsG}   unit="g" colorClass="bg-amber-50 text-amber-700 border-amber-100" />
                <MacroPill label={t("calorieCalculator.results.fat")}     value={result.fatG}     unit="g" colorClass="bg-primary/10 text-primary border-primary/15" />
              </div>
              <div className="bg-muted rounded-xl p-4 text-xs text-muted-foreground">
                {t("calorieCalculator.results.disclaimer")}
              </div>
            </div>
          ) : (
            <div className="bg-card border border-card-border rounded-xl p-10 flex flex-col items-center justify-center text-center h-full min-h-64">
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-muted-foreground text-sm">{t("calorieCalculator.subtitle")}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
