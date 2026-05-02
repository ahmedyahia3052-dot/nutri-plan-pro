import { useState, useMemo } from "react";
import { useGetProfile, useListFoodDrugInteractions, useListMedications } from "@/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SEVERITY_CONFIG: Record<string, { label: string; bg: string; border: string; badgeBg: string; badgeText: string; icon: string }> = {
  major: { label: "Major", bg: "bg-red-50", border: "border-red-200", badgeBg: "bg-destructive", badgeText: "text-destructive-foreground", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  moderate: { label: "Moderate", bg: "bg-amber-50", border: "border-amber-200", badgeBg: "bg-amber-500", badgeText: "text-white", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  minor: { label: "Minor", bg: "bg-blue-50", border: "border-blue-200", badgeBg: "bg-blue-500", badgeText: "text-white", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
};

export function DrugChecker() {
  const { data: profile, isLoading: profileLoading } = useGetProfile();
  const { data: allInteractions = [], isLoading: interactionsLoading } = useListFoodDrugInteractions();
  const { data: allMedications = [], isLoading: medsLoading } = useListMedications();
  const [search, setSearch] = useState("");
  const [selectedMed, setSelectedMed] = useState<string | null>(null);

  const isLoading = profileLoading || interactionsLoading || medsLoading;

  const profileMedNames = profile?.medications ?? [];

  const medMap = useMemo(() => {
    const m: Record<number, string> = {};
    for (const med of allMedications) m[med.id] = med.name;
    return m;
  }, [allMedications]);

  const enriched = useMemo(() => {
    return allInteractions.map(i => ({ ...i, medicationName: medMap[i.medicationId] ?? i.medicationName ?? "Unknown" }));
  }, [allInteractions, medMap]);

  const filtered = useMemo(() => {
    let results = enriched;
    if (selectedMed) {
      results = results.filter(i => i.medicationName.toLowerCase() === selectedMed.toLowerCase());
    } else if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(i =>
        i.medicationName.toLowerCase().includes(q) ||
        i.food.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
      );
    }
    return results.sort((a, b) => {
      const order = { major: 0, moderate: 1, minor: 2 };
      return (order[a.severity as keyof typeof order] ?? 3) - (order[b.severity as keyof typeof order] ?? 3);
    });
  }, [enriched, search, selectedMed]);

  const profileInteractions = useMemo(() => {
    return enriched.filter(i => profileMedNames.some(m => i.medicationName.toLowerCase().includes(m.toLowerCase())));
  }, [enriched, profileMedNames]);

  const majorCount = profileInteractions.filter(i => i.severity === "major").length;
  const moderateCount = profileInteractions.filter(i => i.severity === "moderate").length;
  const minorCount = profileInteractions.filter(i => i.severity === "minor").length;

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-72 mb-6" />
        <div className="grid grid-cols-3 gap-4 mb-8">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium tracking-wide uppercase">
          <span>Plugins</span><span>/</span><span>Drug Interaction Checker</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Drug Interaction Checker</h1>
        <p className="text-muted-foreground mt-1">Cross-check your medications against known food interactions.</p>
      </div>

      {profileMedNames.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-foreground mb-3">Your Medication Risk Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { count: majorCount, label: "Major", color: "text-destructive", bg: "bg-red-50 border-red-200" },
              { count: moderateCount, label: "Moderate", color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
              { count: minorCount, label: "Minor", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
            ].map(stat => (
              <div key={stat.label} className={cn("rounded-xl border p-5 text-center", stat.bg)}>
                <div className={cn("text-3xl font-bold", stat.color)}>{stat.count}</div>
                <div className="text-sm font-medium text-foreground mt-1">{stat.label}</div>
                <div className="text-xs text-muted-foreground">interaction{stat.count !== 1 ? "s" : ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profileMedNames.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-foreground mb-3">Medications in Your Profile</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedMed(null)}
              className={cn("px-3 py-1.5 rounded-lg text-sm border font-medium transition-all", !selectedMed ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50")}>
              All
            </button>
            {profileMedNames.map(med => {
              const count = enriched.filter(i => i.medicationName.toLowerCase().includes(med.toLowerCase())).length;
              return (
                <button key={med} onClick={() => setSelectedMed(med === selectedMed ? null : med)}
                  className={cn("px-3 py-1.5 rounded-lg text-sm border font-medium transition-all", selectedMed === med ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50")}>
                  {med} {count > 0 && <span className="ml-1 text-xs opacity-70">({count})</span>}
                </button>
              );
            })}
          </div>
          {profileMedNames.length === 0 && (
            <div className="text-sm text-muted-foreground mt-2">
              No medications in your profile.{" "}
              <Link href="/profile" className="text-primary hover:underline">Add medications</Link> to see your personalised risk summary.
            </div>
          )}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search by medication or food (e.g. 'warfarin', 'grapefruit')…"
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedMed(null); }}
              className="w-full"
            />
          </div>
          {(search || selectedMed) && (
            <Button variant="outline" size="sm" onClick={() => { setSearch(""); setSelectedMed(null); }}>Clear</Button>
          )}
        </div>

        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">
            {selectedMed ? `Interactions for ${selectedMed}` : search ? "Search Results" : "All Interactions"}
            <span className="ml-2 text-sm font-normal text-muted-foreground">({filtered.length} found)</span>
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-card border border-card-border rounded-xl p-10 text-center">
            <p className="text-muted-foreground text-sm">No interactions found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(interaction => {
              const cfg = SEVERITY_CONFIG[interaction.severity] ?? SEVERITY_CONFIG.minor;
              return (
                <div key={interaction.id} className={cn("rounded-xl border p-5", cfg.border, cfg.bg)}>
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-white/70 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className={cn("w-4.5 h-4.5", cfg.badgeText === "text-destructive-foreground" ? "text-destructive" : cfg.badgeText === "text-white" && cfg.badgeBg === "bg-amber-500" ? "text-amber-600" : "text-blue-600")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cfg.icon} />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-foreground">{interaction.medicationName}</span>
                        <span className="text-muted-foreground">+</span>
                        <span className="font-semibold text-foreground">{interaction.food}</span>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold uppercase", cfg.badgeBg, cfg.badgeText)}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80 mb-2 leading-relaxed">{interaction.description}</p>
                      <div className="flex items-start gap-1.5">
                        <svg className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-xs text-foreground/70 leading-relaxed">{interaction.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-muted rounded-xl p-4">
        <p className="text-xs text-muted-foreground text-center">Interaction data is for educational purposes only. Always consult your pharmacist or physician before making changes to your medications or diet.</p>
      </div>
    </div>
  );
}
