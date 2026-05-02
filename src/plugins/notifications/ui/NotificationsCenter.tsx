import { useEffect, useRef, useState } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  REMINDER_DEFS,
  checkDueReminders,
  isEnabled,
  loadPrefs,
  resetFiredTimestamps,
  savePrefs,
  timeAgo,
} from "../service";
import type { ReminderPrefs } from "../service";
import type { AppNotification } from "@/context/NotificationContext";

// ── Type icons / colours ───────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, { bg: string; icon: string; text: string; path: string }> = {
  warning:  { bg: "bg-red-50    border-red-100",    icon: "text-destructive",  text: "text-destructive",  path: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  info:     { bg: "bg-blue-50   border-blue-100",   icon: "text-blue-600",     text: "text-blue-700",     path: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  success:  { bg: "bg-emerald-50 border-emerald-100", icon: "text-primary",   text: "text-emerald-700",  path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  reminder: { bg: "bg-amber-50  border-amber-100",  icon: "text-amber-600",   text: "text-amber-700",    path: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
};

// ── Toggle switch ──────────────────────────────────────────────────────────────

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        enabled ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
          enabled ? "translate-x-4.5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

// ── Single notification item ───────────────────────────────────────────────────

function NotifItem({ n, onRead, onDismiss }: {
  n: AppNotification;
  onRead: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const style = TYPE_STYLES[n.type] ?? TYPE_STYLES.info;
  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/40 transition-colors border-b border-border last:border-0",
        !n.read && "bg-accent/20"
      )}
      onClick={() => onRead(n.id)}
    >
      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border", style.bg)}>
        <svg className={cn("w-4 h-4", style.icon)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={style.path} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-semibold leading-tight", !n.read ? "text-foreground" : "text-muted-foreground")}>
            {n.title}
          </p>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
              {timeAgo(n.createdAt)}
            </span>
            {!n.read && (
              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
      </div>
    </div>
  );
}

// ── Stat chip ──────────────────────────────────────────────────────────────────

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center bg-muted/40 rounded-xl px-5 py-3 flex-1">
      <span className={`text-2xl font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

type FilterTab = "all" | "unread" | "reminders";

export function NotificationsCenter() {
  const { notifications, addNotification, markAllRead, markRead, dismiss } = useNotifications();

  const [prefs, setPrefs] = useState<ReminderPrefs>(loadPrefs);
  const [tab, setTab] = useState<FilterTab>("all");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Reminder engine: runs on mount + every 60 seconds ─────────────────────
  useEffect(() => {
    function checkReminders() {
      const due = checkDueReminders(prefs);
      for (const def of due) {
        addNotification({ type: def.type, title: def.title, message: def.message });
      }
    }
    checkReminders();
    intervalRef.current = setInterval(checkReminders, 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs]);

  const handleToggle = (id: string) => {
    setPrefs((prev) => {
      const next = { ...prev, [id]: !isEnabled(id, prev) };
      savePrefs(next);
      return next;
    });
  };

  const handleTestReminder = () => {
    resetFiredTimestamps();
    addNotification({
      type: "reminder",
      title: "Test Reminder",
      message: "This is a test notification from the Notifications plugin. Your reminders are working!",
    });
  };

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = notifications.filter((n) => {
    if (tab === "unread")   return !n.read;
    if (tab === "reminders") return n.type === "reminder";
    return true;
  });

  const unread    = notifications.filter((n) => !n.read).length;
  const reminders = notifications.filter((n) => n.type === "reminder").length;
  const total     = notifications.length;

  const TABS: { id: FilterTab; label: string; count: number }[] = [
    { id: "all",       label: "All",       count: total },
    { id: "unread",    label: "Unread",    count: unread },
    { id: "reminders", label: "Reminders", count: reminders },
  ];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Smart in-app reminders — no external services required.
        </p>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-6">
        <StatChip label="Total"     value={total}     color="text-foreground" />
        <StatChip label="Unread"    value={unread}    color="text-primary" />
        <StatChip label="Reminders" value={reminders} color="text-amber-600" />
      </div>

      {/* Reminder settings */}
      <div className="bg-card border border-card-border rounded-xl shadow-card mb-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-foreground text-sm">Reminder Schedule</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reminders trigger automatically while the app is open.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleTestReminder} className="text-xs">
            <svg className="w-3.5 h-3.5 me-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            Test
          </Button>
        </div>
        <div className="divide-y divide-border">
          {REMINDER_DEFS.map((def) => {
            const enabled = isEnabled(def.id, prefs);
            return (
              <div key={def.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="text-xl select-none w-7 text-center flex-shrink-0">{def.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">{def.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{def.schedule}</p>
                </div>
                <Toggle enabled={enabled} onToggle={() => handleToggle(def.id)} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Notification feed */}
      <div className="bg-card border border-card-border rounded-xl shadow-card overflow-hidden">
        {/* Tabs + actions */}
        <div className="flex items-center justify-between px-4 pt-3 pb-0 border-b border-border">
          <div className="flex">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "px-3 pb-3 text-xs font-medium border-b-2 transition-colors -mb-px",
                  tab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={cn("ms-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-2 pb-2">
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Mark all read
              </button>
            )}
            {total > 0 && (
              <button
                onClick={() => notifications.forEach((n) => dismiss(n.id))}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Items */}
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-3xl mb-3 select-none">
              {tab === "unread" ? "✅" : "🔔"}
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {tab === "unread" ? "All caught up!" : "No notifications yet"}
            </p>
            <p className="text-xs text-muted-foreground">
              {tab === "unread"
                ? "No unread notifications."
                : "Enable reminders above and they'll appear here automatically."}
            </p>
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            {filtered.map((n) => (
              <NotifItem
                key={n.id}
                n={n}
                onRead={markRead}
                onDismiss={dismiss}
              />
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-5 leading-relaxed">
        Reminders only fire while the app is open in your browser. No push notifications or external services are used.
      </p>
    </div>
  );
}
