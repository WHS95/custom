---
project: RunHouse Custom — Design System 적용 계획
references:
  - docs/design-system/DESIGN.md
last_updated: 2026-05-18
---

# 디자인 시스템 적용 — 전체 구현 계획

## 원칙

1. **기능을 깨뜨리지 않는다.** 토큰/스타일만 교체하고, 동작·라우팅·상태·API는 손대지 않는다. 컴포넌트 prop signature를 바꿔야 한다면 별도 작업으로 분리하고 사용처를 모두 동시에 갱신한다.
2. **밖에서 안으로.** 토큰 → 공용 UI 컴포넌트(shadcn) → 공유 레이아웃(Navbar/Footer) → 페이지 본문 순서로 작업한다. 페이지부터 손대면 토큰이 자리잡기 전에 일관성이 무너진다.
3. **각 페이지는 "기능 역할 → 시스템 어휘 매핑 → 작업 체크리스트 → 기능 무결성 보존 포인트" 4단으로 정리한다.**
4. **하나의 페이즈가 끝날 때마다 커밋한다.** CLAUDE.md의 커밋 규칙 (이모지 + 한 줄 요약 + Happy 공동 저자) 준수.

---

## Phase 0 — 준비 (반나절)

- [ ] `docs/design-system/DESIGN.md` 합의 (✅ 본 PR로 작성됨)
- [ ] 디자인 토큰 마이그레이션 가이드(본 문서 Phase 1) 확정
- [ ] Pretendard 폰트 도입 방식 결정: CDN(`jsdelivr`) vs `next/font/local` self-host
  - 권장: `next/font/local` + woff2 self-host. FOIT 최소화, LCP 개선.
- [ ] 기존 `Inter` 의존 제거 여부 결정 (대안: 폴백으로만 남김)
- [ ] 백업: `globals.css` 현 상태를 `globals.css.shadcn-backup`으로 사이드 카피 (롤백 안전망)

**기능 무결성 보존 포인트**
- 폰트 교체 후 `studio` 캔버스에서 사용자가 선택할 수 있는 인쇄용 폰트 풀(Black Han Sans, Jua, Do Hyeon, Gugi, Gasoek One, Permanent Marker, Bangers 등)은 **그대로 유지**. 이는 UI 폰트가 아니라 **제품 인쇄 폰트**이므로 시스템 토큰과 분리.

---

## Phase 1 — 토큰 마이그레이션 (1일)

> 목표: `globals.css`를 Nike 시스템 hex 팔레트로 재정의하고, Tailwind v4 `@theme inline`에 토큰을 노출. 모든 후속 작업이 이 토큰 위에서 돌아간다.

### 작업

1. **`src/app/globals.css` 재작성**
   - `:root`의 oklch 토큰을 DESIGN.md의 hex 변수로 교체 (`--color-ink`, `--color-canvas`, `--color-soft-cloud`, ...).
   - `@theme inline` 블록에서 Tailwind utility 매핑을 갱신: `--color-primary: var(--color-ink)`, `--color-background: var(--color-canvas)`, `--color-muted: var(--color-soft-cloud)`, `--color-muted-foreground: var(--color-mute)`, `--color-destructive: var(--color-danger)`, `--color-border: var(--color-hairline)`, `--color-ring: var(--color-ink)`.
   - `--radius` 토큰 트리를 `--radius-none/sm/md/lg/full`로 재정의. shadcn의 `--radius` 단일 토큰 의존성을 호환 유지를 위해 `--radius: var(--radius-lg)` 별칭 유지.
   - `--spacing-*` 토큰 신규 추가. Tailwind v4는 utility class에서 spacing 토큰을 직접 참조할 수 있다.
   - 다크모드(`.dark`) 블록: 본 시스템은 다크모드 1차 지원이 아니므로 보류. globals.css에 다크 토큰은 남기되 페이지에서 `.dark` 클래스 토글 비활성. 추후 별도 페이즈.

