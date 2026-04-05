"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { useState } from "react";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { API_CONFIG } from "@/lib/api-constants";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <GoogleOAuthProvider clientId={API_CONFIG.GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {children}
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
