"use client";

import type {
  AuthResult,
  AuthStatePayload,
  AuthStrategy,
  SignUpParams,
} from "@/lib/auth/types";

async function parseError(response: Response) {
  try {
    const data = await response.json();
    return new Error(data.error || "요청 처리 중 오류가 발생했습니다.");
  } catch {
    return new Error("요청 처리 중 오류가 발생했습니다.");
  }
}

async function request<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}

export class EmailPasswordAuthStrategy implements AuthStrategy {
  async getSession(): Promise<AuthStatePayload> {
    return request<AuthStatePayload>("/api/auth/session");
  }

  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      await request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async signUp(params: SignUpParams): Promise<AuthResult> {
    try {
      await request("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async signOut(): Promise<void> {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
  }

  async resetPassword(email: string): Promise<AuthResult> {
    try {
      const data = await request<{ previewUrl?: string }>("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      return {
        error: null,
        meta: {
          previewUrl: data.previewUrl,
        },
      };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async updatePassword(password: string): Promise<AuthResult> {
    try {
      await request("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }
}

let authStrategy: AuthStrategy | null = null;

export function getAuthStrategy() {
  if (!authStrategy) {
    authStrategy = new EmailPasswordAuthStrategy();
  }

  return authStrategy;
}
