"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Calendar as CalendarIcon, Clock, MessageSquare, Heart, Baby, Users, Sparkles } from "lucide-react";

import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAddAppointment } from "@/lib/hooks/use-appointments";
import { useToast } from "@/providers/ToastProvider";
import type { AppointmentType } from "@/lib/types";

export function AddAppointmentDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess?: () => void }) {
  const { user } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  const addMutation = useAddAppointment();
  
  const [formData, setFormData] = useState({
    title: "",
    type: "mother_checkup" as AppointmentType,
    date: "",
    time: ""
  });

  const types = [
    { value: "mother_checkup", label: t("appointment.type.mother"), icon: Heart },
    { value: "baby_shot", label: t("appointment.type.baby"), icon: Baby },
    { value: "chw_visit", label: t("appointment.type.chw"), icon: Users },
    { value: "wellness", label: t("appointment.type.wellness"), icon: Sparkles },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !formData.title || !formData.date) return;

    try {
      await addMutation.mutateAsync({
        userId: user.uid,
        title: formData.title,
        type: formData.type,
        date: formData.date,
        time: formData.time,
        status: "upcoming",
        reminded: false,
      });
      
      toast({ title: t("success_saved") });
      onSuccess?.();
      onOpenChange(false);
      setFormData({ title: "", type: "mother_checkup", date: "", time: "" });
    } catch (err) {
      console.error(err);
      toast({ title: "Error saving appointment", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[32px] border-uzazi-petal bg-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-uzazi-earth font-display">{t("appointment.form.title")}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-uzazi-earth/60">{t("appointment.form.label")}</p>
            <div className="grid grid-cols-2 gap-2">
              {types.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: type.value as AppointmentType }))}
                    className={`flex items-center gap-2 p-3 rounded-2xl border text-xs font-medium transition-all ${
                      isSelected 
                        ? "border-uzazi-rose bg-uzazi-petal text-uzazi-rose shadow-sm" 
                        : "border-uzazi-earth/10 bg-white text-uzazi-earth/60 hover:border-uzazi-blush"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-uzazi-earth">{t("full_name")} / Title</label>
            <Input 
              value={formData.title} 
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. 6 Week Checkup"
              className="rounded-2xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-uzazi-earth">{t("appointment.form.date")}</label>
              <Input 
                type="date" 
                value={formData.date} 
                onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="rounded-2xl"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-uzazi-earth">{t("appointment.form.time")}</label>
              <Input 
                type="time" 
                value={formData.time} 
                onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                className="rounded-2xl"
              />
            </div>
          </div>

          <Button type="submit" disabled={addMutation.isPending} className="w-full h-12 rounded-full shadow-bloom">
            {addMutation.isPending ? "Saving..." : t("save_btn")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
