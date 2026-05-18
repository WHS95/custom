---
project: RunHouse Custom
adapted_from: Nike design.md (editorial pill-and-photography system)
locale_primary: ko-KR
last_updated: 2026-05-18
---

# RunHouse Custom — Design System

## Overview

RunHouse Custom은 러닝 크루를 위한 커스텀 의류·모자 주문 서비스다. 디자인 시스템은 Nike의 **"사진은 외치고, 크롬은 침묵한다"** 철학을 그대로 차용하되, 다음 두 가지를 한국 시장과 자체 비즈니스 맥락에 맞게 번안한다.

1. **러닝 크루의 정체성**을 캠페인 헤로의 주체로 둔다. 모델 한 명의 인물 사진이 아니라, 트랙·도로·산에서 같은 유니폼을 입고 달리는 **크루의 집단성**이 캠페인 사진의 주제다.
2. **타이포그래피는 한·영 혼합**을 전제로 설계한다. 영문 디스플레이는 Bebas Neue(이미 프로젝트에 로드됨), 한글 디스플레이/본문은 Pretendard. 두 폰트를 같은 디스플레이 줄 안에서 섞을 때 어색하지 않도록 letter-spacing과 baseline 규칙을 명시한다.

크롬(버튼·필터·카드·푸터)은 100% 흑백+단일 회색, 모든 CTA는 `{rounded.lg}` (30px) 알약 모양, 상품 사진은 `{colors.soft-cloud}` 정사각형 배경 위에 풀블리드. Nike와 동일한 골격을 유지한다. 단 하나의 예외는 **세일 빨강(`{colors.sale}`)**, 그리고 사용자의 **크루 식별 색상**(이 색은 시스템 토큰이 아니라 런타임 데이터로 주입되며, swatch dot과 미리보기 영역에서만 등장한다).

서비스 페이지 전체에 동일한 크롬이 동일한 비율로 반복된다 — `/gallery`, `/studio`, `/cart`, `/order`, `/mypage`, `/admin`, `/(auth)`. 변하는 것은 사진과 문구뿐이다. 이것이 시스템의 시그니처다.

**Key Characteristics:**
- 96px Bebas Neue / Pretendard Black uppercase 디스플레이가 풀블리드 캠페인 사진 위에 직접 인쇄됨 (`{typography.display-campaign}`)
- 순수 흑/백/단일 회색 UI 팔레트: `{colors.ink}`, `{colors.canvas}`, `{colors.soft-cloud}`가 크롬 표면적의 약 95%를 담당
- 모든 곳에 알약 지오메트리: CTA·검색·필터칩·뱃지는 모두 `{rounded.lg}` (30px) 또는 `{rounded.md}` (24px). 각진 버튼은 금지
- 상품 카드는 radius·shadow 0, `{colors.soft-cloud}` swatch 배경에 사진이 직접 올라감 — **사진이 곧 카드**
- 2단계 CTA 위계: `{component.button-primary}` (밝은 표면 위 검정) vs `{component.button-secondary}` (밝은 표면 위 soft-cloud) — 한 화면에 둘 다 동시 노출 금지
- 8px 베이스 스페이싱, 섹션 리듬은 `{spacing.section}` (48px) 고정
- 세일 시그널(`{colors.sale}`)이 리테일 크롬에 등장하는 유일한 비중성 색
- **크루 색상은 런타임 토큰** — swatch dot, 미리보기, 주문 요약 카드에서만 사용. 절대 버튼·헤딩·뱃지 배경에 사용 금지

## Colors

> 모든 hex 값은 globals.css의 `@theme inline` 블록에서 토큰으로 정의된다. (Tailwind v4 기준)

### Brand & Accent
- **Ink** (`{colors.ink}` — `#111111`): 브랜드의 유일한 "컬러". 1차 CTA, swatch dot, 활성 필터칩, 캠페인 오버레이, 헤드라인, 본문 텍스트. RunHouse가 무언가를 단호하게 말할 때 사용하는 색.
- **Canvas / On-Primary** (`{colors.canvas}` — `#ffffff`): Ink의 동등한 파트너. 모든 페이지 배경, 이미지 위 CTA, Ink 표면 위 인버스 텍스트.

### Surface
- **Soft Cloud** (`{colors.soft-cloud}` — `#f5f5f5`): 시스템에서 흰색 다음으로 가장 많이 쓰이는 표면. 상품 카드의 사진 배경, 검색 알약, 보조 CTA, 유틸리티 바, 카테고리 타일 배경. 모든 상품 사진의 "스튜디오 색".
- **Hairline** (`{colors.hairline}` — `#cacacb`): 필터 행, 푸터 컬럼, PDP(상품 상세) 디스클로저 행 사이의 1px 디바이더.
- **Hairline Soft** (`{colors.hairline-soft}` — `#e5e5e5`): 스티키 바·탭 스트립의 하단 1px 인셋 섀도. 시스템에서 유일하게 허용되는 "섀도".