2. **폰트 도입**
   - `public/fonts/` 하위에 Pretendard woff2 (Regular 400 / Medium 500 / Bold 700 / Black 900) 4개 파일 추가.
   - `src/app/layout.tsx`에서 `next/font/local`로 Pretendard 로드, `--font-sans` 변수에 바인딩. `Inter` import는 폴백 변수로만 사용 (`--font-sans-fallback`) 또는 제거.
   - Bebas Neue는 Google Fonts CSS @import(현 상태)에서 `next/font/google`로 마이그레이션해 FOIT/CLS 개선. `--font-display`에 바인딩.

3. **검증**
   - `npm run build` 통과 확인
   - `/`, `/gallery`, `/studio/[productId]`, `/cart`, `/mypage`, `/admin/*` 라우트가 콘솔 에러 없이 렌더되는지 확인 (잠시 깨져 보이는 것은 허용)

### 기능 무결성 보존 포인트
- shadcn 컴포넌트들이 `--primary`, `--background`, `--muted`, `--destructive` 등 의미 토큰을 참조하므로 **새 hex 변수에 별칭으로 매핑**한다. 토큰을 삭제하지 않는다.
- 다크모드 토글을 사용 중인 화면(없을 것으로 추정되나 `next-themes` 의존성 있음)이 있으면 dark 토큰도 hex 시스템에 맞춰 임시값 부여. 별도 페이즈에서 정식 정의.

### 커밋 메시지 예시
```
🔧 디자인 토큰을 Nike 시스템(hex)으로 마이그레이션

- globals.css의 oklch 토큰을 ink/canvas/soft-cloud/hairline hex로 교체
- Tailwind @theme에 spacing/radius/typography 토큰 노출
- Pretendard(self-host) + Bebas Neue(next/font/google) 도입
- shadcn 의미 토큰(--primary 등)을 새 hex 토큰의 별칭으로 매핑

Generated with Claude Code via Happy
Co-Authored-By: Claude <noreply@anthropic.com>
Co-Authored-By: Happy <yesreply@happy.engineering>
```

---

## Phase 2 — 공용 UI 컴포넌트 재스타일 (2일)

> 목표: `src/components/ui/`의 shadcn 컴포넌트들을 본 시스템 어휘로 재정의. 페이지 코드는 변경하지 않는다.

### 컴포넌트별 작업

#### `button.tsx`
- variants:
  - `default` → `button-primary` (배경 `bg-[var(--color-ink)]` 텍스트 `text-[var(--color-canvas)]` radius `rounded-[30px]` height 48px padding `px-8 py-4`)
  - `secondary` → `button-secondary` (`bg-[var(--color-soft-cloud)]` 등)
  - `outline` → `button-outline-on-image` (`bg-[var(--color-canvas)]` border 없음, 작은 패딩)
  - `ghost` → 내비 링크 톤 (`bg-transparent` text `text-[var(--color-ink)]`)
  - `destructive` → `button-destructive` (캔버스 배경 + 빨간 1px 보더 + 빨간 텍스트, **솔리드 빨강 금지**)
  - `link` → underline 인라인 링크 (`underline underline-offset-4 text-[var(--color-ink)]`)
- sizes: `lg`(48px), `default`(40px), `sm`(36px), `icon`(40x40 원형)
- pressed: `active:scale-[0.96] active:opacity-85`

#### `card.tsx`
- 기본을 `bg-[var(--color-canvas)] rounded-none border-0 shadow-none`로 변경.
- `Card`, `CardHeader`, `CardContent` 내부 패딩 토큰을 spacing 토큰으로 (`p-6` → `p-[var(--spacing-xl)]` 등).
- shadow 사용 페이지가 있다면 옵션으로 `elevated` prop을 추가하지 말고, 호출처에서 명시적 클래스 추가. (시스템 정책: shadow는 studio 드래그 중에만)

