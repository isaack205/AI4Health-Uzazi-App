import Link from "next/link";
import { ArrowRight, Flower2, HeartHandshake, ShieldCheck } from "lucide-react";

import { FeatureCard } from "@/components/shared/feature-card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-hero-glow">
      <section className="container grid gap-10 py-12 md:py-20 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          <p className="badge-bloom">Postpartum Wellness, Reimagined</p>
          <div className="space-y-4">
            <h1 className="text-display max-w-4xl text-5xl leading-tight text-uzazi-earth md:text-7xl">
              UZAZI brings calm guidance, joyful progress, and community care into the fourth trimester.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-uzazi-earth/75">
              A gamified platform for African mothers and CHWs, blending gentle AI support, daily triage, and a healing
              garden that rewards consistency instead of perfection.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/register">
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Night companion", "Grounding support for heavy, isolated, late-night moments."],
              ["Risk-aware check-ins", "Flags mood, sleep, pain, and red-flag patterns for CHWs."],
              ["Garden rewards", "Turns honest self-care into visible recovery progress."],
            ].map(([title, description]) => (
              <div key={title} className="card-soft p-5">
                <p className="font-semibold text-uzazi-earth">{title}</p>
                <p className="mt-2 text-sm leading-6 text-uzazi-earth/70">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card-soft relative overflow-hidden p-8">
          <div className="absolute -right-10 top-8 h-44 w-44 rounded-full bg-uzazi-blush/50 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-uzazi-sky/40 blur-3xl" />

          <div className="relative space-y-5">
            <div className="rounded-[28px] bg-uzazi-midnight p-6 text-white shadow-bloom">
              <div className="flex items-center gap-3">
                <Flower2 className="h-5 w-5 text-uzazi-blush" />
                <p className="font-medium">Mother dashboard</p>
              </div>
              <p className="mt-4 text-sm leading-7 text-white/80">
                Daily prompts, emotional trend signals, and a garden that grows with every check-in.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] bg-white p-5 shadow-soft">
                <HeartHandshake className="h-5 w-5 text-uzazi-rose" />
                <p className="mt-4 font-semibold text-uzazi-earth">Compassion-first AI</p>
                <p className="mt-2 text-sm leading-6 text-uzazi-earth/70">
                  Supportive language tuned for stigma-sensitive care.
                </p>
              </div>
              <div className="rounded-[28px] bg-white p-5 shadow-soft">
                <ShieldCheck className="h-5 w-5 text-uzazi-leaf" />
                <p className="mt-4 font-semibold text-uzazi-earth">CHW triage</p>
                <p className="mt-2 text-sm leading-6 text-uzazi-earth/70">
                  Clear outreach priorities and visit summaries for faster action.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            eyebrow="Mother Flow"
            title="Gentle routines that meet mothers where they are"
            description="Short check-ins, calming language, and visible progress reduce pressure while keeping the care team informed."
          />
          <FeatureCard
            eyebrow="CHW Flow"
            title="Escalation signals built for field realities"
            description="Prioritized visits, risk snapshots, and quick summaries help CHWs move from signal to response without friction."
          />
          <FeatureCard
            eyebrow="Design System"
            title="Warm, rooted, and clinically clear"
            description="Rose, cream, petal, earth, leaf, and sky anchor a visual system that feels nurturing without becoming vague."
          />
        </div>
      </section>
    </main>
  );
}
