export function getSymptomChips(symptoms: Record<string, boolean | string | number>, t: (key: string) => string) {
  const chips: { label: string; severity: "danger" | "warning" | "normal" }[] = [];

  if (symptoms.fever) chips.push({ label: t("symptom.fever"), severity: "danger" });
  
  if (symptoms.bleeding === "heavy") chips.push({ label: t("symptom.bleedingHeavy"), severity: "danger" });
  else if (symptoms.bleeding === "moderate") chips.push({ label: t("symptom.bleedingModerate"), severity: "warning" });
  else if (symptoms.bleeding === "light") chips.push({ label: t("symptom.bleedingLight"), severity: "normal" });

  if (symptoms.swelling) chips.push({ label: t("symptom.swelling"), severity: "danger" });
  if (symptoms.woundDischarge) chips.push({ label: t("symptom.woundDischarge"), severity: "danger" });
  
  if (symptoms.woundPain === "severe") chips.push({ label: t("symptom.woundPainSevere"), severity: "danger" });
  else if (symptoms.woundPain === "mild") chips.push({ label: t("symptom.woundPainMild"), severity: "warning" });

  if (symptoms.anxiety === "severe") chips.push({ label: t("symptom.anxietySevere"), severity: "danger" });
  else if (symptoms.anxiety === "mild") chips.push({ label: t("symptom.anxietyMild"), severity: "warning" });

  if (symptoms.moodScore !== undefined) {
    const score = Number(symptoms.moodScore);
    if (score <= 2) chips.push({ label: t("symptom.moodLow"), severity: "warning" });
  }

  if (symptoms.breastfeedingPain) chips.push({ label: t("symptom.breastfeedingPain"), severity: "warning" });
  if (symptoms.babyUrgent) chips.push({ label: t("symptom.babyUrgent"), severity: "danger" });

  return chips;
}