### Text
- **Ink** (`{colors.ink}` — `#111111`): 밝은 표면 위 1차 텍스트.
- **Charcoal** (`{colors.charcoal}` — `#39393b`): Ink가 과하게 무거울 때의 본문 톤.
- **Ash** (`{colors.ash}` — `#4b4b4d`): 어두운 표면의 비활성 보조 보더 / 유틸리티.
- **Mute** (`{colors.mute}` — `#707072`): 상품 카테고리 서브타이틀("러닝 크루 티셔츠"), 푸터 링크, 메타데이터.
- **Stone** (`{colors.stone}` — `#9e9ea0`): 어두운 표면 위 인버스 보조 텍스트, 최저 강조 유틸리티.

### Semantic
- **Sale** (`{colors.sale}` — `#d30005`): 할인가 + "% 할인" 표기. 시스템 리테일 크롬 안에서 유일하게 허용되는 빨강.
- **Sale Deep** (`{colors.sale-deep}` — `#780700`): 세일 가격의 pressed/hover, 다크모드 세일 앵커.
- **Success** (`{colors.success}` — `#007d48`): 주문 완료, 재고 있음, 결제 성공.
- **Success Bright** (`{colors.success-bright}` — `#1eaa52`): 어두운 표면 위 인버스 success.
- **Info** (`{colors.info}` — `#1151ff`): 정보성 링크/뱃지. 멤버 혜택 콜아웃 등.
- **Info Deep** (`{colors.info-deep}` — `#0034e3`): info pressed.
- **Danger** (`{colors.danger}` — `#d30005`): 삭제·취소·관리자 destructive 액션 (Sale와 동일 hex, 단 컨텍스트가 다름).

### Crew Accent (런타임 주입)
- **Crew Primary** (`var(--crew-primary)`): 크루별 시그니처 컬러. 운영자가 admin에서 등록하며, 서비스 코드는 색상을 **하드코딩하지 않는다**. swatch dot, studio 미리보기 영역, 주문 요약의 "크루 라벨" 칩에서만 등장한다.
- **Crew Primary Soft** (`var(--crew-primary-soft)`, 60% 알파 합성): 크루 칩의 활성 상태 배경 등 보조 표시. Crew Primary와 흰색을 60/40으로 합성하거나 CSS color-mix로 산출.

> **금지:** Crew Accent를 1차 CTA, 헤딩, 가격, 뱃지 배경, 필터칩에 사용하지 말 것. 시스템 크롬의 흑백 위계가 무너진다.

### Category Accents (편집 콘텐츠 한정)
Nike의 sport accent와 동일한 역할. 이 색들은 **카테고리 타일의 일러스트 안에서만** 사용되며, 버튼·텍스트·메인 크롬에는 절대 등장하지 않는다.
- **Accent Trail** (`{colors.accent-trail}` — `#0a7281`): 트레일·산악 러닝 컬렉션.
- **Accent Road** (`{colors.accent-road}` — `#1151ff`): 로드 러닝 컬렉션.
- **Accent Track** (`{colors.accent-track}` — `#d30005`): 트랙·스피드 컬렉션.
- **Accent Heritage** (`{colors.accent-heritage}` — `#4c012d`): 클래식·헤리티지 에디션.

## Typography

