"use client";

import { GoogleLogin } from "@react-oauth/google";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { extractCredential } from "../auth.helpers";

interface GoogleAuthButtonProps {
  redirectPath: string;
}

export default function GoogleAuthButton({ redirectPath }: GoogleAuthButtonProps) {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError(null);
    try {
      const credential = extractCredential(credentialResponse);
      if (credential) {
        await login(credential);
        router.push(redirectPath);
      }
    } catch (err: any) {
      setError(err.message || "Google authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {loading ? (
        <div className="flex items-center gap-2 text-primary text-xs font-barlow font-bold uppercase tracking-widest animate-pulse py-3">
          <Loader2 size={16} className="animate-spin" />
          Verifying...
        </div>
      ) : (
        <div
          id="google-auth-container"
          className="hover:scale-[1.02] transition-transform duration-200 rounded-full overflow-hidden flex items-center justify-center"
        >
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setError("Google authentication failed")}
            useOneTap
            theme="filled_black"
            shape="pill"
            size="large"
            width="310"
          />
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-red-400 text-xs font-grotesk text-center"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
