import { lazy } from "react";
import { registerPlugin } from "@/plugins/registry";

registerPlugin({
  id: "goals-streaks",
  name: "Goals & Streaks",
  description: "Daily nutrition goals and streak tracking",
  navLabel: "Goals & Streaks",
  iconPath:
    "M13 10V3L4 14h7v7l9-11h-7z",
  routes: [
    {
      path: "/plugins/goals-streaks",
      component: lazy(() =>
        import("./ui/GoalsStreaks").then((m) => ({ default: m.GoalsStreaks }))
      ),
    },
  ],
});
