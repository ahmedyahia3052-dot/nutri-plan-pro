import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogFood } from "@/api/hooks";
import {
  getGetTodayFoodLogsQueryKey,
  getGetWeeklyTrendQueryKey,
  getGetDashboardSummaryQueryKey,
} from "@/api/hooks";
import { searchFoods, scaleNutrition } from "../service";
import type { NormalizedFood } from "../service";
import { Link } from "wouter";

// ── Helpers ────────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── useDebounce ────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

// ── MacroPill ─────────────────────────────────────────────────────────────────

function MacroPill({ label, value, unit, color }: {
  label: string; value: number; unit: string; color: string;
}) {
  return (
    <div className="flex flex-col items-center bg-muted/50 rounded-lg px-3 py-2 min-w-0">
      <span className={`text-sm font-bold tabular-nums ${color}`}>
        {value}<span className="text-xs font-normal ml-0.5">{unit}</span>
      </span>
      <span className="text-[10px] text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}

// ── ResultRow ─────────────────────────────────────────────────────────────────

function ResultRow({ food, onSelect, selectHint }: {
  food: NormalizedFood;
  onSelect: (f: NormalizedFood) => void;
  selectHint: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(food)}
      className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-accent/60 transition-colors border-b border-border/50 last:border-0 group"
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {food.name}
        </div>
        {food.brand && (
          <div className="text-xs text-muted-foreground truncate mt-0.5">{food.brand}</div>
        )}
      </div>
      <div className="flex-shrink-0 text-end">
        <div className="text-sm font-semibold text-foreground tabular-nums">{food.per100g.calories}</div>
        <div className="text-[10px] text-muted-foreground">{selectHint}</div>
      </div>
    </button>
  );
}

// ── LogForm ───────────────────────────────────────────────────────────────────

function LogForm({ food, onBack, onSuccess }: {
  food: NormalizedFood;
  onBack: () => void;
  onSuccess: (name: string) => void;
}) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { mutate: logFood, isPending } = useLogFood();

  const MEAL_TYPES = [
    { value: "breakfast",       label: t("tracker.meals.breakfast") },
    { value: "morning_snack",   label: t("tracker.meals.morning_snack") },
    { value: "lunch",           label: t("tracker.meals.lunch") },
    { value: "afternoon_snack", label: t("tracker.meals.afternoon_snack") },
    { value: "dinner",          label: t("tracker.meals.dinner") },
    { value: "other",           label: t("tracker.meals.other") },
  ] as const;

  const [grams, setGrams] = useState(100);
  const [foodName, setFoodName] = useState(food.name);
  const [mealType, setMealType] = useState<string>("lunch");
  const [date, setDate] = useState(todayStr());
  const [gramsInput, setGramsInput] = useState("100");

  const scaled = useMemo(() => scaleNutrition(food.per100g, grams), [food, grams]);

  const handleGramsChange = (raw: string) => {
    setGramsInput(raw);
    const n = parseFloat(raw);
    if (!isNaN(n) && n > 0) setGrams(n);
  };

  const invalidateTracking = () => {
    queryClient.invalidateQueries({ queryKey: getGetTodayFoodLogsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetWeeklyTrendQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logFood(
      {
        data: {
          date,
          mealType,
          foodName: foodName.trim() || food.name,
          calories: scaled.calories,
          proteinG: scaled.protein,
          carbsG: scaled.carbs,
          fatG: scaled.fat,
        },
      },
      {
        onSuccess: () => {
          invalidateTracking();
          onSuccess(foodName.trim() || food.name);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Selected food header */}
      <div className="flex items-start gap-3 p-4 bg-accent/40 rounded-xl border border-accent-border">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
            {t("plugins.foodSearch.selected")}
          </div>
          <div className="font-semibold text-foreground">{food.name}</div>
          {food.brand && (
            <div className="text-xs text-muted-foreground mt-0.5">{food.brand}</div>
          )}
        </div>
        <button
          type="button"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded flex-shrink-0"
          title={t("common.back")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Serving size */}
      <div>
        <Label htmlFor="grams">{t("plugins.foodSearch.servingSize")}</Label>
        <div className="flex items-center gap-2 mt-1.5">
          <Input
            id="grams"
            type="number"
            min={1}
            max={2000}
            step={5}
            value={gramsInput}
            onChange={(e) => handleGramsChange(e.target.value)}
            className="w-32"
          />
          <span className="text-sm text-muted-foreground">g</span>
          <div className="flex gap-1 ms-2">
            {[50, 100, 150, 200].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => { setGrams(g); setGramsInput(String(g)); }}
                className={`px-2 py-1 rounded text-xs border font-medium transition-all ${
                  grams === g
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:border-primary/50 text-muted-foreground"
                }`}
              >
                {g}g
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Nutrition preview */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          {t("plugins.foodSearch.nutritionFor", { grams })}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <MacroPill label={t("tracker.stats.calories")} value={scaled.calories} unit="kcal" color="text-primary" />
          <MacroPill label={t("tracker.stats.protein")}  value={scaled.protein}  unit="g"    color="text-blue-600" />
          <MacroPill label={t("tracker.stats.carbs")}    value={scaled.carbs}    unit="g"    color="text-amber-600" />
          <MacroPill label={t("tracker.stats.fat")}      value={scaled.fat}      unit="g"    color="text-emerald-600" />
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Food name (editable) */}
      <div>
        <Label htmlFor="food-name">{t("tracker.dialog.foodName")}</Label>
        <Input
          id="food-name"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          className="mt-1.5"
          placeholder={t("tracker.dialog.foodNamePlaceholder")}
          required
          maxLength={200}
        />
      </div>

      {/* Meal type */}
      <div>
        <Label>{t("tracker.dialog.mealType")}</Label>
        <div className="grid grid-cols-3 gap-1.5 mt-1.5">
          {MEAL_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setMealType(value)}
              className={`px-2 py-1.5 rounded-lg text-xs border font-medium transition-all ${
                mealType === value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border hover:border-primary/50 text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Date */}
      <div>
        <Label htmlFor="log-date">Date</Label>
        <Input
          id="log-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1.5 w-44"
          max={todayStr()}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end pt-1">
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          {t("plugins.foodSearch.backToResults")}
        </Button>
        <Button type="submit" disabled={isPending || scaled.calories === 0}>
          {isPending ? t("tracker.dialog.submitting") : t("plugins.foodSearch.addToLog")}
        </Button>
      </div>
    </form>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type View = "search" | "selected" | "success";

export function FoodSearch() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("search");
  const [selected, setSelected] = useState<NormalizedFood | null>(null);
  const [lastLogged, setLastLogged] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query.trim(), 400);

  const {
    data: results = [],
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: ["food-search-off", debouncedQuery],
    queryFn: () => searchFoods(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleReset = () => {
    setView("search");
    setSelected(null);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSelect = (food: NormalizedFood) => {
    setSelected(food);
    setView("selected");
  };

  const handleSuccess = (name: string) => {
    setLastLogged(name);
    setView("success");
  };

  // ── Success state ────────────────────────────────────────────────────────────
  if (view === "success") {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("plugins.foodSearch.title")}</h1>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-emerald-800 mb-1">{t("plugins.foodSearch.success")}</h2>
          <p className="text-sm text-emerald-700 mb-6">
            <span className="font-medium">{lastLogged}</span>{" "}
            {t("plugins.foodSearch.successDesc", { name: "" }).replace(lastLogged, "").trim() || "was logged successfully."}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button onClick={handleReset}>{t("plugins.foodSearch.searchAgain")}</Button>
            <Link href="/tracker">
              <Button variant="outline">{t("plugins.foodSearch.viewTracker")}</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Selected: show log form ──────────────────────────────────────────────────
  if (view === "selected" && selected) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("plugins.foodSearch.title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t("plugins.foodSearch.desc")}</p>
        </div>
        <div className="bg-card border border-card-border rounded-xl p-6 shadow-card">
          <LogForm
            food={selected}
            onBack={() => setView("search")}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    );
  }

  // ── Search state ─────────────────────────────────────────────────────────────
  const showResults    = debouncedQuery.length >= 2 && !isFetching && !isError;
  const showSkeleton   = debouncedQuery.length >= 2 && isFetching;
  const showNoResults  = showResults && results.length === 0;
  const showResultsList = showResults && results.length > 0;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{t("plugins.foodSearch.title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("plugins.foodSearch.desc")}</p>
      </div>

      {/* Search input */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 start-3.5 flex items-center pointer-events-none">
          {isFetching ? (
            <svg className="w-4 h-4 text-muted-foreground animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("plugins.foodSearch.searchPlaceholder")}
          className="w-full ps-10 pe-10 py-3 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground/60 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-input"
          autoComplete="off"
          spellCheck={false}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Hint — too few characters */}
      {query.length > 0 && query.length < 2 && (
        <p className="text-xs text-muted-foreground mb-4 ps-1">{t("plugins.foodSearch.searchHint")}</p>
      )}

      {/* Results panel */}
      <div className="bg-card border border-card-border rounded-xl shadow-card overflow-hidden">

        {/* Loading skeleton */}
        {showSkeleton && (
          <div className="divide-y divide-border/50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-2.5 w-28" />
                </div>
                <Skeleton className="h-8 w-12 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="p-6 text-center">
            <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">{t("plugins.foodSearch.errorTitle")}</p>
            <p className="text-xs text-muted-foreground mb-4">
              {(error as Error)?.message ?? t("common.error")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("plugins.foodSearch.errorHint")}{" "}
              <Link href="/tracker" className="text-primary underline">{t("nav.dailyTracker")}</Link>.
            </p>
          </div>
        )}

        {/* No results */}
        {showNoResults && (
          <div className="p-8 text-center">
            <div className="text-2xl mb-2 select-none">🔍</div>
            <p className="text-sm font-medium text-foreground mb-1">
              {t("plugins.foodSearch.noResults", { query: debouncedQuery })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("plugins.foodSearch.noResultsHint").split(t("nav.dailyTracker"))[0]}{" "}
              <Link href="/tracker" className="text-primary underline">{t("nav.dailyTracker")}</Link>.
            </p>
          </div>
        )}

        {/* Results list */}
        {showResultsList && (
          <div>
            <div className="px-4 py-2 bg-muted/30 border-b border-border/50 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {results.length} {results.length !== 1 ? t("plugins.foodSearch.results") : t("plugins.foodSearch.results")}
              </span>
              <span className="text-xs text-muted-foreground">{t("plugins.foodSearch.per100g")}</span>
            </div>
            <div>
              {results.map((food) => (
                <ResultRow
                  key={food.code}
                  food={food}
                  onSelect={handleSelect}
                  selectHint={t("plugins.foodSearch.selectHint")}
                />
              ))}
            </div>
          </div>
        )}

        {/* Idle state */}
        {!showSkeleton && !isError && !showNoResults && !showResultsList && (
          <div className="px-6 py-10 text-center">
            <div className="text-3xl mb-3 select-none">🥗</div>
            <p className="text-sm text-muted-foreground">{t("plugins.foodSearch.idleTitle")}</p>
            <p className="text-xs text-muted-foreground mt-2">{t("plugins.foodSearch.idleHint")}</p>
          </div>
        )}
      </div>

      {/* Attribution */}
      <p className="text-xs text-muted-foreground text-center mt-4 leading-relaxed">
        {t("plugins.foodSearch.attribution").split("Open Food Facts")[0]}
        <a
          href="https://world.openfoodfacts.org"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-foreground"
        >
          Open Food Facts
        </a>
        {t("plugins.foodSearch.attribution").split("Open Food Facts")[1]}
      </p>
    </div>
  );
}
