/**
 * SSO JWT 페이로드 — RunHouse IdP와의 계약 (§1 고정값)
 */
export interface SsoTokenPayload {
  iss: "runhouse-idp";
  aud: "custom_hat";
  sub: string; // crew_id (uuid from RunningCrewMap crews.id)
  instagram: string; // lowercase, no @
  crew_name: string;
  logo_url: string | null;
  jti: string; // unique token id for replay prevention
  iat: number;
  exp: number;
}

export interface CrewSsoSession {
  crewId: string; // == sub
  instagram: string;
  crewName: string;
  logoUrl: string | null;
}
