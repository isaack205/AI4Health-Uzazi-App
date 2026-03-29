"use client";

import { useState } from "react";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  LogOut, 
  Globe, 
  ShieldAlert, 
  Flower2, 
  Flame, 
  Plus, 
  ChevronRight,
  Check
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/providers/ToastProvider";
import { AddAppointmentDialog } from "@/components/mother/add-appointment-dialog";
import type { Mother } from "@/lib/types";
import type { Locale } from "@/lib/i18n/translations";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const { toast } = useToast();
  
  const mother = user as Mother;
  const [isAddAptOpen, setIsAddAptOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async (updates: Partial<Mother>) => {
    if (!user?.uid) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "users", user.uid), updates);
      toast({ title: t("profile.update_success") });
    } catch (err) {
      console.error(err);
      toast({ title: "Error updating profile", variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  const languages = [
    { code: "en", label: "English" },
    { code: "sw", label: "Kiswahili" },
    { code: "ki", label: "Gĩkũyũ" },
  ];

  return (
    <div className="min-h-screen bg-uzazi-cream pb-32">
      <header className="bg-white/50 border-b border-uzazi-earth/5 px-6 py-10 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-uzazi-earth">{t("profile.title")}</h1>
            <p className="mt-1 text-uzazi-earth/60 font-medium">{t("profile.subtitle")}</p>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => void signOut()}
            className="rounded-full text-uzazi-earth/40 hover:text-rose-500 hover:bg-rose-50"
          >
            <LogOut className="h-5 w-5 mr-2" />
            {t("logout")}
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-6 max-w-2xl mx-auto mt-6">
        {/* User Hero */}
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-uzazi-rose to-uzazi-blush flex items-center justify-center text-white shadow-bloom relative">
            <User size={48} strokeWidth={1.5} />
            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white flex items-center justify-center text-uzazi-rose shadow-sm border-2 border-uzazi-petal">
              <Flower2 size={16} fill="currentColor" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-uzazi-earth">{user?.name}</h2>
            <p className="text-sm text-uzazi-earth/50 font-medium">
              {t("profile.member_since")} {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'March 2026'}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white border-white shadow-soft rounded-[28px] p-4 text-center">
            <div className="mx-auto h-10 w-10 rounded-2xl bg-uzazi-petal flex items-center justify-center text-uzazi-rose mb-2">
              <Flower2 size={20} />
            </div>
            <p className="text-2xl font-bold text-uzazi-earth">{mother?.gardenPetals ?? 0}</p>
            <p className="text-[10px] uppercase font-bold text-uzazi-earth/40 tracking-wider">Total Petals</p>
          </Card>
          <Card className="bg-white border-white shadow-soft rounded-[28px] p-4 text-center">
            <div className="mx-auto h-10 w-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 mb-2">
              <Flame size={20} />
            </div>
            <p className="text-2xl font-bold text-uzazi-earth">{mother?.currentStreak ?? 0}d</p>
            <p className="text-[10px] uppercase font-bold text-uzazi-earth/40 tracking-wider">Active Streak</p>
          </Card>
        </div>

        {/* Personal Info */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-uzazi-earth/40 px-2">{t("profile.personal_info")}</h3>
          <Card className="bg-white border-white shadow-soft rounded-[32px] overflow-hidden">
            <CardContent className="p-0 divide-y divide-uzazi-earth/5">
              <div className="flex items-center gap-4 p-5">
                <div className="h-10 w-10 rounded-xl bg-uzazi-cream flex items-center justify-center text-uzazi-earth/40">
                  <User size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-uzazi-earth/30">{t("full_name")}</p>
                  <p className="font-semibold text-uzazi-earth">{user?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5">
                <div className="h-10 w-10 rounded-xl bg-uzazi-cream flex items-center justify-center text-uzazi-earth/40">
                  <Phone size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-uzazi-earth/30">{t("phone_number")}</p>
                  <p className="font-semibold text-uzazi-earth">{user?.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-5">
                <div className="h-10 w-10 rounded-xl bg-uzazi-cream flex items-center justify-center text-uzazi-earth/40">
                  <MapPin size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-uzazi-earth/30">{t("county")}</p>
                  <p className="font-semibold text-uzazi-earth">{user?.county}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Journey Info */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-uzazi-earth/40 px-2">{t("profile.journey_info")}</h3>
          <Card className="bg-white border-white shadow-soft rounded-[32px] overflow-hidden">
            <CardContent className="p-0 divide-y divide-uzazi-earth/5">
              <div className="flex items-center gap-4 p-5">
                <div className="h-10 w-10 rounded-xl bg-uzazi-petal/50 flex items-center justify-center text-uzazi-rose">
                  <Calendar size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-uzazi-earth/30">{t("baby_dob")}</p>
                  <p className="font-semibold text-uzazi-earth">{mother?.babyDateOfBirth ? new Date(mother.babyDateOfBirth).toLocaleDateString() : 'Not set'}</p>
                </div>
                <div className="bg-uzazi-petal text-uzazi-rose text-xs font-bold px-3 py-1 rounded-full">
                  Day {mother?.postpartumDay}
                </div>
              </div>
              <div className="flex items-center gap-4 p-5">
                <div className="h-10 w-10 rounded-xl bg-uzazi-petal/50 flex items-center justify-center text-uzazi-rose">
                  <ShieldAlert size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase font-bold text-uzazi-earth/30">{t("profile.emergency_contact")}</p>
                  <p className="font-semibold text-uzazi-earth">{mother?.trustedContactName || 'None'}</p>
                  <p className="text-xs text-uzazi-earth/50">{mother?.trustedContactPhone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Language Settings */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-uzazi-earth/40 px-2">{t("profile.language_settings")}</h3>
          <Card className="bg-white border-white shadow-soft rounded-[32px] overflow-hidden p-2">
            <div className="grid grid-cols-3 gap-2">
              {languages.map((lang) => {
                const isActive = locale === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => setLocale(lang.code as Locale)}
                    className={`flex flex-col items-center justify-center p-4 rounded-[24px] transition-all ${
                      isActive 
                        ? "bg-uzazi-rose text-white shadow-bloom scale-105 z-10" 
                        : "bg-uzazi-cream/50 text-uzazi-earth/60 hover:bg-uzazi-petal/40"
                    }`}
                  >
                    <Globe size={20} className={isActive ? "text-white" : "text-uzazi-earth/20"} />
                    <span className="mt-2 text-xs font-bold">{lang.label}</span>
                    {isActive && <Check size={12} className="mt-1" />}
                  </button>
                );
              })}
            </div>
          </Card>
        </section>

        {/* Action Button: Add Appointment */}
        <Button 
          onClick={() => setIsAddAptOpen(true)}
          className="w-full h-16 rounded-[28px] bg-white border-2 border-uzazi-rose/10 text-uzazi-rose hover:bg-uzazi-rose hover:text-white shadow-sm transition-all text-lg font-bold gap-3"
        >
          <div className="h-10 w-10 rounded-2xl bg-uzazi-petal flex items-center justify-center text-uzazi-rose group-hover:bg-white/20 transition-colors">
            <Plus size={24} />
          </div>
          {t("appointment.add")}
        </Button>

        <p className="text-center text-[10px] text-uzazi-earth/30 uppercase tracking-[0.3em] py-6">
          Uzazi v0.1.0 • Built with care
        </p>
      </main>

      <AddAppointmentDialog 
        open={isAddAptOpen} 
        onOpenChange={setIsAddAptOpen} 
        onSuccess={() => {}} 
      />
    </div>
  );
}
