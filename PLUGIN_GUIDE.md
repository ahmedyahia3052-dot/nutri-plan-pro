# How to Add a New Plugin Safely

This project uses a plugin-based architecture. All new features **must** be added as plugins.
Core files (`vite.config.ts`, `package.json`, existing API routes) must never be modified.

---

## Plugin File Structure

```
src/plugins/<plugin-name>/
    index.ts           ← Registers the plugin with the registry (required)
    service.ts         ← Business logic / data transformation (optional)
    ui/
        MyPlugin.tsx   ← React page component (required)

server/plugins/<plugin-name>/
    routes.ts          ← Express router for backend endpoints (optional)
```

---

## Step-by-Step: Create a New Plugin

### 1. Create the UI component

`src/plugins/my-plugin/ui/MyPlugin.tsx`

```tsx
export function MyPlugin() {
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">My Plugin</h1>
      <p className="text-muted-foreground mt-1">Plugin content here.</p>
    </div>
  );
}
```

### 2. Register the plugin

`src/plugins/my-plugin/index.ts`

```ts
import { lazy } from "react";
import { registerPlugin } from "@/plugins/registry";

const MyPlugin = lazy(() =>
  import("./ui/MyPlugin").then(m => ({ default: m.MyPlugin }))
);

registerPlugin({
  id: "my-plugin",                        // Unique ID — never reuse
  name: "My Plugin",
  description: "One-line description.",
  navLabel: "My Plugin",
  iconPath: "M12 ...",                    // SVG path string (Heroicons outline)
  routes: [{ path: "/plugins/my-plugin", component: MyPlugin }],
});
```

### 3. Add it to the plugin loader

Open `src/plugins/index.ts` and add one import line:

```ts
import "./my-plugin/index";   // ← add this
```

That's it for the frontend. The sidebar link and route are registered automatically.

---

### 4. (Optional) Add a backend API

`server/plugins/my-plugin/routes.ts`

```ts
import { Router } from "express";
import { requireAuth } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/data", async (req, res) => {
  res.json({ message: "Hello from my plugin" });
});

export default router;
```

Then register it in `server/plugins/index.ts`:

```ts
import myPluginRouter from "./my-plugin/routes";
pluginRouter.use("/my-plugin", myPluginRouter);
```

The endpoint becomes: `GET /api/plugins/my-plugin/data`

---

### 5. Calling plugin APIs from the UI

Use the shared `pluginFetch` helper — it automatically attaches the JWT token:

```ts
import { pluginFetch } from "@/plugins/utils";

const data = await pluginFetch<MyDataType>("my-plugin/data");
```

Or with React Query:

```ts
import { useQuery } from "@tanstack/react-query";
import { pluginFetch } from "@/plugins/utils";

const { data } = useQuery({
  queryKey: ["plugins", "my-plugin", "data"],
  queryFn: () => pluginFetch("my-plugin/data"),
});
```

---

## Rules

| Rule | Why |
|------|-----|
| Never modify `vite.config.ts` or `package.json` | Breaks the build contract |
| Never modify existing API routes in `server/routes/` | Could break existing clients |
| Never install native / binary packages | Must stay cross-platform |
| Always use `lazy()` for UI components | Keeps initial bundle small |
| Always use `registerPlugin()` in `index.ts` | Enables auto-discovery |
| Always route under `/api/plugins/<name>/` | Prevents namespace conflicts |
| Never call `getPluginRoutes()` or `getPluginNavItems()` before all `index.ts` files are imported | Import order matters |

---

## Existing Plugins Reference

| Plugin | Frontend path | API prefix |
|--------|--------------|------------|
| AI Nutrition | `/plugins/ai-nutrition` | — (client-side only) |
| Drug Checker | `/plugins/drug-checker` | — (uses core `/api/interactions`) |
| Reports | `/plugins/reports` | `/api/plugins/reports/summary` |
| Mobile Sync | `/plugins/mobile-sync` | `/api/plugins/mobile-sync/sync` |
| Barcode Scanner | `/plugins/barcode-scanner` | — (Open Food Facts API, no key needed) |

---

## Quick Checklist

- [ ] `src/plugins/<name>/ui/MyPlugin.tsx` — component exported
- [ ] `src/plugins/<name>/index.ts` — `registerPlugin()` called
- [ ] `src/plugins/index.ts` — import line added
- [ ] (if backend) `server/plugins/<name>/routes.ts` — router exported
- [ ] (if backend) `server/plugins/index.ts` — router mounted
- [ ] `npm run build` passes with 0 errors
