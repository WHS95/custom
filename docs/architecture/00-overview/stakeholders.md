# 이해관계자 (Stakeholders)

IEEE 42010에서 **이해관계자**는 시스템에 대해 관심(Concern)을 가지는 개인/그룹/역할이다.
아래는 RunHouse Custom의 이해관계자와 각자의 관심사를 연결한 목록이다.

| 이해관계자 | 설명 | 주요 관심사(Concern) | 주로 보는 View |
|-----------|------|----------------------|----------------|
| **1인 개발자/운영자** | 설계·구현·배포·운영을 모두 담당 | 유지보수성, 전체 맥락 파악, 변경 영향 범위 | 전체 (특히 05-architecture, 01-domain) |
| **일반 고객 (개인)** | 굿즈를 디자인·주문·조회하는 최종 사용자 | 사용성, 주문/배송 조회, 결제 편의 | 03-process(주문 흐름), 04-interface |
| **크루 스태프 (crew_staff)** | 러닝 크루 대표로 취합·크루 스토어 운영 | 크루 취합, 단체주문 집계, 크루 할인 | 01-domain, 03-process(취합) |
| **크루 승인 대기자 (crew_pending)** | 크루 소속 승인 대기 중 사용자 | 승인 상태 확인 | 03-process |
| **관리자 (tenant admin)** | 테넌트별 상품/주문/리뷰/크루승인 관리 | 주문 관리, 상품 CRUD, 권한 격리 | 04-interface(admin API), 06-quality(보안) |
| **RunningCrewMap (IdP)** | 크루 계정 인증을 제공하는 외부 신원 공급자 | SSO 계약, 토큰 무결성, 재생공격 방지 | 03-process(SSO), 06-quality |
| **Groble (결제)** | 외부 결제 링크·웹훅 정산 제공자 | 결제 연동, 웹훅 서명/멱등성 | 03-process(결제), 04-interface |
| **알림 수신 채널 (Slack/Email)** | 신규 주문·결제·승인 알림 수신 | 이벤트 통지 신뢰성 | 05-architecture |
| **분석 (PostHog)** | 사용자 행동 분석 | 이벤트 계측, 프라이버시 | 06-quality |

## 역할별 신원/권한 요약

- **일반 고객**: 커스텀 이메일/비밀번호 인증 또는 게스트(전화번호 조회). 쿠키 `customer_auth_session`.
- **크루 스태프**: RunningCrewMap SSO(리다이렉트/백채널 PIN)로 로그인 → `user_type=crew_staff`.
- **관리자**: 별도 JWT 세션(`admin_session`, `jose` HS256), 테넌트 범위로 격리.

각 관심사에 대한 상세는 [concerns.md](./concerns.md), 표현 규칙은 [viewpoints.md](./viewpoints.md) 참고.
