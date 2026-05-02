// Declares the browser-native BarcodeDetector API (Chrome/Edge 83+, no package needed)
declare class BarcodeDetector {
  constructor(options?: { formats?: string[] });
  detect(source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap | ImageData): Promise<Array<{ rawValue: string; format: string; boundingBox: DOMRectReadOnly }>>;
  static getSupportedFormats(): Promise<string[]>;
}

export function isBarcodeDetectorSupported(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

export async function createBarcodeDetector(): Promise<BarcodeDetector> {
  const formats = isBarcodeDetectorSupported()
    ? await BarcodeDetector.getSupportedFormats()
    : [];
  const wanted = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"];
  const useFormats = formats.filter(f => wanted.includes(f));
  return new BarcodeDetector({ formats: useFormats.length > 0 ? useFormats : wanted });
}

// ── Open Food Facts API ────────────────────────────────────────────────────────

export interface FoodProduct {
  barcode: string;
  name: string;
  brand: string;
  servingSizeG: number;
  per100g: { calories: number; proteinG: number; carbsG: number; fatG: number };
  perServing: { calories: number; proteinG: number; carbsG: number; fatG: number };
  imageUrl: string | null;
  ingredients: string;
  source: string;
}

interface OFFProductResponse {
  status: number;
  product?: {
    product_name?: string;
    brands?: string;
    serving_size?: string;
    serving_quantity?: number;
    image_front_small_url?: string;
    ingredients_text?: string;
    nutriments?: {
      "energy-kcal_100g"?: number;
      energy_100g?: number;
      proteins_100g?: number;
      carbohydrates_100g?: number;
      fat_100g?: number;
      "energy-kcal_serving"?: number;
      proteins_serving?: number;
      carbohydrates_serving?: number;
      fat_serving?: number;
    };
  };
}

function kcal(energy: number | undefined, isKJ: boolean): number {
  if (!energy) return 0;
  return isKJ ? Math.round(energy / 4.184) : Math.round(energy);
}

export async function lookupBarcode(barcode: string): Promise<FoodProduct | null> {
  const cleanBarcode = barcode.trim().replace(/\D/g, "");
  if (!cleanBarcode) return null;

  const res = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`,
    { headers: { "User-Agent": "NutriPlanPro/2.0" } }
  );

  if (!res.ok) return null;

  const data: OFFProductResponse = await res.json();
  if (data.status !== 1 || !data.product) return null;

  const p = data.product;
  const n = p.nutriments ?? {};
  const isKJ = !n["energy-kcal_100g"] && !!n.energy_100g;
  const cal100 = kcal(n["energy-kcal_100g"] ?? n.energy_100g, isKJ);
  const pro100 = Math.round((n.proteins_100g ?? 0) * 10) / 10;
  const carb100 = Math.round((n.carbohydrates_100g ?? 0) * 10) / 10;
  const fat100 = Math.round((n.fat_100g ?? 0) * 10) / 10;

  const servingG = p.serving_quantity ?? (p.serving_size ? parseFloat(p.serving_size) : 100);
  const ratio = servingG / 100;

  return {
    barcode: cleanBarcode,
    name: p.product_name?.trim() || "Unknown Product",
    brand: p.brands?.split(",")[0]?.trim() || "",
    servingSizeG: servingG,
    per100g: { calories: cal100, proteinG: pro100, carbsG: carb100, fatG: fat100 },
    perServing: {
      calories: Math.round(cal100 * ratio),
      proteinG: Math.round(pro100 * ratio * 10) / 10,
      carbsG: Math.round(carb100 * ratio * 10) / 10,
      fatG: Math.round(fat100 * ratio * 10) / 10,
    },
    imageUrl: p.image_front_small_url ?? null,
    ingredients: p.ingredients_text?.slice(0, 200) ?? "",
    source: "Open Food Facts",
  };
}
