"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import FormField from "./FormField";
import { signupSchema, SignupFormValues } from "../auth.helpers";

interface SignupFormProps {
  redirectPath: string;
}

export default function SignupForm({ redirectPath }: SignupFormProps) {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (values: SignupFormValues) => {
    setServerError(null);
    try {
      await registerUser(values.fullName, values.email, values.phone, values.password);
      router.push(redirectPath);
    } catch (err: any) {
      setServerError(err.message || "Could not create account. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
      {/* Row 1: Name + Phone */}
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Full Name"
          type="text"
          placeholder="Aman Singh"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <FormField
          label="Phone Number"
          type="tel"
          placeholder="9876543210"
          error={errors.phone?.message}
          {...register("phone")}
        />
      </div>

      {/* Row 2: Email full-width */}
      <FormField
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />

      {/* Row 3: Password + Confirm */}
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Password"
          isPassword
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        <FormField
          label="Confirm Password"
          isPassword
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
      </div>

      <p className="font-grotesk text-[10px] text-white/25 leading-relaxed -mt-1">
        Min 8 chars · one uppercase · one number
      </p>

      <AnimatePresence>
        {serverError && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="font-grotesk text-xs text-red-400 text-center"
          >
            {serverError}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={isSubmitting}
        className="group relative overflow-hidden w-full flex items-center justify-center gap-2 py-3.5
                   font-barlow font-black text-[13px] tracking-[0.25em] uppercase
                   bg-primary text-black
                   hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]
                   disabled:opacity-60 disabled:cursor-not-allowed
                   transition-all duration-300 mt-1"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            Create Account
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
          </>
        )}
        <span className="absolute inset-0 bg-white/20 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12 pointer-events-none" />
      </button>
    </form>
  );
}
