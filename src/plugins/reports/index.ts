import { lazy } from "react";
import { registerPlugin } from "@/plugins/registry";

const Reports = lazy(() => import("./ui/Reports").then(m => ({ default: m.Reports })));

registerPlugin({
  id: "reports",
  name: "Professional Reports",
  description: "Generate and export detailed health summaries, nutrition analytics, and progress reports.",
  navLabel: "Reports & Export",
  iconPath: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  routes: [{ path: "/plugins/reports", component: Reports }],
});