### Font Family
- **Bebas Neue** (디스플레이 캠페인 영문, 이미 globals.css에 로드됨) — Nike Futura ND의 오픈소스 근사치. 96px / line-height 0.9 / uppercase. **한글은 렌더링하지 않는다.** 영문 단어만 이 폰트로 처리.
- **Pretendard** (한글 디스플레이 + 본문 모두, 신규 추가 권장) — Inter 기반 한글 최적화 폰트. Black(900)은 캠페인 한글 헤드라인에, Medium(500)은 UI/버튼/캡션에, Regular(400)는 본문에. CDN: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css`.
- **Inter** (현재 layout.tsx에서 사용 중) — 라틴 본문/UI는 Pretendard가 라틴까지 잘 처리하므로 **Inter 의존을 제거하고 Pretendard 단일화** 권장. 호환성 폴백으로만 유지.

#### 한영 혼합 규칙
디스플레이 캠페인 헤드라인은 한 줄에 영문+한글이 섞이는 경우가 많다 ("YOUR CREW, YOUR STRIDE" / "당신의 크루, 당신의 보폭"). 이때:
- 영문 토큰: Bebas Neue 500 / letter-spacing 0
- 한글 토큰: Pretendard Black(900) / letter-spacing -1.5% (Bebas Neue의 컨덴스트 너비에 맞추기 위함)
- 두 폰트를 **같은 줄에 섞을 때는** 한글에 `font-feature-settings: "ss02"`를 적용하지 않고 plain 렌더링 — Pretendard Black은 별도 세팅 없이 Bebas Neue의 baseline과 잘 맞는다.
- 줄당 한 가지 언어만 사용하는 카피가 가장 안전하다. 혼합이 필요하면 한글 줄과 영문 줄을 **수직으로 분리**한다.

### Hierarchy

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|---|---|---|---|---|---|
| `{typography.display-campaign}` | 96px (desktop) / 64px (tablet) / 48px (mobile) | 500(영문) / 900(한글) | 0.9 | 0 (영문) / -1.5% (한글) | 캠페인 헤로. 풀블리드 사진 위 uppercase 영문 또는 Pretendard Black 한글. |
| `{typography.heading-xl}` | 32px | 500(영) / 700(한) | 1.2 | 0 | "추천 제품", "최신 컬렉션", studio 시작 화면 타이틀 등 섹션 헤더 |
| `{typography.heading-lg}` | 24px | 500/700 | 1.2 | 0 | 카드 타이틀, PDP 가격, FAQ 행 라벨 |
| `{typography.heading-md}` | 16px | 500/700 | 1.75 | 0 | 카드 메타, 필터 그룹 헤더, 폼 라벨 |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0 | 본문, 검색 placeholder, 상품 설명 |
| `{typography.body-strong}` | 16px | 500/700 | 1.5 | 0 | 상품명, 1차 네비 링크, 필터 행 라벨 |
| `{typography.button-lg}` | 24px | 500/700 | 1.2 | 0 | 캠페인 헤로 내부의 큰 알약 CTA |
| `{typography.button-md}` | 16px | 500/700 | 1.5 | 0 | 시스템 표준 알약 CTA |
| `{typography.button-sm}` | 14px | 500/700 | 1.5 | 0 | 컴팩트 알약 CTA, 뱃지, 지역 선택 |
| `{typography.link-md}` | 16px | 500/700 | 1.75 | 0 | "상품 상세 보기" 등 underline 인라인 링크 |
| `{typography.caption-md}` | 14px | 500/700 | 1.5 | 0 | 상품 서브타이틀("러닝 크루 모자"), 필터 카운트, 푸터 링크 |
| `{typography.caption-sm}` | 12px | 500/700 | 1.5 | 0 | 필터칩 라벨, 색상 카운트, 작은 뱃지 |
| `{typography.utility-xs}` | 11px (한글 가독성 위해 9→11 상향) | 500/700 | 1.75 | 0 | 푸터 저작권/약관 라인. Nike는 9px이지만 한글 11px 미만은 가독성 급락. |

### Principles
극단적 타이포 콘트라스트가 시스템의 엔진이다. 96px 디스플레이 한 단과 12–16px UI/본문 단 사이에 중간이 거의 없다. 32px → 16px로 바로 점프하는 것은 의도된 것이며, 이로 인해 모든 페이지가 "위는 빌보드, 아래는 카탈로그" 효과를 갖는다. letter-spacing은 0이 기본 (Pretendard와 Inter 모두 디스플레이 사이즈에서 별도 트래킹 불필요), 단 한글 디스플레이만 -1.5% 트래킹.

## Layout

### Spacing System
- **Base unit:** 8px
- **Tokens:** `{spacing.xxs}` (2px) · `{spacing.xs}` (4px) · `{spacing.sm}` (8px) · `{spacing.md}` (12px) · `{spacing.lg}` (18px) · `{spacing.xl}` (24px) · `{spacing.xxl}` (30px) · `{spacing.section}` (48px) · `{spacing.section-lg}` (72px, 캠페인 헤로 위아래용)
- **Universal rhythm:** 모든 페이지의 메이저 블록 사이는 `{spacing.section}` (48px). PLP(상품 목록)의 카드 거터는 `{spacing.sm}` (8px). PDP 디스클로저 행 패딩은 수직 `{spacing.xl}` (24px).
- **Card internal padding:** 상품 카드 내부 패딩 0. 이미지 풀블리드, 메타 행이 8px 간격으로 바로 아래 적층.

### Grid & Container
- **Max width:** ~1440px. 1920px+ 뷰포트에서는 좌우 거터가 ~80px까지 자란다 (stretch 금지, breathe 허용).
- **Column patterns:**
  - Home `/`: 캠페인 2-up → "Trending Now" 3 or 4-up → "Shop by Crew" 가로 스크롤 레일 → "Latest" 4-up 썸네일.
  - PLP `/gallery`: 데스크탑 3-up → 1023px에서 2-up → 599px에서 1-up.
  - PDP `/studio/[productId]`: 좌측 ~80px 썸네일 레일 + 중앙 정사각 메인 이미지 + 우측 ~360px 옵션 패널.
  - Cart/Order/Mypage: 1140px max-width 단일 컬럼 + 좌측 헤로 영역 없음 (Nike Membership 패턴).
  - Admin: 좌측 220px 사이드바 + 우측 잔여 영역 (dashboard 패턴, 1920px까지 stretch 허용).
- **Filter sidebar:** PLP 좌측 220px 고정 → 1023px에서 "필터 숨김" 토글로 전환.

### Whitespace Philosophy
공백은 분리의 도구이지 호흡의 도구가 아니다. 섹션 간 데코레이션 디바이더 없음 — 풀블리드 사진의 가장자리가 디바이더 역할을 한다. 헤딩 위에 장식 여백 없음 (섹션 디바이더 라인 바로 아래에 위치). 상품 사진은 패딩 없이 카드 가장자리까지. "공기"는 사진의 `{colors.soft-cloud}` 배경에서 나오며, 레이아웃 마진에서 나오지 않는다.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | shadow·border 없음 | 카드·버튼·섹션의 기본 처리 — 시스템의 지배적 톤 |
| 1 — Hairline divider | 1px solid `{colors.hairline}` | 필터 행, 푸터 컬럼, PDP 디스클로저 디바이더 |
| 2 — Inset bottom-line | `box-shadow: inset 0 -1px 0 {colors.hairline-soft}` | 스티키 유틸/서브내비·탭 스트립 하단 |

리테일 크롬에 drop-shadow는 존재하지 않는다. studio(커스터마이저) **에디터 캔버스**만 예외 — 디자인 요소를 캔버스 위에서 끌어다 놓을 때 드래그 중 요소에 한해 `0 8px 24px rgba(17,17,17,0.16)` 1회 적용. 드롭하면 즉시 flat.

### Decorative Depth
깊이는 CSS가 아니라 사진이 만든다. 캠페인 타일의 영화적 원근, 상품 사진의 평면 soft-cloud, 카테고리 타일의 풀블리드 시네마틱 사진 + 좌하단 흰 알약 1개. 그 외는 모두 flat.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.none}` | 0px | 카드·캠페인 타일·상품 이미지·내비·푸터 — 시스템의 모든 컨테이너 |
| `{rounded.sm}` | 18px | 멤버 혜택 락업의 아바타/아이콘 컨테이너 |
| `{rounded.md}` | 24px | 검색 알약, 검색 submit, 필터 input |
| `{rounded.lg}` | 30px | 모든 CTA 알약 — 1차/2차/이미지 위/필터칩/지역 선택/"알림 받기" |
| `{rounded.full}` | 9999px | swatch dot, 원형 아이콘 버튼(뒤로/공유/찜/캐러셀 패들) |

