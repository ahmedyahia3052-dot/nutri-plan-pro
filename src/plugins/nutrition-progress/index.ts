import { lazy } from "react";
import { registerPlugin } from "@/plugins/registry";
import { registerWidget } from "@/plugins/widget-registry";

// ── Full page ─────────────────────────────────────────────────────────────────
registerPlugin({
  id: "nutrition-progress",
  name: "Nutrition Progress",
  description: "Real-time macro progress bars for calories, protein, carbs and fat",
  navLabel: "Nutrition Progress",
  iconPath:
    "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  routes: [
    {
      path: "/plugins/nutrition-progress",
      component: lazy(() =>
        import("./ui/NutritionProgress").then((m) => ({ default: m.NutritionProgress }))
      ),
    },
  ],
});

// ── Dashboard widget ──────────────────────────────────────────────────────────
registerWidget({
  id: "nutrition-progress-widget",
  title: "Today's Macro Progress",
  priority: 10,
  component: lazy(() =>
    import("./ui/NutritionWidget").then((m) => ({ default: m.NutritionWidget }))
  ),
});
