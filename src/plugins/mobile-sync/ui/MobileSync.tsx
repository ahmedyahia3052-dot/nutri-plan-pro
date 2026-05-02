import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { pluginFetch } from "@/plugins/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface SyncData {
  meta: { syncedAt: string; userId: number; schemaVersion: string; platform: string };
  profile: object | null;
  dietPlans: unknown[];
  tracking: { today: { date: string; calories: number; waterMl: number; foodEntries: unknown[] }; recentFoodLogs: unknown[]; recentWaterLogs: unknown[] };
}

const ENDPOINTS = [
  { method: "GET", path: "/api/plugins/mobile-sync/sync", description: "Full user data bundle — profile, diet plans, recent food and water logs, and today's summary.", authRequired: true },
  { method: "GET", path: "/api/plugins/mobile-sync/status", description: "Check API status and endpoint documentation.", authRequired: false },
  { method: "POST", path: "/api/auth/login", description: "Authenticate and receive a JWT token.", authRequired: false },
  { method: "GET", path: "/api/auth/me", description: "Get current authenticated user details.", authRequired: true },
  { method: "POST", path: "/api/tracking/food", description: "Log a food entry from the mobile app.", authRequired: true },
  { method: "POST", path: "/api/tracking/water", description: "Log water intake from the mobile app.", authRequired: true },
  { method: "GET", path: "/api/tracking/weekly", description: "Get 7-day calorie and macro trend data.", authRequired: true },
];

export function MobileSync() {
  const [showPreview, setShowPreview] = useState(false);
  const { data, isLoading, refetch, isFetching } = useQuery<SyncData>({
    queryKey: ["plugins", "mobile-sync", "data"],
    queryFn: () => pluginFetch<SyncData>("mobile-sync/sync"),
    enabled: showPreview,
    retry: 1,
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1 font-medium tracking-wide uppercase">
          <span>Plugins</span><span>/</span><span>Mobile Sync</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Mobile Sync</h1>
        <p className="text-muted-foreground mt-1">API layer for React Native and mobile app integration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", label: "API Status", value: "Ready", color: "text-primary" },
          { icon: "M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Schema Version", value: "2.0.0", color: "text-blue-600" },
          { icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z", label: "Auth Method", value: "JWT Bearer", color: "text-amber-600" },
        ].map(card => (
          <div key={card.label} className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                <svg className={`w-5 h-5 ${card.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-foreground">{card.value}</div>
                <div className="text-xs text-muted-foreground">{card.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="font-semibold text-foreground mb-4">Quick Start — React Native</h2>
        <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm">
          <div className="px-4 py-2 bg-muted border-b border-border text-xs font-mono text-muted-foreground">sync.ts</div>
          <pre className="p-5 text-xs font-mono text-foreground overflow-x-auto leading-relaxed">{`const BASE_URL = "http://YOUR_PC_IP:3001";

// 1. Login
const { token } = await fetch(\`\${BASE_URL}/api/auth/login\`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
}).then(r => r.json());

// 2. Sync all data
const data = await fetch(\`\${BASE_URL}/api/plugins/mobile-sync/sync\`, {
  headers: { Authorization: \`Bearer \${token}\` },
}).then(r => r.json());

// data.profile      — health profile
// data.dietPlans    — all meal plans
// data.tracking     — today + recent logs`}</pre>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="font-semibold text-foreground mb-4">Available Endpoints</h2>
        <div className="space-y-2">
          {ENDPOINTS.map(ep => (
            <div key={ep.path} className="bg-card border border-card-border rounded-xl px-5 py-4 shadow-sm flex items-start gap-4">
              <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 mt-0.5 ${ep.method === "GET" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700"}`}>
                {ep.method}
              </span>
              <div className="flex-1 min-w-0">
                <code className="text-sm font-mono text-foreground">{ep.path}</code>
                <p className="text-xs text-muted-foreground mt-1">{ep.description}</p>
              </div>
              {ep.authRequired && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Auth
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Live Data Preview</h2>
          {showPreview && (
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Syncing…" : "Refresh"}
            </Button>
          )}
        </div>
        {!showPreview ? (
          <div className="bg-card border border-card-border rounded-xl p-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">Preview the actual JSON payload that gets sent to a mobile app.</p>
            <Button onClick={() => setShowPreview(true)}>Load Sync Preview</Button>
          </div>
        ) : isLoading ? (
          <Skeleton className="h-48 rounded-xl" />
        ) : data ? (
          <div className="bg-card border border-card-border rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-muted border-b border-border flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">GET /api/plugins/mobile-sync/sync</span>
              <span className="text-xs text-primary font-medium">200 OK</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-border">
              {[
                { label: "Synced At", value: new Date(data.meta.syncedAt).toLocaleTimeString() },
                { label: "Has Profile", value: data.profile ? "Yes" : "No" },
                { label: "Diet Plans", value: String(data.dietPlans.length) },
                { label: "Today Calories", value: `${data.tracking.today.calories} kcal` },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <div className="font-semibold text-foreground text-sm">{item.value}</div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
            <pre className="p-4 text-xs font-mono text-foreground overflow-x-auto max-h-64 leading-relaxed">
              {JSON.stringify({ meta: data.meta, profile: data.profile, dietPlanCount: data.dietPlans.length, tracking: { today: data.tracking.today } }, null, 2)}
            </pre>
          </div>
        ) : (
          <div className="bg-card border border-card-border rounded-xl p-8 text-center text-sm text-muted-foreground">
            Failed to load sync data. Check your connection.
          </div>
        )}
      </div>
    </div>
  );
}
