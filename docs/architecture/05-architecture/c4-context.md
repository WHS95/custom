# C4 — System Context (L1)

RunHouse Custom 시스템과 외부 행위자·시스템의 경계를 보여준다.

```mermaid
flowchart TB
    guest([게스트 고객])
    member([개인 회원])
    crew([크루 스태프])
    admin([테넌트 관리자])

    subgraph sys[RunHouse Custom]
      app[커스텀 굿즈 커머스\nNext.js 16 + Supabase]
    end

    idp[[RunningCrewMap IdP\nSSO 신원공급]]
    groble[[Groble\n외부 결제·웹훅]]
    posthog[[PostHog\n행동분석]]
    slack[[Slack\n운영 알림]]
    email[[Supabase Edge Fn\n주문 이메일 알림]]

    guest --> app
    member --> app
    crew --> app
    admin --> app

    app <-->|SSO 토큰/PIN 검증| idp
    app <-->|결제링크/웹훅 정산| groble
    app -->|이벤트 계측| posthog
    app -->|신규주문·결제·승인| slack
    app -->|주문 알림 메일| email
    app -->|크루 검색 public.crews| idp
```

## 경계 설명

- **시스템**: 러닝 크루 대상 멀티테넌트 커스텀 굿즈 커머스. 스튜디오 디자인 → 개별/크루 주문 → 배송추적.
- **RunningCrewMap IdP**: 크루 계정 인증. 리다이렉트 SSO + 백채널 PIN. 크루 마스터(`public.crews`) 공유.
- **Groble**: 자체 PG 대체. 주문별 외부 결제 링크 + `payment.completed` 웹훅으로 정산.
- **PostHog**: `/ingest`로 리버스 프록시된 행동 분석(스튜디오 오픈·주문 시작 등).
- **Slack / Email**: 운영 통지 채널(단방향).

컨테이너 분해는 [c4-container.md](./c4-container.md) 참고.
