import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { useNotifications } from "@/context/NotificationContext";
import { useGetDashboardSummary } from "@/api/hooks";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getPluginNavItems } from "@/plugins/registry";
import "@/plugins/index";

const NAV_ITEMS = [
  { path: "/",                    key: "nav.dashboard",          icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { path: "/profile",             key: "nav.myProfile",          icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { path: "/diet-plans",          key: "nav.dietPlans",          icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
  { path: "/tracker",             key: "nav.dailyTracker",       icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { path: "/calorie-calculator",  key: "nav.calorieCalculator",  icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" },
  { path: "/interactions",        key: "nav.drugInteractions",   icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
  { path: "/nutrition",           key: "nav.nutritionInfo",      icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" },
  { path: "/food-safety",         key: "nav.foodSafety",         icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
];

function NotificationSeeder() {
  const { data: summary } = useGetDashboardSummary();
  const { addNotification } = useNotifications();
  const { t } = useTranslation();

  useEffect(() => {
    if (!summary) return;
    if (!summary.hasProfile) {
      addNotification({
        type: "reminder",
        title: t("notifications.completeProfile.title"),
        message: t("notifications.completeProfile.message"),
      });
    }
    if (summary.interactionWarnings > 0) {
      addNotification({
        type: "warning",
        title: t("notifications.interactionWarning.title", { count: summary.interactionWarnings }),
        message: t("notifications.interactionWarning.message"),
      });
    }
    if (summary.todayCalories === 0) {
      addNotification({
        type: "reminder",
        title: t("notifications.logMeals.title"),
        message: t("notifications.logMeals.message"),
      });
    }
    if (summary.todayWaterMl < 500) {
      addNotification({
        type: "reminder",
        title: t("notifications.stayHydrated.title"),
        message: t("notifications.stayHydrated.message"),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]);

  return null;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  return (
    <div className="layout-root flex h-screen bg-background overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-sidebar text-sidebar-foreground flex flex-col">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-sidebar-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight text-sidebar-foreground">{t("app.name")}</div>
              <div className="text-xs text-sidebar-foreground/50 leading-tight">{t("app.subtitle")}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const isActive = item.path === "/" ? location === "/" : location.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.icon} />
                  </svg>
                  {t(item.key)}
                </Link>
              );
            })}
          </div>

          {getPluginNavItems().length > 0 && (
            <div className="mt-4 pt-4 border-t border-sidebar-border">
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {t("nav.plugins")}
              </div>
              <div className="space-y-0.5">
                {getPluginNavItems().map((item) => {
                  const isActive = location.startsWith(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={item.icon} />
                      </svg>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Footer: user info + language switcher + sign out */}
        <div className="px-4 py-4 border-t border-sidebar-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-sidebar-primary/30 flex items-center justify-center flex-shrink-0 text-xs font-bold text-sidebar-primary-foreground">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-sidebar-foreground truncate">{user?.name}</div>
                <div className="text-[10px] text-sidebar-foreground/50 truncate">{user?.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <NotificationBell />
              <button
                onClick={logout}
                title={t("common.signOut")}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <svg className="w-4 h-4 rtl-flip" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Language switcher */}
          <LanguageSwitcher />

          <p className="text-[10px] text-sidebar-foreground/40 leading-relaxed">
            {t("common.educational")}
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <NotificationSeeder />
        {children}
      </main>
    </div>
  );
}
