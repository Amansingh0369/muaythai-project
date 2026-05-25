"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isPassword?: boolean;
}

const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, isPassword, className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-white/60 font-bold">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            type={isPassword ? (visible ? "text" : "password") : props.type}
            className={`
              w-full bg-white/[0.07] border px-4 py-3 text-sm font-grotesk text-white
              placeholder:text-white/30 outline-none
              transition-colors duration-200
              focus:bg-white/[0.11]
              ${error
                ? "border-red-500/60 focus:border-red-400"
                : "border-white/15 focus:border-primary/70"
              }
              ${isPassword ? "pr-11" : ""}
              ${className ?? ""}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setVisible((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              {visible ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          )}
        </div>
        {error && (
          <p className="font-grotesk text-[10px] text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
export default FormField;
