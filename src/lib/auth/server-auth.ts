import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/infrastructure/supabase/client";
import {
  AUTH_SESSION_COOKIE,
  createPasswordResetToken,
  createSessionToken,
  getPasswordResetExpiryDate,
  getSessionExpiryDate,
  hashSessionToken,
  normalizeEmail,
} from "./session";
import type { AuthSession, AuthUser, UserProfile } from "./types";

interface AuthUserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

interface AuthSessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

function getAuthClient() {
  return createServerSupabaseClient();
}

function mapAuthUser(row: AuthUserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
  };
}

export async function findAuthUserByEmail(email: string) {
  const supabase = getAuthClient();
  const { data, error } = await supabase
    .from("customer_auth_users")
    .select("id, email, password_hash, created_at, updated_at")
    .eq("email", normalizeEmail(email))
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as AuthUserRow | null) ?? null;
}

export async function findAuthUserById(userId: string) {
  const supabase = getAuthClient();
  const { data, error } = await supabase
    .from("customer_auth_users")
    .select("id, email, password_hash, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as AuthUserRow | null) ?? null;
}

export async function createAuthUser(params: {
  id: string;
  email: string;
  passwordHash: string;
}) {
  const supabase = getAuthClient();
  const { data, error } = await supabase
    .from("customer_auth_users")
    .insert({
      id: params.id,
      email: normalizeEmail(params.email),
      password_hash: params.passwordHash,
    })
    .select("id, email, password_hash, created_at, updated_at")
    .single();

  if (error) {
    throw error;
  }

  return data as AuthUserRow;
}

export async function deleteAuthUser(userId: string) {
  const supabase = getAuthClient();
  const { error } = await supabase
    .from("customer_auth_users")
    .delete()
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function updateAuthUserPassword(userId: string, passwordHash: string) {
  const supabase = getAuthClient();
  const { error } = await supabase
    .from("customer_auth_users")
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function createSessionForUser(userId: string) {
  const supabase = getAuthClient();
  const token = createSessionToken();
  const expiresAt = getSessionExpiryDate();

  const { error } = await supabase
    .from("customer_auth_sessions")
    .insert({
      user_id: userId,
      token_hash: hashSessionToken(token),
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    throw error;
  }

  return {
    token,
    expiresAt,
  };
}

export async function deleteSessionByToken(token: string) {
  const supabase = getAuthClient();
  const { error } = await supabase
    .from("customer_auth_sessions")
    .delete()
    .eq("token_hash", hashSessionToken(token));

  if (error) {
    throw error;
  }
}

export async function getAuthSessionByToken(token: string) {
  const supabase = getAuthClient();
  const tokenHash = hashSessionToken(token);
  const now = new Date().toISOString();

  const { data: sessionData, error: sessionError } = await supabase
    .from("customer_auth_sessions")
    .select("id, user_id, token_hash, expires_at, created_at")
    .eq("token_hash", tokenHash)
    .gt("expires_at", now)
    .maybeSingle();

  if (sessionError) {
    throw sessionError;
  }

  if (!sessionData) {
    return null;
  }

  const session = sessionData as AuthSessionRow;
  const user = await findAuthUserById(session.user_id);

  if (!user) {
    return null;
  }

  return {
    session: {
      expiresAt: session.expires_at,
      user: mapAuthUser(user),
    } satisfies AuthSession,
    user: mapAuthUser(user),
  };
}

export async function getCurrentAuthState() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  if (!token) {
    return {
      session: null,
      user: null,
      profile: null,
    };
  }

  const authState = await getAuthSessionByToken(token);

  if (!authState?.user) {
    return {
      session: null,
      user: null,
      profile: null,
    };
  }

  const supabase = getAuthClient();
  const { data: profileData, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", authState.user.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  return {
    session: authState.session,
    user: authState.user,
    profile: (profileData as UserProfile | null) ?? null,
  };
}

export async function getCurrentAuthUser() {
  const { user } = await getCurrentAuthState();
  return user;
}

export async function getCurrentAuthUserProfile() {
  const { profile } = await getCurrentAuthState();
  return profile;
}

export async function createPasswordResetTokenForUser(userId: string) {
  const supabase = getAuthClient();
  const token = createPasswordResetToken();
  const expiresAt = getPasswordResetExpiryDate();

  await supabase
    .from("customer_password_reset_tokens")
    .delete()
    .eq("user_id", userId)
    .is("used_at", null);

  const { error } = await supabase
    .from("customer_password_reset_tokens")
    .insert({
      user_id: userId,
      token_hash: hashSessionToken(token),
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    throw error;
  }

  return {
    token,
    expiresAt,
  };
}

export async function getPasswordResetToken(token: string) {
  const supabase = getAuthClient();
  const { data, error } = await supabase
    .from("customer_password_reset_tokens")
    .select("id, user_id, token_hash, expires_at, used_at, created_at")
    .eq("token_hash", hashSessionToken(token))
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function markPasswordResetTokenUsed(tokenId: string) {
  const supabase = getAuthClient();
  const { error } = await supabase
    .from("customer_password_reset_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenId);

  if (error) {
    throw error;
  }
}