#### `input.tsx` + `email-input.tsx` + `phone-input.tsx` + `textarea.tsx`
- 박스형(상하좌우 border) → **underline형**: `border-0 border-b border-[var(--color-hairline)] rounded-none px-0 py-3`.
- focus: `focus-visible:border-b-2 focus-visible:border-[var(--color-ink)] focus-visible:ring-0`.
- 검색 컨텍스트에서는 별도 `SearchPill` 컴포넌트 신설 (shadcn input은 underline 형태로, 검색은 알약 형태로 분리).

#### `badge.tsx`
- 기본을 `badge-promo` 스펙으로: `bg-[var(--color-canvas)] border border-[var(--color-hairline)] text-[var(--color-ink)] rounded-[30px] px-3 py-1 text-xs font-medium`.
- variants: `default`, `status-pending`, `status-info`, `status-success`, `status-danger`, `sale-text`(컨테이너 없는 인라인 빨강).

#### `select.tsx`
- trigger를 알약 형태로: `rounded-[24px] bg-[var(--color-soft-cloud)] border-0 h-10 px-4`.
- content 패널은 `rounded-none border border-[var(--color-hairline)] shadow-none`.

#### `dialog.tsx` + `sheet.tsx` + `alert-modal.tsx`
- 모달 패널: `bg-[var(--color-canvas)] rounded-none max-w-[480px] p-8 shadow-none border border-[var(--color-hairline)]`.
- backdrop: `bg-[rgba(17,17,17,0.6)]`.
- close 버튼: 우상단 `button-icon-circular` 40px.

#### `tabs.tsx`
- TabsList: 알약 그룹 (`filter-chip` 어휘) 또는 underline 탭 중 페이지별 선택. 기본은 underline 탭으로 변경: `bg-transparent border-b border-[var(--color-hairline-soft)]`, 활성 탭은 `border-b-2 border-[var(--color-ink)]`.

#### `separator.tsx`
- `bg-[var(--color-hairline)] h-px` 단일 처리.

#### `dropdown-menu.tsx`
- 패널: `rounded-none border-[var(--color-hairline)] shadow-none bg-[var(--color-canvas)]`.
- 아이템: 활성 시 배경 `bg-[var(--color-soft-cloud)]`.

#### `tooltip.tsx`
- `bg-[var(--color-ink)] text-[var(--color-canvas)] rounded-[24px] px-3 py-1.5 text-xs`. shadow 없음.

#### `sonner.tsx` (토스트)
- 토스트 컨테이너: `bg-[var(--color-ink)] text-[var(--color-canvas)] rounded-[30px] px-4 py-3 border-0`.
- success/error variant는 좌측에 4px solid `var(--color-success)` / `var(--color-danger)` 인디케이터.

#### `skeleton.tsx`
- `bg-[var(--color-soft-cloud)] rounded-none animate-pulse`.

#### `label.tsx`
- `text-[var(--color-ink)] text-sm font-medium`. underline 금지.

### 신규 컴포넌트 (UI 레이어 추가)

- `src/components/ui/search-pill.tsx`: `search-pill` 스펙 그대로. 내비와 PLP에서 재사용.
- `src/components/ui/filter-chip.tsx`: `filter-chip` + `filter-chip-active` 토글. PLP·studio 양쪽에서 사용.
- `src/components/ui/swatch-dot.tsx`: 12px·24px 원형, active 동심원. 상품 카드·studio에서 공용.
- `src/components/ui/campaign-tile.tsx`: 풀블리드 이미지 + 디스플레이 헤드라인 + 좌하단 outline-on-image 알약. 홈·갤러리·멤버 화면에서 재사용.

### 기능 무결성 보존 포인트
- prop signature 변경 금지. `variant`/`size` 옵션은 그대로 두고, **각 variant의 시각만** 본 시스템에 맞게 갈아끼운다. 페이지에서 `<Button variant="destructive">`를 사용 중이면 빨간 솔리드가 빨간 outline으로만 바뀐다.
- 사용처 중 일부가 `className` overrides로 색·radius를 강제하고 있을 수 있음. 컴포넌트 단계에서 토큰만 갈고, 페이지의 ad-hoc override는 Phase 3에서 정리.
- 토스트 메시지·alert-modal 사용처(주문 완료, 결제 실패 등)는 시각만 바뀌고 메시지 흐름은 동일.

