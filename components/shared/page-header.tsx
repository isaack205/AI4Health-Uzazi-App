import { Badge } from "@/components/ui/badge";

export function PageHeader({
  badge,
  title,
  description,
}: {
  badge: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-4">
      <Badge className="w-fit">{badge}</Badge>
      <div className="space-y-2">
        <h1 className="text-display text-4xl text-uzazi-earth md:text-5xl">{title}</h1>
        <p className="max-w-2xl text-base leading-7 text-uzazi-earth/75">{description}</p>
      </div>
    </div>
  );
}
