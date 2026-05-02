import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useListFoodSafetyTips, getListFoodSafetyTipsQueryKey } from "@/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_IDS = ["haccp", "cross_contamination", "storage", "hygiene", "diseases"] as const;
type CategoryId = typeof CATEGORY_IDS[number];

export function FoodSafety() {
  const { t } = useTranslation();
  const [category, setCategory] = useState<CategoryId | undefined>(undefined);
  const { data: tips = [], isLoading } = useListFoodSafetyTips(
    category ? { category } : {},
    { query: { queryKey: getListFoodSafetyTipsQueryKey(category ? { category } : {}) } }
  );

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("foodSafety.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("foodSafety.subtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button onClick={() => setCategory(undefined)}
          className={`px-4 py-2 rounded-lg text-sm border font-medium transition-all ${!category ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}>
          {t("common.allTopics")}
        </button>
        {CATEGORY_IDS.map(id => (
          <button key={id} onClick={() => setCategory(id)}
            className={`px-4 py-2 rounded-lg text-sm border font-medium transition-all ${category === id ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}>
            {t(`foodSafety.categories.${id}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
      ) : tips.length === 0 ? (
        <div className="bg-card border border-card-border rounded-xl p-10 text-center text-muted-foreground">
          {t("common.noArticles")}
        </div>
      ) : (
        <div className="space-y-5">
          {tips.map(tip => (
            <div key={tip.id} className="bg-card border border-card-border rounded-xl overflow-hidden">
              <div className="bg-primary/5 border-b border-border px-6 py-4">
                <span className="text-xs font-medium text-primary uppercase tracking-wide">
                  {t(`foodSafety.categories.${tip.category as CategoryId}`, { defaultValue: tip.category })}
                </span>
                <h2 className="font-semibold text-foreground mt-1 text-base">{tip.title}</h2>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-foreground/80 leading-relaxed mb-5">{tip.content}</p>
                {tip.keyPoints.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-foreground uppercase tracking-wide mb-3">
                      {t("common.keyPoints")}
                    </div>
                    <ul className="space-y-2">
                      {tip.keyPoints.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
