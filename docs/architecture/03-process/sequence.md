# 프로세스 뷰 — 주요 흐름 (Sequence)

동적 관점. 핵심 유스케이스의 런타임 상호작용을 시퀀스로 기술한다.

## 1. 커스터마이즈 → 주문 생성

```mermaid
sequenceDiagram
    actor U as 고객/크루
    participant S as /studio/[productId]
    participant Cart as Zustand cart-store
    participant API as POST /api/orders
    participant OS as order-service
    participant DB as Supabase(runhousecustom)
    participant Slack
    participant Email as Edge Fn(order-notify)

    U->>S: 상품 로드(getProductWithAreas)
    U->>S: 뷰별 이미지/텍스트 레이어 편집
    S->>Cart: addItem(디자인 스냅샷)
    U->>Cart: /cart 결제하기
    Cart->>API: 주문+배송+항목 제출
    API->>API: 인쇄색 검증(BR-5) / 크루할인(BR-4)
    API->>OS: createOrder
    OS->>DB: generate_order_number + insert orders/order_items
    API-->>Cart: orderNumber
    Cart->>API: POST /orders/{n}/attachments (원본 업로드)
    par 비동기 알림
      API->>Slack: notifyNewOrder
      API->>Email: notifyNewOrderByEmail
    end
    Cart-->>U: /order/{orderNumber} 이동
```

## 2. 크루 SSO 로그인 (리다이렉트 + 백채널 PIN)

```mermaid
sequenceDiagram
    actor C as 크루 스태프
    participant App as RunHouse Custom
    participant IdP as RunningCrewMap IdP
    participant DB as Supabase

    rect rgb(240,244,255)
    note over C,IdP: 리다이렉트 플로우
    C->>App: GET /api/sso/initiate
    App->>App: state 생성→httpOnly 쿠키(sso_state)
    App-->>C: 302 IdP /sso/authorize
    C->>IdP: 인증
    IdP-->>C: 302 /sso/callback?token&state
    C->>App: GET /sso/callback
    App->>App: state(CSRF) 1회검증 + verifySsoToken(iss/aud/exp)
    App->>DB: insert used_sso_tokens(jti)  %% 23505=재생
    App->>DB: upsert customer_auth_users + user_profiles(crew_staff)
    App->>DB: create customer_auth_sessions
    App-->>C: 세션쿠키 + 홈 리다이렉트
    end

    rect rgb(245,255,245)
    note over C,IdP: 백채널 PIN 플로우 (crewLoginInline)
    C->>App: 인스타+PIN 입력(서버액션)
    App->>IdP: POST /api/sso/verify-pin (X-SSO-Client-Secret)
    IdP-->>App: SSO 토큰
    App->>App: verifySsoToken + jti 재생가드
    App->>DB: upsertCrewAccountAndCreateSession
    App-->>C: 세션쿠키 (실패시 fallback:true → 리다이렉트)
    end
```

## 3. 크루 취합 → 주문 전환

```mermaid
sequenceDiagram
    actor Staff as 크루 스태프
    actor Member as 크루원
    participant App as RunHouse Custom
    participant DB as Supabase

    Staff->>App: POST /api/collections (또는 /api/store/register)
    App->>DB: insert size_collections(token, admin_token[, design_snapshot])
    App-->>Staff: 공유 링크(token) / 관리 링크(admin_token)
    loop 크루원 제출
      Member->>App: POST /collections/{token}/responses (이름·색상·사이즈·수량)
      App->>DB: insert size_collection_responses(edit_token)
    end
    Staff->>App: PATCH /collections/{token} (마감 closed)
    Staff->>App: POST /collections/{token}/convert
    App->>App: 색상×사이즈 집계(BR-8)
    App->>DB: create order+order_items, size_collections.status=ordered
    App-->>Staff: 생성된 주문번호
```

## 4. Groble 결제 웹훅 정산

```mermaid
sequenceDiagram
    participant G as Groble
    participant WH as POST /api/webhooks/groble
    participant DB as Supabase
    participant Slack

    G->>WH: payment.completed (X-Groble-Signature, Idempotency-Key)
    WH->>WH: HMAC-SHA256("{ts}.{body}") 검증 + ±5분 + 멱등키 확인
    WH->>DB: insert groble_webhook_events (중복이면 스킵)
    WH->>DB: unpaid 주문 매칭(전화번호+금액)
    alt 매칭 성공
      WH->>DB: orders.payment_status=paid, paid_at
      WH->>Slack: 정산 완료 통지
    else 미매칭
      WH->>Slack: 미매칭/취소요청 통지
    end
    WH-->>G: 200
```

## 5. 관리자 인증 (참고)

관리자는 고객/크루와 분리된 JWT 세션(`admin_session`, jose HS256, 7일)을 사용하며
`/admin/[tenantSlug]/*` 접근 시 `getCurrentAdmin`으로 `session.tenantSlug === tenantSlug`를 검증한다.
근거: `src/lib/auth/admin-auth.ts`.
