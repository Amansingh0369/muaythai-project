"use client";

import React from "react";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-none bg-surface-container p-6 ${className}`}
    >
      {children}
    </div>
  );
}
