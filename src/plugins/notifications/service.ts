// Reminder engine — no external services, no native dependencies.
// All state in localStorage. Works entirely in-browser.

export interface ReminderDef {
  id: string;
  title: string;
  message: string;
  type: "reminder" | "info";
  icon: string;
  schedule: string;
  /** Fire once per day at this 24h hour (0–23) */
  hour?: number;
  /** Fire every N hours (used for hydration reminder) */
  intervalHours?: number;
}

const PREFS_KEY     = "nutri_plan_reminder_prefs";
const FIRED_KEY     = "nutri_plan_reminder_fired";

export const REMINDER_DEFS: ReminderDef[] = [
  {
    id: "breakfast",
    title: "Log Breakfast",
    message: "Good morning! Start your day right — log your breakfast to track your nutrition.",
    type: "reminder",
    icon: "🌅",
    schedule: "Daily at 8:00 AM",
    hour: 8,
  },
  {
    id: "lunch",
    title: "Log Lunch",
    message: "Midday check-in! Don't forget to log your lunch and stay on track.",
    type: "reminder",
    icon: "☀️",
    schedule: "Daily at 12:00 PM",
    hour: 12,
  },
  {
    id: "dinner",
    title: "Log Dinner",
    message: "Evening logging time! Record your dinner to complete today's nutrition diary.",
    type: "reminder",
    icon: "🌙",
    schedule: "Daily at 7:00 PM",
    hour: 19,
  },
  {
    id: "water",
    title: "Stay Hydrated 💧",
    message: "Time for a water break! Staying hydrated improves energy and focus.",
    type: "reminder",
    icon: "💧",
    schedule: "Every 2 hours",
    intervalHours: 2,
  },
  {
    id: "goals",
    title: "Daily Goals Check-In",
    message: "Evening wrap-up: check if you've hit your calorie, protein and water targets today!",
    type: "info",
    icon: "🎯",
    schedule: "Daily at 9:00 PM",
    hour: 21,
  },
];

export interface ReminderPrefs {
  [reminderId: string]: boolean;
}

export function loadPrefs(): ReminderPrefs {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function savePrefs(prefs: ReminderPrefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function isEnabled(id: string, prefs: ReminderPrefs): boolean {
  return prefs[id] !== false;          // default: enabled
}

interface FiredMap {
  [key: string]: string;               // ISO timestamp
}

function loadFired(): FiredMap {
  try {
    return JSON.parse(localStorage.getItem(FIRED_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveFired(m: FiredMap): void {
  localStorage.setItem(FIRED_KEY, JSON.stringify(m));
}

/**
 * Returns reminder definitions that are due right now.
 * Mutates localStorage to record fire timestamps.
 */
export function checkDueReminders(prefs: ReminderPrefs): ReminderDef[] {
  const now      = new Date();
  const hour     = now.getHours();
  const today    = now.toISOString().slice(0, 10);
  const fired    = loadFired();
  const due: ReminderDef[] = [];

  for (const def of REMINDER_DEFS) {
    if (!isEnabled(def.id, prefs)) continue;

    if (def.hour !== undefined) {
      const key = `${def.id}__${today}`;
      if (fired[key]) continue;
      if (hour === def.hour) {
        due.push(def);
        fired[key] = now.toISOString();
      }
    } else if (def.intervalHours !== undefined) {
      const lastStr = fired[def.id];
      const elapsed = lastStr
        ? (now.getTime() - new Date(lastStr).getTime()) / 3_600_000
        : Infinity;
      if (elapsed >= def.intervalHours) {
        due.push(def);
        fired[def.id] = now.toISOString();
      }
    }
  }

  if (due.length > 0) saveFired(fired);
  return due;
}

/** Clear all fired timestamps so reminders will fire again immediately (for testing). */
export function resetFiredTimestamps(): void {
  localStorage.removeItem(FIRED_KEY);
}

/** Human-readable "time ago" */
export function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60)  return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
