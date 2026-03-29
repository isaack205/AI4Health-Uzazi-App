"use client";

import { useLocale } from "@/providers/LanguageProvider";
import { cn } from "@/lib/utils";

interface ReactionBarProps {
  reactions: {
    feel_this: number;
    you_got_this: number;
    strength: number;
    thank_you: number;
  };
  onReact: (type: string) => void;
  userReaction?: string | null;
}

export function ReactionBar({ reactions, onReact, userReaction }: ReactionBarProps) {
  const { t } = useLocale();

  const formatCount = (count: number) => {
    if (count === 0) return null;
    if (count < 5) return t("reactions_few");
    if (count < 15) return t("reactions_several");
    return t("reactions_many");
  };

  const reactionTypes = [
    { key: "feel_this", emoji: "🤱", label: t("reaction_feel_this") },
    { key: "you_got_this", emoji: "💪", label: t("reaction_you_got_this") },
    { key: "strength", emoji: "🌿", label: t("reaction_strength") },
    { key: "thank_you", emoji: "🙏", label: t("reaction_thank_you") },
  ];

  return (
    <div className="space-y-3 pt-4 border-t border-uzazi-earth/5">
      <div className="flex flex-wrap gap-2">
        {reactionTypes.map((type) => (
          <button
            key={type.key}
            onClick={() => onReact(type.key)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-medium border",
              userReaction === type.key
                ? "bg-uzazi-rose border-uzazi-rose text-white shadow-sm"
                : "bg-white border-uzazi-earth/10 text-uzazi-earth/60 hover:border-uzazi-blush hover:bg-uzazi-petal/30"
            )}
          >
            <span>{type.emoji}</span>
            <span>{type.label}</span>
          </button>
        ))}
      </div>
      
      {/* Aggregate Range Labels (approximate) */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] uppercase font-bold tracking-widest text-uzazi-earth/30 px-1">
        {reactionTypes.map((type) => {
          const count = (reactions as any)[type.key] || 0;
          const label = formatCount(count);
          if (!label) return null;
          return (
            <div key={type.key} className="flex items-center gap-1">
              <span>{type.emoji}</span>
              <span>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