### 검증
- 시각 회귀: 주요 페이지 5개(`/`, `/gallery`, `/studio/[productId]`, `/cart`, `/mypage`) 스크린샷 캡처 후 변경 사항 확인.
- 기능 회귀: 회원가입 → 디자인 → 장바구니 → 주문 플로우를 1회 직접 수행.

### 커밋
- 컴포넌트별로 1커밋 권장 (`💄 Button을 알약 알약 시스템으로 재스타일`, `💄 Card를 flat·radius-none으로 재정의`, ...).
- 신규 컴포넌트 추가는 별도 커밋(`✨ SearchPill·FilterChip·SwatchDot·CampaignTile 신규 추가`).

---

## Phase 3 — 페이지별 적용 (3–5일)

### 페이지 매트릭스

| Route | 기능 역할 | 사진 자원 필요 | 시스템 어휘 | 우선순위 |
|---|---|---|---|---|
| `/` | 브랜드 첫 인상, 카테고리 진입 | 캠페인 헤로 1, 크루 타일 4 | campaign-tile · crew-tile · product-card 그리드 · footer | 최상 |
| `/gallery` | 상품 목록·필터·정렬 | 상품 사진 N | sub-nav · filter-sidebar · product-card · pagination | 최상 |
| `/studio/[productId]` | 디자인 커스터마이저 | 상품 mock 1 | studio-canvas · studio-tool-rail · studio-color-palette · studio-save-cta | 최상 |
| `/cart` | 장바구니, 합계, 주문 진입 | 0 | text-input(메모) · product-card-mini · button-primary | 중 |
| `/order` & `/order/[orderNumber]` | 결제 단계, 주문 완료 | 0 | step-indicator(신규) · text-input · button-primary · order-summary-card | 중 |
| `/mypage` `/mypage/profile` `/mypage/orders` | 프로필·주문이력 | 멤버 혜택 카드 3 | member-benefit-card · admin-table 어휘 차용(주문 목록) | 중 |
| `/(auth)/login` `/signup` `/forgot-password` `/reset-password` | 인증 | 캠페인 헤로 1 (선택) | text-input · button-primary · campaign-tile 좌측 분할 레이아웃 | 최상 |
| `/admin/[tenantSlug]/dashboard` | KPI · 매출 · 신규 주문 | 0 | admin-sidebar · admin-metric-card · admin-table | 중 |
| `/admin/[tenantSlug]/products` `/orders` `/crew-approvals` `/reviews` `/settings` | 운영자 데이터 관리 | 0 | admin-sidebar · admin-table · filter-chip · dialog | 중 |
| `/crew-approval/pending` | 크루 가입 승인 대기 | 0 | member-benefit-card · button-primary | 하 |
| `/onboarding` | 신규 사용자 환영 | 캠페인 헤로 1 | campaign-tile · button-primary | 하 |
| `/dashboard` | 일반 사용자 대시보드 (있다면 mypage 통합 검토) | 0 | member-benefit-card 그리드 | 하 |

### 페이지별 작업 상세

#### 3.1 `/` (Home, 우선순위 최상)
**기능 역할:** 브랜드 첫 인상 + 상품 카테고리 진입 + 신상 알림.

**시스템 어휘 매핑:**
- 상단: `utility-bar` + `primary-nav` (Navbar.tsx 갱신).
- 1차 폴드: 풀블리드 `campaign-tile` (16:9, "당신의 크루, 당신의 보폭" / 영문 lockup).
- 2차 폴드: 3-up `crew-tile` 가로 스크롤 레일 ("로드 / 트랙 / 트레일").
- 3차 폴드: "신상" `{typography.heading-xl}` 헤더 + 4-up `product-card` 그리드.
- 4차 폴드: "곧 출시" 1-up wide `campaign-tile` (좌하단 outline-on-image CTA).
- 푸터: `footer` 4컬럼.

