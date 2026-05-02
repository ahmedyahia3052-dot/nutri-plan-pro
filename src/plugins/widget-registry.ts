/**
 * Dashboard Widget Registry
 *
 * Plugins call `registerWidget()` to inject compact cards into the Dashboard.
 * The Dashboard itself only knows about `DashboardWidgetZone` — it never imports
 * any plugin directly, keeping core and plugin code fully decoupled.
 */
import type { ComponentType } from "react";

export interface DashboardWidget {
  /** Unique stable identifier */
  id: string;
  /** Display title (used for aria labelling) */
  title: string;
  /** Lower number = rendered first */
  priority?: number;
  /** The React component to render. Must be self-contained. */
  component: ComponentType;
}

const _registry: DashboardWidget[] = [];

export function registerWidget(widget: DashboardWidget): void {
  if (_registry.find((w) => w.id === widget.id)) return;
  _registry.push(widget);
  _registry.sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));
}

export function getWidgets(): readonly DashboardWidget[] {
  return _registry;
}
