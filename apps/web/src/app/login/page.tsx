"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { extractCredential, getRedirectPath } from "./login.helpers";

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = getRedirectPath(searchParams);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = async (credentialResponse: any) => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const credential = extractCredential(credentialResponse);
      if (credential) {
        await login(credential);
        router.push(redirect);
      }
    } catch (err) {
      setError("Authentication failed. Please try again.");
      console.error(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {isLoggingIn ? (
        <div className="flex items-center gap-3 text-primary animate-pulse font-heading tracking-widest text-sm uppercase">
            <Loader2 className="animate-spin" />
            Authenticating...
        </div>
      ) : (
        <div className="scale-110 hover:scale-[1.03] transition-transform duration-300">
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => setError("Google Login Failed")}
                useOneTap
                theme="filled_black"
                shape="pill"
                size="large"
                width="300"
            />
        </div>
      )}
      
      {error && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-primary text-xs font-heading uppercase tracking-wider bg-primary/10 px-4 py-2 rounded-full border border-primary/20"
        >
          {error}
        </motion.p>
      )}

      <p className="text-[10px] text-center text-muted-foreground mt-6 leading-relaxed opacity-50 max-w-[250px]">
        By continuing, you agree to our <a href="#" className="underline hover:text-white transition-colors">Terms of Service</a> and <a href="#" className="underline hover:text-white transition-colors">Privacy Policy</a>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-black font-body">
      {/* Background with ring feel */}
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.2) 0%, transparent 60%)",
        }}
      />
      <div 
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center brightness-[0.25] z-[-1] pointer-events-none" 
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md p-10 glass-surface border border-white/10 rounded-[2.5rem] m-4 shadow-2xl flex flex-col items-center"
      >
        <div className="flex flex-col items-center text-center mb-10 w-full">
          <motion.div
            animate={{ 
                boxShadow: ["0 0 0px var(--primary)", "0 0 15px var(--primary)", "0 0 0px var(--primary)"] 
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="rounded-full p-1 border-2 border-primary/30 mb-6"
          >
            <img 
              src={logo.src} 
              alt="Logo" 
              className="w-20 h-20 rounded-full"
            />
          </motion.div>
          <h1 className="font-display text-4xl tracking-tight text-white mb-3">Forge Your Legacy</h1>
          <p className="text-muted-foreground">Sign in to start your journey</p>
        </div>

        <Suspense fallback={
          <div className="flex items-center gap-3 text-primary animate-pulse font-heading tracking-widest text-sm uppercase">
            <Loader2 className="animate-spin" />
            Loading...
          </div>
        }>
          <LoginContent />
        </Suspense>
      </motion.div>
    </div>
  );
}
