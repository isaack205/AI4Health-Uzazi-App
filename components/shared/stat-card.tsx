import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border-uzazi-petal bg-white/90">
      <CardContent className="space-y-2 p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-uzazi-earth/45">{label}</p>
        <p className="font-mono text-3xl text-uzazi-earth">{value}</p>
        <p className="text-sm text-uzazi-earth/70">{hint}</p>
      </CardContent>
    </Card>
  );
}
