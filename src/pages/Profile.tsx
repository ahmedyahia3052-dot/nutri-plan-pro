import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  useGetProfile, useUpsertProfile, useListConditions, useListAllergies, useListMedications,
  getGetProfileQueryKey, getGetDashboardSummaryQueryKey,
} from "@/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

function MultiSelect({ options, selected, onChange }: {
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => toggle(opt.id)}
          className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-all ${
            selected.includes(opt.id)
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card text-foreground border-border hover:border-primary/50"
          }`}
        >
          {opt.name}
        </button>
      ))}
    </div>
  );
}

export function Profile() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { data: profile } = useGetProfile();
  const { data: conditions = [] } = useListConditions();
  const { data: allergies = [] } = useListAllergies();
  const { data: medications = [] } = useListMedications();
  const { mutate: upsertProfile, isPending, isSuccess } = useUpsertProfile();

  const ACTIVITY_LABELS: Record<string, string> = {
    sedentary:        t("profile.activityOptions.sedentary"),
    lightly_active:   t("profile.activityOptions.lightly_active"),
    moderately_active:t("profile.activityOptions.moderately_active"),
    very_active:      t("profile.activityOptions.very_active"),
    extra_active:     t("profile.activityOptions.extra_active"),
  };

  const GENDER_LABELS: Record<string, string> = {
    male:   t("profile.genderOptions.male"),
    female: t("profile.genderOptions.female"),
    other:  t("profile.genderOptions.other"),
  };

  const [form, setForm] = useState({
    name: "",
    age: 30,
    gender: "male",
    weightKg: 70,
    heightCm: 170,
    activityLevel: "moderately_active",
    goal: "maintain",
    conditions: [] as string[],
    allergies: [] as string[],
    medications: [] as string[],
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        weightKg: profile.weightKg,
        heightCm: profile.heightCm,
        activityLevel: profile.activityLevel,
        goal: profile.goal ?? "maintain",
        conditions: profile.conditions,
        allergies: profile.allergies,
        medications: profile.medications,
      });
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertProfile(
      { data: form },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        },
      }
    );
  };

  const conditionOpts = conditions.map(c => ({ id: c.id, name: c.name }));
  const allergyOpts   = allergies.map(a => ({ id: a.id, name: a.name }));
  const medOpts       = medications.map(m => ({ id: m.name, name: m.name }));

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t("profile.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("profile.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">{t("profile.personalInfo")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">{t("profile.name")}</Label>
              <Input id="name" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={t("profile.namePlaceholder")} required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="age">{t("profile.age")}</Label>
              <Input id="age" type="number" min={1} max={120} value={form.age}
                onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))}
                required className="mt-1.5" />
            </div>
            <div>
              <Label>{t("profile.gender")}</Label>
              <div className="flex gap-2 mt-1.5">
                {["male", "female", "other"].map(g => (
                  <button key={g} type="button" onClick={() => setForm(f => ({ ...f, gender: g }))}
                    className={`flex-1 py-2 rounded-lg text-sm border font-medium transition-all ${form.gender === g ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}>
                    {GENDER_LABELS[g] ?? g}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="weight">{t("profile.weight")}</Label>
              <Input id="weight" type="number" min={20} max={300} step={0.1} value={form.weightKg}
                onChange={e => setForm(f => ({ ...f, weightKg: Number(e.target.value) }))}
                required className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="height">{t("profile.height")}</Label>
              <Input id="height" type="number" min={50} max={250} value={form.heightCm}
                onChange={e => setForm(f => ({ ...f, heightCm: Number(e.target.value) }))}
                required className="mt-1.5" />
            </div>
          </div>
          <div className="mt-4">
            <Label>{t("profile.activityLevel")}</Label>
            <div className="grid grid-cols-1 gap-2 mt-1.5">
              {Object.entries(ACTIVITY_LABELS).map(([val, label]) => (
                <button key={val} type="button" onClick={() => setForm(f => ({ ...f, activityLevel: val }))}
                  className={`text-start px-4 py-2.5 rounded-lg text-sm border transition-all ${form.activityLevel === val ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-1">{t("profile.conditions")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("profile.conditionsHint")}</p>
          <MultiSelect options={conditionOpts} selected={form.conditions} onChange={v => setForm(f => ({ ...f, conditions: v }))} />
          {form.conditions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {form.conditions.map(c => <Badge key={c} variant="secondary">{conditionOpts.find(o => o.id === c)?.name ?? c}</Badge>)}
            </div>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-1">{t("profile.allergies")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("profile.allergiesHint")}</p>
          <MultiSelect options={allergyOpts} selected={form.allergies} onChange={v => setForm(f => ({ ...f, allergies: v }))} />
          {form.allergies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {form.allergies.map(a => <Badge key={a} className="bg-destructive/10 text-destructive border-destructive/20">{allergyOpts.find(o => o.id === a)?.name ?? a}</Badge>)}
            </div>
          )}
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-1">{t("profile.medications")}</h2>
          <p className="text-sm text-muted-foreground mb-4">{t("profile.medicationsHint")}</p>
          <MultiSelect options={medOpts} selected={form.medications} onChange={v => setForm(f => ({ ...f, medications: v }))} />
          {form.medications.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {form.medications.map(m => <Badge key={m} className="bg-amber-50 text-amber-700 border-amber-200">{m}</Badge>)}
            </div>
          )}
        </div>

        {isSuccess && (
          <div className="bg-accent border border-accent-border rounded-xl p-4 text-sm text-accent-foreground font-medium">
            {t("profile.saved")}
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-full h-11">
          {isPending ? t("profile.saving") : t("profile.saveButton")}
        </Button>
      </form>
    </div>
  );
}
