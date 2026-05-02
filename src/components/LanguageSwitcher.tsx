import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className="flex items-center gap-0.5 bg-sidebar-accent/50 rounded-lg p-1 border border-sidebar-border/50"
      role="group"
      aria-label="Language switcher"
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={cn(
          "px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 select-none",
          lang === "en"
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            : "text-sidebar-foreground/55 hover:text-sidebar-foreground"
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("ar")}
        aria-pressed={lang === "ar"}
        className={cn(
          "px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-150 select-none",
          lang === "ar"
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            : "text-sidebar-foreground/55 hover:text-sidebar-foreground"
        )}
      >
        عربي
      </button>
    </div>
  );
}
