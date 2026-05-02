// ── Types ─────────────────────────────────────────────────────────────────────

export interface NormalizedFood {
  code: string;
  name: string;
  brand: string;
  per100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

interface OFFProduct {
  code?: string;
  _id?: string;
  product_name?: string;
  brands?: string;
  nutriments?: {
    "energy-kcal_100g"?: number;
    "energy_100g"?: number;
    "energy-kj_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
}

// ── In-memory cache ───────────────────────────────────────────────────────────

const CACHE = new Map<string, { data: NormalizedFood[]; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 25;

// ── Normalize one product from OFF response ───────────────────────────────────

function normalize(p: OFFProduct): NormalizedFood | null {
  const name = (p.product_name ?? "").trim();
  if (!name) return null;

  const n = p.nutriments ?? {};

  // Prefer kcal field; fall back to kJ ÷ 4.184
  const kcal =
    n["energy-kcal_100g"] ??
    (n["energy-kj_100g"] != null
      ? n["energy-kj_100g"] / 4.184
      : n["energy_100g"] != null
      ? n["energy_100g"] / 4.184
      : 0);

  // Use only first brand when multiple are listed ("Nestlé, Generic" → "Nestlé")
  const brand = (p.brands ?? "")
    .split(",")[0]
    .trim();

  return {
    code: p.code ?? p._id ?? Math.random().toString(36).slice(2),
    name,
    brand,
    per100g: {
      calories: Math.round(kcal),
      protein: Math.round((n.proteins_100g ?? 0) * 10) / 10,
      carbs: Math.round((n.carbohydrates_100g ?? 0) * 10) / 10,
      fat: Math.round((n.fat_100g ?? 0) * 10) / 10,
    },
  };
}

// ── Public search function ────────────────────────────────────────────────────

export async function searchFoods(query: string): Promise<NormalizedFood[]> {
  const key = query.trim().toLowerCase();
  if (key.length < 2) return [];

  // Serve from cache if fresh
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const params = new URLSearchParams({
    search_terms: key,
    json: "1",
    page_size: "15",
    fields: "code,product_name,brands,nutriments",
    sort_by: "unique_scans_n",  // most-scanned = most recognisable products first
  });

  const res = await fetch(
    `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`
  );
  if (!res.ok) {
    throw new Error(`Open Food Facts returned ${res.status}. Check your internet connection.`);
  }

  const json = await res.json() as { products?: OFFProduct[] };
  const results: NormalizedFood[] = (json.products ?? [])
    .map(normalize)
    .filter((f): f is NormalizedFood => f !== null)
    .filter((f) => f.per100g.calories > 0);     // drop entries with no calorie data

  // Evict oldest entry when cache is full
  if (CACHE.size >= MAX_CACHE_SIZE) {
    const oldest = [...CACHE.entries()].sort((a, b) => a[1].ts - b[1].ts)[0];
    CACHE.delete(oldest[0]);
  }
  CACHE.set(key, { data: results, ts: Date.now() });

  return results;
}

// ── Scale nutrition for an arbitrary serving size ─────────────────────────────

export function scaleNutrition(
  per100g: NormalizedFood["per100g"],
  grams: number
): { calories: number; protein: number; carbs: number; fat: number } {
  const f = Math.max(0, grams) / 100;
  return {
    calories: Math.round(per100g.calories * f),
    protein: Math.round(per100g.protein * f * 10) / 10,
    carbs: Math.round(per100g.carbs * f * 10) / 10,
    fat: Math.round(per100g.fat * f * 10) / 10,
  };
}

export function clearSearchCache(): void {
  CACHE.clear();
}
