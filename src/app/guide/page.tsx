/**
 * /guide — 크루 굿즈 주문·운영 온보딩 인포그래픽
 * 러닝 코스(루트) 메타포로 운영진의 6단계 여정을 설명한다.
 * 메인 히어로의 "운영 가이드"에서 진입.
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
} from "lucide-react";

export const metadata: Metadata = {
  title: "운영 가이드 — 크루 굿즈는 이렇게 운영돼요",
  description:
    "디자인부터 제작 확인, 상점 오픈, 사이즈 취합, 일괄 주문까지 — 크루 운영진의 6단계 여정.",
};

/** 역할 태그 */
type RoleKey = "operator" | "member" | "factory" | "admin";
const ROLE: Record<RoleKey, { label: string; cls: string }> = {
  operator: { label: "운영진", cls: "bg-[#C7FF00] text-[#0B0C0A]" },
  member: { label: "크루원", cls: "bg-ink text-canvas" },
  factory: { label: "공장", cls: "bg-amber-400 text-[#0B0C0A]" },
  admin: { label: "관리자", cls: "border border-hairline text-mute" },
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
    body: "스튜디오에서 베이스 상품을 고르고 로고·텍스트를 뷰(앞·뒤·옆)별로 자유롭게 배치해 우리 크루 굿즈를 만들어요.",
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
    body: "승인된 굿즈를 상점에 등록하면 우리 크루만의 굿즈 상점이 자동으로 만들어져요. 상품마다 색상·가격이 함께 올라가요.",
    where: "내 상점",
  },
  {
    n: "05",
    icon: Users,
    title: "사이즈 취합",
    roles: ["member"],
    body: "상점 링크를 크루 단톡방에 공유하면, 크루원은 로그인 없이 이름·연락처만으로 원하는 굿즈의 색상·사이즈·수량을 직접 등록해요.",
    where: "상점 링크 공유",
  },
  {
    n: "06",
    icon: PackageCheck,
    title: "일괄 주문·배송",
    roles: ["operator"],
    body: "취합이 끝나면 집계된 수량으로 한 번에 주문하고, 한 곳으로 배송받아 크루원에게 나눠줘요. 결제·정산도 자동으로 매칭돼요.",
    where: "취합 관리 · 내 주문",
  },
];

const MANAGE = [
  {
    icon: Store,
    title: "내 상점",
    body: "굿즈 추가·내리기, 운영 기간, 주문 현황을 한 곳에서 관리해요.",
  },
  {
    icon: Bell,
    title: "알림",
    body: "제작 승인·반려, 상점 신규 주문, 할인 승인 소식을 모아서 알려줘요.",
  },
  {
    icon: ClipboardCheck,
    title: "내 제작 문의",
    body: "보낸 디자인의 심사 상태와 공장 의견을 추적하고 바로 상점에 등록해요.",
  },
];

function RolePills({ roles }: { roles: RoleKey[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {roles.map((r) => (
        <span
          key={r}
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide ${ROLE[r].cls}`}
        >
          {ROLE[r].label}
        </span>
      ))}
    </div>
  );
}

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-ink text-canvas">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-end overflow-hidden pr-6 opacity-[0.06]"
        >
          <span className="whitespace-nowrap font-display text-[8rem] font-black leading-none tracking-tight sm:text-[13rem]">
            CREW OPS
          </span>
        </div>
        <div className="relative mx-auto max-w-3xl px-4 py-14 sm:py-20">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-1 text-sm text-stone transition-colors hover:text-canvas"
          >
            <ArrowLeft className="h-4 w-4" />홈으로
          </Link>
          <p className="text-kicker mb-4 text-[#C7FF00]">· HOW IT WORKS · CREW OPS ·</p>
          <h1 className="font-display text-[40px] uppercase leading-[0.95] tracking-[0] sm:text-[64px]">
            크루 굿즈,
            <br />
            이렇게 운영돼요
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-stone sm:text-lg">
            디자인 한 번으로 제작 확인부터 크루원 사이즈 취합, 일괄 주문까지.
            <br className="hidden sm:block" />
            운영진이 달리는 6개의 코스를 따라가 보세요.
          </p>

          {/* 역할 범례 */}
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone">
            <span className="text-xs uppercase tracking-widest text-stone/70">함께하는 사람</span>
            {(Object.keys(ROLE) as RoleKey[]).map((r) => (
              <span key={r} className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${ROLE[r].cls.split(" ")[0]}`} />
                {ROLE[r].label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 코스(루트) — 6개 LEG ── */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
        <ol className="relative">
          {/* 점선 루트 라인 */}
          <span
            aria-hidden
            className="absolute left-[19px] top-3 bottom-3 w-px border-l-2 border-dashed border-hairline sm:left-[23px]"
          />
          {LEGS.map((leg) => {
            const Icon = leg.icon;
            return (
              <li key={leg.n} className="relative flex gap-4 pb-10 last:pb-0 sm:gap-6">
                {/* 체크포인트 노드 */}
                <div className="relative z-10 flex flex-col items-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C7FF00] text-ink ring-4 ring-canvas sm:h-12 sm:w-12">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </span>
                </div>

                {/* 내용 */}
                <div className="min-w-0 flex-1 pt-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="font-display text-sm tracking-widest text-mute">
                      LEG {leg.n}
                    </span>
                    <RolePills roles={leg.roles} />
                  </div>
                  <h2 className="mt-1 text-xl font-bold text-ink sm:text-2xl">{leg.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-charcoal sm:text-base">
                    {leg.body}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-soft-cloud px-2.5 py-1 text-xs text-mute">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#C7FF00]" />
                    {leg.where}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── 운영 대시보드 ── */}
      <section className="border-t border-hairline bg-soft-cloud">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:py-16">
          <p className="text-kicker mb-3 text-mute">· 언제든 여기서 관리해요 ·</p>
          <h2 className="text-2xl font-bold text-ink sm:text-3xl">운영 대시보드</h2>
          <p className="mt-2 max-w-xl text-sm text-mute sm:text-base">
            상점 오픈 이후엔 이 세 곳에서 굿즈와 주문, 소식을 관리해요.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {MANAGE.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.title}
                  className="rounded-xl border border-hairline bg-canvas p-5"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink text-[#C7FF00]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-bold text-ink">{m.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-mute">{m.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-ink text-canvas">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center sm:py-16">
          <h2 className="font-display text-2xl uppercase tracking-wide sm:text-3xl">
            이제 코스를 출발해요
          </h2>
          <p className="mt-3 text-sm text-stone sm:text-base">
            크루로 가입하고 첫 굿즈를 디자인해 보세요.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[4px] bg-[#C7FF00] px-8 font-bold text-[#0B0C0A] transition-all hover:brightness-95 active:scale-[0.98]"
            >
              크루 회원가입
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[4px] border border-canvas/20 px-8 font-medium text-canvas transition-colors hover:bg-canvas/5"
            >
              스튜디오 둘러보기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
