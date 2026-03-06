/**
 * 크루 승인 토큰 유틸리티
 *
 * HMAC-SHA256으로 서명된 토큰을 생성/검증
 * 토큰 형식: base64url(userId:email:crewName:timestamp):signature
 */

import { createHmac } from "crypto";

const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret";

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 32);
}

function toBase64Url(str: string): string {
  return Buffer.from(str, "utf-8").toString("base64url");
}

function fromBase64Url(str: string): string {
  return Buffer.from(str, "base64url").toString("utf-8");
}

export interface ApprovalTokenPayload {
  email: string;
  crewName: string;
  timestamp: number;
}

/**
 * 크루 승인 요청 토큰 생성
 */
export function generateApprovalToken(email: string, crewName: string): string {
  const timestamp = Date.now();
  const payload = `${email}:${crewName}:${timestamp}`;
  const encoded = toBase64Url(payload);
  const signature = sign(payload);
  return `${encoded}.${signature}`;
}

/**
 * 토큰 검증 및 페이로드 반환
 * 유효하지 않으면 null 반환
 */
export function verifyApprovalToken(token: string): ApprovalTokenPayload | null {
  try {
    const [encoded, signature] = token.split(".");
    if (!encoded || !signature) return null;

    const payload = fromBase64Url(encoded);
    const expectedSig = sign(payload);

    if (signature !== expectedSig) return null;

    const parts = payload.split(":");
    if (parts.length < 3) return null;

    const timestamp = parseInt(parts[parts.length - 1], 10);
    const crewName = parts[parts.length - 2];
    const email = parts.slice(0, parts.length - 2).join(":");

    // 7일 만료
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > SEVEN_DAYS) return null;

    return { email, crewName, timestamp };
  } catch {
    return null;
  }
}
