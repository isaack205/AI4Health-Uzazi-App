"use client";

import { useLocale } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";

export function LanguagePickerScreen({ onComplete }: { onComplete: () => void }) {
  const { setLocale } = useLocale();

  const handleSelect = (locale: "en" | "sw" | "ki") => {
    setLocale(locale);
    onComplete();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-uzazi-cream p-6">
      <div className="w-full max-w-md space-y-12 text-center animate-in fade-in zoom-in-95 duration-500">
        
        {/* Render all three greetings natively so they recognize their language */}
        <div className="space-y-4">
          <h1 className="text-display text-4xl text-uzazi-earth font-bold">Welcome</h1>
          <h1 className="text-display text-4xl text-uzazi-earth font-bold">Karibu</h1>
          <h1 className="text-display text-4xl text-uzazi-earth font-bold">Nĩ wega gũka</h1>
        </div>

        <p className="text-uzazi-earth/70 text-lg">
          Please choose your preferred language to get started. <br/>
          (Tafadhali chagua lugha yako / Thuura rũthiomi rwaku)
        </p>

        <div className="grid gap-4">
          <Button 
            size="lg" 
            variant="outline" 
            className="h-16 text-lg rounded-2xl border-uzazi-rose/30 hover:border-uzazi-rose hover:bg-uzazi-petal"
            onClick={() => handleSelect("en")}
          >
            English
          </Button>

          <Button 
            size="lg" 
            variant="outline" 
            className="h-16 text-lg rounded-2xl border-uzazi-rose/30 hover:border-uzazi-rose hover:bg-uzazi-petal"
            onClick={() => handleSelect("sw")}
          >
            Kiswahili
          </Button>

          <Button 
            size="lg" 
            variant="outline" 
            className="h-16 text-lg rounded-2xl border-uzazi-rose/30 hover:border-uzazi-rose hover:bg-uzazi-petal"
            onClick={() => handleSelect("ki")}
          >
            Gĩkũyũ
          </Button>
        </div>
      </div>
    </div>
  );
}
