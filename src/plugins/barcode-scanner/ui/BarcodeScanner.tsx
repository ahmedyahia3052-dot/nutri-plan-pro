import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  isBarcodeDetectorSupported,
  createBarcodeDetector,
  lookupBarcode,
} from "../service";
import type { FoodProduct } from "../service";
import { getAuthToken } from "@/plugins/utils";

// ── Log-food API ───────────────────────────────────────────────────────────────
async function logFood(entry: {
  date: string; mealType: string; name: string;
  portionSize: string; calories: number;
  proteinG: number; carbsG: number; fatG: number;
}) {
  const token = getAuthToken();
  const res = await fetch("/api/tracking/food", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error ?? `API error ${res.status}`);
  }
  return res.json();
}

// ── Types ──────────────────────────────────────────────────────────────────────
type ScanState = "idle" | "requesting" | "scanning" | "detected" | "lookup" | "found" | "not_found" | "error";

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "morning_snack", label: "Morning Snack" },
  { value: "lunch", label: "Lunch" },
  { value: "afternoon_snack", label: "Afternoon Snack" },
  { value: "dinner", label: "Dinner" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}

function NutritionRow({ label, value, unit = "g", highlight = false }: { label: string; value: number; unit?: string; highlight?: boolean }) {
  return (
    <div className={cn("flex justify-between items-center py-2", highlight && "border-t-4 border-foreground")}>
      <span className={cn("text-sm", highlight ? "font-bold text-foreground" : "text-muted-foreground")}>{label}</span>
      <span className={cn("text-sm", highlight ? "font-bold text-foreground" : "text-foreground")}>
        {value}{unit}
      </span>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────
export function BarcodeScanner() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [manualBarcode, setManualBarcode] = useState("");
  const [detectedBarcode, setDetectedBarcode] = useState("");
  const [product, setProduct] = useState<FoodProduct | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [servings, setServings] = useState(1);
  const [mealType, setMealType] = useState("lunch");
  const [logDate, setLogDate] = useState(today());

  const supportsCamera = isBarcodeDetectorSupported() &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const startCamera = useCallback(async () => {
    setScanState("requesting");
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanState("scanning");

      const detector = await createBarcodeDetector();

      const scan = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(scan);
          return;
        }
        try {
          const results = await detector.detect(videoRef.current);
          if (results.length > 0) {
            const code = results[0].rawValue;
            stopCamera();
            setScanState("detected");
            setDetectedBarcode(code);
            await fetchProduct(code);
            return;
          }
        } catch { /* continue scanning */ }
        rafRef.current = requestAnimationFrame(scan);
      };
      rafRef.current = requestAnimationFrame(scan);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isPermission = msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("denied");
      setErrorMsg(isPermission
        ? "Camera access was denied. Please allow camera access in your browser settings and try again."
        : "Could not start camera. Try entering the barcode manually below.");
      setScanState("error");
    }
  }, [stopCamera]);

  const fetchProduct = useCallback(async (barcode: string) => {
    setScanState("lookup");
    setProduct(null);
    try {
      const result = await lookupBarcode(barcode);
      if (result) {
        setProduct(result);
        setServings(1);
        setScanState("found");
      } else {
        setScanState("not_found");
      }
    } catch {
      setErrorMsg("Failed to look up product. Check your internet connection.");
      setScanState("error");
    }
  }, []);

  const handleManualLookup = () => {
    const code = manualBarcode.trim().replace(/\D/g, "");
    if (!code) return;
    setDetectedBarcode(code);
    fetchProduct(code);
  };

  const reset = () => {
    stopCamera();
    setScanState("idle");
    setProduct(null);
    setDetectedBarcode("");
    setManualBarcode("");
    setErrorMsg("");
    setServings(1);
  };

  const logMutation = useMutation({
    mutationFn: logFood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracking"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: "Added to food log", description: `${product?.name} logged for ${MEAL_TYPES.find(m => m.value === mealType)?.label}.` });
      reset();
    },
    onError: (err: Error) => {
      toast({ title: "Failed to log food", description: err.message, variant: "destructive" });
    },
  });

  const handleAddToLog = () => {
    if (!product) return;
    logMutation.mutate({
      date: logDate,
      mealType,
      name: product.brand ? `${product.brand} ${product.name}` : product.name,
      portionSize: `${Math.round(product.servingSizeG * servings)}g`,
      calories: Math.round(product.perServing.calories * servings),
      proteinG: Math.round(product.perServing.proteinG * servings * 10) / 10,
      carbsG: Math.round(product.perServing.carbsG * servings * 10) / 10,
      fatG: Math.round(product.perServing.fatG * servings * 10) / 10,
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium tracking-wide uppercase">
          <span>Plugins</span><span>/</span><span>Barcode Scanner</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Barcode Scanner</h1>
        <p className="text-muted-foreground mt-1 text-sm">Scan a product barcode to instantly auto-fill its nutrition facts.</p>
      </div>

      {/* ── Camera area ── */}
      {(scanState === "idle" || scanState === "requesting" || scanState === "scanning" || scanState === "detected") && !product && (
        <div className="mb-6">
          {/* Camera viewfinder */}
          <div className={cn(
            "relative bg-black rounded-2xl overflow-hidden border-2 transition-colors",
            scanState === "scanning" ? "border-primary" : "border-border",
            scanState !== "scanning" && scanState !== "requesting" ? "hidden" : "block"
          )} style={{ aspectRatio: "4/3" }}>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />

            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-44">
                <div className="absolute inset-0 border-2 border-white/60 rounded-lg" />
                {/* Corner markers */}
                {[["top-0 left-0", "border-t-4 border-l-4 rounded-tl-lg"],
                  ["top-0 right-0", "border-t-4 border-r-4 rounded-tr-lg"],
                  ["bottom-0 left-0", "border-b-4 border-l-4 rounded-bl-lg"],
                  ["bottom-0 right-0", "border-b-4 border-r-4 rounded-br-lg"]].map(([pos, style]) => (
                  <div key={pos} className={cn("absolute w-6 h-6 border-primary", pos, style)} />
                ))}
                {/* Animated scan line */}
                {scanState === "scanning" && (
                  <div className="absolute left-1 right-1 h-0.5 bg-primary/80 shadow-[0_0_8px_2px_hsl(var(--primary)/0.6)] animate-[scan-line_2s_ease-in-out_infinite]" />
                )}
              </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 text-center">
              <span className="text-white/80 text-xs font-medium bg-black/50 px-3 py-1 rounded-full">
                {scanState === "requesting" ? "Starting camera…" : "Point at a barcode"}
              </span>
            </div>
          </div>

          {/* Placeholder when idle */}
          {scanState === "idle" && (
            <div className="bg-card border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-4 py-14 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center">
                <svg className="w-8 h-8 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h1M4 10h1M4 14h1M4 18h1M19 6h1M19 10h1M19 14h1M19 18h1M7 4v16M10 4v4M13 4v4M16 4v4M10 16v4M13 16v4M16 16v4M7 10h10" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Scan a product barcode</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {supportsCamera ? "Use your camera or enter a barcode manually." : "Your browser doesn't support camera scanning — use manual entry below."}
                </p>
              </div>
              {supportsCamera && (
                <Button onClick={startCamera} className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Start Camera
                </Button>
              )}
            </div>
          )}

          {scanState === "scanning" && (
            <div className="mt-3 text-center">
              <Button variant="outline" size="sm" onClick={() => { stopCamera(); setScanState("idle"); }}>Cancel</Button>
            </div>
          )}
        </div>
      )}

      {/* ── Lookup states ── */}
      {scanState === "lookup" && (
        <div className="bg-card border border-card-border rounded-2xl p-10 text-center mb-6">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-medium text-foreground">Looking up barcode</p>
          <p className="text-sm text-muted-foreground mt-1 font-mono">{detectedBarcode}</p>
          <p className="text-xs text-muted-foreground mt-1">Fetching from Open Food Facts…</p>
        </div>
      )}

      {scanState === "not_found" && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center mb-6">
          <svg className="w-10 h-10 text-amber-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-foreground">Product not found</p>
          <p className="text-sm text-muted-foreground mt-1">Barcode <span className="font-mono">{detectedBarcode}</span> isn't in the database yet.</p>
          <Button className="mt-4" size="sm" onClick={reset}>Try Another</Button>
        </div>
      )}

      {scanState === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
          <div className="flex gap-3 items-start">
            <svg className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-destructive text-sm">{errorMsg || "Something went wrong."}</p>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>Dismiss</Button>
          </div>
        </div>
      )}

      {/* ── Product result card ── */}
      {scanState === "found" && product && (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm mb-6">
          {/* Header */}
          <div className="flex items-start gap-4 p-5 border-b border-border">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-xl object-cover bg-muted flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground text-lg leading-tight">{product.name}</div>
              {product.brand && <div className="text-sm text-muted-foreground mt-0.5">{product.brand}</div>}
              <div className="text-xs text-muted-foreground mt-1 font-mono">{product.barcode}</div>
            </div>
          </div>

          {/* Nutrition facts panel */}
          <div className="p-5 border-b border-border">
            <div className="bg-foreground text-background rounded-xl p-4">
              <div className="text-xl font-extrabold border-b-8 border-background pb-1 mb-1">Nutrition Facts</div>
              <div className="text-xs border-b border-background/30 pb-1 mb-1">
                Serving size <span className="font-semibold">{product.servingSizeG}g</span>
              </div>
              <NutritionRow label="Calories" value={Math.round(product.perServing.calories * servings)} unit="" highlight />
              <div className="border-t border-background/30">
                <NutritionRow label="Total Fat" value={Math.round(product.perServing.fatG * servings * 10) / 10} />
                <NutritionRow label="Total Carbohydrate" value={Math.round(product.perServing.carbsG * servings * 10) / 10} />
                <NutritionRow label="Protein" value={Math.round(product.perServing.proteinG * servings * 10) / 10} />
              </div>
              <div className="text-[10px] text-background/50 mt-2">Source: {product.source}</div>
            </div>
          </div>

          {/* Per-100g comparison */}
          <div className="px-5 pt-3 pb-1 border-b border-border">
            <div className="text-xs text-muted-foreground mb-2 font-medium">Per 100g</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "kcal", value: product.per100g.calories },
                { label: "protein", value: `${product.per100g.proteinG}g` },
                { label: "carbs", value: `${product.per100g.carbsG}g` },
                { label: "fat", value: `${product.per100g.fatG}g` },
              ].map(item => (
                <div key={item.label} className="bg-muted rounded-lg py-2">
                  <div className="font-semibold text-foreground text-sm">{item.value}</div>
                  <div className="text-[10px] text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Log controls */}
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Servings</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setServings(Math.max(0.5, +(servings - 0.5).toFixed(1)))}
                    className="w-8 h-8 rounded-lg border border-border hover:bg-accent flex items-center justify-center text-lg font-bold transition-colors">−</button>
                  <span className="w-10 text-center font-semibold text-foreground">{servings}</span>
                  <button onClick={() => setServings(+(servings + 0.5).toFixed(1))}
                    className="w-8 h-8 rounded-lg border border-border hover:bg-accent flex items-center justify-center text-lg font-bold transition-colors">+</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Meal</label>
                <select value={mealType} onChange={e => setMealType(e.target.value)}
                  className="w-full h-9 text-sm rounded-lg border border-input bg-background px-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                  {MEAL_TYPES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date</label>
              <Input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} className="w-full" />
            </div>

            <div className="flex gap-3">
              <Button className="flex-1" onClick={handleAddToLog} disabled={logMutation.isPending}>
                {logMutation.isPending ? (
                  <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Adding…</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add to Food Log
                  </span>
                )}
              </Button>
              <Button variant="outline" onClick={reset}>Scan Another</Button>
            </div>
          </div>

          {product.ingredients && (
            <div className="px-5 pb-5">
              <div className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Ingredients: </span>{product.ingredients}
                {product.ingredients.length >= 200 && "…"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Manual entry (always visible unless a product is showing) ── */}
      {scanState !== "found" && scanState !== "lookup" && (
        <div className={cn("bg-card border border-card-border rounded-2xl p-5 shadow-sm", scanState === "scanning" && "opacity-60 pointer-events-none")}>
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-foreground">Enter barcode manually</span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. 5000128007278"
              value={manualBarcode}
              onChange={e => setManualBarcode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={e => e.key === "Enter" && handleManualLookup()}
              className="font-mono"
              maxLength={14}
            />
            <Button onClick={handleManualLookup} disabled={manualBarcode.length < 6}>Look Up</Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Works with EAN-13, EAN-8, UPC-A, UPC-E. The barcode number is printed below the bars on the packaging.
          </p>
        </div>
      )}

      {/* ── Camera support notice ── */}
      {!supportsCamera && scanState === "idle" && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
          <span className="font-semibold">Camera scanning</span> requires Chrome or Edge 83+. Firefox and Safari users can use manual entry above.
        </div>
      )}
    </div>
  );
}
