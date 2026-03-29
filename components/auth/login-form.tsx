"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signOut as firebaseSignOut } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  EMAIL_REGEX,
  PHONE_REGEX,
  getWarmFirebaseMessage,
  resolveDestination,
  sendResetLink,
  signInWithGoogleFlow,
  signInWithIdentifier,
} from "@/components/auth/auth-utils";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { LoadingBloom } from "@/components/auth/loading-bloom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase";
import { useToast } from "@/providers/ToastProvider";
import { useLocale } from "@/providers/LanguageProvider";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        d="M21.8 12.227c0-.818-.073-1.604-.209-2.364H12v4.473h5.49a4.7 4.7 0 0 1-2.038 3.082v2.56h3.29c1.926-1.774 3.058-4.39 3.058-7.751Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.754 0 5.063-.913 6.75-2.471l-3.29-2.56c-.913.611-2.079.973-3.46.973-2.656 0-4.906-1.794-5.71-4.205H2.89v2.64A9.998 9.998 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.29 13.737A5.995 5.995 0 0 1 5.97 12c0-.603.109-1.186.32-1.737v-2.64H2.89A10 10 0 0 0 2 12c0 1.61.386 3.136.89 4.377l3.4-2.64Z"
        fill="#FBBC04"
      />
      <path
        d="M12 6.058c1.499 0 2.846.516 3.906 1.531l2.93-2.931C17.058 2.988 14.75 2 12 2A9.998 9.998 0 0 0 2.89 7.623l3.4 2.64C7.094 7.852 9.344 6.058 12 6.058Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const fieldRing =
    "focus-visible:ring-2 focus-visible:ring-uzazi-blush focus-visible:ring-offset-2 focus-visible:ring-offset-uzazi-cream";

  const loginSchema = z.object({
    identifier: z
      .string()
      .trim()
      .refine(
        (value) => EMAIL_REGEX.test(value.toLowerCase()) || PHONE_REGEX.test(value.replace(/[^\d+]/g, "")),
        {
          message: t("error_invalid_phone"),
        },
      ),
    password: z.string().min(8, t("error_passwords_no_match")),
  });

  type LoginValues = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    getValues,
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const loadingCopy = useMemo(
    () => ({
      title: "Opening your care space",
      description: "We’re gathering your profile and guiding you back to the right place.",
    }),
    [],
  );

  const onSubmit = handleSubmit(async (values) => {
    try {
      // Clear any existing session to prevent "auto-login" interference or "wrong details" confusion
      await fetch("/api/session", { method: "DELETE" });
      await firebaseSignOut(auth);

      const { profile } = await signInWithIdentifier(values.identifier, values.password);
      router.replace(resolveDestination(profile.role, returnTo));

      await new Promise(() => {});
    } catch (error) {
      const message = getWarmFirebaseMessage(error, "login");
      toast({ ...message, variant: "destructive" });
    }
  });

  const handleForgotPassword = async () => {
    try {
      await sendResetLink(getValues("identifier"));
      toast({
        title: "A reset link is on its way",
        description: "Check your inbox for the email you entered. You can return here once your password is ready.",
      });
    } catch (error) {
      if ((error as Error).message === "reset-email-only") {
        toast({
          title: "Password reset works with email sign-in",
          description: "If you usually sign in with a phone number, use the email linked to your account or register with email next time.",
          variant: "destructive",
        });
        return;
      }

      const message = getWarmFirebaseMessage(error, "reset");
      toast({ ...message, variant: "destructive" });
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    let keepLoading = false;

    try {
      // Clear session before Google sign-in too
      await fetch("/api/session", { method: "DELETE" });
      await firebaseSignOut(auth);

      const result = await signInWithGoogleFlow({
        language: locale,
      });

      if (result.redirected) {
        keepLoading = true;
        return;
      }

      keepLoading = true;
      router.replace(resolveDestination(result.profile.role, returnTo));
    } catch (error) {
      const message = getWarmFirebaseMessage(error, "google");
      toast({ ...message, variant: "destructive" });
    } finally {
      if (!keepLoading) {
        setIsGoogleLoading(false);
      }
    }
  };

  return (
    <div className="relative w-full max-w-xl">
      {isSubmitting || isGoogleLoading ? <LoadingBloom {...loadingCopy} /> : null}

      <Card className="overflow-hidden border-white/70 bg-white/88">
        <CardHeader className="border-b border-uzazi-petal/70 bg-white/75">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="badge-bloom w-fit">{t("welcome_title")}</p>
              <CardTitle className="text-4xl text-uzazi-rose">{t("sign_in")}</CardTitle>
            </div>
            <LanguageSwitcher />
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6 md:p-8">
          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="space-y-2">
              <label htmlFor="identifier" className="text-sm font-medium text-uzazi-earth">
                {t("phone_number")} / Email
              </label>
              <Input
                id="identifier"
                aria-label={t("phone_number")}
                aria-invalid={Boolean(errors.identifier)}
                placeholder="you@example.com or +254700000000"
                className={fieldRing}
                {...register("identifier")}
              />
              {errors.identifier ? (
                <p className="text-sm text-rose-600">{errors.identifier.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-uzazi-earth">
                {t("password")}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  aria-label={t("password")}
                  aria-invalid={Boolean(errors.password)}
                  type={showPassword ? "text" : "password"}
                  className={`pr-12 ${fieldRing}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-uzazi-earth/55 transition hover:text-uzazi-earth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uzazi-blush"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password ? <p className="text-sm text-rose-600">{errors.password.message}</p> : null}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void handleForgotPassword()}
                className="text-sm font-medium text-uzazi-rose underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uzazi-blush"
              >
                {t("forgot_password")}
              </button>
            </div>

            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="h-12 w-full rounded-full transition duration-200 hover:scale-[1.02] hover:shadow-bloom"
            >
              {t("sign_in")}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-uzazi-blush/50" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-uzazi-earth/55">or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => void handleGoogleSignIn()}
            className="h-12 w-full rounded-full border-uzazi-earth/10 bg-white text-uzazi-earth hover:scale-[1.02] hover:bg-white"
          >
            <GoogleIcon />
            Google
          </Button>

          <p className="text-sm text-uzazi-earth/72">
            New mother?{" "}
            <Link href="/register" className="font-semibold text-uzazi-rose underline-offset-4 hover:underline">
              {t("sign_up")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
