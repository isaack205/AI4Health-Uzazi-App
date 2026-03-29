"use client";

export function RiskBadge({ riskLevel, t }: { riskLevel: "low" | "medium" | "high" | "critical", t: (key: string) => string }) {
  const styles = {
    low: "bg-uzazi-sage text-white shadow-sm",
    medium: "bg-uzazi-amber text-white shadow-sm",
    high: "bg-uzazi-terracotta text-white shadow-sm",
    critical: "bg-uzazi-rose text-white shadow-sm animate-pulse", // Red/rose logic based on design system
  };

  const labels = {
    low: t("result.low"),
    medium: t("result.medium"),
    high: t("result.high"),
    critical: t("result.critical"),
  };

  return (
    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wider ${styles[riskLevel]}`}>
      {labels[riskLevel]}
    </span>
  );
}