### Photography Geometry
- **상품 카드:** 1:1 정사각 또는 4:5 세로 크롭. 패딩 0, `{colors.soft-cloud}` 배경에 풀블리드.
- **캠페인 헤로:** 16:9 또는 더 와이드. 데스크탑은 풀블리드 콘텐츠 max-width까지, 모바일은 4:5 세로로 art-direction 변경.
- **카테고리 레일:** 4:5 세로 풀블리드 + 좌하단에 흰 알약 CTA 1개.
- **PDP 메인 이미지:** 정사각 + 좌측에 5–7개 세로 썸네일 적층 (모바일에서는 가로 스와이프 캐러셀로 전환).
- **Studio 미리보기:** 정사각 1:1, 배경 `{colors.soft-cloud}`, 디자인 요소(텍스트/로고)는 절대 좌표로 캔버스 위에 배치.

## Components

> 모든 컴포넌트는 default와 active/pressed만 정의한다 (hover는 시스템 정책상 별도 토큰화하지 않음). 변형은 `-active`, `-disabled`, `-focused`처럼 별도 엔트리로 둔다.

### Buttons

**`button-primary`** — RunHouse의 표준 CTA
- 배경 `{colors.ink}`, 텍스트 `{colors.canvas}`, 타입 `{typography.button-md}`, 패딩 `16px 32px`, 높이 48px, radius `{rounded.lg}` (30px).
- 모든 1차 액션: "주문하기", "장바구니 담기", "회원가입", "스튜디오 시작", "디자인 저장", "결제".
- **Pressed (`button-primary-active`):** 배경 유지 + `transform: scale(0.96)` + `opacity: 0.85`. Nike의 `scale(0.5)`는 너무 과격해서 액션이 사라지는 느낌이 나므로 한국 사용자 기준 0.96으로 완화.

**`button-secondary`** — 밝은 표면 위 보조 CTA
- 배경 `{colors.soft-cloud}`, 텍스트 `{colors.ink}`, 나머지 button-primary와 동일.
- 1차 CTA가 이미 있는 화면에서의 보조 액션: "취소", "더 보기", "다른 디자인 보기".

**`button-outline-on-image`** — 사진 위 오버레이 CTA
- 배경 `{colors.canvas}`, 텍스트 `{colors.ink}`, 패딩 `12px 24px`, radius `{rounded.lg}`.
- 모든 풀블리드 카테고리·캠페인 타일의 좌하단에 앵커된 흰 알약 1개.

**`button-icon-circular`** — 원형 아이콘 컨트롤
- 배경 `{colors.soft-cloud}` 또는 transparent, 아이콘 `{colors.ink}`, radius `{rounded.full}`, 사이즈 40px.
- 뒤로 가기, 캐러셀 패들, 찜 하트, 공유, "필터 숨김" 토글.

**`button-destructive`** — 위험 액션 (관리자/주문 취소)
- 배경 `{colors.canvas}`, 1px solid `{colors.danger}`, 텍스트 `{colors.danger}`, radius `{rounded.lg}`.
- "주문 취소", "사용자 삭제", "디자인 영구 삭제" 등. **빨강 배경의 솔리드 버튼은 사용하지 않는다** — 시스템에 솔리드 빨강이 등장하는 순간 세일 시그널이 무의미해진다.

