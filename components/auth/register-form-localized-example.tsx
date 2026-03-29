"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "@/providers/LanguageProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Note: Zod schemas defined OUTSIDE the component cannot use `t()` dynamically 
// unless re-created on render, so we move schema generation inside the component.

export function RegisterFormLocalizedExample() {
  const { t } = useLocale();

  // 1. Create the schema inside the render cycle so we can localize error messages!
  const registerSchema = z.object({
    fullName: z.string().min(2, t("error_required")),
    phoneNumber: z.string().min(10, t("error_invalid_phone")),
  });

  type RegisterValues = z.infer<typeof registerSchema>;

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = (data: RegisterValues) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full max-w-md" noValidate>
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium text-uzazi-earth">
          {t("full_name")}
        </label>
        <Input 
          id="fullName" 
          aria-label={t("full_name")}
          placeholder={t("full_name")}
          {...register("fullName")} 
        />
        {errors.fullName && <p className="text-sm text-rose-600">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="phoneNumber" className="text-sm font-medium text-uzazi-earth">
          {t("phone_number")}
        </label>
        <Input 
          id="phoneNumber" 
          type="tel"
          aria-label={t("phone_number")}
          placeholder="+254700000000"
          {...register("phoneNumber")} 
        />
        {errors.phoneNumber && <p className="text-sm text-rose-600">{errors.phoneNumber.message}</p>}
      </div>

      <Button type="submit" className="w-full">
        {t("sign_up")}
      </Button>
    </form>
  );
}
