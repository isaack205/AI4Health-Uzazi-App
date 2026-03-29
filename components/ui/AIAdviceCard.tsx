"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function AIAdviceCard({ advice, language, loading, t }: { advice: string, language: string, loading: boolean, t: (key: string) => string }) {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    if (loading || !advice) {
      setDisplayedText("");
      return;
    }
    
    let i = 0;
    setDisplayedText("");
    
    const interval = setInterval(() => {
      setDisplayedText(advice.substring(0, i + 1));
      i++;
      if (i >= advice.length) {
        clearInterval(interval);
      }
    }, 25);
    
    return () => clearInterval(interval);
  }, [advice, loading]);

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] bg-uzazi-earth/5 p-4 text-sm text-uzazi-earth/70">
        {t("aiDisclaimer")}
      </div>
      
      <Card className="border-l-4 border-l-uzazi-rose bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-uzazi-earth/10">
            <div className="flex items-center gap-2 text-uzazi-earth font-semibold">
              <div className="rounded-full bg-uzazi-rose/10 p-1.5 text-uzazi-rose">
                <Sparkles className="h-4 w-4" />
              </div>
              {t("result.aiAdviceLabel")}
            </div>
            <span className="text-xs uppercase tracking-wider text-uzazi-earth/50 font-medium bg-uzazi-earth/5 px-2 py-1 rounded">
              {language}
            </span>
          </div>

          <div className="min-h-[100px] text-uzazi-charcoal text-[16px] leading-[1.7] font-body relative">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-uzazi-rose/20 rounded w-full"></div>
                <div className="h-4 bg-uzazi-rose/20 rounded w-5/6"></div>
                <div className="h-4 bg-uzazi-rose/20 rounded w-4/6"></div>
              </div>
            ) : (
              <>
                {displayedText.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
                {displayedText.length < advice?.length && (
                  <span className="inline-block w-1.5 h-4 ml-1 bg-uzazi-charcoal animate-pulse"></span>
                )}
              </>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-uzazi-earth/5 flex items-center justify-center gap-2 opacity-60">
            <div className="h-5 w-5 rounded-full bg-uzazi-earth/10 flex items-center justify-center font-bold text-[10px]">G</div>
            <span className="text-xs text-uzazi-earth font-medium">{t("result.generatedBy")}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}