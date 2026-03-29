"use client";

import { useState } from "react";
import { 
  X, 
  Send, 
  Mic, 
  HelpCircle, 
  Sparkles, 
  Type, 
  ChevronDown,
  Info,
  Globe
} from "lucide-react";
import { collection, addDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/providers/ToastProvider";
import { generateDisplayName } from "@/lib/services/community-identity";
import { scanContent } from "@/lib/services/moderation";
import {
  COMMUNITY_LOCAL_POSTS_KEY,
  normalizeCommunityPost,
  sortCommunityPosts,
  type CommunityPost,
} from "@/lib/community/mock-posts";

const TOPIC_TAGS = [
  "breastfeeding", "sleep", "mental_health", "relationship", 
  "body_recovery", "baby_care", "nutrition", "faith_spirituality", 
  "single_mother", "joy", "grief", "csection_recovery"
];

export function NewPostSheet({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"text" | "question" | "milestone" | "voice">("text");
  const [content, setContent] = useState("");
  const [topic, setTopic] = useState("joy");
  const [postLocale, setPostLocale] = useState(locale);

  const persistLocalPost = (post: CommunityPost) => {
    if (typeof window === "undefined") {
      return;
    }

    const existing = window.localStorage.getItem(COMMUNITY_LOCAL_POSTS_KEY);
    const parsed = existing ? (JSON.parse(existing) as CommunityPost[]) : [];
    const next = sortCommunityPosts([normalizeCommunityPost(post), ...parsed]);
    window.localStorage.setItem(COMMUNITY_LOCAL_POSTS_KEY, JSON.stringify(next));
  };

  const handleSubmit = async () => {
    if (!user?.uid || !content.trim()) return;

    setLoading(true);
    
    // 1. Scan for moderation
    const scan = scanContent(content);
    const status = scan.isSafe ? "published" : "held";

    try {
      const anonymousName = generateDisplayName(user.uid);
      const timestamp = new Date().toISOString();
      const draftPost = normalizeCommunityPost({
        id: `local-${Date.now()}`,
        userId: user.uid,
        anonymousName,
        avatarSeed: user.uid,
        postType: type,
        topicTag: topic,
        content: content.trim(),
        locale: postLocale,
        status,
        replyCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        reactions: { feel_this: 0, you_got_this: 0, strength: 0, thank_you: 0 },
        userReactions: {},
        reportedBy: [],
        reportCount: 0,
      });

      await addDoc(collection(db, "posts"), {
        ...draftPost,
      });

      if (status === "held") {
        toast({ title: "Words submitted", description: t("post_held_message") });
      } else {
        toast({ title: t("success_sent") });
      }
      onSuccess();
      onOpenChange(false);
      setContent("");
    } catch (err) {
      console.error(err);
      const fallbackPost = normalizeCommunityPost({
        id: `local-${Date.now()}`,
        userId: user.uid,
        anonymousName: generateDisplayName(user.uid),
        avatarSeed: user.uid,
        postType: type,
        topicTag: topic,
        content: content.trim(),
        locale: postLocale,
        status: "published",
        replyCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reactions: { feel_this: 0, you_got_this: 0, strength: 0, thank_you: 0 },
        userReactions: {},
        reportedBy: [],
        reportCount: 0,
      });
      persistLocalPost(fallbackPost);
      toast({
        title: "Shared locally",
        description: "Your post was saved on this device while community sync catches up.",
      });
      onSuccess();
      onOpenChange(false);
      setContent("");
    } finally {
      setLoading(false);
    }
  };

  const types = [
    { id: "text", icon: Type, label: "Text" },
    { id: "question", icon: HelpCircle, label: "Question" },
    { id: "milestone", icon: Sparkles, label: "Milestone" },
    { id: "voice", icon: Mic, label: "Voice" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-uzazi-cream border-uzazi-blush/20 rounded-[40px] p-0 overflow-hidden">
        <div className="p-6 md:p-8 space-y-6">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-2xl font-display text-uzazi-earth">{t("new_post_btn")}</DialogTitle>
            <button onClick={() => onOpenChange(false)} className="p-2 rounded-full hover:bg-uzazi-petal/50">
              <X className="h-6 w-6 text-uzazi-earth/40" />
            </button>
          </DialogHeader>

          {/* Type Selector */}
          <div className="flex gap-2 p-1 bg-white/50 rounded-3xl border border-uzazi-earth/5 overflow-x-auto scrollbar-hide">
            {types.map((item) => {
              const Icon = item.icon;
              const active = type === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setType(item.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all text-sm font-bold whitespace-nowrap ${
                    active ? "bg-uzazi-rose text-white shadow-bloom" : "text-uzazi-earth/40 hover:text-uzazi-rose"
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="space-y-4 bg-white rounded-[32px] p-6 shadow-soft border border-white">
            {/* Topic & Locale Selectors */}
            <div className="flex flex-wrap gap-3">
              <div className="relative group">
                <select 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="appearance-none bg-uzazi-petal/30 border border-uzazi-blush/20 rounded-full px-4 py-2 pr-10 text-xs font-bold text-uzazi-rose focus:outline-none focus:ring-2 focus:ring-uzazi-rose/20"
                >
                  {TOPIC_TAGS.map(tag => (
                    <option key={tag} value={tag}>{t(`tag.${tag}`)}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-uzazi-rose/40" />
              </div>

              <div className="relative group">
                <select 
                  value={postLocale}
                  onChange={(e) => setPostLocale(e.target.value as any)}
                  className="appearance-none bg-uzazi-cream border border-uzazi-earth/10 rounded-full px-4 py-2 pr-10 text-xs font-bold text-uzazi-earth/60 focus:outline-none focus:ring-2 focus:ring-uzazi-rose/20"
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="sw">🇰🇪 Kiswahili</option>
                  <option value="ki">🇰🇪 Gĩkũyũ</option>
                </select>
                <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none text-uzazi-earth/20" />
              </div>
            </div>

            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={type === "question" ? t("question_placeholder") : t("post_placeholder")}
              className="min-h-[180px] border-none bg-transparent text-lg text-uzazi-earth placeholder:text-uzazi-earth/20 focus-visible:ring-0 resize-none p-0"
              maxLength={500}
            />
            
            <div className="flex items-center justify-between pt-4 border-t border-uzazi-earth/5">
              <div className="flex items-center gap-2 text-uzazi-earth/30">
                <Info size={14} />
                <span className="text-[10px] uppercase font-bold tracking-widest">Anonymously as {generateDisplayName(user?.uid || "")}</span>
              </div>
              <span className="text-xs font-mono text-uzazi-earth/20">{content.length}/500</span>
            </div>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={loading || !content.trim()}
            className="w-full h-16 rounded-[28px] text-lg font-bold shadow-bloom gap-3"
          >
            <Send size={20} />
            {t("new_post_btn")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
