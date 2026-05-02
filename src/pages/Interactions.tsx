import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useListFoodDrugInteractions, useListMedications, getListFoodDrugInteractionsQueryKey } from "@/api/hooks";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const SEVERITY_STYLES: Record<string, { badge: string; border: string; bg: string; dot: string }> = {
  minor:    { badge: "bg-yellow-50 text-yellow-700 border-yellow-200",       border: "border-yellow-200",      bg: "bg-yellow-50/40",    dot: "bg-yellow-400" },
  moderate: { badge: "bg-orange-50 text-orange-700 border-orange-200",       border: "border-orange-200",      bg: "bg-orange-50/40",    dot: "bg-orange-500" },
  major:    { badge: "bg-red-50 text-destructive border-destructive/20",      border: "border-destructive/20",  bg: "bg-destructive/5",   dot: "bg-destructive" },
};

export function Interactions() {
  const { t } = useTranslation();
  const [selectedMed, setSelectedMed] = useState<number | undefined>(undefined);
  const { data: medications = [], isLoading: medsLoading } = useListMedications();
  const { data: interactions = [], isLoading } = useListFoodDrugInteractions(
    selectedMed ? { medicationId: selectedMed } : {},
    { query: { queryKey: getListFoodDrugInteractionsQueryKey(selectedMed ? { medicationId: selectedMed } : {}) } }
  );

  const majorCount    = interactions.filter(i => i.severity === "major").length;
  const moderateCount = interactions.filter(i => i.severity === "moderate").length;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("interactions.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("interactions.subtitle")}</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-700 font-medium">{t("interactions.disclaimer")}</p>
      </div>

      {interactions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-card-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{interactions.length}</div>
            <div className="text-xs text-muted-foreground mt-1">{t("interactions.totalInteractions")}</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{moderateCount}</div>
            <div className="text-xs text-orange-600/70 mt-1">{t("interactions.moderate")}</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-destructive">{majorCount}</div>
            <div className="text-xs text-destructive/70 mt-1">{t("interactions.major")}</div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="text-sm font-medium text-foreground mb-2">{t("interactions.filterByMed")}</div>
        {medsLoading ? <Skeleton className="h-10 w-full" /> : (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedMed(undefined)}
              className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-all ${!selectedMed ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}>
              {t("interactions.allMedications")}
            </button>
            {medications.map(med => (
              <button key={med.id} onClick={() => setSelectedMed(selectedMed === med.id ? undefined : med.id)}
                className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-all ${selectedMed === med.id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}>
                {med.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : interactions.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-10 text-center">
          <div className="text-muted-foreground">
            {selectedMed ? t("interactions.emptyForMed") : t("interactions.empty")}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {interactions.map(interaction => {
            const s = SEVERITY_STYLES[interaction.severity] ?? SEVERITY_STYLES.minor;
            return (
              <div key={interaction.id} className={`rounded-xl border p-5 ${s.bg} ${s.border}`}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="font-semibold text-foreground">{interaction.medicationName} + {interaction.food}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{interaction.medicationName}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <Badge className={`capitalize text-xs ${s.badge}`}>
                      {t(`interactions.severity.${interaction.severity}` as const, { defaultValue: interaction.severity })}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 mb-3">{interaction.description}</p>
                <div className="bg-white/60 rounded-lg px-4 py-3 border border-white/40">
                  <div className="text-xs font-semibold text-foreground mb-1">{t("interactions.recommendation")}</div>
                  <div className="text-sm text-foreground/80">{interaction.recommendation}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
