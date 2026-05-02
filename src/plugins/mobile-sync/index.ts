import { lazy } from "react";
import { registerPlugin } from "@/plugins/registry";

const MobileSync = lazy(() => import("./ui/MobileSync").then(m => ({ default: m.MobileSync })));

registerPlugin({
  id: "mobile-sync",
  name: "Mobile Sync",
  description: "API layer for React Native / mobile app integration with full data synchronisation.",
  navLabel: "Mobile Sync",
  iconPath: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
  routes: [{ path: "/plugins/mobile-sync", component: MobileSync }],
});
