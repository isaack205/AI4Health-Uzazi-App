import { TriageBoard } from "@/components/chw/triage-board";
import { AppShell } from "@/components/shared/app-shell";
import { PageHeader } from "@/components/shared/page-header";

export default function TriagePage() {
  return (
    <AppShell role="chw">
      <PageHeader
        badge="CHW Triage"
        title="See who needs contact now, why they were flagged, and what to do next."
        description="Designed for speed under field conditions, with AI summaries translating mother input into clear outreach priorities."
      />
      <TriageBoard />
    </AppShell>
  );
}
