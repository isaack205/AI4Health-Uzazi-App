"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Calendar as CalendarIcon, Clock, CheckCircle2, ChevronRight, Heart, Baby, Users, Sparkles, MapPin, Trash2, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddAppointmentDialog } from "@/components/mother/add-appointment-dialog";
import { useAppointments, useUpdateAppointment, useDeleteAppointment, useAddAppointment } from "@/lib/hooks/use-appointments";
import { cn } from "@/lib/utils";
import type { Appointment, Mother } from "@/lib/types";
import { useToast } from "@/providers/ToastProvider";

export default function AppointmentPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { toast } = useToast();
  
  const { data: appointments = [], isLoading } = useAppointments(user?.uid);
  const updateMutation = useUpdateAppointment();
  const deleteMutation = useDeleteAppointment();
  const addMutation = useAddAppointment();
  
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleComplete = async (id: string) => {
    await updateMutation.mutateAsync({ id, status: "completed" });
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    toast({ title: "Appointment removed" });
  };

  const handleSuggestMilestones = async () => {
    if (!user?.uid) return;
    
    // Suggest 6 week checkup
    const dob = (user as Mother).babyDateOfBirth;
    if (!dob) {
      toast({ title: "Please add baby's birth date in profile first", variant: "destructive" });
      return;
    }

    const birthDate = new Date(dob);
    const milestones = [
      { weeks: 6, title: "6 Week Mother & Baby Checkup", type: "mother_checkup" as const },
      { weeks: 10, title: "10 Week Immunizations", type: "baby_shot" as const },
      { weeks: 14, title: "14 Week Immunizations", type: "baby_shot" as const },
    ];

    try {
      for (const m of milestones) {
        const date = new Date(birthDate);
        date.setDate(date.getDate() + (m.weeks * 7));
        
        await addMutation.mutateAsync({
          userId: user.uid,
          title: m.title,
          type: m.type,
          date: date.toISOString().split("T")[0],
          status: "upcoming",
          reminded: false,
        });
      }
      toast({ title: "Standard milestones added to your timeline!" });
    } catch (err) {
      console.error(err);
    }
  };

  const nextAppointment = useMemo(() => {
    return appointments.find(a => a.status === "upcoming" && new Date(a.date) >= new Date(new Date().setHours(0,0,0,0)));
  }, [appointments]);

  const getDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().setHours(0,0,0,0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const typeIcons: Record<string, any> = {
    mother_checkup: Heart,
    baby_shot: Baby,
    chw_visit: Users,
    wellness: Sparkles,
    other: CalendarIcon
  };

  return (
    <div className="min-h-screen bg-uzazi-cream pb-32">
      <header className="bg-white/50 border-b border-uzazi-earth/5 px-6 py-8 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-uzazi-earth">{t("appointment.title")}</h1>
            <p className="mt-1 text-uzazi-earth/60 font-medium">{t("appointment.subtitle")}</p>
          </div>
          <Button 
            onClick={() => setIsAddOpen(true)}
            className="rounded-full h-12 w-12 p-0 shadow-bloom"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-8 max-w-2xl mx-auto">
        {/* Hero Alert / Next Appointment */}
        {nextAppointment ? (
          <Card className="bg-gradient-to-br from-uzazi-rose to-rose-400 text-white border-none shadow-bloom rounded-[32px] overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
              <CalendarIcon size={120} />
            </div>
            <CardContent className="p-8 relative z-10">
              <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">{t("appointment.next")}</span>
              <h2 className="text-3xl font-bold mt-2">{nextAppointment.title}</h2>
              <div className="flex items-center gap-4 mt-6">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium">
                  <CalendarIcon className="h-4 w-4" />
                  {new Date(nextAppointment.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
                {nextAppointment.time && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    {nextAppointment.time}
                  </div>
                )}
              </div>
              <div className="mt-8 flex items-center justify-between">
                <p className="text-lg font-medium">
                  {getDaysLeft(nextAppointment.date) === 0 
                    ? t("appointment.today") 
                    : t("appointment.daysLeft").replace("{{days}}", String(getDaysLeft(nextAppointment.date)))}
                </p>
                <Button 
                  variant="secondary" 
                  className="rounded-full bg-white text-uzazi-rose hover:bg-white/90"
                  onClick={() => handleComplete(nextAppointment.id)}
                >
                  {t("appointment.completed")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Timeline View */}
        <div className="space-y-6 relative">
          {/* The Vine/Line */}
          <div className="absolute left-7 top-4 bottom-4 w-0.5 bg-uzazi-rose/10" />

          {appointments.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in duration-700">
              <div className="h-24 w-24 rounded-full bg-uzazi-petal flex items-center justify-center text-uzazi-rose/40">
                <CalendarIcon size={40} />
              </div>
              <p className="text-uzazi-earth/50 max-w-[240px] leading-relaxed italic">{t("appointment.empty")}</p>
              
              <div className="flex flex-col gap-3">
                <Button variant="outline" onClick={() => setIsAddOpen(true)} className="rounded-full border-uzazi-rose/20 text-uzazi-rose">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("appointment.add")}
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={handleSuggestMilestones} 
                  className="text-xs font-semibold text-uzazi-earth/40 hover:text-uzazi-rose hover:bg-uzazi-rose/5"
                >
                  <Wand2 className="mr-2 h-3 w-3" />
                  Suggest standard milestones
                </Button>
              </div>
            </div>
          )}

          {appointments.map((apt, idx) => {
            const Icon = typeIcons[apt.type] || CalendarIcon;
            const isPast = new Date(apt.date) < new Date(new Date().setHours(0,0,0,0));
            const isCompleted = apt.status === "completed";
            
            return (
              <div key={apt.id} className="relative pl-16 group">
                {/* Node */}
                <div className={cn(
                  "absolute left-4 top-1 h-6 w-6 rounded-full border-4 transition-all duration-500 z-10",
                  isCompleted ? "bg-uzazi-rose border-uzazi-petal scale-110" : 
                  isPast ? "bg-uzazi-earth/20 border-white" :
                  "bg-white border-uzazi-rose"
                )}>
                  {isCompleted && <div className="absolute inset-0 bg-uzazi-rose rounded-full animate-ping opacity-20" />}
                </div>

                <Card className={cn(
                  "bg-white border-white shadow-soft transition-all rounded-[28px] overflow-hidden",
                  isCompleted ? "opacity-60 grayscale-[0.5]" : "hover:shadow-bloom hover:-translate-y-1"
                )}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                        isCompleted ? "bg-uzazi-earth/5 text-uzazi-earth/40" : "bg-uzazi-petal text-uzazi-rose"
                      )}>
                        <Icon size={24} />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-uzazi-earth truncate">{apt.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs font-semibold text-uzazi-earth/40 uppercase tracking-wider">
                          <span>{new Date(apt.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          {apt.time && (
                            <>
                              <span className="h-1 w-1 rounded-full bg-uzazi-earth/20" />
                              <span>{apt.time}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!isCompleted && (
                        <button 
                          onClick={() => handleComplete(apt.id)}
                          className="h-10 w-10 rounded-full border border-uzazi-earth/10 flex items-center justify-center text-uzazi-earth/20 hover:text-uzazi-rose hover:border-uzazi-rose transition-colors"
                          aria-label={t("appointment.completed")}
                        >
                          <CheckCircle2 size={20} />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleDelete(apt.id)}
                        className="h-10 w-10 rounded-full flex items-center justify-center text-uzazi-earth/10 hover:text-rose-500 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </main>

      <AddAppointmentDialog 
        open={isAddOpen} 
        onOpenChange={setIsAddOpen} 
      />
    </div>
  );
}
