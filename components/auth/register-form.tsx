"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, HeartHandshake, ShieldPlus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { type FieldPath, useForm } from "react-hook-form";
import { z } from "zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import {
  KENYA_COUNTIES,
  PREFERRED_LANGUAGES,
  PHONE_REGEX,
  calculatePostpartumDay,
  ensureLocalAuthPersistence,
  getWarmFirebaseMessage,
  resolvePasswordStrength,
  syncSession,
  toAuthEmail,
} from "@/components/auth/auth-utils";
import { LoadingBloom } from "@/components/auth/loading-bloom";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { auth, db } from "@/lib/firebase";
import { getDefaultRouteForRole } from "@/lib/auth";
import { useToast } from "@/providers/ToastProvider";
import { useLocale } from "@/providers/LanguageProvider";

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-sm text-rose-600">{message}</p>;
}

function SelectField({
  id,
  label,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  label: string;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-uzazi-earth">
        {label}
      </label>
      <select
        id={id}
        className="flex h-11 w-full rounded-2xl border border-uzazi-earth/10 bg-white px-4 text-sm text-uzazi-earth shadow-sm transition focus:outline-none focus:ring-2 focus:ring-uzazi-blush focus:ring-offset-2 focus:ring-offset-uzazi-cream"
        {...props}
      >
        {children}
      </select>
      <FieldError message={error} />
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useLocale();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fieldRing =
    "focus-visible:ring-2 focus-visible:ring-uzazi-blush focus-visible:ring-offset-2 focus-visible:ring-offset-uzazi-cream";

  const registerSchema = useMemo(() => z
    .object({
      fullName: z.string().min(2, t("error_required")),
      phoneNumber: z
        .string()
        .trim()
        .refine((value) => PHONE_REGEX.test(value.replace(/[^\d+]/g, "")), {
          message: t("error_invalid_phone"),
        }),
      email: z
        .string()
        .trim()
        .optional()
        .refine((value) => !value || z.string().email().safeParse(value).success, {
          message: t("error_required"),
        }),
      county: z.string().min(1, t("error_required")),
      preferredLanguage: z.enum(PREFERRED_LANGUAGES),
      role: z.enum(["mother", "chw"]),
      babyDateOfBirth: z.string().optional(),
      pregnancyNumber: z.enum(["1st", "2nd", "3rd+"]).optional(),
      deliveryType: z.enum(["Vaginal", "C-Section", "Prefer not to say"]).optional(),
      trustedContactName: z.string().optional(),
      trustedContactPhone: z.string().optional(),
      chwId: z.string().optional(),
      subCounty: z.string().optional(),
      facilityName: z.string().optional(),
      supervisorContact: z.string().optional(),
      password: z.string().min(8, t("error_required")),
      confirmPassword: z.string().min(8, t("error_required")),
      consent: z.boolean().refine((value) => value, {
        message: t("error_required"),
      }),
      privacyAccepted: z.boolean().refine((value) => value, {
        message: t("error_required"),
      }),
    })
    .superRefine((values, context) => {
      if (values.password !== values.confirmPassword) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["confirmPassword"],
          message: t("error_passwords_no_match"),
        });
      }

      if (values.trustedContactPhone && !PHONE_REGEX.test(values.trustedContactPhone.replace(/[^\d+]/g, ""))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["trustedContactPhone"],
          message: t("error_invalid_phone"),
        });
      }

      if (values.supervisorContact && !PHONE_REGEX.test(values.supervisorContact.replace(/[^\d+]/g, ""))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["supervisorContact"],
          message: t("error_invalid_phone"),
        });
      }

      if (values.role === "mother") {
        if (!values.babyDateOfBirth) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["babyDateOfBirth"],
            message: t("error_required"),
          });
        }
        if (!values.pregnancyNumber) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["pregnancyNumber"],
            message: t("error_required"),
          });
        }
        if (!values.deliveryType) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["deliveryType"],
            message: t("error_required"),
          });
        }
      }

      if (values.role === "chw") {
        if (!values.chwId?.trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["chwId"],
            message: t("error_required"),
          });
        }
        if (!values.subCounty?.trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["subCounty"],
            message: t("error_required"),
          });
        }
        if (!values.facilityName?.trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["facilityName"],
            message: t("error_required"),
          });
        }
        if (!values.supervisorContact?.trim()) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["supervisorContact"],
            message: t("error_required"),
          });
        }
      }
    }), [t]);

  type RegisterValues = z.infer<typeof registerSchema>;

  const STEP_TITLES = useMemo(() => [
    { step: 1, label: t("step_about_you") },
    { step: 2, label: t("step_journey") },
    { step: 3, label: t("step_password") },
  ], [t]);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      email: "",
      county: "",
      preferredLanguage: "Swahili",
      role: "mother",
      babyDateOfBirth: "",
      pregnancyNumber: "1st",
      deliveryType: "Vaginal",
      trustedContactName: "",
      trustedContactPhone: "",
      chwId: "",
      subCounty: "",
      facilityName: "",
      supervisorContact: "",
      password: "",
      confirmPassword: "",
      consent: false,
      privacyAccepted: false,
    },
  });

  useEffect(() => {
    // Attempt to map locale to PREFERRED_LANGUAGES
    const langMap: Record<string, RegisterValues["preferredLanguage"]> = {
      en: "English",
      sw: "Swahili",
      ki: "Kikuyu",
    };
    if (langMap[locale]) {
      setValue("preferredLanguage", langMap[locale]);
    }
  }, [locale, setValue]);

  const role = watch("role");
  const babyDateOfBirth = watch("babyDateOfBirth");
  const password = watch("password");
  const postpartumDay = useMemo(() => calculatePostpartumDay(babyDateOfBirth ?? ""), [babyDateOfBirth]);
  const passwordStrength = resolvePasswordStrength(password ?? "");

  const nextStep = async () => {
    const fields =
      step === 1
        ? ["fullName", "phoneNumber", "email", "county", "preferredLanguage", "role"]
        : role === "mother"
          ? ["babyDateOfBirth", "pregnancyNumber", "deliveryType", "trustedContactName", "trustedContactPhone"]
          : ["chwId", "subCounty", "facilityName", "supervisorContact"];

    const valid = await trigger(fields as FieldPath<RegisterValues>[]);

    if (valid) {
      setStep((current) => Math.min(3, current + 1));
    }
  };

  const previousStep = () => {
    setStep((current) => Math.max(1, current - 1));
  };

  const onSubmit = handleSubmit(async (values) => {
    try {
      await ensureLocalAuthPersistence();
      const authEmail = toAuthEmail(values.phoneNumber, values.email);
      const credential = await createUserWithEmailAndPassword(auth, authEmail, values.password);
      await updateProfile(credential.user, { displayName: values.fullName });

      const sharedProfile = {
        uid: credential.user.uid,
        email: values.email?.trim().toLowerCase() || authEmail,
        phone: values.phoneNumber.replace(/[^\d+]/g, ""),
        role: values.role,
        name: values.fullName,
        language: values.preferredLanguage,
        county: values.county,
        createdAt: new Date().toISOString(),
      };

      const profile =
        values.role === "mother"
          ? {
              ...sharedProfile,
              postpartumDay,
              babyDateOfBirth: values.babyDateOfBirth,
              pregnancyNumber: values.pregnancyNumber,
              deliveryType: values.deliveryType,
              trustedContactName: values.trustedContactName?.trim() || "",
              trustedContactPhone: values.trustedContactPhone?.replace(/[^\d+]/g, "") || "",
              assignedCHW: "unassigned",
              riskLevel: "low",
              gardenPetals: 3,
              badges: [],
              onboardingComplete: true,
              currentStreak: 0,
              lastCheckInDate: "",
              lastLoginDate: new Date().toISOString().split("T")[0],
            }
          : {
              ...sharedProfile,
              assignedMothers: [],
              subCounty: values.subCounty,
              chwId: values.chwId,
              facilityName: values.facilityName,
              supervisorContact: values.supervisorContact?.replace(/[^\d+]/g, "") || "",
              onboardingComplete: true,
            };

      await setDoc(doc(db, "users", credential.user.uid), profile);
      await syncSession(credential.user, values.role);
      router.replace(getDefaultRouteForRole(values.role));

      await new Promise(() => {});
    } catch (error) {
      const message = getWarmFirebaseMessage(error, "register");
      toast({ ...message, variant: "destructive" });
    }
  });

  return (
    <div className="relative w-full max-w-3xl">
      {isSubmitting ? (
        <LoadingBloom
          title={role === "mother" ? t("begin_journey") : t("access_dashboard")}
          description={t("register_subtitle")}
        />
      ) : null}

      <Card className="overflow-hidden border-white/70 bg-white/88">
        <CardHeader className="space-y-5 border-b border-uzazi-petal/70 bg-white/75">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="badge-bloom w-fit">{t("register_title")}</p>
              <CardTitle className="text-4xl text-uzazi-rose">{t("sign_up")}</CardTitle>
            </div>
            <LanguageSwitcher />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {STEP_TITLES.map((item) => {
              const complete = step > item.step;
              const active = step === item.step;

              return (
                <div
                  key={item.step}
                  className={`rounded-[24px] border px-4 py-3 transition ${
                    active
                      ? "border-uzazi-rose bg-uzazi-petal"
                      : complete
                        ? "border-uzazi-blush bg-white"
                        : "border-uzazi-earth/10 bg-white/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        active || complete ? "bg-uzazi-rose text-white" : "bg-uzazi-petal text-uzazi-earth"
                      }`}
                    >
                      {item.step}
                    </span>
                    <p className="text-sm font-medium text-uzazi-earth">{item.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="p-6 md:p-8">
          <form onSubmit={onSubmit} noValidate>
            <div key={`${step}-${role}`} className="animate-in slide-in-from-right-6 fade-in duration-300">
              {step === 1 ? (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label htmlFor="fullName" className="text-sm font-medium text-uzazi-earth">
                        {t("full_name")}
                      </label>
                      <Input id="fullName" className={fieldRing} aria-label={t("full_name")} {...register("fullName")} />
                      <FieldError message={errors.fullName?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phoneNumber" className="text-sm font-medium text-uzazi-earth">
                        {t("phone_number")}
                      </label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        className={fieldRing}
                        aria-label={t("phone_number")}
                        aria-invalid={Boolean(errors.phoneNumber)}
                        placeholder="+254700000000"
                        {...register("phoneNumber")}
                      />
                      <FieldError message={errors.phoneNumber?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-uzazi-earth">
                        Email ({t("optional")})
                      </label>
                      <Input
                        id="email"
                        type="email"
                        className={fieldRing}
                        aria-label="Email"
                        aria-invalid={Boolean(errors.email)}
                        placeholder="you@example.com"
                        {...register("email")}
                      />
                      <FieldError message={errors.email?.message} />
                    </div>

                    <SelectField id="county" label={t("county")} error={errors.county?.message} {...register("county")}>
                      <option value="">{t("county")}</option>
                      {KENYA_COUNTIES.map((county) => (
                        <option key={county} value={county}>
                          {county}
                        </option>
                      ))}
                    </SelectField>

                    <SelectField
                      id="preferredLanguage"
                      label={t("preferred_language")}
                      error={errors.preferredLanguage?.message}
                      {...register("preferredLanguage")}
                    >
                      {PREFERRED_LANGUAGES.map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                    </SelectField>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium text-uzazi-earth">Choose your role</p>
                    <div className="grid gap-4 md:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setValue("role", "mother", { shouldValidate: true })}
                        className={`rounded-[28px] border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uzazi-blush ${
                          role === "mother"
                            ? "border-uzazi-rose bg-uzazi-petal shadow-bloom"
                            : "border-uzazi-earth/10 bg-white hover:border-uzazi-blush"
                        }`}
                        aria-pressed={role === "mother"}
                      >
                        <div className="flex items-start gap-4">
                          <div className="rounded-2xl bg-white p-3 text-2xl">🌸</div>
                          <div>
                            <p className="font-semibold text-uzazi-earth">{t("role_mother")}</p>
                            <p className="mt-2 text-sm leading-6 text-uzazi-earth/70">
                              {t("role_mother_desc")}
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setValue("role", "chw", { shouldValidate: true })}
                        className={`rounded-[28px] border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uzazi-blush ${
                          role === "chw"
                            ? "border-uzazi-rose bg-uzazi-petal shadow-bloom"
                            : "border-uzazi-earth/10 bg-white hover:border-uzazi-blush"
                        }`}
                        aria-pressed={role === "chw"}
                      >
                        <div className="flex items-start gap-4">
                          <div className="rounded-2xl bg-white p-3 text-2xl">🏥</div>
                          <div>
                            <p className="font-semibold text-uzazi-earth">{t("role_chw")}</p>
                            <p className="mt-2 text-sm leading-6 text-uzazi-earth/70">
                              {t("role_chw_desc")}
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 && role === "mother" ? (
                <div className="space-y-6">
                  <div className="rounded-[26px] bg-uzazi-petal/65 p-4">
                    <p className="flex items-center gap-2 font-medium text-uzazi-earth">
                      <HeartHandshake className="h-4 w-4 text-uzazi-rose" />
                      {t("step_journey")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-uzazi-earth/72">
                      {t("register_subtitle")}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="babyDateOfBirth" className="text-sm font-medium text-uzazi-earth">
                        {t("baby_dob")}
                      </label>
                      <Input
                        id="babyDateOfBirth"
                        type="date"
                        className={fieldRing}
                        aria-label={t("baby_dob")}
                        {...register("babyDateOfBirth")}
                      />
                      <FieldError message={errors.babyDateOfBirth?.message} />
                    </div>

                    <div className="rounded-[24px] border border-uzazi-blush/60 bg-white px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.2em] text-uzazi-earth/45">Postpartum day</p>
                      <p className="mt-2 font-mono text-3xl text-uzazi-rose">{postpartumDay}</p>
                    </div>

                    <SelectField
                      id="pregnancyNumber"
                      label={t("pregnancy_number")}
                      error={errors.pregnancyNumber?.message}
                      {...register("pregnancyNumber")}
                    >
                      <option value="1st">1st</option>
                      <option value="2nd">2nd</option>
                      <option value="3rd+">3rd+</option>
                    </SelectField>

                    <SelectField
                      id="deliveryType"
                      label={t("delivery_type")}
                      error={errors.deliveryType?.message}
                      {...register("deliveryType")}
                    >
                      <option value="Vaginal">{t("delivery_type_vaginal")}</option>
                      <option value="C-Section">{t("delivery_type_csection")}</option>
                      <option value="Prefer not to say">{t("delivery_type_prefer_not_to_say")}</option>
                    </SelectField>

                    <div className="space-y-2">
                      <label htmlFor="trustedContactName" className="text-sm font-medium text-uzazi-earth">
                        {t("trusted_contact_name")}
                      </label>
                      <Input
                        id="trustedContactName"
                        className={fieldRing}
                        aria-label={t("trusted_contact_name")}
                        placeholder={t("optional")}
                        {...register("trustedContactName")}
                      />
                      <FieldError message={errors.trustedContactName?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="trustedContactPhone" className="text-sm font-medium text-uzazi-earth">
                        {t("trusted_contact_phone")}
                      </label>
                      <Input
                        id="trustedContactPhone"
                        type="tel"
                        className={fieldRing}
                        aria-label={t("trusted_contact_phone")}
                        aria-invalid={Boolean(errors.trustedContactPhone)}
                        placeholder="+254700000000"
                        {...register("trustedContactPhone")}
                      />
                      <FieldError message={errors.trustedContactPhone?.message} />
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 && role === "chw" ? (
                <div className="space-y-6">
                  <div className="rounded-[26px] bg-uzazi-petal/65 p-4">
                    <p className="flex items-center gap-2 font-medium text-uzazi-earth">
                      <ShieldPlus className="h-4 w-4 text-uzazi-rose" />
                      {t("step_journey")}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-uzazi-earth/72">
                      {t("register_subtitle")}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="chwId" className="text-sm font-medium text-uzazi-earth">
                        {t("chw_id")}
                      </label>
                      <Input id="chwId" className={fieldRing} aria-label={t("chw_id")} {...register("chwId")} />
                      <FieldError message={errors.chwId?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="subCounty" className="text-sm font-medium text-uzazi-earth">
                        {t("sub_county")}
                      </label>
                      <Input
                        id="subCounty"
                        className={fieldRing}
                        aria-label={t("sub_county")}
                        {...register("subCounty")}
                      />
                      <FieldError message={errors.subCounty?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="facilityName" className="text-sm font-medium text-uzazi-earth">
                        {t("facility_name")}
                      </label>
                      <Input
                        id="facilityName"
                        className={fieldRing}
                        aria-label={t("facility_name")}
                        {...register("facilityName")}
                      />
                      <FieldError message={errors.facilityName?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="supervisorContact" className="text-sm font-medium text-uzazi-earth">
                        {t("supervisor_contact")}
                      </label>
                      <Input
                        id="supervisorContact"
                        type="tel"
                        className={fieldRing}
                        aria-label={t("supervisor_contact")}
                        aria-invalid={Boolean(errors.supervisorContact)}
                        placeholder="+254700000000"
                        {...register("supervisorContact")}
                      />
                      <FieldError message={errors.supervisorContact?.message} />
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-6">
                  <div className="rounded-[26px] bg-uzazi-petal/65 p-4">
                    <p className="flex items-center gap-2 font-medium text-uzazi-earth">
                      <Sparkles className="h-4 w-4 text-uzazi-rose" />
                      {t("step_password")}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-uzazi-earth/55 transition hover:text-uzazi-earth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uzazi-blush"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <FieldError message={errors.password?.message} />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="text-sm font-medium text-uzazi-earth">
                        {t("confirm_password")}
                      </label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          aria-label={t("confirm_password")}
                          aria-invalid={Boolean(errors.confirmPassword)}
                          type={showConfirmPassword ? "text" : "password"}
                          className={`pr-12 ${fieldRing}`}
                          {...register("confirmPassword")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-uzazi-earth/55 transition hover:text-uzazi-earth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-uzazi-blush"
                          aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <FieldError message={errors.confirmPassword?.message} />
                    </div>
                  </div>

                  <div className="space-y-2 rounded-[24px] border border-uzazi-earth/10 bg-white/80 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium text-uzazi-earth">{t("password_strength")}</p>
                      <p className="text-sm text-uzazi-earth/65">{passwordStrength.label}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div
                          key={index}
                          className={`h-2 rounded-full ${
                            index < passwordStrength.score ? passwordStrength.className : "bg-uzazi-petal"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start gap-3 rounded-[24px] border border-uzazi-earth/10 bg-white p-4">
                      <input
                        type="checkbox"
                        className="mt-1 h-5 w-5 rounded border-uzazi-blush accent-uzazi-rose"
                        {...register("consent")}
                        aria-label="Consent confirmation"
                      />
                      <span className="text-sm leading-6 text-uzazi-earth/80">
                        {t("consent_text")}
                      </span>
                    </label>
                    <FieldError message={errors.consent?.message} />

                    <label className="flex items-start gap-3 rounded-[24px] border border-uzazi-earth/10 bg-white p-4">
                      <input
                        type="checkbox"
                        className="mt-1 h-5 w-5 rounded border-uzazi-blush accent-uzazi-rose"
                        {...register("privacyAccepted")}
                        aria-label="Privacy consent"
                      />
                      <span className="text-sm leading-6 text-uzazi-earth/80">
                        {t("privacy_text")}
                      </span>
                    </label>
                    <FieldError message={errors.privacyAccepted?.message} />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-uzazi-petal/80 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                {step > 1 ? (
                  <Button type="button" variant="outline" onClick={previousStep} className="rounded-full">
                    {t("back_btn")}
                  </Button>
                ) : null}
                {step < 3 ? (
                  <Button type="button" onClick={() => void nextStep()} className="rounded-full">
                    {t("continue_btn")}
                  </Button>
                ) : null}
              </div>

              {step === 3 ? (
                <Button type="submit" className="rounded-full px-6 hover:scale-[1.02] hover:shadow-bloom">
                  {role === "mother" ? t("begin_journey") : t("access_dashboard")}
                </Button>
              ) : null}
            </div>

            <p className="mt-6 text-sm text-uzazi-earth/72">
              {t("already_have_account")}{" "}
              <Link href="/login" className="font-semibold text-uzazi-rose underline-offset-4 hover:underline">
                {t("sign_in_here")}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
