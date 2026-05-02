import type { ComponentType } from "react";

export interface PluginRoute {
  path: string;
  component: ComponentType;
}

export interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  iconPath: string;
  navLabel: string;
  routes: PluginRoute[];
  badgeCount?: () => number;
}

const _registry: PluginDefinition[] = [];

export function registerPlugin(plugin: PluginDefinition): void {
  if (!_registry.find(p => p.id === plugin.id)) {
    _registry.push(plugin);
  }
}

export function getPlugins(): PluginDefinition[] {
  return _registry;
}

export function getPluginRoutes(): PluginRoute[] {
  return _registry.flatMap(p => p.routes);
}

export function getPluginNavItems() {
  return _registry.map(p => ({
    id: p.id,
    path: p.routes[0]?.path ?? `/plugins/${p.id}`,
    label: p.navLabel,
    icon: p.iconPath,
    description: p.description,
  }));
}
