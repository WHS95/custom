export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
  };
}

export interface AuthSession {
  expiresAt: string;
  user: AuthUser;
}

export interface UserProfile {
  id: string;
  user_id: string;
  tenant_id: string;
  name: string;
  phone: string;
  user_type: "individual" | "crew_staff" | "crew_pending";
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

export interface SignUpParams {
  email: string;
  password: string;
  name: string;
  userType: "individual" | "crew_staff" | "crew_pending";
  crewName?: string;
}

export interface AuthStatePayload {
  session: AuthSession | null;
  user: AuthUser | null;
  profile: UserProfile | null;
}

export interface AuthResult {
  error: Error | null;
  meta?: {
    previewUrl?: string;
  };
}

export interface AuthStrategy {
  getSession(): Promise<AuthStatePayload>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(params: SignUpParams): Promise<AuthResult>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<AuthResult>;
  updatePassword(password: string): Promise<AuthResult>;
}
