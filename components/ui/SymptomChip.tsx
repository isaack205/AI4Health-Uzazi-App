"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export function SymptomChip({ label, severity }: { label: string, severity: "danger" | "warning" | "normal" }) {
  const styles = {
    danger: "bg-uzazi-rose/10 text-uzazi-rose border border-uzazi-rose/20",
    warning: "bg-uzazi-amber/10 text-uzazi-amber border border-uzazi-amber/20",
    normal: "bg-uzazi-sage/10 text-uzazi-sage border border-uzazi-sage/20",
  };

  const Icon = severity === "danger" ? XCircle : severity === "warning" ? AlertTriangle : CheckCircle2;

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${styles[severity]}`}>
      <Icon className="h-4 w-4" />
      {label}
    </div>
  );
}