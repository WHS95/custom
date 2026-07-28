"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { getAuthStrategy } from "@/lib/auth/strategies/email-password-strategy";
import type {
  AuthSession,
  AuthUser,
  SignUpParams,
  UserProfile,
} from "@/lib/auth/types";

/**
 * 인증 컨텍스트 타입
 */
interface AuthContextType {
  // 상태
  user: AuthUser | null;
  profile: UserProfile | null;
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;

  // 액션
  signUp: (params: SignUpParams) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider
 * 애플리케이션 전체에서 인증 상태를 관리
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const authStrategy = getAuthStrategy();

  const refreshProfile = async () => {
    try {
      const authState = await authStrategy.getSession();
      setSession(authState.session);
      setUser(authState.user);
      setProfile(authState.profile);
    } catch (error) {
      console.error("세션 새로고침 에러:", error);
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

  /**
   * 초기 세션 로드 및 리스너 설정
   */
  useEffect(() => {
    const initSession = async () => {
      try {
        const authState = await authStrategy.getSession();
        setSession(authState.session);
        setUser(authState.user);
        setProfile(authState.profile);
      } catch (error) {
        console.error("세션 초기화 에러:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, [authStrategy]);

  /**
   * 회원가입
   */
  const signUp = async (params: SignUpParams) => {
    const { email, password, name, userType, crewName, instagram, runhouseMapRegistered } =
      params;

    try {
      const { error } = await authStrategy.signUp({
        email,
        password,
        name,
        userType,
        crewName,
        instagram,
        runhouseMapRegistered,
      });

      if (error) {
        return { error };
      }

      await refreshProfile();
      router.refresh();

      return { error: null };
    } catch (error) {
      console.error("회원가입 에러:", error);
      return { error: error as Error };
    }
  };

  /**
   * 로그인
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await authStrategy.signIn(email, password);

    if (!error) {
      await refreshProfile();
      router.refresh();
    }

    return { error };
  };

  /**
   * 로그아웃
   */
  const signOut = async () => {
    try {
      await authStrategy.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      router.refresh();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  /**
   * 비밀번호 재설정 이메일 발송
   */
  const resetPassword = async (email: string) => {
    return authStrategy.resetPassword(email);
  };

  /**
   * 비밀번호 변경
   */
  const updatePassword = async (password: string) => {
    try {
      return await authStrategy.updatePassword(password);
    } catch (err) {
      console.error("비밀번호 변경 예외:", err);
      return { error: err as Error };
    }
  };

  // 로그인은 되어 있지만 프로필이 없는 경우 (OAuth 최초 로그인)
  const needsOnboarding = !!user && !profile && !isLoading;

  // 프로필 없는 유저 → 온보딩 페이지로 리다이렉트
  useEffect(() => {
    if (needsOnboarding && pathname !== "/onboarding") {
      router.push("/onboarding");
    }
  }, [needsOnboarding, pathname, router]);

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!user,
    needsOnboarding,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth 훅
 * 컴포넌트에서 인증 상태와 메서드에 접근
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

/**
 * 인증 필요 체크 훅
 * 비로그인 시 로그인 페이지로 리다이렉트
 */
export function useRequireAuth(redirectTo = "/login") {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  return { isAuthenticated, isLoading };
}
