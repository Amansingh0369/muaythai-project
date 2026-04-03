"use client";

import React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-bold uppercase tracking-widest text-outline font-display"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`rounded-none border-b-2 bg-surface-container-highest/50 px-4 py-3 text-base text-white placeholder:text-outline/50 transition-all focus:outline-none focus:border-secondary focus:bg-surface-container-highest disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? "border-primary" : "border-outline-variant"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
