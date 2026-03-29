"use client";

import { useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useAppointments } from "@/lib/hooks/use-appointments";
import { useToast } from "@/providers/ToastProvider";
import { useLocale } from "@/providers/LanguageProvider";
import { AppShell } from "@/components/shared/app-shell";

export default function MotherLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const { data: appointments = [] } = useAppointments(user?.uid);

  useEffect(() => {
    if (!user?.uid || appointments.length === 0) return;

    const today = new Date().toISOString().split("T")[0];
    const todaysApts = appointments.filter(a => a.date === today && a.status === "upcoming" && !a.reminded);

    if (todaysApts.length > 0) {
      todaysApts.forEach(apt => {
        toast({
          title: t("appointment.today"),
          description: apt.title,
        });
        // Note: In a real app, we'd mark 'reminded: true' in DB here to avoid multiple toasts per session
      });
    }
  }, [user?.uid, appointments, t, toast]);

  return <AppShell role="mother">{children}</AppShell>;
}
