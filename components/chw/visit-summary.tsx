import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function VisitSummary({ visitId }: { visitId: string }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <Card className="bg-white/90">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-uzazi-earth/45">Visit ID</p>
              <CardTitle className="mt-2 text-uzazi-earth">{visitId}</CardTitle>
            </div>
            <Badge>High attention</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-[24px] bg-uzazi-petal/60 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-uzazi-earth/45">AI summary</p>
            <p className="mt-3 text-sm leading-7 text-uzazi-earth/80">
              Recent check-ins indicate disrupted sleep, rising anxiety, and dizziness. Escalate to a same-day call,
              confirm bleeding status, hydration, and available household support, then determine whether a facility
              referral is required.
            </p>
          </div>

          <div className="space-y-4">
            {[
              "Mood moved from neutral to negative over the past 3 entries.",
              "Pain and dizziness keywords appeared twice in the last 24 hours.",
              "Companion chat suggests feelings of isolation during night feeds.",
            ].map((item) => (
              <div key={item} className="rounded-[22px] border border-uzazi-earth/8 bg-white p-4 text-sm leading-7 text-uzazi-earth/75">
                {item}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle className="text-uzazi-earth">Suggested outreach flow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            ["1", "Call within 15 minutes and assess dizziness, bleeding, fever, and food intake."],
            ["2", "Offer practical support prompts for the household and identify an immediate helper."],
            ["3", "If red-flag symptoms persist, direct facility review and document referral."],
          ].map(([step, detail]) => (
            <div key={step} className="flex gap-4 rounded-[24px] border border-uzazi-petal bg-uzazi-cream/70 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-uzazi-rose text-sm font-semibold text-white">
                {step}
              </div>
              <p className="text-sm leading-7 text-uzazi-earth/80">{detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
