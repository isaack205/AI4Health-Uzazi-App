"use client";

export function DayProgressStrip({ 
  checkins, 
  totalDays = 42, 
  currentDay, 
  onDayPress 
}: { 
  checkins: any[]; 
  totalDays?: number; 
  currentDay: number; 
  onDayPress?: (day: number) => void 
}) {
  const checkinMap = new Map(checkins.map(c => [c.dayPostpartum, c]));

  return (
    <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex items-center gap-2 min-w-max px-2">
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const checkin = checkinMap.get(day);
          const isCurrent = day === currentDay;
          
          let bgColor = "bg-uzazi-earth/10"; // Default empty
          if (checkin) {
            switch (checkin.riskLevel) {
              case "low": bgColor = "bg-uzazi-sage"; break;
              case "medium": bgColor = "bg-uzazi-amber"; break;
              case "high": bgColor = "bg-uzazi-terracotta"; break;
              case "critical": bgColor = "bg-uzazi-rose"; break;
            }
          }

          return (
            <button
              key={day}
              onClick={() => onDayPress && onDayPress(day)}
              disabled={!onDayPress}
              aria-label={`Day ${day}`}
              className={`relative flex items-center justify-center rounded-full transition-all flex-shrink-0 ${
                isCurrent 
                  ? `w-6 h-6 border-2 border-uzazi-rose ${bgColor === "bg-uzazi-earth/10" ? "bg-white" : bgColor}` 
                  : `w-3 h-3 ${bgColor}`
              } ${onDayPress ? "hover:scale-125 cursor-pointer" : "cursor-default"}`}
            >
              {isCurrent && bgColor === "bg-uzazi-earth/10" && (
                <div className="w-2 h-2 rounded-full bg-uzazi-rose" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}