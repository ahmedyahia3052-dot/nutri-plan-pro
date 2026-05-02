import { useState, useRef, useEffect } from "react";
import { useNotifications } from "@/context/NotificationContext";
import { cn } from "@/lib/utils";

const TYPE_STYLES: Record<string, { bg: string; icon: string; dot: string }> = {
  warning: { bg: "bg-red-50 border-red-100", icon: "text-destructive", dot: "bg-destructive" },
  info: { bg: "bg-blue-50 border-blue-100", icon: "text-blue-600", dot: "bg-blue-500" },
  success: { bg: "bg-accent border-accent-border", icon: "text-primary", dot: "bg-primary" },
  reminder: { bg: "bg-amber-50 border-amber-100", icon: "text-amber-600", dot: "bg-amber-500" },
};

const TYPE_ICONS: Record<string, string> = {
  warning: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  reminder: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
};

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, markRead, dismiss } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(v => !v); if (!open && unreadCount > 0) markAllRead(); }}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-card border border-card-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-foreground text-sm">Notifications</span>
            {notifications.length > 0 && (
              <button onClick={() => notifications.forEach(n => dismiss(n.id))} className="text-xs text-muted-foreground hover:text-foreground">
                Clear all
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {notifications.map(n => {
                const style = TYPE_STYLES[n.type] ?? TYPE_STYLES.info;
                return (
                  <div key={n.id} className={cn("px-4 py-3 flex gap-3 cursor-pointer hover:bg-muted/50 transition-colors", !n.read && "bg-accent/20")}
                    onClick={() => markRead(n.id)}>
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border", style.bg)}>
                      <svg className={cn("w-3.5 h-3.5", style.icon)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={TYPE_ICONS[n.type] ?? TYPE_ICONS.info} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground leading-tight">{n.title}</p>
                        <button onClick={e => { e.stopPropagation(); dismiss(n.id); }} className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{n.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
