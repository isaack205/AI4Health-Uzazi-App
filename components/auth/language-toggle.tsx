"use client";

import { useEffect, useState } from "react";

import { LANGUAGE_TOGGLE_OPTIONS, getStoredLocale, storeLocale } from "@/components/auth/auth-utils";
import { cn } from "@/lib/utils";

export function LanguageToggle({
  className,
  onChange,
}: {
  className?: string;
  onChange?: (value: string) => void;
}) {
  const [language, setLanguage] = useState("EN");

  useEffect(() => {
    const stored = getStoredLocale();
    setLanguage(stored);
    onChange?.(stored);
  }, [onChange]);

  const selectLanguage = (value: string) => {
    setLanguage(value);
    storeLocale(value);
    onChange?.(value);
  };

  return (
    <div
      className={cn(
        "inline-flex rounded-full border border-uzazi-blush/60 bg-white p-1 shadow-soft",
        className,
      )}
      role="group"
      aria-label="Language selector"
    >
      {LANGUAGE_TOGGLE_OPTIONS.map((option) => {
        const active = option.code === language;

        return (
          <button
            key={option.code}
            type="button"
            onClick={() => selectLanguage(option.code)}
            className={cn(
              "rounded-full px-3 py-2 text-xs font-semibold tracking-[0.2em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uzazi-blush",
              active ? "bg-uzazi-rose text-white shadow-soft" : "text-uzazi-earth/65 hover:bg-uzazi-petal",
            )}
            aria-pressed={active}
            aria-label={`Switch language to ${option.label}`}
          >
            {option.uiLabel}
          </button>
        );
      })}
    </div>
  );
}
