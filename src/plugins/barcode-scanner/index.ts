import { lazy } from "react";
import { registerPlugin } from "@/plugins/registry";

const BarcodeScanner = lazy(() =>
  import("./ui/BarcodeScanner").then(m => ({ default: m.BarcodeScanner }))
);

registerPlugin({
  id: "barcode-scanner",
  name: "Barcode Scanner",
  description: "Scan a food product barcode or enter it manually to auto-fill nutrition facts in your food log.",
  navLabel: "Barcode Scanner",
  iconPath: "M4 6h1M4 10h1M4 14h1M4 18h1M19 6h1M19 10h1M19 14h1M19 18h1M7 4v16M10 4v4M13 4v4M16 4v4M10 16v4M13 16v4M16 16v4M7 10h10",
  routes: [{ path: "/plugins/barcode-scanner", component: BarcodeScanner }],
});
