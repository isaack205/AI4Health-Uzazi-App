"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, type Locale } from "@/lib/i18n/translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en"); // Default to English before hydration
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const stored = localStorage.getItem("uzazi_locale") as Locale | null;
    if (stored && ["en", "sw", "ki"].includes(stored)) {
      setLocaleState(stored);
      document.documentElement.lang = stored;
      document.documentElement.setAttribute("data-lang", stored);
    } else {
      document.documentElement.lang = "en";
      document.documentElement.setAttribute("data-lang", "en");
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("uzazi_locale", newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.setAttribute("data-lang", newLocale);
    
    // Sync with Google Translate widget if present
    document.cookie = `googtrans=/en/${newLocale}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=/en/${newLocale}; path=/;`;
  };

  const t = (key: string): string => {
    // 1. Try active locale
    if (translations[locale] && translations[locale][key]) {
      return translations[locale][key];
    }
    
    // 2. Fallback to Swahili if Kikuyu is missing a term
    if (locale === "ki" && translations["sw"][key]) {
      console.warn(`[i18n] Missing Kikuyu translation for "${key}", falling back to Swahili.`);
      return translations["sw"][key];
    }

    // 3. Fallback to English ultimately
    if (translations["en"][key]) {
      console.warn(`[i18n] Missing translation for "${key}" in ${locale}, falling back to English.`);
      return translations["en"][key];
    }

    console.warn(`[i18n] Missing translation entirely for key: "${key}"`);
    return key; // Never return undefined; return the key itself so it's obvious in UI
  };

  // Prevent hydration mismatch flashes by not rendering until we know the locale
  if (!isClient) return null;

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLocale must be used within a LanguageProvider");
  }
  return context;
}
