import { BrandPanel } from "@/components/auth/brand-panel";

export function AuthShell({
  children,
  tagline,
  subTagline,
  showTestimonials = false,
}: {
  children: React.ReactNode;
  tagline: string;
  subTagline: string;
  showTestimonials?: boolean;
}) {
  return (
    <main className="min-h-screen bg-uzazi-cream lg:grid lg:grid-cols-[0.42fr_0.58fr]">
      <BrandPanel tagline={tagline} subTagline={subTagline} showTestimonials={showTestimonials} />
      <section className="relative flex min-h-screen items-center justify-center bg-uzazi-cream px-4 py-8 md:px-8 lg:px-12">
        {children}
      </section>
    </main>
  );
}
