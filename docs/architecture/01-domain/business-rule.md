# 비즈니스 규칙 (Business Rules)

코드에 구현된 도메인 규칙을 단일 출처로 정리한다. 각 규칙은 근거 파일을 명시한다.

## 서비스 정의 — BR-0 (2026-07-25 피벗)
- **크루 상점이 메인.** 유일한 메인 루프: 크루 운영진 커스텀 → **공장 제작 가능 여부 확인(필수)**
  → 상점 굿즈 등록 → 링크 공유 → 크루원 취합(이름+뒷4자리, 로그인 불필요) → 일괄 주문(convert/convert-all).
- **제작 가능 게이트 — BR-0a**: 등록 전 `manufacture_reviews` 승인이 필수.
  크루장 요청(pending) → 공장 사장님 토큰 링크(`/review/{token}`)로 제작가능/불가 판정
  → 승인(`approved`)된 리뷰의 디자인만 상점 등록 가능(`POST /api/store/register`는 reviewId+approved 검증).
  알림은 Discord 웹훅(공장 채널: 신규 문의 / 운영자 채널: 판정 결과). 리뷰 1건당 등록 1회
  (`registered_collection_id`로 중복 차단). 근거: `api/manufacture-reviews/*`, `lib/discord-notify.ts`.
- **개인 장바구니·직접 구매는 보류(휴면)**: `/cart`·`/api/cart`·cart-store는 코드 유지,
  UI 진입점만 제거. 삭제 아님 — 부활 가능성 유지 (오너 결정).
- 가입 = 크루 단일 트랙 (`individual` 유형 신규 발급 중단, 기존 계정 유지).
- 상점 굿즈 등록은 `crew_staff`만 가능 (`POST /api/store/register` 서버 검증).
- 독립 취합 생성기(`/collect/new`)는 상점으로 흡수·제거(홈 redirect).
  기존 `/collect/{token}` 참여·manage 링크는 하위 호환 유지.
- 근거: 피벗 계획 문서(2026-07-25), `ProductSidebar.tsx`, `api/store/register`, `api/store/mine`.

## 주문번호 생성 — BR-1
- 형식: `{테넌트 2글자 접두}-{YYYYMMDD}-{3자리 시퀀스}` (예: `RH-20241219-001`).
- 시퀀스는 테넌트·당일 기준. DB 함수 `generate_order_number(p_tenant_id)` / `get_today_order_count(p_tenant_id)`.
- 근거: `src/domain/order/index.ts`(`generateOrderNumber`), 마이그레이션 DB 함수.

## 주문 상태 전이 / 진행률 — BR-2
- 상태 순서: `pending → design_confirmed → preparing → in_production → shipped → delivered`, 별도 `cancelled`.
- 진행률 `calculateOrderProgress(status)`: `ORDER_STATUS_ORDER` 내 위치의 백분율. `cancelled` = 0%.
- 상태 전이는 `order_status_history`에 from→to로 기록.
- 근거: `src/domain/order/index.ts`(`OrderStatus`, `ORDER_STATUS_ORDER`, `ORDER_STATUS_LABELS`, `calculateOrderProgress`).

## 가격 계산 — BR-3 (수량 티어)
- `getUnitPrice(basePrice, quantity, priceTiers)`: `minQuantity ≤ quantity` 인 티어 중 **가장 큰 minQuantity** 티어의 단가 선택. 없으면 `basePrice`.
- 부수: `getDiscountAmount`, `getDiscountRate(%)`, `getBestTier`, `sortPriceTiers`.
- 근거: `src/lib/pricing/price-calculator.ts`.