**`filter-chip` + `filter-chip-active`**
- Default: 배경 `{colors.canvas}`, 텍스트 `{colors.ink}`, 1px `{colors.hairline}`, radius `{rounded.lg}`, 패딩 `8px 16px`.
- Active: 배경 `{colors.ink}`, 텍스트 `{colors.canvas}`. 완전 인버스. 중간 상태 없음.

### Inputs & Forms

**`search-pill` + `search-pill-focused`**
- Default: 배경 `{colors.soft-cloud}`, 텍스트 `{colors.ink}`, 타입 `{typography.body-md}`, radius `{rounded.md}`, 패딩 `8px 16px`, 높이 40px. 1차 내비 우측에 magnifier 아이콘과 함께.
- Focused: 배경 `{colors.canvas}`, 2px solid border `{colors.ink}`, 12px outer halo `{colors.soft-cloud}`. 시스템의 유일한 "포커스 링" 효과.

**`text-input`** (회원가입/주소/결제 등)
- 배경 `{colors.canvas}`, 1px solid `{colors.hairline}` 하단만 (top/left/right 없음 — 시스템은 박스형 input 대신 underline input을 사용한다), 텍스트 `{colors.ink}`, placeholder `{colors.mute}`, 높이 48px, 패딩 `12px 0`, radius `{rounded.none}`.
- Focused: 하단 border → 2px solid `{colors.ink}`.
- Error: 하단 border → 2px solid `{colors.danger}`, 라벨 아래 12px 캡션을 `{colors.danger}`로.

**`select-dropdown`** (사이즈/수량/지역 등)
- search-pill과 동일한 알약 형태. 우측에 chevron 아이콘 `{colors.ink}`.

**`textarea`** (리뷰/문의 등)
- text-input과 동일 underline 패턴, 최소 높이 96px.

### Cards & Containers

**`product-card`**
- 컨테이너: 배경 `{colors.canvas}`, radius `{rounded.none}`, 패딩 0, shadow 없음.
- 이미지 영역(`{component.product-card-image}`): 풀블리드 상품 사진 on `{colors.soft-cloud}` 정사각.
- 이미지 아래 (8px 간격): swatch dot 행(12px 원 3–6개) → promo 뱃지(`{component.badge-promo}` "신상", "곧 출시", "재생 소재") → 상품명 `{typography.body-strong}` `{colors.ink}` → 카테고리 서브타이틀 `{typography.caption-md}` `{colors.mute}` → 가격 행.
- 가격 행: 정가 `{typography.body-strong}` `{colors.ink}`. 세일 시: 할인가 `{colors.sale}` + strike-through 정가 `{colors.mute}` + "% 할인" `{colors.sale}`.

**`campaign-tile`** — 브랜드 시그니처
- 풀블리드 사진 위에 `{typography.display-campaign}` 헤드라인 직접 인쇄 (uppercase 96px / line-height 0.9).
- 헤드라인 색상은 사진별로 `{colors.canvas}` 또는 `{colors.ink}` 중 가독성이 좋은 쪽 선택 (토큰으로 파라미터화하지 않음).
- 좌하단 `{component.button-outline-on-image}` 1개로 CTA 앵커.

**`crew-tile`** — 크루 카테고리 (Nike의 sport-tile 대응)
- 4:5 세로 풀블리드 크루 단체 사진, 좌하단에 크루명 + 흰 알약 "둘러보기" 1개.
- 카테고리 라벨은 `{typography.caption-md}` `{colors.canvas}` (사진 위에 직접, 헤드라인보다 작게).

**`member-benefit-card`** — `/mypage` & `/onboarding`
- 풀블리드 사진 위 좌하단 슬롯: `{typography.heading-lg}` `{colors.canvas}` 헤드라인 + `{component.button-outline-on-image}` "자세히".

**`swatch-dot` + `swatch-dot-active`**
- 12px 원, radius `{rounded.full}`. Default는 colorway 실제 색으로 채움. 흰/밝은 색상은 1px `{colors.hairline}` 외곽 링.
- Active: 같은 fill + 2px `{colors.ink}` 외곽 링 + 2px 흰 인터리어 갭. 동심원 "선택됨" 시그니처. 크기 변화 없음.

**`badge-promo`**
- 배경 `{colors.canvas}` + 1px `{colors.hairline}`, 텍스트 `{colors.ink}`, 타입 `{typography.caption-sm}`, radius `{rounded.lg}`, 패딩 `4px 12px`.
- 카드 좌상단 위에 오버레이: "신상", "곧 출시", "재생 소재", "크루 한정".

**`badge-status`** (주문/관리자)
- 동일한 형태, 다만 컨텍스트에 따라 텍스트 색만 변경: 대기 `{colors.ink}`, 진행 `{colors.info}`, 완료 `{colors.success}`, 취소/실패 `{colors.danger}`. 배경은 항상 `{colors.canvas}`.

**`badge-sale-text`**
- 가격 행 인라인 텍스트 `{colors.sale}`, 배경 없음. 시스템에서 유일하게 컨테이너 없는 "뱃지".

**`crew-chip`** (런타임 크루 색)
- Default: 배경 `var(--crew-primary-soft)`, 텍스트 `{colors.ink}`, 1px solid `var(--crew-primary)`, radius `{rounded.lg}`, 패딩 `4px 12px`.
- 주문 카드·mypage·크루 승인 화면 등 사용자가 어느 크루 소속인지를 시각적으로 식별해야 하는 곳에서만 등장.

