// Shared utilities for plugin API calls — isolated from core hooks.

export function getAuthToken(): string | null {
  return localStorage.getItem("nutri_plan_token");
}

export async function pluginFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`/api/plugins/${path}`, { headers, ...options });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try { const j = await res.json(); msg = j.error ?? msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return res.json() as T;
}
