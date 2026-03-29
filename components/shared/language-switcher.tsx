"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { useLocale } from "@/providers/LanguageProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { code: "en", label: "English" },
    { code: "sw", label: "Kiswahili" },
    { code: "ki", label: "Gĩkũyũ" },
  ] as const;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-uzazi-earth/10 text-uzazi-earth hover:bg-uzazi-petal hover:text-uzazi-rose transition shadow-sm"
        aria-label={t("change_language")}
        title={t("change_language")}
      >
        <Globe className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
            aria-hidden="true" 
          />
          <div className="absolute right-0 top-14 z-50 w-48 rounded-2xl bg-white p-2 shadow-bloom border border-uzazi-earth/5 animate-in slide-in-from-top-2 fade-in">
            <div className="px-3 py-2 mb-2 border-b border-uzazi-earth/5 text-xs font-semibold uppercase tracking-wider text-uzazi-earth/50">
              {t("change_language")}
            </div>
            {options.map((opt) => (
              <button
                key={opt.code}
                onClick={() => {
                  setLocale(opt.code);
                  setIsOpen(false);
                }}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                  locale === opt.code
                    ? "bg-uzazi-rose text-white font-medium"
                    : "text-uzazi-earth hover:bg-uzazi-petal"
                }`}
                aria-pressed={locale === opt.code}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
