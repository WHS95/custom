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

> **로그인 UI 주의**: `/login` 페이지는 **크루 SSO 로그인 전용**(인스타 핸들 + PIN →
> `crewLoginInline` 서버 액션 → IdP `/api/sso/verify-pin` 백채널). 이메일/비번 로그인은
> `POST /api/auth/login` API만 존재하고 **이를 쓰는 UI 페이지는 현재 없다**.
> SSO 계정(`sso-{핸들}@runhouse-sso.internal`)은 `password_hash="sso-no-password"`로
> 이메일 로그인이 의도적으로 차단됨.
>
> **클라이언트 인증 상태 갱신 규칙**: `AuthProvider`는 마운트 시 1회만 세션을 로드한다.
> 따라서 **로그인 성공 콜백은 반드시 `refreshProfile()`을 호출한 뒤 이동**해야 한다
> (`router.replace`만 하면 profile이 null로 남아 crew_staff 전용 UI가 안 보임).
> 적용처: `/login`, `/cart` 인라인 로그인, `GuestIntentModal`.

## 장바구니 (Cart)

| 경로 | 설명 |
|------|------|
| `GET /api/cart` | 로그인 사용자의 `user_carts` 조회 (비로그인 시 빈 배열) |
| `PUT /api/cart` | 장바구니 전체 교체(기존 삭제 후 재삽입) |

> `user_carts`는 RLS가 `auth.uid()=user_id` 기준이나 앱은 커스텀 인증을 써서 anon 브라우저 쓰기가 막힌다.
> 그래서 이 라우트에서 **service_role**로 처리하고, `user_id`는 세션 쿠키에서 서버가 도출한다(클라이언트 값 미신뢰).
> 클라이언트 `cart-store`의 `syncFromDB`/`syncToDB`가 이 엔드포인트를 호출한다.

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

> 스튜디오의 "우리 크루 상품으로 등록" 버튼(`ProductSidebar`)은
> `isAuthenticated && profile.user_type === "crew_staff"`일 때만 렌더된다.
> 버튼이 안 보이면: ① 비로그인 ② user_type이 individual/crew_pending
> ③ 로그인 후 `refreshProfile()` 미호출로 클라이언트 profile이 stale (인증 섹션 참조).

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
