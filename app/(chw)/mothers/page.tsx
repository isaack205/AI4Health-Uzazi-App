import { MothersTable } from "@/components/chw/mothers-table";
import { AppShell } from "@/components/shared/app-shell";
import { PageHeader } from "@/components/shared/page-header";

export default function MothersPage() {
  return (
    <AppShell role="chw">
      <PageHeader
        badge="Mother Registry"
        title="A quick operating view of mothers, risk tiers, and follow-up context."
        description="This registry is tuned for practical case review: who is assigned, where they are, what day they are on, and whether their signal is shifting."
      />
      <MothersTable />
    </AppShell>
  );
}
