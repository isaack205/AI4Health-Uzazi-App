import { HeartHandshake } from "lucide-react";

import { TESTIMONIAL_PILLS } from "@/components/auth/auth-utils";

function BloomMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 180 180"
      className="h-24 w-24 drop-shadow-[0_18px_40px_rgba(0,0,0,0.22)] md:h-28 md:w-28"
      fill="none"
    >
      <circle cx="90" cy="90" r="18" fill="#FFF8F5" fillOpacity="0.95" />
      {[0, 60, 120, 180, 240, 300].map((rotation, index) => (
        <g key={rotation} transform={`rotate(${rotation} 90 90)`}>
          <path
            d="M90 24C106 38 115 53 115 68C115 82 103 93 90 93C77 93 65 82 65 68C65 53 74 38 90 24Z"
            fill={index % 2 === 0 ? "#F4A7B9" : "#FFF8F5"}
            fillOpacity={index % 2 === 0 ? "0.96" : "0.88"}
          />
        </g>
      ))}
      <path
        d="M90 71C100.493 71 109 79.507 109 90C109 100.493 100.493 109 90 109C79.507 109 71 100.493 71 90C71 79.507 79.507 71 90 71Z"
        fill="#8B2252"
      />
    </svg>
  );
}

export function BrandPanel({
  tagline,
  subTagline,
  showTestimonials = false,
}: {
  tagline: string;
  subTagline: string;
  showTestimonials?: boolean;
}) {
  return (
    <aside className="relative overflow-hidden bg-[linear-gradient(160deg,#8B2252_0%,#5c1035_100%)] px-6 py-10 text-white md:px-10 lg:min-h-screen lg:px-12 lg:py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(244,167,185,0.35),transparent_34%)]" />
      <div className="relative flex h-full flex-col justify-between gap-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <BloomMark />
            <div>
              <p className="text-display text-4xl">UZAZI</p>
              <p className="mt-1 text-sm uppercase tracking-[0.34em] text-white/65">Postpartum Wellness</p>
            </div>
          </div>

          <div className="max-w-md space-y-4">
            <h1 className="text-display text-5xl leading-tight text-white md:text-6xl">{tagline}</h1>
            <p className="max-w-sm text-base leading-8 text-white/78">{subTagline}</p>
          </div>

          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/88 backdrop-blur">
            <HeartHandshake className="h-4 w-4 text-uzazi-blush" />
            A gentle space for mothers and the people who walk beside them.
          </div>
        </div>

        {showTestimonials ? (
          <div className="flex flex-wrap gap-3">
            {TESTIMONIAL_PILLS.map((pill, index) => (
              <div
                key={pill.name}
                className="rounded-full border border-white/16 bg-white/12 px-4 py-3 text-sm shadow-soft backdrop-blur animate-in fade-in slide-in-from-bottom-3 duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <p className="font-semibold text-white">{pill.name}</p>
                <p className="text-white/75">{pill.text}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
