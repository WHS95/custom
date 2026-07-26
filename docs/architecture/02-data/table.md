# 테이블 명세 (Table Reference)

스키마 `runhousecustom`. JSONB 컬럼은 도메인 VO를 직렬화한다. 근거는 [erd.md](./erd.md)와 동일.

## 커머스 코어

### tenants
| 컬럼 | 비고 |
|------|------|
| id (PK), name, slug | 기본 테넌트 `런하우스`(a0000000-…-0001) |
| logo_url, contact_email, contact_phone | |
| settings (JSONB) | 스튜디오/가격 기본값(basePrice 22400, 배송무료 50000, 배송비 3000, KRW 등) |

### products
`id(PK)`, `tenant_id→tenants`, `name`, `slug`, `description`, `category`(hat/clothing/accessory),
`base_price`, `images(JSONB)`, `variants(JSONB)`, `price_tiers(JSONB)`, `detail_image_url`,
`admin_message`, `is_active`, `sort_order`.

### product_customizable_areas
`id(PK)`, `product_id→products`, `color_id`(nullable=공통), `view_name`(front/back/left/right/top),
`display_name`, `zone_x/y/width/height`(%), `image_url`, `is_enabled`, `sort_order`.

### customers
`id(PK)`, `tenant_id→tenants`, `name`, `email`, `phone`, `organization_name`.

### orders
`id(PK)`, `tenant_id→tenants`, `customer_id→customers`, `user_id→customer_auth_users(SET NULL)`,
`order_number`, `customer_name/phone/email`, `subtotal`, `shipping_cost`, `total_amount`,
`shipping_info(JSONB)`, `status`(enum order_status), `admin_memo`, `attachment_files(JSONB)`,
`payment_link`, `payment_status`, `paid_at`.

### order_items
`id(PK)`, `order_id→orders`, `product_id`, `product_name`, `color`, `color_label`, `size`,
`quantity`, `unit_price`, `total_price`, `design_snapshot(JSONB)`.

### order_status_history
`id(PK)`, `order_id→orders`, `from_status`(enum,null), `to_status`(enum), `changed_by`, `memo`.

## 리뷰 (mig 004)

### reviews
`id(PK)`, `tenant_id→tenants`, `order_id→orders(SET NULL)`, `author_type`(admin/customer),
`author_name`, `organization_name`, `title`, `content`, `rating`(CHECK 1–5), `images(JSONB)`,
`status`(enum review_status), `admin_memo`, `is_featured`, `sort_order`, `approved_at`. **RLS 활성.**

## 크루 취합/스토어 (mig 005/007/008)

### size_collections
`id(PK)`, `tenant_id→tenants`, `token`(UNIQUE), `admin_token`(UNIQUE), `title`, `crew_name`,
`product_id→products(SET NULL)`, `allowed_colors(JSONB)`, `unit_price`, `deposit_info`, `deadline`,
`status`(open/closed/ordered), `order_number`, `creator_user_id`,
`design_snapshot(JSONB)`·`design_color_id`(mig 007), `store_id→crew_stores(SET NULL)`(mig 008). **RLS.**

### size_collection_responses
`id(PK)`, `collection_id→size_collections(CASCADE)`, `name`, `color_id`, `size`,
`quantity`(CHECK 1–20), `note`, `is_paid`, `edit_token`,
`phone_last4`·`submission_id`(mig 009). **RLS.**
> 1행 = 한 사람의 한 사이즈. 한 번의 제출(여러 사이즈·여러 굿즈)은 공통
> `submission_id`로 묶인다(상품 경계를 넘음). 본인 확인은 `name`+`phone_last4`
> (크로스 기기) 또는 `edit_token`(localStorage). 입금 관리는 UI에서 제거됨
> (is_paid 컬럼은 유지).

### crew_stores (mig 008)
`id(PK)`, `tenant_id→tenants`, `creator_user_id`, `crew_name`, `store_token`,
`open_from`·`open_until`(mig 009 — 상점 운영기간, NULL=상시). **RLS.**

### manufacture_reviews (mig 010)
`id(PK)`, `tenant_id→tenants(CASCADE)`, `creator_user_id→customer_auth_users(CASCADE)`,
`crew_name`, `product_id`, `color_id`, `design_snapshot(JSONB)`, `attachments(JSONB)`,
`note`, `status`(pending/approved/rejected), `review_token`(UNIQUE, 공장 링크),
`factory_comment`, `reviewed_at`, `registered_collection_id→size_collections(SET NULL)`. **RLS.**
> 등록 전 제작 가능 여부 게이트(BR-0a). 승인된 리뷰만 상점 등록 가능,
> `registered_collection_id`로 리뷰당 등록 1회. 첨부는 order-attachments 버킷
> `manufacture-reviews/{id}/` 재사용.

## 결제 정산 (mig 006)

### groble_webhook_events
`id(PK)`, `event_id`, `event_type`, `idempotency_key`, `matched_order_id→orders(SET NULL)`,
`payload(JSONB)`, `processed`. **RLS.**

## 인증 / 계정 (custom-email-auth.sql)

### customer_auth_users
`id(uuid PK)`, `email`(UNIQUE), `password_hash`. (SSO 스텁은 `"sso-no-password"`)

### customer_auth_sessions
`id(PK)`, `user_id→customer_auth_users(CASCADE)`, `token_hash`(UNIQUE, SHA-256), `expires_at`.

### customer_password_reset_tokens
`id(PK)`, `user_id→…(CASCADE)`, `token_hash`(UNIQUE), `expires_at`, `used_at`.

### user_profiles
`id(PK)`, `user_id→customer_auth_users(UNIQUE, CASCADE)`, `tenant_id→tenants`, `name`, `phone`,
`user_type`(enum), `crew_name`, `default_address(JSONB)`, `marketing_agreed`(+`_at`).

### user_carts
`id(PK)`, `user_id→customer_auth_users(CASCADE)`, `tenant_id→tenants`(NOT NULL, DEFAULT 기본 테넌트),
`product_id`, `product_name`, `color`, `color_label`, `size`, `quantity`, `unit_price`, `design_layers(JSONB)`. **RLS.**
> ⚠️ **RLS 주의**: 정책이 `auth.uid() = user_id` 기준인데, 이 앱은 Supabase Auth가 아닌 커스텀
> `customer_auth_users` 인증을 쓰므로 브라우저(anon) 클라이언트에서는 `auth.uid()`가 항상 null이다.
> 따라서 브라우저에서 직접 insert/update하면 RLS에 막힌다(과거 "장바구니 저장 에러: {}"의 실제 원인).
> → 장바구니 읽기/쓰기는 `GET/PUT /api/cart` 서버 라우트에서 service_role로 처리한다.
> user_id는 세션 쿠키에서 서버가 도출(클라이언트 값 미신뢰). 참조: 04-interface/api.md.

### tenant_admins (mig 003)
`id(PK)`, `tenant_id→tenants(CASCADE)`, `username`(indexed). 관리자 로그인 계정. **RLS.**

### used_sso_tokens (크로스앱)
`jti(PK)`, `aud`, `exp`, `used_at`. SSO 토큰 재생공격 방지.

## 크로스앱 (public)
- `public.crews` — RunningCrewMap 크루 마스터(크루 검색 `/api/crews/search`에서 조회).
