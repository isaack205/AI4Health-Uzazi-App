"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  doc,
  updateDoc,
  runTransaction,
} from "firebase/firestore";
import { Plus, Globe } from "lucide-react";

import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LanguageProvider";
import { PostCard } from "./PostCard";
import { NewPostSheet } from "./NewPostSheet";
import { SafetyCard } from "./SafetyCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles as SparklesIcon } from "lucide-react";
import {
  COMMUNITY_LOCAL_POSTS_KEY,
  mockCommunityPosts,
  normalizeCommunityPost,
  sortCommunityPosts,
  type CommunityPost,
} from "@/lib/community/mock-posts";
import { useToast } from "@/providers/ToastProvider";

export function CommunityFeed() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const { toast } = useToast();
  
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewPostOpen, setIsAddOpen] = useState(false);
  const [filterLanguage, setFilterLanguage] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const existing = window.localStorage.getItem(COMMUNITY_LOCAL_POSTS_KEY);
      if (!existing) {
        window.localStorage.setItem(COMMUNITY_LOCAL_POSTS_KEY, JSON.stringify(mockCommunityPosts));
      }
    }
  }, []);

  useEffect(() => {
    const readLocalPosts = () => {
      if (typeof window === "undefined") {
        return mockCommunityPosts;
      }

      const raw = window.localStorage.getItem(COMMUNITY_LOCAL_POSTS_KEY);
      if (!raw) {
        return mockCommunityPosts;
      }

      try {
        return sortCommunityPosts((JSON.parse(raw) as CommunityPost[]).map(normalizeCommunityPost));
      } catch {
        return mockCommunityPosts;
      }
    };

    const applyPosts = (incoming: CommunityPost[]) => {
      const visible = incoming.filter((post) => {
        if (post.status === "deleted") {
          return false;
        }
        if (post.status === "held") {
          return post.userId === user?.uid;
        }
        if (filterLanguage) {
          return post.locale === locale;
        }
        return true;
      });
      setPosts(sortCommunityPosts(visible));
      setLoading(false);
    };

    const postsRef = collection(db, "posts");

    const baseQuery = query(
      postsRef,
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const filteredQuery = query(
      postsRef,
      where("locale", "==", locale),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const activeQuery = filterLanguage ? filteredQuery : baseQuery;
    const unsubscribe = onSnapshot(
      activeQuery,
      (snapshot) => {
        const remotePosts = snapshot.docs.map((item) => normalizeCommunityPost({ id: item.id, ...(item.data() as Partial<CommunityPost>) }));
        const localPosts = readLocalPosts();
        const merged = [...localPosts];

        remotePosts.forEach((post) => {
          const index = merged.findIndex((entry) => entry.id === post.id);
          if (index >= 0) {
            merged[index] = post;
          } else {
            merged.push(post);
          }
        });

        setFeedError(null);
        applyPosts(merged);
      },
      (error) => {
        console.error(error);
        setFeedError("Community sync is warming up, so local posts are shown for now.");
        applyPosts(readLocalPosts());
      },
    );

    return () => unsubscribe();
  }, [locale, filterLanguage, user?.uid]);

  const persistLocalPosts = (updater: (current: CommunityPost[]) => CommunityPost[]) => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(COMMUNITY_LOCAL_POSTS_KEY);
    const current = raw ? ((JSON.parse(raw) as CommunityPost[]).map(normalizeCommunityPost)) : [...mockCommunityPosts];
    const next = sortCommunityPosts(updater(current));
    window.localStorage.setItem(COMMUNITY_LOCAL_POSTS_KEY, JSON.stringify(next));
    const visible = next.filter((post) => {
      if (post.status === "deleted") return false;
      if (post.status === "held") return post.userId === user?.uid;
      return filterLanguage ? post.locale === locale : true;
    });
    setPosts(visible);
  };

  const handleReact = async (postId: string, reactionType: string) => {
    if (!user?.uid) return;

    try {
      const postRef = doc(db, "posts", postId);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(postRef);
        if (!snapshot.exists()) {
          throw new Error("Post not found");
        }

        const post = normalizeCommunityPost({ id: snapshot.id, ...(snapshot.data() as Partial<CommunityPost>) });
        const previousReaction = post.userReactions?.[user.uid];
        const nextReactions = { ...post.reactions };
        const nextUserReactions = { ...(post.userReactions ?? {}) };

        if (previousReaction === reactionType) {
          nextReactions[reactionType as keyof typeof nextReactions] = Math.max(
            0,
            nextReactions[reactionType as keyof typeof nextReactions] - 1,
          );
          delete nextUserReactions[user.uid];
        } else {
          if (previousReaction) {
            nextReactions[previousReaction as keyof typeof nextReactions] = Math.max(
              0,
              nextReactions[previousReaction as keyof typeof nextReactions] - 1,
            );
          }
          nextReactions[reactionType as keyof typeof nextReactions] += 1;
          nextUserReactions[user.uid] = reactionType;
        }

        transaction.update(postRef, {
          reactions: nextReactions,
          userReactions: nextUserReactions,
          updatedAt: new Date().toISOString(),
        });
      });
    } catch (err) {
      console.error(err);
      persistLocalPosts((current) =>
        current.map((post) => {
          if (post.id !== postId) return post;
          const previousReaction = post.userReactions?.[user.uid];
          const nextReactions = { ...post.reactions };
          const nextUserReactions = { ...(post.userReactions ?? {}) };

          if (previousReaction === reactionType) {
            nextReactions[reactionType as keyof typeof nextReactions] = Math.max(
              0,
              nextReactions[reactionType as keyof typeof nextReactions] - 1,
            );
            delete nextUserReactions[user.uid];
          } else {
            if (previousReaction) {
              nextReactions[previousReaction as keyof typeof nextReactions] = Math.max(
                0,
                nextReactions[previousReaction as keyof typeof nextReactions] - 1,
              );
            }
            nextReactions[reactionType as keyof typeof nextReactions] += 1;
            nextUserReactions[user.uid] = reactionType;
          }

          return normalizeCommunityPost({
            ...post,
            reactions: nextReactions,
            userReactions: nextUserReactions,
            updatedAt: new Date().toISOString(),
          });
        }),
      );
    }
  };

  const handleReport = async (postId: string) => {
    if (!user?.uid) return;

    try {
      const postRef = doc(db, "posts", postId);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(postRef);
        if (!snapshot.exists()) {
          throw new Error("Post not found");
        }

        const post = normalizeCommunityPost({ id: snapshot.id, ...(snapshot.data() as Partial<CommunityPost>) });
        const reportedBy = Array.from(new Set([...(post.reportedBy ?? []), user.uid]));
        transaction.update(postRef, {
          reportedBy,
          reportCount: reportedBy.length,
          updatedAt: new Date().toISOString(),
        });
      });
      toast({ title: "Post reported", description: "Thanks. We’ll review it quietly." });
    } catch (error) {
      console.error(error);
      persistLocalPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? normalizeCommunityPost({
                ...post,
                reportedBy: Array.from(new Set([...(post.reportedBy ?? []), user.uid])),
                reportCount: Array.from(new Set([...(post.reportedBy ?? []), user.uid])).length,
                updatedAt: new Date().toISOString(),
              })
            : post,
        ),
      );
      toast({ title: "Reported locally", description: "The report was saved on this device." });
    }
  };

  const handleDelete = async (postId: string) => {
    if (!user?.uid) return;

    try {
      await updateDoc(doc(db, "posts", postId), {
        status: "deleted",
        updatedAt: new Date().toISOString(),
      });
      toast({ title: "Post removed" });
    } catch (error) {
      console.error(error);
      persistLocalPosts((current) =>
        current.map((post) =>
          post.id === postId && post.userId === user.uid
            ? normalizeCommunityPost({ ...post, status: "deleted", updatedAt: new Date().toISOString() })
            : post,
        ),
      );
      toast({ title: "Removed locally", description: "This post is hidden on this device." });
    }
  };

  const handleReply = (postId: string) => {
    const selectedPost = posts.find((post) => post.id === postId);
    toast({
      title: "Replies are warming up",
      description: selectedPost
        ? `Mothers can already see this post in the shared feed. Threaded replies are next.`
        : "Threaded replies are the next step for Jamii.",
    });
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Feed Controls */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-uzazi-cream/80 backdrop-blur-md py-2 -mx-1 px-1">
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilterLanguage(!filterLanguage)}
            className={cn(
              "rounded-full text-xs font-bold gap-2 transition-all",
              filterLanguage ? "bg-uzazi-rose text-white" : "bg-white text-uzazi-earth/40"
            )}
          >
            <Globe size={14} />
            {filterLanguage ? "My Language Only" : "All Languages"}
          </Button>
        </div>
        
        <Button 
          onClick={() => setIsAddOpen(true)}
          className="rounded-full shadow-bloom h-10 px-5 gap-2 font-bold"
        >
          <Plus size={18} />
          {t("new_post_btn")}
        </Button>
      </div>

      {/* Pulse Banner (Anonymized Sentiment) */}
      <Card className="bg-uzazi-petal/40 border-uzazi-blush/20 rounded-[28px] border-dashed">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-uzazi-rose">
            <SparklesIcon size={16} />
          </div>
          <p className="text-xs font-medium text-uzazi-earth/70">
            Many mothers in Jamii are talking about <span className="font-bold text-uzazi-rose">nutrition</span> this week. You&apos;re not alone.
          </p>
        </CardContent>
      </Card>

      {feedError ? (
        <Card className="border-amber-200 bg-amber-50/80">
          <CardContent className="p-4 text-sm text-amber-800">{feedError}</CardContent>
        </Card>
      ) : null}

      {/* Main Feed */}
      <div className="grid gap-6">
        {loading ? (
          // Skeleton Loaders
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-[32px] bg-white/50 animate-pulse border border-white" />
          ))
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-uzazi-earth/40 italic">The community is quiet right now. Be the first to share.</p>
          </div>
        ) : (
          posts.map((post, idx) => (
            <div key={post.id} className="space-y-6">
              <PostCard
                post={post}
                onReact={handleReact}
                onReply={handleReply}
                onReport={handleReport}
                onDelete={handleDelete}
                currentUserId={user?.uid}
              />
              
              {/* Insert safety card or ads every few posts */}
              {idx === 1 && <SafetyCard />}
            </div>
          ))
        )}
      </div>

      <NewPostSheet 
        open={isNewPostOpen} 
        onOpenChange={setIsAddOpen} 
        onSuccess={() => {
          setFeedError(null);
        }} 
      />
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