### Navigation

**`utility-bar`** — 상단 유틸리티
- 배경 `{colors.soft-cloud}`, 텍스트 `{colors.ink}`, 타입 `{typography.caption-sm}`, 높이 ~36px, radius `{rounded.none}`.
- 우측 클러스터: "매장 찾기 · 도움말 · 회원가입 · 로그인". 항상 노출, 모바일에서 숨김.

**`primary-nav`** — 메인 내비
- 배경 `{colors.canvas}`, 텍스트 `{colors.ink}`, 타입 `{typography.body-strong}`, 높이 56–64px.
- 레이아웃: 좌측 로고(32×32 RunHouse 워드마크) · 가운데 내비 행("신상 · 크루 모자 · 크루 티셔츠 · 스튜디오 · 갤러리 · 크루 가이드") · 우측 클러스터(search pill, 찜 아이콘, 장바구니 아이콘, 프로필 아이콘).
- 활성 섹션: 2px bottom underline `{colors.ink}`. 배경 fill 금지.

**`sub-nav` (PLP)** — 1차 내비 아래
- 배경 `{colors.canvas}` + 1px inset `{colors.hairline-soft}` 하단.
- 좌측: 브레드크럼 `{typography.caption-md}` `{colors.mute}` " / "로 구분.
- 우측: "필터 숨김" 토글 + "정렬: …" 드롭다운. 둘 다 `{typography.button-md}` + chevron.

**`mobile-nav`**
- 좌측 햄버거 → 가운데 워드마크 → 우측 검색·장바구니 아이콘.
- 검색은 아이콘 → 탭 시 풀폭 오버레이 알약(`{rounded.md}`).
- 메뉴는 좌측에서 슬라이드 인하는 풀하이트 드로어, 각 행 24px 수직 패딩.

### Signature Components

**`pdp-disclosure-row`** — 상품 상세 아코디언
- "상세 정보", "배송·교환", "리뷰 (n)" 세로 적층, 각 행 수직 24px 패딩 + 1px `{colors.hairline}` 하단.
- 라벨 `{typography.body-strong}` 좌, chevron 우.

**`faq-row`** — 자주 묻는 질문
- pdp-disclosure-row와 동일 패턴, 라벨만 `{typography.heading-md}`.

**`filter-sidebar`** — PLP 좌측 레일
- 컨테이너 `{colors.canvas}`, radius `{rounded.none}`.
- 섹션 헤더 `{typography.body-strong}` `{colors.ink}` + 그룹 간 18px 수직 갭.
- 활성 필터는 라벨 아래 1px ink underline. 카운트는 `{colors.mute}`로 괄호 표기.

**`footer`**
- 배경 `{colors.canvas}` + 1px `{colors.hairline}` 상단 디바이더.
- 4컬럼: 리소스 / 도움말 / 회사 / 프로모션. 컬럼 헤더 `{typography.body-strong}` + 링크 리스트 `{typography.caption-md}` `{colors.mute}`.
- 하단에 가로 룰 + `{typography.utility-xs}` `{colors.mute}` 한 줄 (저작권, 사업자 정보, 약관, 개인정보).

### Studio (커스터마이저) 전용 컴포넌트

> Studio는 본 시스템에서 유일하게 "에디팅 도구"의 시각 어휘가 추가로 필요한 영역. 그러나 시스템의 흑백+알약 골격은 동일하게 유지한다.

**`studio-canvas`**
- 배경 `{colors.soft-cloud}` 정사각형 1:1, radius `{rounded.none}`, shadow 없음.
- 캔버스 내부의 디자인 요소(텍스트·로고·이미지)는 드래그 가능. 드래그 중에 한해 `0 8px 24px rgba(17,17,17,0.16)` shadow.

**`studio-tool-rail`** — 우측 옵션 패널
- 배경 `{colors.canvas}`, 1px `{colors.hairline}` 좌측 보더, 폭 360px (모바일은 하단 시트로 전환).
- 도구 그룹: 텍스트 / 로고 업로드 / 색상 / 위치. 각 그룹은 `{typography.heading-md}` 헤더 + 18px 수직 갭.

**`studio-tool-tab`**
- filter-chip과 동일한 알약 패턴. 활성 시 인버스.

**`studio-color-palette`**
- swatch-dot 그리드. 24px 원 8–12개 한 행. 활성 swatch만 동심원 시그니처.

**`studio-text-controls`**
- 폰트 선택 = select-dropdown, 크기 = +/- 알약 버튼 + 숫자 input, 정렬 = filter-chip 3개 그룹.

**`studio-save-cta`**
- 우측 패널 하단 sticky 영역. `{component.button-primary}` 1개, 가로 100%.

### Admin 전용 컴포넌트

> Admin은 데이터 밀도가 높지만 시각 어휘는 retail과 동일. 단, 사진 대신 **데이터 테이블·메트릭 카드**가 주연이다.

