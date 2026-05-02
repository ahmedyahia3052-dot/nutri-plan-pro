import { lazy } from "react";
import { registerPlugin } from "@/plugins/registry";

registerPlugin({
  id: "food-search",
  name: "Food Search",
  description: "Search Open Food Facts and log nutrition instantly",
  navLabel: "Food Search",
  iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  routes: [
    {
      path: "/plugins/food-search",
      component: lazy(() =>
        import("./ui/FoodSearch").then((m) => ({ default: m.FoodSearch }))
      ),
    },
  ],
});
