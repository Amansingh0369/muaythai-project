"use client";

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { AlertCircle, Check } from "lucide-react";

export function SectionHeader({
  icon,
  title,
  complete,
}: {
  icon: ReactNode;
  title: string;
  complete?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div
        className={`w-7 h-7 border flex items-center justify-center ${
          complete
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-primary/10 border-primary/20 text-primary"
        }`}
      >
        {complete ? <Check size={13} /> : icon}
      </div>
      <h3 className="font-barlow font-black italic text-lg uppercase tracking-wide text-white">{title}</h3>
      <span className="flex-1 h-px bg-white/[0.06]" />
      {complete && (
        <span className="font-grotesk text-[13px] tracking-[0.3em] uppercase text-green-400">Complete</span>
      )}
    </div>
  );
}

export function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-grotesk text-[13px] uppercase tracking-[0.3em] text-white/60 font-bold">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {error && (
        <p className="font-grotesk text-[13px] text-red-400 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

const CONTROL_BASE =
  "w-full bg-white/[0.06] border px-3 py-2.5 text-sm font-grotesk text-white outline-none focus:bg-white/[0.10] transition-colors duration-200";

export function TextInput({
  hasError,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return (
    <input
      className={`${CONTROL_BASE} placeholder:text-white/25 ${
        hasError ? "border-red-500/50 focus:border-red-500/70" : "border-white/12 focus:border-primary/50"
      } ${className ?? ""}`}
      {...rest}
    />
  );
}

export function SelectInput({
  hasError,
  className,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }) {
  return (
    <select
      className={`${CONTROL_BASE} appearance-none ${
        hasError ? "border-red-500/50" : "border-white/12 focus:border-primary/50"
      } ${className ?? ""}`}
      {...rest}
    >
      {children}
    </select>
  );
}