**`admin-sidebar`**
- 배경 `{colors.canvas}`, 1px `{colors.hairline}` 우측 보더, 폭 220px.
- 메뉴 행: 16px 수직 패딩, 활성 시 좌측에 4px solid `{colors.ink}` 인디케이터 + 텍스트 `{typography.body-strong}`.

**`admin-metric-card`**
- 배경 `{colors.canvas}`, 1px `{colors.hairline}` 보더, radius `{rounded.none}`, 패딩 24px.
- 메트릭명 `{typography.caption-md}` `{colors.mute}` → 메트릭 값 `{typography.heading-xl}` `{colors.ink}` → 변화량 `{typography.caption-sm}` (`{colors.success}` 또는 `{colors.danger}`).
- shadow·gradient 금지.

**`admin-table`**
- 행 구분: 1px `{colors.hairline}` 하단 보더. 헤더 행은 `{colors.soft-cloud}` 배경 + `{typography.caption-md}` `{colors.mute}` uppercase.
- 데이터 행 패딩 `16px 12px`, 1행 1px hairline.
- 행 액션 버튼은 우측 정렬 + `{typography.caption-md}` underline 텍스트 링크 형태 (`{component.link-md}`). 알약 버튼 사용 금지 (테이블 밀도 깨짐).

## Do's and Don'ts

### Do
- `{typography.display-campaign}` (Bebas Neue 96px / Pretendard Black)는 캠페인 헤로에만. 섹션 헤더·상품명에 96px 사용 금지.
- 한 뷰포트당 `{component.button-primary}` 1개. 보조 액션은 `{component.button-secondary}` 또는 underline link.
- 모든 상품 사진은 `{colors.soft-cloud}` 위에. 다른 색 배경 위에 상품 사진을 두지 말 것.
- 모든 CTA는 `{rounded.lg}` (30px) 알약. 각진 버튼은 일체 금지.
- `{colors.sale}`은 가격 행에만. 뱃지 배경·필터칩·헤딩 색 사용 금지.
- 섹션은 `{spacing.section}` (48px)로 적층. 디바이더 라인 금지 (사진 가장자리가 디바이더).
- 사진 위 CTA는 `{component.button-outline-on-image}` 흰 알약, 좌하단 앵커.
- 크루 색상은 **런타임 토큰**으로만 주입. swatch dot·studio 미리보기·crew-chip 외에서 사용 금지.
- 한글이 11px 미만으로 떨어지지 않도록 utility-xs를 11px로 클램프.

### Don't
- drop shadow / card elevation 도입 금지. 깊이는 사진이 만든다.
- accent-trail/road/track/heritage를 메인 크롬 색에 사용 금지. 카테고리 일러스트와 swatch dot 한정.
- `{colors.ink}` 대신 `{colors.charcoal}`로 CTA 만들지 말 것. 1차 알약은 항상 `#111111`.
- 상품 카드 내부 패딩 추가 금지. 사진 풀블리드.
- 같은 행에 캠페인 타일 2개를 같은 스케일로 배치 금지. 풀블리드 캠페인 1개 다음에는 그리드.
- 인라인 링크와 활성 내비 외에는 underline 금지. 버튼·헤딩·가격에 underline 금지.
- 버튼 셰이프 3번째 도입 금지. 알약 + 원형 아이콘이 전부.
- 솔리드 빨강 배경 버튼 금지. 빨강은 텍스트·1px 보더만.
- Crew Primary를 1차 CTA로 쓰지 말 것. 색을 부여받은 사용자는 자신의 색이 어떻게 등장하는지 정확히 알아야 한다 — chip과 swatch와 미리보기에만.

## Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|---|---|---|
| ultrawide | 1920px+ | 콘텐츠 max ~1440px 유지, 외곽 거터 ~80px |
| desktop-large | 1440px | 기본 데스크탑, 3-up 그리드, 풀 내비 |
| desktop | 1200px | 동일하되 외곽 거터 좁아짐 |
| desktop-small | 1024px | 필터 사이드바 압축 시작, 크루 레일 ~3 노출 |
| tablet | 1023–961px | PLP 3-up → 2-up, "필터 숨김" 기본 토글, studio 우측 패널 320px로 축소 |
| tablet-narrow | 960–640px | 1차 내비 가운데 클러스터 → 햄버거 드로어, 검색 알약 → 아이콘 |
| mobile-landscape | 639–600px | PLP 2-up → 1-up, studio 우측 패널 → 하단 시트 |
| mobile | 599–320px | 모든 페이지 단일 컬럼, 캠페인 헤드라인 96 → 48px, 섹션 갭 48 → 24px |

### Touch Targets
모든 인터랙티브 요소 ≥ 44×44px (WCAG AAA). 알약 버튼 48px / 패딩 32px. 원형 아이콘 40px이지만 hit-target은 padding으로 48px+. 필터칩 40px / 패딩 16px.

