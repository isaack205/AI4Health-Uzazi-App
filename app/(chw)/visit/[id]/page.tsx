import { VisitSummary } from "@/components/chw/visit-summary";
import { AppShell } from "@/components/shared/app-shell";
import { PageHeader } from "@/components/shared/page-header";

export default async function VisitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <AppShell role="chw">
      <PageHeader
        badge="Visit Summary"
        title="Context before contact, so intervention starts from understanding."
        description="This page condenses the latest mood, body, and support signals into an outreach-ready note for CHWs in the field."
      />
      <VisitSummary visitId={id} />
    </AppShell>
  );
}
