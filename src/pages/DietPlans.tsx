import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  useListDietPlans, useGenerateDietPlan, useDeleteDietPlan, useGetProfile,
  useListConditions, useListAllergies,
  getListDietPlansQueryKey, getGetDashboardSummaryQueryKey,
} from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

function MultiPick({ options, selected, onChange }: {
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  return (
    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
      {options.map(opt => (
        <button key={opt.id} type="button" onClick={() => toggle(opt.id)}
          className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-all ${selected.includes(opt.id) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/50"}`}>
          {opt.name}
        </button>
      ))}
    </div>
  );
}

export function DietPlans() {
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar-SA" : "en-US";

  const { data: plans = [], isLoading } = useListDietPlans();
  const { data: profile } = useGetProfile();
  const { data: conditions = [] } = useListConditions();
  const { data: allergies = [] } = useListAllergies();
  const { mutate: generatePlan, isPending } = useGenerateDietPlan();
  const { mutate: deletePlan } = useDeleteDietPlan();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", conditions: [] as string[], allergies: [] as string[], calorieTarget: 2000 });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generatePlan(
      {
        data: {
          ...form,
          weightKg: profile?.weightKg ?? 70,
          heightCm: profile?.heightCm ?? 170,
          age: profile?.age ?? 30,
          gender: profile?.gender ?? "male",
          activityLevel: profile?.activityLevel ?? "moderately_active",
        }
      },
      {
        onSuccess: () => {
          setOpen(false);
          queryClient.invalidateQueries({ queryKey: getListDietPlansQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm(t("dietPlans.delete.confirm"))) return;
    deletePlan({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDietPlansQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      }
    });
  };

  const conditionOpts = conditions.map(c => ({ id: c.id, name: c.name }));
  const allergyOpts   = allergies.map(a => ({ id: a.id, name: a.name }));

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("dietPlans.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("dietPlans.subtitle")}</p>
        </div>
        <Button onClick={() => { setForm({ title: "", conditions: profile?.conditions ?? [], allergies: profile?.allergies ?? [], calorieTarget: 2000 }); setOpen(true); }}>
          {t("dietPlans.newPlan")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : plans.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-12 text-center">
          <div className="text-muted-foreground mb-3">{t("dietPlans.empty.desc")}</div>
          <Button onClick={() => setOpen(true)}>{t("dietPlans.dialog.title")}</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map(plan => (
            <div key={plan.id} className="bg-card border border-card-border rounded-xl px-5 py-4 flex items-center justify-between hover:border-primary/30 transition-all">
              <Link href={`/diet-plans/${plan.id}`} className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{plan.title}</div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {plan.targetConditions.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                  <span className="text-xs text-muted-foreground">
                    {new Date(plan.createdAt).toLocaleDateString(locale)}
                  </span>
                </div>
              </Link>
              <div className="flex items-center gap-4 ms-4 flex-shrink-0">
                <div className="text-end">
                  <div className="text-lg font-bold text-primary">{plan.calorieTarget}</div>
                  <div className="text-xs text-muted-foreground">{t("dietPlans.kcalDay")}</div>
                </div>
                <button onClick={() => handleDelete(plan.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dietPlans.dialog.title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenerate} className="space-y-5 py-2">
            <div>
              <Label htmlFor="plan-title">{t("dietPlans.dialog.planTitle")}</Label>
              <Input id="plan-title" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={t("dietPlans.dialog.planTitlePlaceholder")} required className="mt-1.5" />
            </div>
            <div>
              <Label>{t("dietPlans.dialog.calorieTarget")}</Label>
              <div className="flex items-center gap-3 mt-1.5">
                <Input type="number" min={800} max={5000} value={form.calorieTarget}
                  onChange={e => setForm(f => ({ ...f, calorieTarget: Number(e.target.value) }))} className="w-32" />
                <span className="text-sm text-muted-foreground">{t("dietPlans.dialog.caloriesPerDay")}</span>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">{t("dietPlans.dialog.conditions")}</Label>
              <MultiPick options={conditionOpts} selected={form.conditions} onChange={v => setForm(f => ({ ...f, conditions: v }))} />
            </div>
            <div>
              <Label className="mb-2 block">{t("dietPlans.dialog.allergies")}</Label>
              <MultiPick options={allergyOpts} selected={form.allergies} onChange={v => setForm(f => ({ ...f, allergies: v }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("dietPlans.dialog.submitting") : t("dietPlans.dialog.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
