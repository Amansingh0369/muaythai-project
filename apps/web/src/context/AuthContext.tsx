"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { authService, User } from "@/services/auth.service";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    if (token) {
        setAccessToken(token);
        try {
            const userData = await authService.getCurrentUser();
            setUser(userData);
        } catch (error) {
            console.error('Error checking auth:', error);
            localStorage.removeItem('access_token');
            setAccessToken(null);
            setUser(null);
        }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
    
    const handleLogoutEvent = () => {
        setAccessToken(null);
        setUser(null);
    };
    
    window.addEventListener('auth_logout', handleLogoutEvent);
    return () => window.removeEventListener('auth_logout', handleLogoutEvent);
  }, [checkAuth]);

  const login = async (idToken: string) => {
    try {
      const data = await authService.loginWithGoogle(idToken);
      localStorage.setItem("access_token", data.access);
      setAccessToken(data.access);
      setUser(data.user);
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout Error:", error);
    } finally {
      localStorage.removeItem("access_token");
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
