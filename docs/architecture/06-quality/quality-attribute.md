# 품질 속성 (Quality Attributes)

주요 품질 속성과 이를 달성하는 아키텍처 수단을 시나리오로 정리한다.
(자극→응답 형식. 근거 파일 명시.)

## 보안 (Security)

| ID | 시나리오 | 아키텍처 대응 | 근거 |
|----|----------|----------------|------|
| SEC-1 | 인증 경계 격리 | 고객/크루SSO/관리자 **3개 독립 세션** 체계 | `lib/auth/session.ts`, `admin-auth.ts`, `sso/*` |
| SEC-2 | 세션 토큰 유출 대비 | 토큰은 **SHA-256 해시 저장**, httpOnly·sameSite lax·prod secure 쿠키 | `lib/auth/session.ts` |
| SEC-3 | 비밀번호 보호 | `bcryptjs` (cost 10) 해시 | `api/auth/signup`, `login` |
| SEC-4 | SSO 재생공격 방지 | jti를 `used_sso_tokens`에 유니크 저장(23505=재생), CSRF state 1회용, 5s clock tolerance | `sso/verify-token.ts`, `/sso/callback` |
| SEC-5 | 토큰 URL 유출 방지 | `/sso/*`에 `Referrer-Policy: no-referrer` | `next.config.ts` |
| SEC-6 | 웹훅 위·변조 방지 | HMAC-SHA256 서명 검증 + ±5분 타임스탬프 + 멱등키, 시크릿 로테이션 | `api/webhooks/groble` |
| SEC-7 | 관리자 테넌트 격리 | `session.tenantSlug === tenantSlug` 검증, 테넌트 스코프 라우트 | `admin-auth.ts`, `/admin/[tenantSlug]/*` |
| SEC-8 | 데이터 접근 통제 | Postgres RLS(Service role 전체 + 제한된 anon), service-role은 서버 전용 | 마이그레이션 003–008 |
| SEC-9 | 민감정보 미로깅 | 백채널 PIN 로그 금지 | `actions/crew-login.ts` |
| SEC-10 | 커스텀 인증 ↔ RLS 정합 | RLS가 `auth.uid()` 기준인 테이블은 커스텀 인증(`customer_auth_users`)에서 anon 브라우저 쓰기가 막힘. 해당 쓰기는 **service_role 서버 라우트**로 처리하고 `user_id`는 세션 쿠키에서 서버가 도출(클라이언트 값 미신뢰) | `api/cart` (user_carts) |

## 성능 (Performance)

| ID | 시나리오 | 대응 | 근거 |
|----|----------|------|------|
| PERF-1 | 상품 목록 반복 조회 | `/api/products` `s-maxage 3600` 캐시 | `next.config.ts` |
| PERF-2 | 이미지 전송량 | AVIF/WebP 변환 + 1년 캐시 | `next.config.ts` images |
| PERF-3 | 정적 자산 | `/_next/static` immutable | `next.config.ts` |
| PERF-4 | 초기 렌더 | RSC/SSR로 상품·주문 서버 렌더 | `app/page.tsx`, `studio/order` 서버 컴포넌트 |
| PERF-5 | 번들 크기 | `optimizePackageImports: lucide-react` | `next.config.ts` |
| PERF-6 | 관리자 통계 | 상태별 카운트 **병렬 조회** | `order-service.getOrderStats` |

## 유지보수성 (Maintainability)

| ID | 시나리오 | 대응 |
|----|----------|------|
| MNT-1 | 규칙 변경 국소화 | DDD 레이어링(도메인 순수, 리포지토리 인터페이스/구현 분리) |
| MNT-2 | 데이터 접근 교체 | Supabase 클라이언트 3종 팩토리 + 리포지토리 싱글턴 |
| MNT-3 | 파이프라인 재사용 | 크루 스토어 상품 = size_collection 재사용(BR-8/9)으로 경로 단일화 |
| MNT-4 | 1인 개발 맥락 | 문서-코드 동기화 규칙(CLAUDE.md), 이 AD가 변경 영향 범위 안내 |
| MNT-5 | 단일 출처 | 상태·라벨·가격 규칙을 코드 enum/함수에 집중, 문서는 이를 인용 |

## 신뢰성 / 정합성 (Reliability)

| ID | 시나리오 | 대응 |
|----|----------|------|
| REL-1 | 중복 결제 통지 | 웹훅 멱등키(`groble_webhook_events`) |
| REL-2 | 알림 실패가 주문 차단 안 함 | Slack/Email **비동기 fire-and-forget** |
| REL-3 | 주문 이력 추적 | `order_status_history` from→to 기록 |
| REL-4 | 참조 정합성 | FK CASCADE/SET NULL 정책(02-data 참고) |

## 관측성 (Observability)

| ID | 시나리오 | 대응 |
|----|----------|------|
| OBS-1 | 사용자 행동 분석 | PostHog(`hat_studio_opened`, `hat_order_started`, `guest_intent_*`), `identified_only` |
| OBS-2 | 운영 이벤트 인지 | Slack 알림(신규주문·결제·크루승인) |
| OBS-3 | 프라이버시 | dev에서 분석 비활성, 크로스앱 anon id(`rh_anon`) |

## 사용성 (Usability)

- 게스트도 전화번호로 주문 조회 가능(`/dashboard`), 크루 인라인 로그인(PIN)으로 마찰 최소화.
- 상세 UI/디자인 시스템은 `docs/design-system/` 에서 별도 관리.
