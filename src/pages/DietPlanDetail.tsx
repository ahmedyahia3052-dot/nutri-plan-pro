import { useRoute, Link } from "wouter";
import { useGetDietPlan } from "@/api/hooks";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  morning_snack: "Morning Snack",
  lunch: "Lunch",
  afternoon_snack: "Afternoon Snack",
  dinner: "Dinner",
};

function MacroBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{value}g</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DietPlanDetail() {
  const [, params] = useRoute("/diet-plans/:id");
  const id = Number(params?.id);
  const { data: plan, isLoading } = useGetDietPlan(id, { query: { enabled: !!id } });

  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="space-y-4">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-8 text-center">
        <div className="text-muted-foreground mb-3">Plan not found.</div>
        <Link href="/diet-plans"><Button variant="outline">Back to Plans</Button></Link>
      </div>
    );
  }

  const meals = plan.meals as any[];
  const totalProtein = meals.reduce((s, m) => s + m.foods.reduce((fs: number, f: any) => fs + (f.proteinG ?? 0), 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + m.foods.reduce((fs: number, f: any) => fs + (f.carbsG ?? 0), 0), 0);
  const totalFat = meals.reduce((s, m) => s + m.foods.reduce((fs: number, f: any) => fs + (f.fatG ?? 0), 0), 0);
  const totalCals = meals.reduce((s, m) => s + (m.totalCalories ?? 0), 0);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-2">
        <Link href="/diet-plans" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Back to Plans
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{plan.title}</h1>
        <p className="text-muted-foreground mt-1">{plan.notes}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Badge className="bg-primary/10 text-primary border-primary/20">{plan.calorieTarget} kcal/day target</Badge>
        {plan.targetConditions.map(c => <Badge key={c} variant="secondary">{c}</Badge>)}
        <span className="text-xs text-muted-foreground self-center">{new Date(plan.createdAt).toLocaleDateString()}</span>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Daily Macronutrient Summary</h2>
          <span className="text-lg font-bold text-primary">{totalCals} kcal</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <MacroBar label="Protein" value={Math.round(totalProtein)} total={totalProtein + totalCarbs + totalFat} color="bg-blue-500" />
          <MacroBar label="Carbohydrates" value={Math.round(totalCarbs)} total={totalProtein + totalCarbs + totalFat} color="bg-amber-500" />
          <MacroBar label="Fat" value={Math.round(totalFat)} total={totalProtein + totalCarbs + totalFat} color="bg-primary" />
        </div>
        {totalCals > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-3 text-center">
            <div className="text-xs text-muted-foreground">Protein: {Math.round((totalProtein * 4 / totalCals) * 100)}% of calories</div>
            <div className="text-xs text-muted-foreground">Carbs: {Math.round((totalCarbs * 4 / totalCals) * 100)}% of calories</div>
            <div className="text-xs text-muted-foreground">Fat: {Math.round((totalFat * 9 / totalCals) * 100)}% of calories</div>
          </div>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <h2 className="font-semibold text-foreground">Meal Plan</h2>
        {meals.map((meal: any) => (
          <div key={meal.mealType} className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/30">
              <span className="font-semibold text-foreground text-sm">{MEAL_LABELS[meal.mealType] ?? meal.mealType}</span>
              <span className="text-sm text-primary font-semibold">{meal.totalCalories} kcal</span>
            </div>
            <div className="divide-y divide-border">
              {meal.foods.map((food: any, i: number) => (
                <div key={i} className="px-5 py-3 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-foreground text-sm">{food.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{food.portion}</div>
                    {food.notes && <div className="text-xs text-primary mt-0.5 italic">{food.notes}</div>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-foreground">{food.calories} kcal</div>
                    <div className="text-xs text-muted-foreground mt-0.5">P: {food.proteinG}g · C: {food.carbsG}g · F: {food.fatG}g</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {plan.warnings && plan.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Important Notices
          </h2>
          <ul className="space-y-2">
            {plan.warnings.map((w: string, i: number) => (
              <li key={i} className="text-sm text-amber-700 flex gap-2"><span className="flex-shrink-0 mt-0.5">•</span><span>{w}</span></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
