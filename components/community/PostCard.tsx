"use client";

import { useState } from "react";
import { 
  MessageCircle, 
  HelpCircle, 
  Sparkles, 
  MoreHorizontal, 
  Flag, 
  Trash2, 
  Volume2
} from "lucide-react";

import { useLocale } from "@/providers/LanguageProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReactionBar } from "./ReactionBar";
import { cn } from "@/lib/utils";
import { generateAvatarSVG } from "@/lib/services/community-identity";

function getTimeAgo(date: string) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

interface PostCardProps {
  post: {
    id: string;
    userId: string;
    anonymousName: string;
    avatarSeed: string;
    postType: "text" | "voice" | "question" | "milestone";
    topicTag: string;
    content: string;
    replyCount: number;
    createdAt: string;
    reactions: any;
    locale: string;
    transcription?: string;
    userReactions?: Record<string, string>;
  };
  onReact: (postId: string, type: string) => void;
  onReply?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onReport?: (postId: string) => void;
  currentUserId?: string;
}

export function PostCard({ post, onReact, onReply, onDelete, onReport, currentUserId }: PostCardProps) {
  const { t, locale: currentLocale } = useLocale();
  const [showFull, setShowFull] = useState(false);
  const avatarUrl = generateAvatarSVG(post.avatarSeed);

  const isQuestion = post.postType === "question";
  const isMilestone = post.postType === "milestone";
  const isVoice = post.postType === "voice";
  const isMine = currentUserId === post.userId;
  const userReaction = currentUserId ? post.userReactions?.[currentUserId] ?? null : null;

  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <Card className={cn(
      "overflow-hidden border-white/80 shadow-soft transition-all rounded-[32px]",
      isMilestone ? "bg-gradient-to-br from-white to-uzazi-petal/40 border-uzazi-blush/20" : "bg-white/90"
    )}>
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl overflow-hidden border border-uzazi-earth/5">
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-uzazi-earth">{post.anonymousName}</p>
                {post.locale !== currentLocale && (
                  <span className="text-[10px] opacity-40">🌐</span>
                )}
              </div>
              <p className="text-[10px] uppercase font-bold tracking-wider text-uzazi-earth/30">
                {timeAgo}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="muted" className="bg-uzazi-cream/50 border-uzazi-earth/5 text-uzazi-earth/60 font-bold rounded-xl px-3 py-1">
              {t(`tag.${post.topicTag}`)}
            </Badge>
            <button className="p-2 text-uzazi-earth/20 hover:text-uzazi-earth transition-colors">
              <MoreHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {isQuestion && (
            <div className="flex items-center gap-2 text-uzazi-rose mb-1">
              <HelpCircle size={16} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">{t("question_placeholder")}</span>
            </div>
          )}
          
          {isMilestone && (
            <div className="flex items-center gap-2 text-uzazi-leaf mb-1">
              <Sparkles size={16} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">{t("milestone_title")}</span>
            </div>
          )}

          <div className={cn(
            "text-uzazi-earth/80 leading-relaxed text-[15px]",
            !showFull && "line-clamp-3"
          )}>
            {post.content}
          </div>
          
          {post.content.length > 150 && (
            <button 
              onClick={() => setShowFull(!showFull)}
              className="text-xs font-bold text-uzazi-rose hover:underline"
            >
              {showFull ? "Show less" : "Read more"}
            </button>
          )}

          {isVoice && (
            <div className="bg-uzazi-midnight rounded-3xl p-4 flex items-center gap-4 border border-white/5">
              <div className="h-10 w-10 rounded-full bg-uzazi-rose flex items-center justify-center text-white cursor-pointer hover:scale-105 transition-transform">
                <Volume2 size={20} />
              </div>
              <div className="flex-1 flex items-center gap-1 h-8 opacity-40">
                {/* Visual Placeholder for Waveform */}
                {Array.from({ length: 24 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-white rounded-full" 
                    style={{ height: `${20 + Math.random() * 80}%` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reactions & Interaction */}
        <div className="space-y-4 pt-2">
          <ReactionBar 
            reactions={post.reactions} 
            onReact={(type) => onReact(post.id, type)}
            userReaction={userReaction}
          />
          
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => onReply?.(post.id)}
              className="flex items-center gap-2 text-xs font-bold text-uzazi-earth/40 hover:text-uzazi-rose transition-colors"
            >
              <MessageCircle size={16} />
              <span>{post.replyCount} {t("reply_btn")}</span>
            </button>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => onReport?.(post.id)}
                className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-uzazi-earth/20 hover:text-rose-500 transition-colors"
              >
                <Flag size={12} />
                {t("report_btn")}
              </button>
              {isMine ? (
                <button
                  onClick={() => onDelete?.(post.id)}
                  className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-uzazi-earth/20 hover:text-uzazi-rose transition-colors"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