**작업 체크리스트:**
- [ ] `src/app/page.tsx` 본문 구조 재작성 (단순 hero 단일 → 4단 적층).
- [ ] 캠페인 카피·이미지 자리표시자 (`/public/campaign/hero-1.jpg` 등). 운영자가 admin에서 교체 가능하도록 추후 CMS 연결 고려.
- [ ] 크루 타일은 운영자가 등록한 상위 4개 크루 사진 사용. API: 기존 `/api/crews` 또는 `/api/tenants` 활용.
- [ ] 신상 그리드는 `/api/products?sort=latest&limit=8` 호출 (없으면 신규 추가).

**기능 무결성 보존 포인트:**
- 기존 홈에 존재하는 진입 동선(스튜디오 시작, 갤러리 보기, 로그인)을 모두 유지. campaign-tile의 CTA 한 개와 crew-tile의 CTA 한 개에 동선을 분산 매핑.

#### 3.2 `/gallery` (PLP, 우선순위 최상)
**기능 역할:** 상품 검색·필터·정렬·페이지네이션.

**시스템 어휘:** `primary-nav` → `sub-nav`(브레드크럼·필터 토글·정렬) → 좌측 `filter-sidebar` + 우측 3-up `product-card` 그리드 → 페이지네이션 알약 그룹.

**작업 체크리스트:**
- [ ] `src/components/products/` 내 카드 컴포넌트를 새 `product-card` 어휘로 교체.
- [ ] `filter-sidebar` 신규 컴포넌트 (카테고리·색상·사이즈·가격대). 필터칩은 알약 인버스.
- [ ] 모바일에서 `filter-sidebar` → 풀스크린 오프캔버스 (`sheet` 컴포넌트 활용).
- [ ] 정렬 드롭다운은 `select-dropdown` 어휘.
- [ ] 페이지네이션은 알약 버튼 그룹.

**기능 무결성 보존 포인트:**
- 필터 상태(URL query string) 유지. 새 UI로 갈아끼우되 query parameter 스펙은 동일.
- 정렬 옵션·필터 옵션 enum 유지.

#### 3.3 `/studio/[productId]` (커스터마이저, 우선순위 최상)
**기능 역할:** 캔버스 위에서 텍스트·로고·색상 편집 후 디자인 저장.

**시스템 어휘:** 좌측 1차 내비 통과 → 상단 sub-nav (상품명 + "저장하기" 알약) → 좌측 ~80px 썸네일 레일 + 가운데 정사각 `studio-canvas` + 우측 360px `studio-tool-rail`.

**작업 체크리스트:**
- [ ] `src/components/customizer/HatCustomizer.tsx`의 외곽 레이아웃을 본 시스템 grid로 재배치 (`min-h-screen grid grid-cols-[80px_1fr_360px]`).
- [ ] 캔버스 컨테이너 `bg-[var(--color-soft-cloud)] aspect-square rounded-none`.
- [ ] 우측 도구 레일 내부의 그룹 헤더 `{typography.heading-md}`, 도구 탭은 `filter-chip` 어휘.
- [ ] 색상 선택 그리드 `swatch-dot` 24px × N. 활성 시 동심원.
- [ ] 폰트 선택 dropdown: shadcn `select` (Phase 2 재스타일된 상태). **인쇄 폰트 enum은 그대로 유지** (Black Han Sans 등).
- [ ] 모바일에서 우측 패널 → 하단 sheet.
- [ ] 저장 sticky 영역 하단 `button-primary` 가로 100%.

**기능 무결성 보존 포인트:**
- 캔버스 내부 디자인 요소 좌표 시스템(react-rnd)·zustand 상태 스토어·저장 API 절대 변경 금지. 외곽 chrome만 교체.
- 드래그 중 shadow는 react-rnd의 dragging callback에서 임시 클래스 부여로 처리.
- 사용자가 선택한 디자인을 미리보기/장바구니에서 일관되게 렌더링하는 캔버스 직렬화 포맷(JSON) 변경 금지.

