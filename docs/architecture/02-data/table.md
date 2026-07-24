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
`quantity`(CHECK 1–20), `note`, `is_paid`, `edit_token`. **RLS.**

### crew_stores (mig 008)
`id(PK)`, `tenant_id→tenants`, `creator_user_id`, `crew_name`, `store_token`. **RLS.**

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
`id(PK)`, `user_id→customer_auth_users(CASCADE)`, `tenant_id→tenants`, `product_id`, `product_name`,
`color`, `color_label`, `size`, `quantity`, `unit_price`, `design_layers(JSONB)`.

### tenant_admins (mig 003)
`id(PK)`, `tenant_id→tenants(CASCADE)`, `username`(indexed). 관리자 로그인 계정. **RLS.**

### used_sso_tokens (크로스앱)
`jti(PK)`, `aud`, `exp`, `used_at`. SSO 토큰 재생공격 방지.

## 크로스앱 (public)
- `public.crews` — RunningCrewMap 크루 마스터(크루 검색 `/api/crews/search`에서 조회).
