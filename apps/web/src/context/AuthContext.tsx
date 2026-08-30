"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { authService, User } from "@/services/auth.service";
import { fighterCardService } from "@/services/fighter-card.service";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (idToken: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  /**
   * The fighter card photo, shared so the navbar and the profile page do not
   * each fetch it. It is a signed URL with a lifetime, so it is held in memory
   * for the session only — never localStorage, and re-read rather than cached.
   */
  fighterPhoto: string | null;
  /** Set directly when the caller already holds a freshly-read card. */
  setFighterPhoto: (photo: string | null) => void;
  /** Re-read the card for a fresh signed URL. */
  refreshFighterPhoto: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fighterPhoto, setFighterPhoto] = useState<string | null>(null);

  const refreshFighterPhoto = useCallback(async () => {
    try {
      const card = await fighterCardService.getMyCard();
      setFighterPhoto(card.photo);
    } catch {
      // No card, or the request failed — avatars fall back to initials.
      setFighterPhoto(null);
    }
  }, []);

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
    if (!user) {
      setFighterPhoto(null);
      return;
    }
    // GET /me/ creates the card on first read, so this is safe anywhere.
    refreshFighterPhoto();
  }, [user, refreshFighterPhoto]);

  useEffect(() => {
    checkAuth();
    
    const handleLogoutEvent = () => {
        setAccessToken(null);
        setUser(null);
        setFighterPhoto(null);
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

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const data = await authService.loginWithEmail(email, password);
      localStorage.setItem("access_token", data.access);
      setAccessToken(data.access);
      setUser(data.user);
    } catch (error) {
      console.error("Email Login Error:", error);
      throw error;
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    try {
      return await authService.register(fullName, email, password);
    } catch (error) {
      console.error("Register Error:", error);
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
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, loginWithEmail, register, logout, checkAuth, fighterPhoto, setFighterPhoto, refreshFighterPhoto }}>
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
