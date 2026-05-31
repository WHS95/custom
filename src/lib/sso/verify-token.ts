/**
 * SSO JWT 검증 (서버 전용)
 * §1 계약: HS256, iss=runhouse-idp, aud=custom_hat, exp 검증
 */
import { jwtVerify } from "jose";
import type { SsoTokenPayload } from "./types";

const SSO_CLIENT_ID = "custom_hat";

export async function verifySsoToken(token: string): Promise<SsoTokenPayload> {
  // Fix A: trim to match IdP secret derivation; require >=32 chars
  const secret = process.env.RUNHOUSE_SSO_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error(
      "RUNHOUSE_SSO_SECRET is not configured or is shorter than 32 characters",
    );
  }

  const secretBytes = new TextEncoder().encode(secret);

  // Fix B: add clockTolerance to handle minor clock skew between RP and IdP
  const { payload } = await jwtVerify(token, secretBytes, {
    algorithms: ["HS256"],
    issuer: "runhouse-idp",
    audience: SSO_CLIENT_ID,
    clockTolerance: 5,
  });

  // jose already verified iss, aud, exp — cast to our known shape
  return payload as unknown as SsoTokenPayload;
}
