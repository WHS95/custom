"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/infrastructure/supabase/client";

/**
 * 사용자 프로필 타입
 */
export interface UserProfile {
  id: string;
  user_id: string;
  tenant_id: string;
  name: string;
  phone: string;
  user_type: "individual" | "crew_staff";
  crew_name: string | null;
  default_address: {
    recipientName: string;
    phone: string;
    zipCode: string;
    address: string;
    addressDetail: string;
    memo?: string;
  } | null;
  marketing_agreed: boolean;
  marketing_agreed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 인증 컨텍스트 타입
 */
interface AuthContextType {
  // 상태
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // 액션
  signUp: (params: SignUpParams) => Promise<{ error: AuthError | Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

/**
 * 회원가입 파라미터
 */
export interface SignUpParams {
  email: string;
  password: string;
  name: string;
  userType: "individual" | "crew_staff";
  crewName?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider
 * 애플리케이션 전체에서 인증 상태를 관리
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const supabase = getSupabaseBrowserClient();

  /**
   * 사용자 프로필 가져오기
   */
  const fetchProfile = useCallback(
    async (userId: string) => {
      try {
        const { data, error } = await supabase
          .schema("runhousecustom")
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) {
          console.error("프로필 조회 에러:", error);
          return null;
        }

        return data as UserProfile | null;
      } catch (error) {
        console.error("프로필 조회 에러:", error);
        return null;
      }
    },
    [supabase]
  );

  /**
   * 프로필 새로고침
   */
  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  /**
   * 초기 세션 로드 및 리스너 설정
   */
  useEffect(() => {
    // 현재 세션 확인
    const initSession = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const profileData = await fetchProfile(currentSession.user.id);
          setProfile(profileData);
        }
      } catch (error) {
        console.error("세션 초기화 에러:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // 인증 상태 변경 리스너
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log("Auth state changed:", event);
      
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // 비동기 작업을 별도로 실행하여 이벤트 핸들러 블로킹 방지
        fetchProfile(newSession.user.id).then((profileData) => {
          setProfile(profileData);
        });
      } else {
        setProfile(null);
      }

      // 라우터 새로고침으로 서버 컴포넌트 갱신
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile, router]);

  /**
   * 회원가입
   */
  const signUp = async (params: SignUpParams) => {
    const { email, password, name, userType, crewName } = params;

    try {
      // 1. Supabase Auth에 사용자 생성
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            user_type: userType,
            crew_name: crewName,
          },
        },
      });

      if (authError) {
        return { error: authError };
      }

      if (!authData.user) {
        return { error: new Error("사용자 생성에 실패했습니다.") };
      }

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  /**
   * 로그아웃
   */
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { error };
  };

  /**
   * 비밀번호 변경
   */
  const updatePassword = async (password: string) => {
    try {
      console.log("Attempting to update password...");

      // 세션 확인
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        console.error("No active session found");
        return { error: { message: "로그인이 필요합니다.", name: "AuthError", status: 401 } as AuthError };
      }
      console.log("Session found for user:", currentSession.user.id);

      // updateUser 호출 with timeout
      const timeoutPromise = new Promise<{ error: AuthError; data: null }>((_, reject) => 
        setTimeout(() => reject(new Error("Request timeout")), 30000)
      );

      const updatePromise = supabase.auth.updateUser({ password });
      
      console.log("Calling updateUser...");
      const result = await Promise.race([updatePromise, timeoutPromise]);
      console.log("updateUser completed:", result);

      if (result.error) {
        console.error("Password update failed:", result.error);
      } else {
        console.log("Password update success:", result.data);
      }
      
      return { error: result.error };
    } catch (err) {
      console.error("비밀번호 변경 예외:", err);
      return { error: err as AuthError };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated: !!user,
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
