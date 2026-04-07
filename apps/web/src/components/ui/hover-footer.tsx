"use client";
import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const TextHoverEffect = ({
  text,
  className,
}: {
  text: string;
  duration?: number;
  automatic?: boolean;
  className?: string;
}) => {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1000 200"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("select-none uppercase pointer-events-none", className)}
    >
      <text
        x="50%"
        y="95%"
        textAnchor="middle"
        dominantBaseline="auto"
        fill="black"
        fontWeight="900"
        className="font-barlow"
        fontSize="190"
        letterSpacing="-0.04em"
      >
        {text}
      </text>
    </svg>
  );
};

export const FooterBackgroundGradient = () => {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(125% 125% at 50% 10%, transparent 40%, rgba(0,0,0,0.8) 100%)",
      }}
    />
  );
};
