"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { useLocale } from "@/providers/LanguageProvider";

export function ChatInputExample({ onSend }: { onSend: (msg: string, locale: string) => void }) {
  const { t, locale } = useLocale();
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    // Pass the locale along with the message to the backend
    onSend(message, locale);
    setMessage("");
  };

  return (
    <div className="flex w-full items-center gap-2 p-4 bg-white border-t border-uzazi-petal">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        placeholder={t("chat_placeholder")}
        aria-label={t("chat_placeholder")}
        className="flex-1 rounded-full border border-uzazi-earth/20 px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-uzazi-blush"
      />
      <button
        onClick={handleSend}
        disabled={!message.trim()}
        aria-label={t("send_btn")}
        title={t("send_btn")}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-uzazi-rose text-white transition hover:scale-105 disabled:opacity-50"
      >
        <Send className="h-5 w-5" />
      </button>
    </div>
  );
}
