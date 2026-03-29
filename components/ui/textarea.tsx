import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "min-h-[120px] w-full rounded-3xl border border-uzazi-earth/10 bg-white px-4 py-3 text-sm text-uzazi-earth shadow-sm transition-colors placeholder:text-uzazi-earth/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uzazi-rose/30 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