#### 3.4 `/cart` (장바구니, 우선순위 중)
**기능 역할:** 담긴 디자인 미리보기 + 수량·옵션 변경 + 합계 + 주문 진입.

**시스템 어휘:** 단일 컬럼 1140px, 상단 `{typography.heading-xl}` "장바구니". 각 항목은 한 행 (좌측 정사각 미리보기 120px + 가운데 메타 + 우측 가격/삭제). 우하단 또는 sticky bottom에 합계 카드 + `button-primary` "주문하기".

**작업 체크리스트:**
- [ ] `src/components/cart/`의 카드 컴포넌트를 본 어휘로 교체. 박스 보더 제거, hairline divider 적층.
- [ ] 수량 컨트롤은 `+/-` 원형 아이콘 버튼 + 가운데 input.
- [ ] 모바일은 sticky bottom bar (합계 + 주문하기 알약).
- [ ] 빈 카트 상태: 가운데 빈 카트 일러스트 + `{typography.heading-lg}` "장바구니가 비어 있습니다" + `button-secondary` "갤러리 보기".

**기능 무결성 보존 포인트:**
- `CartSync` 컴포넌트·zustand store 인터페이스 유지. 시각만 변경.
- 미리보기 이미지는 studio가 생성한 thumbnail 그대로 사용.

#### 3.5 `/order` & `/order/[orderNumber]` (결제, 우선순위 중)
**기능 역할:** 다단계 결제 (수령자·배송지·결제수단·확인) + 주문 완료 화면.

**시스템 어휘:** `step-indicator` 신규(상단 3–4단 알약 인디케이터) + underline `text-input` 폼 + 우측 `order-summary-card` 고정.

**작업 체크리스트:**
- [ ] step-indicator: 각 step을 알약 형태, 활성 step만 `{colors.ink}` fill.
- [ ] 외부 PG 위젯(카카오페이/네이버페이) 래퍼는 카드 어휘로만 감싸고 내부는 SDK 그대로.
- [ ] 주문 완료(`/order/[orderNumber]`): 상단에 `{typography.heading-xl}` "주문이 완료되었습니다" + 주문번호 + `{component.button-secondary}` "주문 내역 보기" / `{component.button-primary}` "쇼핑 계속하기".

**기능 무결성 보존 포인트:**
- 결제 SDK 콜백 흐름·주문 상태 전이 절대 변경 금지.
- 이메일 알림(Supabase Edge Function + Resend, 최근 커밋에 반영) 트리거 그대로.

#### 3.6 `/mypage`, `/mypage/profile`, `/mypage/orders` (우선순위 중)
**기능 역할:** 사용자 프로필 / 주문 이력.

**시스템 어휘:** 좌측 220px sub-nav(프로필·주문이력·찜·로그아웃) + 우측 본문. 본문은 페이지에 따라 underline 폼(프로필) 또는 admin-table 어휘를 차용한 주문 리스트.

**작업 체크리스트:**
- [ ] 좌측 sub-nav: 현재 활성 메뉴는 4px 좌측 인디케이터 + `{typography.body-strong}`.
- [ ] 프로필 폼: underline `text-input` + `button-primary` "저장".
- [ ] 주문 이력: 각 행이 상품 미리보기 80px + 메타 + 상태 `badge-status` + 우측 "상세 보기" link.
- [ ] 빈 상태(`주문 내역 없음`): 가운데 안내 + `button-secondary` "갤러리 보기".

**기능 무결성 보존 포인트:**
- 로그아웃·프로필 수정 API 호출부 변경 금지.

#### 3.7 `/(auth)/login`, `/signup`, `/forgot-password`, `/reset-password` (우선순위 최상)
**기능 역할:** 이메일/비밀번호 기반 인증 + 비밀번호 재설정.

**시스템 어휘:** 좌측 1/2 분할 풀하이트 `campaign-tile` (크루 사진 + uppercase 디스플레이) + 우측 1/2 폼. 모바일은 사진 위 1/3 + 폼 아래 2/3.