### Collapsing Strategy
- 1차 내비: 데스크탑 가운데 클러스터 → 모바일 햄버거 드로어.
- PLP: 3-up → 2-up → 1-up (1023, 599, ~). 거터 8px → 4px.
- 필터: 220px 사이드바 → 토글 → 모바일 풀스크린 오프캔버스 드로어.
- 크루 레일: 데스크탑 가로 스크롤 ~5 → 모바일 ~1.5 peek-next 패턴.
- 섹션 갭: 48 → 32 → 24.
- 캠페인 헤드라인: 96 → 64 → 48, line-height 0.9 유지.
- Studio 우측 패널: 360 → 320 → 하단 시트.

### Image Behavior
- 상품 사진은 모든 브레이크포인트에서 동일 1:1 비율. 크기만 변경, 비율 불변.
- 캠페인 타일은 데스크탑 16:9 → 모바일 4:5 art-direction crop. 헤드라인 burn-in 공간 유지.
- studio 캔버스는 모든 브레이크포인트에서 1:1, 도구는 우측 → 하단 시트.
- 비크리티컬 그리드 이미지 lazy-load.

## Iteration Guide

1. 한 번에 한 컴포넌트씩. front-matter YAML 엔트리를 우선 작성하고 globals.css 토큰으로 해결되는지 확인.
2. 토큰명을 산문에 풀어 쓰지 말 것. `{colors.ink}`, `{component.button-primary-active}`, `{rounded.lg}` 그대로 인용.
3. 새 변형은 `-active`, `-disabled`, `-focused`로 별도 엔트리화. pressed 상태를 hover로 위장 금지.
4. 본문 기본은 `{typography.body-md}`, 상품명/내비는 `{typography.body-strong}`, 디스플레이는 캠페인 헤로에만.
5. 한 뷰포트에 솔리드 ink 알약 2개 이상 등장하면 하나를 `{component.button-secondary}` 또는 `{component.button-outline-on-image}`으로 중화.
6. 새 컴포넌트 제안 시 — 기존 알약 + flat 카드 + soft-cloud 사진 어휘로 표현 가능한지 먼저 확인. 시스템의 강점은 새 토큰이 거의 필요 없다는 점.

## Known Gaps / 한국 시장 특화 메모

- **결제 흐름의 한국 표준 UI (카카오페이/네이버페이 버튼, 휴대폰 인증)** 는 외부 SDK 제공 위젯을 사용하므로 본 시스템 토큰을 강제 적용할 수 없다. 자체 결제 step UI(주소 입력, 수령자, 메시지)만 토큰을 따르고, 외부 위젯은 wrapper 컨테이너만 시스템 카드 어휘로 감싼다.
- **모바일 캡처 부재** — 위 반응형 명세는 데스크탑 증거와 Nike의 알려진 패턴을 합성한 결과. 실제 디바이스 캡처로 추후 보강.
- **Hover state는 본 문서에 토큰화하지 않음** (Nike 정책 차용). 인터랙션 강조는 active/pressed/focused 토큰으로만.
- **다이얼로그/모달**: 지오 셀렉터·국가 확인 외의 모달(장바구니 추가 확인, 주문 취소 확인, 디자인 삭제 확인) 스타일은 본 문서에 추가 정의됨 — 모달 패널 = `{colors.canvas}`, `{rounded.none}`, max-width 480px, padding 32px, backdrop `rgba(17,17,17,0.6)`.
- **Studio의 픽셀 단위 좌표 시스템** — 캔버스 내 디자인 요소의 위치/회전/스케일은 별도 데이터 스키마. 디자인 시스템은 캔버스 외곽 chrome만 책임진다.

## Reference: 토큰 → CSS 변수 매핑

```css
:root {
  /* Brand */
  --color-ink: #111111;
  --color-canvas: #ffffff;

  /* Surface */
  --color-soft-cloud: #f5f5f5;
  --color-hairline: #cacacb;
  --color-hairline-soft: #e5e5e5;

  /* Text */
  --color-charcoal: #39393b;
  --color-ash: #4b4b4d;
  --color-mute: #707072;
  --color-stone: #9e9ea0;

  /* Semantic */
  --color-sale: #d30005;
  --color-sale-deep: #780700;
  --color-success: #007d48;
  --color-success-bright: #1eaa52;
  --color-info: #1151ff;
  --color-info-deep: #0034e3;
  --color-danger: #d30005;

  /* Category accents (편집 한정) */
  --color-accent-trail: #0a7281;
  --color-accent-road: #1151ff;
  --color-accent-track: #d30005;
  --color-accent-heritage: #4c012d;

  /* Crew runtime (런타임 주입) */
  --crew-primary: #111111; /* fallback */
  --crew-primary-soft: color-mix(in srgb, var(--crew-primary) 30%, white);

  /* Radius */
  --radius-none: 0;
  --radius-sm: 18px;
  --radius-md: 24px;
  --radius-lg: 30px;
  --radius-full: 9999px;

  /* Spacing (8px base) */
  --spacing-xxs: 2px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 18px;
  --spacing-xl: 24px;
  --spacing-xxl: 30px;
  --spacing-section: 48px;
  --spacing-section-lg: 72px;

  /* Typography */
  --font-display: "Bebas Neue", "Pretendard", system-ui, sans-serif;
  --font-sans: "Pretendard", "Inter", system-ui, sans-serif;
}
```
