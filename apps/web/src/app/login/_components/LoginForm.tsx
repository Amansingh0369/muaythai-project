"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import FormField from "./FormField";
import { loginSchema, LoginFormValues } from "../auth.helpers";

interface LoginFormProps {
  redirectPath: string;
}

export default function LoginForm({ redirectPath }: LoginFormProps) {
  const { loginWithEmail } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      await loginWithEmail(values.email, values.password);
      router.push(redirectPath);
    } catch (err: any) {
      setServerError(err.message || "Incorrect email or password.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
      <FormField
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />
      <FormField
        label="Password"
        isPassword
        placeholder="••••••••"
        error={errors.password?.message}
        {...register("password")}
      />

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
            Signing In...
          </>
        ) : (
          <>
            Sign In
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
          </>
        )}
        <span className="absolute inset-0 bg-white/20 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12 pointer-events-none" />
      </button>
    </form>
  );
}
