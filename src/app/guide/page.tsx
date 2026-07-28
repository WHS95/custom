/**
 * /guide — 크루 굿즈 주문·운영 온보딩
 * 마라톤 코스 메타포: START → 6개 LEG 체크포인트 → FINISH.
 * 러닝/지도 주제에 근거를 두고 라임은 절제(루트·핵심 액센트만), 라벨은 모노.
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
  Flag,
} from "lucide-react";

export const metadata: Metadata = {
  title: "운영 가이드 — 크루 굿즈는 이렇게 운영해요",
  description:
    "START부터 FINISH까지, 디자인·제작 확인·상점·취합·일괄 주문 6개 코스로 보는 크루 운영.",
};

type RoleKey = "operator" | "member" | "factory" | "admin";
const ROLE: Record<RoleKey, string> = {
  operator: "운영진",
  member: "크루원",
  factory: "공장",
  admin: "관리자",
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

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-ink text-canvas">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-[#C7FF00] opacity-[0.07] blur-[130px]"
        />
        <div className="relative mx-auto max-w-3xl px-5 pb-14 pt-12 sm:pb-20 sm:pt-16">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-1 text-sm text-stone transition-colors hover:text-canvas"
          >
            <ArrowLeft className="h-4 w-4" />홈으로
          </Link>

          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#C7FF00]">
            How crew ops work
          </p>
          <h1 className="mt-5 font-display text-[44px] uppercase leading-[0.92] tracking-[0] sm:text-[72px]">
            크루 굿즈,
            <br />
            이렇게 <span className="text-[#C7FF00]">운영해요</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-stone sm:text-lg">
            디자인 한 번이면 제작 확인부터 크루원 사이즈 취합, 일괄 주문까지.
            START에서 FINISH까지 6개 코스를 따라가 보세요.
          </p>

          {/* 증명 카드 — 결과를 먼저 */}
          <div className="mt-10 max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-stone/70">
              Finish line
            </p>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C7FF00] text-[#0B0C0A]">
                <Check className="h-5 w-5" strokeWidth={3} />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-canvas">우리 크루 상점이 열렸어요</p>
                <p className="text-sm text-stone">굿즈 3종 · 24명 참여 · 한 번에 주문</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 코스: START → 6 LEG → FINISH ── */}
      <section className="mx-auto max-w-3xl px-5 pb-6 sm:pb-10">
        {/* START */}
        <div className="mb-4 flex items-center gap-4">
          <div className="flex w-12 shrink-0 justify-center">
            <span className="h-2.5 w-2.5 rounded-full bg-[#C7FF00]" />
          </div>
          <div className="flex flex-1 items-center gap-2.5">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#C7FF00]">
              Start
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </div>

        <ol>
          {LEGS.map((leg, i) => {
            const Icon = leg.icon;
            const last = i === LEGS.length - 1;
            return (
              <li key={leg.n} className="flex gap-4">
                {/* 레일 컬럼: 배번 + 연결선 */}
                <div className="flex w-12 shrink-0 flex-col items-center">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-ink">
                    <span
                      aria-hidden
                      className="absolute inset-x-2 top-0 h-[3px] rounded-b bg-[#C7FF00]"
                    />
                    <span className="font-display text-lg leading-none text-canvas">
                      {leg.n}
                    </span>
                  </div>
                  {!last && <span aria-hidden className="mt-1 w-px flex-1 bg-white/12" />}
                </div>

                {/* 내용 */}
                <div className="flex-1 pb-9">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] uppercase tracking-[0.18em] text-stone/70">
                    <span className="text-[#C7FF00]">LEG {leg.n}</span>
                    <span className="text-white/20">/</span>
                    {leg.roles.map((r) => (
                      <span key={r}>{ROLE[r]}</span>
                    ))}
                  </div>
                  <h2 className="mt-1.5 flex items-center gap-2 text-xl font-bold text-canvas sm:text-2xl">
                    <Icon className="h-5 w-5 shrink-0 text-stone" />
                    {leg.title}
                  </h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone sm:text-[15px]">
                    {leg.body}
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-stone/60">
                    <span className="h-1 w-1 rounded-full bg-[#C7FF00]" />
                    {leg.where}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* FINISH */}
        <div className="flex items-center gap-4">
          <div className="flex w-12 shrink-0 justify-center">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C7FF00] text-[#0B0C0A]">
              <Flag className="h-3 w-3" strokeWidth={3} />
            </span>
          </div>
          <div className="flex flex-1 items-center gap-2.5">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#C7FF00]">
              Finish
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
        </div>
      </section>

      {/* ── 운영 대시보드 ── */}
      <section className="mt-10 border-t border-white/10">
        <div className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-stone/70">
            After the finish
          </p>
          <h2 className="mt-3 font-display text-2xl uppercase tracking-wide sm:text-3xl">
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
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-canvas">
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
        <div className="mx-auto max-w-3xl px-5 py-14 text-center sm:py-20">
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
