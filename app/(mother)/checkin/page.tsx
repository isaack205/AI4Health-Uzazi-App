import { CheckInForm } from "@/components/mother/checkin-form";
import { PageHeader } from "@/components/shared/page-header";

export default function CheckInPage() {
  return (
    <>
      <PageHeader
        badge="Daily Check-In"
        title="Turn today&apos;s feelings into a signal your care team can act on."
        description="This flow balances emotional honesty with clinical usefulness, so mothers are heard without needing to narrate everything twice."
      />
      <CheckInForm />
    </>
  );
}