**작업 체크리스트:**
- [ ] 분할 레이아웃: `grid grid-cols-1 lg:grid-cols-2 min-h-screen`.
- [ ] 좌측 사진은 캠페인 자산. 폴백으로 `{colors.ink}` 단색 + 디스플레이 텍스트.
- [ ] 우측: 워드마크 → `{typography.heading-xl}` "로그인" → underline 이메일/비밀번호 input → `button-primary` 가로 100% → underline link "비밀번호 찾기" / "회원가입".
- [ ] 이메일 도메인 추천 UI (최근 커밋에 반영) 시각만 본 시스템에 맞춰 정리.

**기능 무결성 보존 포인트:**
- 자체 인증 + 비밀번호 재설정 흐름(최근 커밋 `7b23f73`) 동작 보존.
- Supabase Auth callback(`/auth/callback`) 라우트 변경 금지.

#### 3.8 `/admin/[tenantSlug]/*` (우선순위 중)
**기능 역할:** 운영자 데이터 관리 (상품·주문·크루 승인·리뷰·설정 + 대시보드).

**시스템 어휘:** 좌측 `admin-sidebar` + 상단 admin sub-nav(현 페이지 타이틀 + 우측 1차 액션 알약) + 본문(테이블 또는 메트릭 카드 그리드).

**작업 체크리스트:**
- [ ] `admin-sidebar` 신규: 220px, 메뉴 행 16px 패딩, 활성 4px 좌측 ink 인디케이터.
- [ ] `admin-metric-card` 신규: 1px hairline border, padding 24px. 대시보드 4-up grid.
- [ ] `admin-table` 신규: 헤더 행 soft-cloud 배경, 데이터 행 hairline 하단 보더, 행 액션은 underline link.
- [ ] 필터·검색은 알약 형태 (search-pill + filter-chip 그룹).
- [ ] 모달(상품 추가, 주문 상태 변경, 크루 승인 확인)은 본 시스템 dialog 어휘.
- [ ] 최근 커밋의 테넌트 라우팅·크루 승인 조회 로직(`1cd7607`) 보존.

**기능 무결성 보존 포인트:**
- admin tenant slug 라우팅·세션 검증 로직 변경 금지.
- 테이블의 sort/filter URL state 그대로 유지.
- destructive 액션(삭제 등)은 본 시스템 `button-destructive` (outline 빨강) + 확인 모달 패턴.

#### 3.9 `/crew-approval/pending`, `/onboarding`, `/dashboard` (우선순위 하)
**기능 역할:** 신규 가입 사용자 안내 + 크루 가입 승인 대기.

**시스템 어휘:** `campaign-tile` 풀블리드 + 좌하단 `button-primary` "시작하기" / "갤러리 보기".

**작업 체크리스트:**
- [ ] 단순화: 풀블리드 사진 + 헤드라인 + CTA 1개로 일원화.
- [ ] `/dashboard`는 `/mypage`로 흡수 가능한지 검토. 별도 페이지가 필요한 이유가 없으면 redirect로 통합.

**기능 무결성 보존 포인트:**
- 크루 승인 polling/refetch 로직 보존.
- 온보딩 완료 플래그(있다면) 보존.

---

## Phase 4 — 검증·미세조정 (1일)

### 검증

- [ ] 풀 회귀 테스트 (수동): 회원가입 → 로그인 → 갤러리 → 스튜디오 → 디자인 저장 → 장바구니 → 주문 → 완료 메일 수신.
- [ ] 관리자 회귀: admin 로그인 → 상품 등록 → 주문 상태 변경 → 크루 승인.
- [ ] 모바일 viewport(375px) 직접 확인. 1차 내비 햄버거, 갤러리 1-up, studio 하단 시트.
- [ ] Lighthouse: LCP, CLS, TBT 측정. Pretendard self-host로 폰트 CLS 감소했는지 확인.
- [ ] WCAG 콘트라스트 자동 체크 ( `{colors.mute}` on `{colors.canvas}` = 4.6:1, AA 통과 / `{colors.stone}` on `{colors.ink}` = 5.8:1, AA 통과).

