"use client";

import { Flame, Flower2, Sparkle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";

export function GardenOverview() {
  const { user } = useAuth();
  const mother = user && "gardenPetals" in user ? user : null;
  const petals = mother?.gardenPetals ?? 16;
  const currentStreak = mother?.currentStreak ?? 0;
  const badges = mother?.badges ?? [
    {
      id: "b1",
      name: "Soft Start",
      description: "Completed your first week with daily reflections.",
      icon: "Sparkle",
      earnedAt: new Date().toISOString(),
    },
    {
      id: "b2",
      name: "Rest Reclaimer",
      description: "Logged three honest sleep check-ins.",
      icon: "Moon",
      earnedAt: new Date().toISOString(),
    },
  ];

  // Calculate full flowers (5 petals each) and remaining loose petals
  const fullFlowers = Math.floor(petals / 5);
  const remainingPetals = petals % 5;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-6">
        {/* Streak & Status Card */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-white to-uzazi-rose/10 border-uzazi-blush/30 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-white p-3 shadow-sm mb-3">
                <Flame className={`h-6 w-6 ${currentStreak > 0 ? "text-orange-500 animate-pulse" : "text-uzazi-earth/30"}`} />
              </div>
              <p className="text-3xl font-bold text-uzazi-earth">{currentStreak}</p>
              <p className="text-xs uppercase tracking-wider text-uzazi-earth/60 font-semibold mt-1">Day Streak</p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-white to-uzazi-petal/40 border-uzazi-blush/30 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="rounded-full bg-white p-3 shadow-sm mb-3 relative">
                <Flower2 className="h-6 w-6 text-uzazi-rose" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-uzazi-rose text-[10px] font-bold text-white">
                  +
                </span>
              </div>
              <p className="text-3xl font-bold text-uzazi-earth">{petals}</p>
              <p className="text-xs uppercase tracking-wider text-uzazi-earth/60 font-semibold mt-1">Total Petals</p>
            </CardContent>
          </Card>
        </div>

        {/* Garden Visualization Card */}
        <Card className="overflow-hidden border-uzazi-blush/40 bg-gradient-to-b from-white via-uzazi-petal/40 to-uzazi-blush/20 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-uzazi-earth flex items-center justify-between">
              <span>Healing Garden</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="min-h-[240px] rounded-3xl bg-white/40 p-6 backdrop-blur-sm border border-white/60 shadow-inner flex flex-wrap gap-4 items-center justify-center content-start">
              {petals === 0 ? (
                <div className="w-full text-center py-12 text-uzazi-earth/50 flex flex-col items-center">
                  <Flower2 className="h-12 w-12 mb-3 opacity-20" />
                  <p>Your garden awaits its first drop of care.</p>
                </div>
              ) : (
                <>
                  {/* Full Flowers */}
                  {Array.from({ length: fullFlowers }).map((_, i) => (
                    <div key={`flower-${i}`} className="group relative transition-transform hover:scale-110">
                      <div className="absolute inset-0 bg-uzazi-rose/20 rounded-full blur-md opacity-50 group-hover:opacity-100 transition-opacity" />
                      <Flower2 className="h-14 w-14 text-uzazi-rose drop-shadow-sm" fill="#ffebf0" />
                    </div>
                  ))}
                  
                  {/* Growing Flower (remaining petals) */}
                  {remainingPetals > 0 && (
                    <div className="relative flex h-14 w-14 items-center justify-center opacity-80">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const isFilled = i < remainingPetals;
                        const angle = (i * 360) / 5;
                        return (
                          <div 
                            key={`petal-${i}`}
                            className={`absolute h-4 w-4 rounded-full transition-all ${
                              isFilled ? "bg-uzazi-rose shadow-sm scale-110" : "bg-uzazi-earth/10"
                            }`}
                            style={{ 
                              transform: `rotate(${angle}deg) translateY(-12px)`,
                              transformOrigin: 'center center'
                            }}
                          />
                        );
                      })}
                      <div className={`h-4 w-4 rounded-full ${remainingPetals > 0 ? "bg-uzazi-rose/50" : "bg-transparent"}`} />
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="rounded-2xl bg-white/70 p-4 border border-white">
              <p className="text-sm leading-6 text-uzazi-earth/80">
                <strong className="text-uzazi-rose">Every 5 petals blossom into a full flower.</strong> Each petal marks a moment of care: a mood check, a calmer night, or reaching for help before overwhelm builds.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit shadow-sm border-white/70 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-uzazi-earth">Earned badges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {badges.map((badge) => (
            <div key={badge.id} className="rounded-[24px] border border-uzazi-petal/80 bg-white p-4 shadow-sm hover:shadow-soft transition-shadow">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-uzazi-rose/10 p-3 text-uzazi-rose">
                  <Sparkle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-uzazi-earth">{badge.name}</p>
                  <p className="mt-1 text-sm leading-6 text-uzazi-earth/70">{badge.description}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
