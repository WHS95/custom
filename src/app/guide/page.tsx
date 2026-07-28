/**
 * /guide — 크루 굿즈 주문·운영 온보딩 (다크 브랜드 인포그래픽)
 * 러닝 코스(루트) 메타포 + 결과를 보여주는 "증명 카드"로 6단계 여정을 설명.
 * 메인 히어로의 "주문·운영 보기"에서 진입.
 */
import Link from "next/link";
import type { Metadata } from "next";
import {
  Palette,
  Factory,
  Store,
  Users,
  PackageCheck,
  UserPlus,
  Bell,
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

export const metadata: Metadata = {
  title: "운영 가이드 — 크루 굿즈는 이렇게 운영해요",
  description:
    "디자인부터 제작 확인, 상점 오픈, 사이즈 취합, 일괄 주문까지 — 크루 운영진의 6단계 여정.",
};

type RoleKey = "operator" | "member" | "factory" | "admin";
const ROLE: Record<RoleKey, { label: string; dot: string; pill: string }> = {
  operator: { label: "운영진", dot: "bg-[#C7FF00]", pill: "bg-[#C7FF00] text-[#0B0C0A]" },
  member: { label: "크루원", dot: "bg-white", pill: "bg-white text-[#0B0C0A]" },
  factory: { label: "공장", dot: "bg-amber-400", pill: "bg-amber-400 text-[#0B0C0A]" },
  admin: { label: "관리자", dot: "bg-white/30", pill: "border border-white/25 text-stone" },
};

interface Leg {
  n: string;
  icon: typeof Palette;
  title: string;
  roles: RoleKey[];
  body: string;
  where: string;
}

const LEGS: Leg[] = [
  {
    n: "01",
    icon: UserPlus,
    title: "크루로 가입",
    roles: ["operator"],
    body: "이메일로 크루 회원가입하면 바로 운영진이 돼요. 상점 개설·제작 문의는 즉시, 10% 크루 할인가만 관리자 승인 후 적용됩니다.",
    where: "회원가입 · 마이페이지",
  },
  {
    n: "02",
    icon: Palette,
    title: "굿즈 디자인",
    roles: ["operator"],
    body: "스튜디오에서 베이스 상품을 고르고 로고·텍스트를 뷰(앞·뒤·옆)별로 배치해 우리 크루 굿즈를 만들어요.",
    where: "스튜디오",
  },
  {
    n: "03",
    icon: Factory,
    title: "제작 가능 확인",
    roles: ["factory", "operator"],
    body: "디자인을 제작 문의로 보내면 공장이 실제 제작 가능 여부를 판정해요. 승인된 디자인만 상점에 올릴 수 있어요.",
    where: "내 제작 문의",
  },
  {
    n: "04",
    icon: Store,
    title: "상점 오픈",
    roles: ["operator"],
    body: "승인된 굿즈를 등록하면 우리 크루만의 굿즈 상점이 자동으로 만들어져요. 색상·가격이 함께 올라가요.",
    where: "내 상점",
  },
  {
    n: "05",
    icon: Users,
    title: "사이즈 취합",
    roles: ["member"],
    body: "상점 링크를 단톡방에 공유하면, 크루원은 로그인 없이 이름·연락처만으로 색상·사이즈·수량을 직접 등록해요.",
    where: "상점 링크 공유",
  },
  {
    n: "06",
    icon: PackageCheck,
    title: "일괄 주문·배송",
    roles: ["operator"],
    body: "취합이 끝나면 집계된 수량으로 한 번에 주문하고, 한 곳으로 배송받아 크루원에게 나눠줘요. 결제·정산도 자동 매칭돼요.",
    where: "취합 관리 · 내 주문",
  },
];

const MANAGE = [
  { icon: Store, title: "내 상점", body: "굿즈 추가·내리기, 운영 기간, 주문 현황을 한 곳에서." },
  { icon: Bell, title: "알림", body: "제작 승인·반려, 신규 주문, 할인 승인 소식을 모아서." },
  { icon: ClipboardCheck, title: "내 제작 문의", body: "심사 상태·공장 의견을 추적하고 바로 상점에 등록." },
];

function RolePills({ roles }: { roles: RoleKey[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {roles.map((r) => (
        <span
          key={r}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${ROLE[r].pill}`}
        >
          {ROLE[r].label}
        </span>
      ))}
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-ink text-canvas">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#C7FF00] opacity-[0.10] blur-[120px]"
        />

        <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-12 sm:pb-24 sm:pt-16">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-1 text-sm text-stone transition-colors hover:text-canvas"
          >
            <ArrowLeft className="h-4 w-4" />홈으로
          </Link>

          <p className="text-kicker mb-5 text-[#C7FF00]">· HOW CREW OPS WORK ·</p>
          <h1 className="font-display text-[44px] uppercase leading-[0.92] tracking-[0] sm:text-[72px]">
            크루 굿즈,
            <br />
            이렇게 <span className="text-[#C7FF00]">운영해요</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-stone sm:text-lg">
            디자인 한 번이면 제작 확인부터 크루원 사이즈 취합, 일괄 주문까지.
            운영진이 달리는 6개의 코스를 따라가 보세요.
          </p>

          {/* Toss식 증명 카드 — 결과를 먼저 보여준다 */}
          <div className="mt-10 max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C7FF00] text-[#0B0C0A]">
                <Check className="h-5 w-5" strokeWidth={3} />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-canvas">우리 크루 상점이 열렸어요</p>
                <p className="text-sm text-stone">굿즈 3종 · 24명 참여 · 한 번에 주문</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-[#C7FF00]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C7FF00]" />
              링크 하나로 취합·결제까지 끝
            </div>
          </div>
        </div>
      </section>

      {/* ── 역할 범례 ── */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 text-sm text-stone">
          <span className="text-xs uppercase tracking-widest text-stone/60">함께하는 사람</span>
          {(Object.keys(ROLE) as RoleKey[]).map((r) => (
            <span key={r} className="inline-flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${ROLE[r].dot}`} />
              {ROLE[r].label}
            </span>
          ))}
        </div>
      </section>

      {/* ── 6개 LEG — 스택 카드 + 라임 넘버 ── */}
      <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
        <div className="space-y-4 sm:space-y-5">
          {LEGS.map((leg) => {
            const Icon = leg.icon;
            return (
              <article
                key={leg.n}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-[#C7FF00]/40 hover:bg-white/[0.04] sm:p-8"
              >
                {/* 큰 라임 아웃라인 넘버 (구조적 장치 — 실제 순서) */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-1 top-2 select-none font-display text-[88px] font-black leading-none tracking-tighter text-transparent sm:text-[120px]"
                  style={{ WebkitTextStroke: "1px rgba(199,255,0,0.16)" }}
                >
                  {leg.n}
                </span>

                <div className="relative flex items-start gap-4 sm:gap-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#C7FF00] text-[#0B0C0A] sm:h-12 sm:w-12">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span className="font-display text-xs tracking-widest text-[#C7FF00]">
                        LEG {leg.n}
                      </span>
                      <RolePills roles={leg.roles} />
                    </div>
                    <h2 className="mt-1.5 text-xl font-bold text-canvas sm:text-2xl">
                      {leg.title}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone sm:text-base">
                      {leg.body}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2.5 py-1 text-xs text-stone">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C7FF00]" />
                      {leg.where}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── 운영 대시보드 ── */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:py-20">
          <p className="text-kicker mb-3 text-[#C7FF00]">· 언제든 여기서 관리해요 ·</p>
          <h2 className="font-display text-2xl uppercase tracking-wide sm:text-3xl">
            운영 대시보드
          </h2>
          <p className="mt-3 max-w-lg text-sm text-stone sm:text-base">
            상점을 연 뒤엔 이 세 곳에서 굿즈와 주문, 소식을 관리해요.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {MANAGE.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-white/20"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#C7FF00] text-[#0B0C0A]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-bold text-canvas">{m.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone">{m.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-white/10">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:py-20">
          <h2 className="font-display text-2xl uppercase tracking-wide sm:text-4xl">
            이제 코스를 출발해요
          </h2>
          <p className="mt-3 text-sm text-stone sm:text-base">
            크루로 가입하고 첫 굿즈를 디자인해 보세요.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[4px] bg-[#C7FF00] px-8 font-bold text-[#0B0C0A] transition-all hover:brightness-95 active:scale-[0.98]"
            >
              크루 회원가입
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[4px] border border-white/20 px-8 font-medium text-canvas transition-colors hover:bg-white/5"
            >
              스튜디오 둘러보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
