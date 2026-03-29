"use client";

import { useDeferredValue, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useCompanionReply } from "@/lib/hooks/use-companion";
import type { CompanionMessage } from "@/lib/types";

const starterMessages: CompanionMessage[] = [
  {
    role: "assistant",
    content:
      "I’m here with you. If the night feels heavy, tell me what is happening in your body or your thoughts right now.",
    timestamp: new Date().toISOString(),
  },
];

export function CompanionChat() {
  const [messages, setMessages] = useState<CompanionMessage[]>(starterMessages);
  const [draft, setDraft] = useState("");
  const deferredDraft = useDeferredValue(draft);
  const mutation = useCompanionReply();

  const send = async () => {
    const content = deferredDraft.trim();

    if (!content) {
      return;
    }

    const nextMessages = [
      ...messages,
      {
        role: "user" as const,
        content,
        timestamp: new Date().toISOString(),
      },
    ];

    setMessages(nextMessages);
    setDraft("");

    try {
      const response = await mutation.mutateAsync({ messages: nextMessages });
      setMessages((current) => [...current, response.message]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "I lost the connection for a moment. Try again, or reach out to your CHW if you need urgent support.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  return (
    <Card className="overflow-hidden border-uzazi-midnight/10 bg-gradient-to-br from-uzazi-midnight via-[#281341] to-[#3d1f4e] text-white">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-white">3AM Companion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-0">
        <div className="max-h-[440px] space-y-4 overflow-y-auto px-6 py-6">
          {messages.map((message, index) => (
            <div
              key={`${message.timestamp}-${index}`}
              className={message.role === "assistant" ? "mr-8 rounded-[28px] bg-white/10 p-4" : "ml-8 rounded-[28px] bg-uzazi-blush/25 p-4"}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                {message.role === "assistant" ? "UZAZI Companion" : "You"}
              </p>
              <p className="mt-2 text-sm leading-7 text-white/90">{message.content}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t border-white/10 bg-black/10 px-6 py-5">
          <Textarea
            className="border-white/10 bg-white/10 text-white placeholder:text-white/45"
            placeholder="Tell me what feels hardest right now..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-white/60">Supportive responses, grounding prompts, and escalation cues.</p>
            <Button variant="outline" className="border-white/15 bg-white/10 text-white hover:bg-white/20" onClick={() => void send()}>
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
