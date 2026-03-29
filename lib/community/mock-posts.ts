export interface CommunityPost {
  id: string;
  userId: string;
  anonymousName: string;
  avatarSeed: string;
  postType: "text" | "voice" | "question" | "milestone";
  topicTag: string;
  content: string;
  replyCount: number;
  createdAt: string;
  updatedAt?: string;
  reactions: {
    feel_this: number;
    you_got_this: number;
    strength: number;
    thank_you: number;
  };
  locale: string;
  status: "published" | "held" | "deleted";
  userReactions?: Record<string, string>;
  reportCount?: number;
  reportedBy?: string[];
}

export const COMMUNITY_LOCAL_POSTS_KEY = "uzazi-community-posts";

export const mockCommunityPosts: CommunityPost[] = [
  {
    id: "mock-post-1",
    userId: "mock-user-1",
    anonymousName: "Gentle River",
    avatarSeed: "mock-user-1",
    postType: "text",
    topicTag: "nutrition",
    content: "Today I finally ate a full warm meal before noon. It felt small, but it changed my whole mood.",
    replyCount: 4,
    createdAt: "2026-03-29T06:15:00.000Z",
    updatedAt: "2026-03-29T06:15:00.000Z",
    locale: "en",
    status: "published",
    reactions: { feel_this: 6, you_got_this: 8, strength: 3, thank_you: 2 },
  },
  {
    id: "mock-post-2",
    userId: "mock-user-2",
    anonymousName: "Brave Acacia",
    avatarSeed: "mock-user-2",
    postType: "question",
    topicTag: "sleep",
    content: "How are you handling cluster feeding nights without feeling like your body is disappearing?",
    replyCount: 7,
    createdAt: "2026-03-29T04:40:00.000Z",
    updatedAt: "2026-03-29T04:40:00.000Z",
    locale: "en",
    status: "published",
    reactions: { feel_this: 10, you_got_this: 5, strength: 4, thank_you: 1 },
  },
  {
    id: "mock-post-3",
    userId: "mock-user-3",
    anonymousName: "Radiant Bloom",
    avatarSeed: "mock-user-3",
    postType: "milestone",
    topicTag: "joy",
    content: "I laughed properly for the first time since delivery today. I had missed that version of me.",
    replyCount: 3,
    createdAt: "2026-03-28T18:00:00.000Z",
    updatedAt: "2026-03-28T18:00:00.000Z",
    locale: "sw",
    status: "published",
    reactions: { feel_this: 4, you_got_this: 9, strength: 2, thank_you: 5 },
  },
];

export function normalizeCommunityPost(input: Partial<CommunityPost> & { id: string }): CommunityPost {
  return {
    id: input.id,
    userId: input.userId ?? "unknown-user",
    anonymousName: input.anonymousName ?? "Quiet Bloom",
    avatarSeed: input.avatarSeed ?? input.userId ?? input.id,
    postType: input.postType ?? "text",
    topicTag: input.topicTag ?? "joy",
    content: input.content ?? "",
    replyCount: input.replyCount ?? 0,
    createdAt: input.createdAt ?? new Date().toISOString(),
    updatedAt: input.updatedAt ?? input.createdAt ?? new Date().toISOString(),
    locale: input.locale ?? "en",
    status: input.status ?? "published",
    reportCount: input.reportCount ?? 0,
    reportedBy: input.reportedBy ?? [],
    userReactions: input.userReactions ?? {},
    reactions: {
      feel_this: input.reactions?.feel_this ?? 0,
      you_got_this: input.reactions?.you_got_this ?? 0,
      strength: input.reactions?.strength ?? 0,
      thank_you: input.reactions?.thank_you ?? 0,
    },
  };
}

export function sortCommunityPosts(posts: CommunityPost[]) {
  return [...posts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

