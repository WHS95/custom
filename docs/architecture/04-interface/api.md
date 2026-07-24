# 인터페이스 뷰 — API & 서버액션

외부/클라이언트에 노출되는 계약. 근거: `src/app/api/*`, `src/app/actions/*`.
인증 표기: 🟢공개 · 👤회원 · 🧑‍🤝‍🧑크루 · 🔑관리자 · 🤝외부시스템.

## 주문 (Orders)

| 메서드/경로 | 인증 | 설명 |
|-------------|------|------|
| `POST /api/orders` | 🟢/👤/🧑‍🤝‍🧑 | 주문 생성. 인쇄색 검증·크루할인·Slack/Email 알림 |
| `GET /api/orders?phone=|userId=|admin=true` | 혼합 | 전화(게스트)/회원/관리자(페이지네이션) 목록. status/detail 필터 |
| `GET|PATCH /api/orders/[orderNumber]` | 🟢/🔑 | 상세 / 상태·메모 변경(관리자) |
| `PATCH /api/orders/[orderNumber]/design` | 👤/🧑‍🤝‍🧑 | design_confirmed 이전 디자인 수정 |
| `POST|GET /api/orders/[orderNumber]/attachments` | 혼합 | 첨부(.ai) 업로드/목록 (Supabase Storage) |
| `GET|POST /api/orders/[orderNumber]/shipping` | 🟢/🔑 | 배송조회 / 송장등록→shipped |
| `GET|PATCH /api/orders/[orderNumber]/payment` | 🟢/🔑 | Groble 결제링크·상태 조회 / 설정(관리자) |

## 상품 · 테넌트

| 메서드/경로 | 인증 | 설명 |
|-------------|------|------|
| `GET|POST /api/products` | 🟢/🔑 | 테넌트별 목록 / 생성. (`/api/products` s-maxage 3600 캐시) |
| `GET|PATCH|DELETE /api/products/[productId]` | 🟢/🔑 | 상세(영역포함)/수정/삭제 |
| `GET|PUT|DELETE /api/products/[productId]/areas` | 🟢/🔑 | 커스터마이즈 영역 upsert/삭제 |
| `POST|DELETE /api/products/[productId]/images` | 🔑 | 이미지(base64) 업로드/삭제 |
| `GET|PATCH /api/tenant` | 🟢/🔑 | 테넌트 설정 조회/수정 |
| `POST|DELETE /api/tenant/logo` | 🔑 | 로고 업로드/삭제 |
| `GET /api/tenants` | 🟢 | 전체 테넌트 |

## 인증 (고객)

| 경로 | 설명 |
|------|------|
| `POST /api/auth/signup` `\|` `/login` `\|` `/logout`, `GET /api/auth/session` | 이메일/비번 인증·세션 |
| `POST /api/auth/check-email` | 이메일 중복 확인 |
| `POST|PATCH /api/auth/profile` | 프로필 생성/수정 |
| `PATCH /api/auth/password`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password` | 비번 변경/재설정 |

## 관리자

| 경로 | 설명 |
|------|------|
| `POST /api/admin/login` `\|` `/logout`, `GET /api/admin/me` | 관리자 JWT 세션 |
| `GET|PUT /api/admin/crew-approvals` | crew_pending 목록 / 승인·거부 |

## 크루 취합 (Collections)

| 메서드/경로 | 인증 | 설명 |
|-------------|------|------|
| `POST /api/collections`, `GET /api/collections?mine=true` | 🧑‍🤝‍🧑 | 취합 링크 생성 / 내 취합 |
| `GET|PATCH /api/collections/[token]` | 🟢/🧑‍🤝‍🧑 | 정보(관리키 시 응답목록) / 마감·재오픈 |
| `POST|PATCH|DELETE /api/collections/[token]/responses` | 🟢 | 제출 / editToken·adminToken 으로 수정·삭제 |
| `POST /api/collections/[token]/convert` | 🧑‍🤝‍🧑 | 집계→주문 전환 |

## 크루 스토어

| 메서드/경로 | 인증 | 설명 |
|-------------|------|------|
| `GET /api/store/[storeToken]` | 🟢 | 스토어 + 등록 커스텀 상품(토큰 게이트) |
| `POST /api/store/register` | 🧑‍🤝‍🧑 | 스튜디오 디자인을 크루 상품(size_collection)으로 등록 |

## 크루/리뷰/SSO/웹훅

| 메서드/경로 | 인증 | 설명 |
|-------------|------|------|
| `GET /api/crews/search?q=` | 🟢 | 크로스앱 `public.crews` 검색 |
| `POST /api/crew-approval/notify` | 내부 | 프로필 생성 후 Slack 통지(fire-and-forget) |
| `GET|POST /api/reviews`, `GET|PATCH|DELETE /api/reviews/[reviewId]` | 🟢/🔑 | 리뷰 CRUD/승인 |
| `GET /api/sso/initiate` | 🟢 | 리다이렉트 SSO 시작(state 쿠키→IdP) |
| `POST /api/webhooks/groble` | 🤝 | 결제 웹훅(HMAC 서명·멱등) |

## 서버액션 (`src/app/actions/`)

| 액션 | 설명 |
|------|------|
| `crewLoginInline(instagram, pin)` | 백채널 SSO. IdP `POST /api/sso/verify-pin`(X-SSO-Client-Secret) → 검증 → jti 가드 → 세션 발급. 실패 시 `fallback:true`. PIN 미로깅 |

## 콜백 (라우트 핸들러)

| 경로 | 설명 |
|------|------|
| `GET /auth/callback` | Supabase OAuth(Kakao) 코드 교환 → 프로필 없으면 `/onboarding` |
| `GET /sso/callback` | SSO 리다이렉트 콜백(state·jwt·jti 검증 후 세션 발급) |

> 미들웨어 없음(`middleware.ts` 부재). 인증은 각 핸들러/서버컴포넌트에서 개별 강제.