## 크루 할인 — BR-4
- **기능 접근과 할인 승인 분리(mig 011)**: 크루 가입 시 즉시 `crew_staff`(상점·제작·알림 전체 기능)가 되지만, **10% 할인가는 `discount_status='approved'`일 때만** 적용된다. `user_type`이 아닌 `discount_status`가 할인 게이트다.
- `discount_status`: `null`(개인) | `pending`(가입 직후) | `approved` | `rejected`.
- 정액 10% 할인(`CREW_DISCOUNT_RATE = 0.1`), `getCrewDiscountAmount(subtotal, isApproved) = floor(subtotal * 0.1)`.
- **적용 순서: 수량 티어 할인 후 → 크루 할인**.
- 승인 흐름: 가입 → `discount_status='pending'` + **Discord OPERATOR 웹훅**(`notifyCrewDiscountRequest`, 크루맵 등록여부 포함) → 관리자 `PUT /api/admin/crew-approvals` → `approved`/`rejected`(+`discount_reviewed_at`) → 가입자 마이페이지·알림에 반영.
- 근거: `src/lib/pricing/crew-discount.ts`, 게이트 `src/app/cart/page.tsx`·`POST /api/orders`(`discount_status==='approved'`).

## 인쇄 색상 제약 — BR-5
- 텍스트 레이어의 색상은 테넌트 인쇄 팔레트(`isAllowedPrintColor`) 내에서만 허용.
- 주문 생성 시 검증하여 위반 시 거부.
- 근거: `POST /api/orders` 라우트, `src/lib/constants/print-color-palette.ts`.

## 커스터마이즈 영역 — BR-6
- 인쇄 존은 상품·뷰(front/back/left/right/top)별로 정의. `colorId = null`이면 모든 색상 공통.
- 좌표는 백분율(zone_x/y/width/height).
- 근거: `src/domain/product/types.ts`(`CustomizableArea`), `product_customizable_areas` 테이블.

## 리뷰 승인 — BR-7
- 리뷰 최초 상태 `pending`. 관리자 승인 시 `approved`(+`approved_at`), 거부 시 `rejected`.
- 공개 갤러리에는 `approved`만 노출(RLS: anon은 approved SELECT / pending INSERT만).
- 평점은 1–5 (DB CHECK). 근거: 마이그레이션 004, `src/domain/review/*`.

## 사이즈 취합 → 주문 전환 — BR-8
- 취합 상태 open/closed/ordered. 응답 수량은 1–20 (DB CHECK).
- 전환(`convert`): 응답을 **색상×사이즈로 집계**하여 하나의 주문(order_items)으로 생성, 취합 상태 `ordered`.
- 근거: `POST /api/collections/[token]/convert`, 마이그레이션 005/007/008.

## 크루 스토어 등록 — BR-9
- 크루 계정당 스토어 1개 자동 생성. 스튜디오 디자인 등록 시 **디자인 스냅샷이 붙은 size_collection** 생성.
- 즉, 크루 상품은 취합/집계/주문 파이프라인(BR-8)을 재사용.
- 근거: `POST /api/store/register`, `crew_stores`/`size_collections(design_snapshot, store_id)`.

## 결제 정산 (Groble 웹훅) — BR-10
- 자체 PG 없음. 주문에 외부 Groble 결제 링크 저장(`payment_link`, `payment_status`).
- 웹훅 `payment.completed` 수신 시 **전화번호+금액**으로 `unpaid` 주문 매칭 → `paid`(+`paid_at`).
- 서명 검증: `X-Groble-Signature = HMAC-SHA256(secret, "{timestamp}.{rawBody}")`, ±5분 허용, 멱등키 저장.
- 근거: `POST /api/webhooks/groble`, `groble_webhook_events`.

## SSO 세션 발급 — BR-11
- IdP 토큰 검증(iss/aud/exp, HS256) → jti 1회성(`used_sso_tokens`, 유니크 위반=재생) → 크루 계정 upsert → 앱 세션 쿠키 발급.
- 크루 스텁 계정은 `password_hash="sso-no-password"`로 직접 로그인 차단.
- 근거: `src/lib/sso/verify-token.ts`, `crew-account.ts`, `/sso/callback`, `actions/crew-login.ts`.
