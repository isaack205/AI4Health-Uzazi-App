"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Send, Mic, ArrowLeft, Info, Phone, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BreathingExercise } from "@/components/mother/breathing-exercise";
import { cn } from "@/lib/utils";
import type { CompanionMessage, Mother } from "@/lib/types";

export default function CompanionPage() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const router = useRouter();
  
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [showBreathing, setShowBreathing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCrisis, setIsCrisis] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Time display
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Initial message
  useEffect(() => {
    if (!showDisclaimer && messages.length === 0 && user) {
      const firstMsg = t("companion.firstMessage").replace("{{name}}", user.name || "Mama");
      setMessages([{
        role: "assistant",
        content: firstMsg,
        timestamp: new Date().toISOString()
      }]);
    }
  }, [showDisclaimer, messages.length, user, t]);

  const chips = [
    t("companion.chipSleep"),
    t("companion.chipOverwhelmed"),
    t("companion.chipAnxious"),
    t("companion.chipTalk")
  ];

  const handleSend = async (content: string) => {
    if (!content.trim() || isTyping) return;

    const userMsg: CompanionMessage = {
      role: "user",
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // 1. Prepare history for context
      const history = messages.slice(-10); // Last 10 messages

      // 2. Stream from API
      const response = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          conversationHistory: history,
          userId: user?.uid,
          language: locale,
          dayPostpartum: (user as Mother)?.postpartumDay ?? 0
        })
      });

      if (!response.ok) throw new Error("Failed to connect");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      let aiContent = "";
      const assistantMsg: CompanionMessage = {
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                aiContent += parsed.content;
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: aiContent
                  };
                  return updated;
                });
              }
              if (parsed.isCrisis) {
                setIsCrisis(true);
              }
              if (parsed.triggerBreathing) {
                setShowBreathing(true);
              }
            } catch (e) {
              // Handle partial JSON or formatting issues
            }
          }
        }
      }

      // 3. Save to Firestore
      if (user?.uid) {
        await addDoc(collection(db, "conversations"), {
          userId: user.uid,
          userMessage: content,
          aiResponse: aiContent,
          timestamp: serverTimestamp(),
          isCrisis: isCrisis
        });
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm sorry, I'm having a little trouble connecting right now. But I'm still here with you.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#1A0A2E] text-[#F8F0E3] overflow-hidden font-body">
      {/* Star field animation */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="stars-container">
          {Array.from({ length: 50 }).map((_, i) => (
            <div 
              key={i} 
              className="star" 
              style={{ 
                left: `${Math.random() * 100}%`, 
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }} 
            />
          ))}
        </div>
      </div>

      {/* Moon */}
      <div className="absolute top-8 right-8 w-24 h-24 rounded-full bg-[#FFF9D7] blur-[1px] shadow-[0_0_60px_rgba(255,249,215,0.3)] opacity-80 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-4 h-4 rounded-full bg-[#E8E2BD] opacity-40" />
        <div className="absolute bottom-1/3 right-1/4 w-6 h-6 rounded-full bg-[#E8E2BD] opacity-30" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-white/5 bg-[#1A0A2E]/40">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-white/5 transition">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-uzazi-rose/30 animate-pulse-slow" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-uzazi-rose/20 animate-breathing" />
              </div>
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-wide">{t("companion.title")}</h1>
              <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 overflow-hidden flex flex-col">
        {showDisclaimer ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <Card className="max-w-md bg-uzazi-midnight border-white/10 shadow-bloom animate-in fade-in zoom-in duration-500">
              <CardContent className="p-8 space-y-6">
                <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Info className="h-8 w-8" />
                </div>
                <p className="text-[#F8F0E3]/80 leading-relaxed italic">
                  &quot;{t("companion.disclaimer")}&quot;
                </p>
                <Button 
                  onClick={() => setShowDisclaimer(false)}
                  className="w-full h-14 rounded-2xl bg-uzazi-rose hover:bg-rose-600 text-lg shadow-bloom"
                >
                  {t("companion.disclaimerBtn")}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Message Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scroll-smooth"
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "flex flex-col max-w-[85%] animate-in fade-in slide-in-from-bottom-2 duration-300",
                    msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className={cn(
                    "p-4 rounded-[24px] text-[16px] leading-relaxed shadow-sm",
                    msg.role === "user" 
                      ? "bg-uzazi-rose/20 border border-uzazi-rose/30 text-[#F8F0E3]" 
                      : "bg-white/5 backdrop-blur-md border border-white/10 text-[#F8F0E3]/90 rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>
                  <span className="mt-2 text-[10px] text-white/20 uppercase font-bold tracking-tighter">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              
              {isTyping && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-1 p-4 rounded-[24px] bg-white/5 border border-white/10 w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0.4s]" />
                </div>
              )}

              {isCrisis && (
                <div className="p-6 rounded-[32px] bg-rose-500/10 border border-rose-500/30 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center text-white">
                    <Phone className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-semibold">{t("companion.crisisWarning")}</p>
                  <Button variant="outline" className="rounded-full border-rose-500 text-rose-500 bg-transparent hover:bg-rose-500 hover:text-white" asChild>
                    <a href="tel:0722178177">Call Now</a>
                  </Button>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 pb-10 space-y-4 backdrop-blur-xl border-t border-white/5 bg-[#1A0A2E]/60 relative z-20">
              {/* Quick Chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {chips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(chip)}
                    className="flex-shrink-0 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/60 hover:bg-white/10 hover:text-white transition"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-3 max-w-2xl mx-auto">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-[28px] px-4 py-2 flex items-end">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend(input);
                      }
                    }}
                    placeholder={t("companion.inputPlaceholder")}
                    className="w-full bg-transparent border-none text-[#F8F0E3] placeholder:text-white/20 focus:ring-0 resize-none min-h-[44px] max-h-32 py-3"
                    rows={1}
                  />
                  <button className="p-3 text-white/30 hover:text-uzazi-rose transition relative group">
                    <Mic className="h-5 w-5" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-black text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap transition">
                      {t("companion.micSoon")}
                    </span>
                  </button>
                </div>
                <Button 
                  onClick={() => handleSend(input)}
                  disabled={!input.trim() || isTyping}
                  className="h-14 w-14 rounded-full bg-uzazi-rose hover:bg-rose-600 shadow-bloom p-0"
                >
                  <Send className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </>
        )}
      </main>

      <BreathingExercise open={showBreathing} onOpenChange={setShowBreathing} />

      <style jsx global>{`
        .stars-container {
          position: absolute;
          width: 100%;
          height: 100%;
        }
        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          opacity: 0;
          animation: twinkle var(--duration) infinite;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes breathing {
          0%, 100% { transform: scale(0.8); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 0.6; }
        }
        .animate-breathing {
          animation: breathing 4s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
