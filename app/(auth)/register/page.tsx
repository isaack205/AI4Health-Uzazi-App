import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell
      tagline="A gentle beginning"
      subTagline="Tell us about yourself, your journey, and the kind of support that should meet you here."
    >
      <RegisterForm />
    </AuthShell>
  );
}
