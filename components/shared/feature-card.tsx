import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function FeatureCard({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <Card className="h-full border-white/80 bg-white/80">
      <CardHeader>
        <p className="badge-bloom w-fit">{eyebrow}</p>
        <CardTitle className="mt-4 text-uzazi-earth">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base leading-7 text-uzazi-earth/75">
          {description}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
