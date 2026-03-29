"use client";

import { Phone, ShieldAlert, Heart } from "lucide-react";
import { useLocale } from "@/providers/LanguageProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SafetyCard() {
  const { t } = useLocale();

  return (
    <Card className="bg-uzazi-rose text-white border-none shadow-bloom rounded-[32px] overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <h4 className="font-bold text-lg">{t("community_rules_title")}</h4>
        </div>
        
        <p className="text-sm leading-relaxed text-white/90 italic">
          {t("companion.crisisWarning")}
        </p>
        
        <div className="pt-2 flex gap-3">
          <Button variant="secondary" className="flex-1 rounded-full bg-white text-uzazi-rose hover:bg-white/90" asChild>
            <a href="tel:0722178177">
              <Phone className="mr-2 h-4 w-4" />
              Call Now
            </a>
          </Button>
          <Button variant="ghost" className="flex-1 rounded-full border border-white/20 text-white hover:bg-white/10" asChild>
            <a href="/companion">
              <Heart className="mr-2 h-4 w-4" />
              {t("companion_tab")}
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
