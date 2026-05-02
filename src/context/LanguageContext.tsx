import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Lang = "en" | "ar";

interface LanguageContextValue {
  lang: Lang;
  isRTL: boolean;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  isRTL: false,
  setLang: () => {},
});

function detectInitialLang(): Lang {
  const saved = localStorage.getItem("nutri_plan_lang");
  if (saved === "ar" || saved === "en") return saved;
  if (navigator.language.startsWith("ar")) return "ar";
  return "en";
}

function applyLangToDocument(lang: Lang) {
  const isRTL = lang === "ar";
  document.documentElement.lang = lang;
  document.documentElement.dir = isRTL ? "rtl" : "ltr";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  const isRTL = lang === "ar";

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    i18n.changeLanguage(newLang);
    localStorage.setItem("nutri_plan_lang", newLang);
    applyLangToDocument(newLang);
  };

  // Apply on mount to ensure DOM is in sync with persisted preference
  useEffect(() => {
    applyLangToDocument(lang);
    i18n.changeLanguage(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, isRTL, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
