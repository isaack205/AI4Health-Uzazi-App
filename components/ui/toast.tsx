import { X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface WarmToastProps {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  onDismiss: () => void;
}

export function WarmToast({
  title,
  description,
  variant = "default",
  onDismiss,
}: WarmToastProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto w-full max-w-sm rounded-[28px] border p-4 shadow-soft backdrop-blur animate-in slide-in-from-top-4 fade-in duration-300",
        variant === "destructive"
          ? "border-rose-200 bg-[#fff4f5] text-rose-900"
          : "border-uzazi-blush/60 bg-white/95 text-uzazi-earth",
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{title}</p>
          {description ? <p className="mt-1 text-sm leading-6 opacity-80">{description}</p> : null}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full p-1 text-current/60 transition hover:bg-black/5 hover:text-current focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uzazi-blush"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
