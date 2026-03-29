import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;

  return (
    <AuthShell
      tagline="Karibu tena"
      subTagline="Your wellness journey continues here"
      showTestimonials
    >
      <LoginForm returnTo={returnTo} />
    </AuthShell>
  );
}
