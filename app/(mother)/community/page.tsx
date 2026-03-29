"use client";

import { CommunityFeed } from "@/components/community/CommunityFeed";
import { PageHeader } from "@/components/shared/page-header";
import { useLocale } from "@/providers/LanguageProvider";

export default function CommunityPage() {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <PageHeader
        badge="Jamii Community"
        title={t("feed_title")}
        description="A safe, anonymous space where Kenyan mothers share strength, ask questions, and celebrate milestones together. You are never walking this path alone."
      />
      
      <CommunityFeed />
    </div>
  );
}
