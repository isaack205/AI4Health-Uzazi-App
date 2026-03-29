"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";

export function ActionCard({ 
  icon: Icon, 
  title, 
  description, 
  onPress, 
  href,
  variant = "default"
}: { 
  icon: LucideIcon; 
  title: string; 
  description: string; 
  onPress?: () => void; 
  href?: string;
  variant?: "default" | "danger"
}) {
  const isDanger = variant === "danger";
  const content = (
    <div className={`flex items-start gap-4 p-4 rounded-[24px] border transition-all ${
      isDanger 
        ? "bg-uzazi-rose/5 border-uzazi-rose/30 hover:bg-uzazi-rose/10" 
        : "bg-white border-uzazi-earth/10 hover:border-uzazi-blush hover:shadow-soft"
    }`}>
      <div className={`p-3 rounded-2xl ${isDanger ? "bg-uzazi-rose text-white" : "bg-uzazi-petal text-uzazi-rose"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h4 className={`font-semibold ${isDanger ? "text-uzazi-rose" : "text-uzazi-earth"}`}>{title}</h4>
        <p className="mt-1 text-sm leading-6 text-uzazi-earth/70">{description}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-uzazi-blush rounded-[24px]">{content}</Link>;
  }

  if (onPress) {
    return (
      <button 
        onClick={onPress} 
        className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-uzazi-blush rounded-[24px]"
      >
        {content}
      </button>
    );
  }

  return content;
}