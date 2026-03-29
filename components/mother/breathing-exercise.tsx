"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/providers/LanguageProvider";

export function BreathingExercise({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { t } = useLocale();
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const [timer, setTimer] = useState(4);

  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev === 1) {
          if (phase === "in") {
            setPhase("hold");
            return 4;
          } else if (phase === "hold") {
            setPhase("out");
            return 4;
          } else {
            setPhase("in");
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, phase]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#1A0A2E] border-uzazi-rose/20 text-[#F8F0E3]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-body">
            {phase === "in" ? t("companion.breatheIn") : phase === "hold" ? t("companion.breatheHold") : t("companion.breatheOut")}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-12">
          <div className={`relative flex items-center justify-center rounded-full transition-all duration-&lsqb;4000ms&rsqb; ease-in-out border-2 border-uzazi-rose/30 ${
            phase === "in" ? "w-64 h-64 scale-100 bg-uzazi-rose/10" : 
            phase === "hold" ? "w-64 h-64 scale-100 bg-uzazi-rose/20 shadow-[0_0_40px_rgba(255,139,167,0.4)]" : 
            "w-32 h-32 scale-50 bg-uzazi-rose/5"
          }`}>
            <span className="text-4xl font-bold font-mono">{timer}</span>
          </div>
          
          <Button 
            variant="outline" 
            className="mt-12 rounded-full border-white/10 text-white/60 hover:text-white hover:bg-white/5"
            onClick={() => onOpenChange(false)}
          >
            {t("companion.endExercise")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
