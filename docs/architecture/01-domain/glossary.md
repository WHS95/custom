# 용어집 (Glossary / Ubiquitous Language)

도메인에서 사용하는 핵심 용어를 정의한다. 근거 코드: `src/domain/*`, `src/application/*`.

## 조직 / 사용자

| 용어 | 코드 식별자 | 정의 |
|------|-------------|------|
| 테넌트 | `Tenant` / `tenants` | 서비스를 사용하는 브랜드 단위. 기본 테넌트 `런하우스`(id `a0000000-…-0001`). 멀티테넌트. |
| 고객 | `Customer` / `customers` | 주문 주체. 이메일/비번 회원 또는 게스트(전화번호). |
| 사용자 프로필 | `user_profiles` | 인증 사용자 부가정보. `user_type` = individual / crew_staff / crew_pending. |
| 크루 스태프 | `crew_staff` | 러닝 크루 대표. SSO로 로그인, 크루 취합/스토어 운영, 10% 할인. |
| 관리자 | `AdminSession` / `tenant_admins` | 테넌트 운영자. 별도 JWT 세션. |

## 상품 / 커스터마이즈

| 용어 | 코드 식별자 | 정의 |
|------|-------------|------|
| 상품 | `Product` / `products` | 판매 품목. 카테고리 hat/clothing/accessory, 기본가·변형·가격티어 보유. |
| 상품 변형 | `ProductVariant` | 색상(id/label/hex)과 사이즈 조합. |
| 가격 티어 | `PriceTier` | 수량 구간별 단가(`minQuantity`/`unitPrice`). 대량 할인. |
| 커스터마이즈 영역 | `CustomizableArea` / `product_customizable_areas` | 인쇄 가능 존(뷰별 x/y/w/h %). `viewName` = front/back/left/right/top. |
| 디자인 스냅샷 | `DesignSnapshot` / `DesignLayerSnapshot` | 주문 시점의 디자인 레이어(이미지/텍스트) 저장본. |
| 스튜디오 | (studio 라우트) | 상품 커스터마이즈 편집 UI. `react-rnd` 레이어 캔버스. |
| 인쇄 색상 팔레트 | `PRINT_COLOR_PALETTE` | 텍스트 레이어에 허용되는 인쇄 색상 집합. |

## 주문

| 용어 | 코드 식별자 | 정의 |
|------|-------------|------|
| 주문 | `Order` / `orders` | 애그리거트 루트. 주문번호·항목·배송·금액·상태·이력 보유. |
| 주문번호 | `orderNumber` | 형식 `{2글자접두}-{YYYYMMDD}-{001}` (예 `RH-20241219-001`). |
| 주문 항목 | `OrderItem` / `order_items` | 상품×색상×사이즈×수량 단위 라인. 디자인 스냅샷 포함. |
| 주문 상태 | `OrderStatus` | pending → design_confirmed → preparing → in_production → shipped → delivered (+cancelled). |
| 상태 이력 | `OrderStatusHistory` / `order_status_history` | 상태 전이 기록(from→to, 변경자, 메모). |
| 배송정보 | `ShippingInfo` / `TrackingInfo` | 수령지 및 택배사(`CarrierCode` cj/hanjin/logen/lotte/post)·송장. |
| 첨부파일 | `AttachmentFile` | 주문에 첨부되는 원본(.ai 등) 파일. Supabase Storage. |

## 크루 취합 / 스토어

| 용어 | 코드 식별자 | 정의 |
|------|-------------|------|
| 사이즈 취합 | `size_collections` | 크루 단체주문용 사이즈 수집 링크. `token`(공개)·`admin_token`(관리). 상태 open/closed/ordered. |
| 취합 응답 | `size_collection_responses` | 크루원 개별 제출(이름·색상·사이즈·수량). `edit_token`으로 본인 수정. |
| 크루 스토어 | `crew_stores` | 크루 전용 커스텀 상품 상점(`store_token`). |
| 크루 상품 | (store 등록) | 스튜디오 디자인을 등록한 상품 = 디자인 스냅샷이 붙은 size_collection. |

## 리뷰

| 용어 | 코드 식별자 | 정의 |
|------|-------------|------|
| 리뷰 | `Review` / `reviews` | 고객/관리자 후기. 평점 1–5, 상태 pending/approved/rejected, 대표(featured). |

## 인증 / 연동

| 용어 | 코드 식별자 | 정의 |
|------|-------------|------|
| SSO 토큰 | `SsoTokenPayload` | RunningCrewMap IdP 발급 JWT. iss `runhouse-idp`, aud `custom_hat`. |
| jti 재생방지 | `used_sso_tokens` | 사용된 SSO 토큰 id 저장(1회용 보장). |
| Groble 웹훅 | `groble_webhook_events` | 외부 결제 완료 통지 이벤트(멱등키 저장). |

관련: 규칙은 [business-rule.md](./business-rule.md), 유스케이스는 [usecase.md](./usecase.md).
