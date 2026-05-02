/**
 * DashboardWidgetZone
 *
 * Renders all widgets that have been registered via `registerWidget()`.
 * This component is the ONLY connection between the Dashboard page and the
 * plugin system — the Dashboard imports this component, not any plugin directly.
 *
 * Each widget is wrapped in an error boundary + Suspense so a broken widget
 * can never crash the Dashboard.
 */
import { Component, Suspense } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { getWidgets } from "@/plugins/widget-registry";

// ── Lightweight per-widget error boundary ────────────────────────────────────

interface EBState { crashed: boolean }

class WidgetErrorBoundary extends Component<{ id: string; children: ReactNode }, EBState> {
  state: EBState = { crashed: false };

  static getDerivedStateFromError(): EBState {
    return { crashed: true };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error(`[DashboardWidget] widget crashed:`, err, info);
  }

  render() {
    if (this.state.crashed) {
      return (
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3 text-xs text-destructive/70">
          Widget "{this.props.id}" failed to render.
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Suspense fallback ────────────────────────────────────────────────────────

function WidgetSkeleton() {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 animate-pulse">
      <div className="h-3.5 bg-muted rounded w-40 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <div className="h-2.5 bg-muted rounded w-full mb-1.5" />
            <div className="h-2 bg-muted/60 rounded-full w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Zone ─────────────────────────────────────────────────────────────────────

export function DashboardWidgetZone() {
  const widgets = getWidgets();
  if (widgets.length === 0) return null;

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      {widgets.map((w) => {
        const Widget = w.component;
        return (
          <WidgetErrorBoundary key={w.id} id={w.id}>
            <Suspense fallback={<WidgetSkeleton />}>
              <Widget />
            </Suspense>
          </WidgetErrorBoundary>
        );
      })}
    </div>
  );
}