### 미세조정

- [ ] 빈 상태(empty state) 일러스트 또는 카피 누락 없는지 모든 페이지 점검.
- [ ] 에러 상태(`/error.tsx`, 404) 본 시스템 어휘로 정리.
- [ ] 로딩 상태(`/loading.tsx`, 스켈레톤) Skeleton 컴포넌트로 통일.
- [ ] 한글 utility-xs 11px 클램프 적용 확인 (푸터 등).

### 커밋
- 한 종류의 미세조정마다 1커밋. `💄 빈 상태 카피·일러스트 정리`, `🐛 모바일 갤러리 1-up 거터 조정`, ...

---

## Phase 5 — 문서·툴링 (선택)

- [ ] Storybook 또는 단일 `/__design` 라우트(개발 전용)에 모든 토큰·컴포넌트를 한 페이지에 진열. 새로 합류하는 개발자/디자이너 온보딩용.
- [ ] `npx @google/design.md lint docs/design-system/DESIGN.md` 정상 통과 확인.
- [ ] 다크모드 정식 정의 (별도 PR).
- [ ] 캠페인 자산 운영자 CMS 등록 (admin에서 캠페인 이미지·헤드라인 텍스트 등록 후 홈에 노출).

---

## 예상 일정 (단순 산정)

| Phase | 작업 | 일수 |
|---|---|---|
| 0 | 준비·합의 | 0.5 |
| 1 | 토큰 마이그레이션 | 1 |
| 2 | 공용 UI 재스타일 | 2 |
| 3 | 페이지별 적용 | 3–5 |
| 4 | 검증·미세조정 | 1 |
| 5 | 문서·툴링 (선택) | 1 |
| **합계** | | **8–10일** |

## 위험 요소와 완화

1. **shadcn 토큰 의존:** dialog/select/dropdown 등이 `--radius`, `--border` 토큰을 깊이 참조. → Phase 1에서 별칭으로 매핑 유지, Phase 2에서 컴포넌트별 className override로 안전하게 시각만 교체.
2. **studio의 react-rnd·zustand 의존:** 외곽 grid 변경이 캔버스 좌표계에 영향을 줄 수 있음. → 캔버스 컨테이너의 width/height 측정 로직을 그대로 두고, 외곽 wrapper만 grid로 감싼다.
3. **인쇄 폰트 풀과 UI 폰트 혼동:** Pretendard 도입 시 studio의 인쇄 폰트 enum이 같은 변수로 묶이지 않도록 분리. `--font-print-*` 별도 네임스페이스 권장.
4. **외부 결제 SDK 시각 불일치:** 카카오페이/네이버페이 위젯은 본 시스템 토큰을 적용할 수 없음. wrapper 카드만 시스템에 맞추고 위젯은 그대로 노출. UX 가이드 카피로 사용자에게 사전 안내.
5. **운영자가 등록한 캠페인 사진 톤 일관성:** 운영 측 가이드(필름 톤·인물 배치 등) 별도 문서화 권장. 현 페이즈 범위 밖.

## 체크포인트 정의 (각 Phase 종료 기준)

- **Phase 1 종료:** 모든 페이지가 콘솔 에러 없이 렌더되고 토큰이 새 시스템을 따른다 (시각은 일부 깨져 있을 수 있음).
- **Phase 2 종료:** shadcn 컴포넌트가 본 시스템 어휘를 따른다. 페이지를 열었을 때 버튼·카드·input이 모두 본 시스템 톤을 보인다.
- **Phase 3 종료:** 모든 페이지가 페이지별 vocabulary로 재구성되어 있다. 페이지 간 일관성이 시각적으로 확인된다.
- **Phase 4 종료:** 수동 회귀 + Lighthouse 통과. 본 시스템 적용 완료.
