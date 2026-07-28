"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/language-context";
import { useAuth } from "@/lib/auth/auth-context";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  User,
  LogOut,
  Users,
  MessageCircle,
  Menu,
  Home,
  Image,
  Instagram,
  Globe,
  Store,
  ClipboardCheck,
  Bell,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  countUnread,
  getNotificationsSeenAt,
} from "@/lib/notifications";

const KAKAO_LINK = "https://open.kakao.com/me/runhouse";
const INSTAGRAM_LINK = "https://www.instagram.com/run_house_club/";
const RUNHOUSE_CLUB_LINK = "https://www.runhouse.club/home";

export function Navbar() {
  const { t } = useLanguage();
  const { profile, isLoading, isAuthenticated, signOut } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 내 크루 상점 진입은 안정 URL /store/mine로 통일 (상점 유무 무관)
  const isCrewStaff = profile?.user_type === "crew_staff";

  // 알림 미읽음 수 (crew_staff)
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (!isCrewStaff) {
      setUnread(0);
      return;
    }
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((json) => {
        const items: { createdAt: string }[] = json.data?.items ?? [];
        setUnread(countUnread(items, getNotificationsSeenAt()));
      })
      .catch(() => setUnread(0));
    // 알림 페이지에서 읽음 처리하면 pathname 변경 시 재계산됨
  }, [isCrewStaff, pathname]);

  // 라우트 변경 시 모바일 메뉴 자동 닫기
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/", label: t("common.studio"), icon: Home },
    { href: "/gallery", label: t("common.showcase"), icon: Image },
    ...(isCrewStaff
      ? [
          {
            href: "/store/mine",
            label: "내 상점",
            icon: Store,
          },
          {
            href: "/notifications",
            label: unread > 0 ? `알림 (${unread})` : "알림",
            icon: Bell,
          },
          {
            href: "/manufacture-reviews",
            label: "내 제작 문의",
            icon: ClipboardCheck,
          },
        ]
      : []),
  ];

  return (
    <header className="border-b border-hairline sticky top-0 bg-canvas/85 backdrop-blur-md z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* 왼쪽: 햄버거 + 로고 */}
        <div className="flex items-center gap-2">
          {/* 모바일 햄버거 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </Button>

          <Link
            href="/"
            className="flex items-center gap-2 font-bold tracking-[0.08em] uppercase hover:opacity-80 transition"
          >
            <span className="text-ink">RUN HOUSE</span>
            <span className="px-1.5 py-0.5 bg-[#C7FF00] text-[#0B0C0A] text-[9px] font-extrabold tracking-[0.15em] rounded-[4px]">
              CUSTOM
            </span>
          </Link>
        </div>

        {/* 데스크탑 네비게이션 */}
        <nav className="hidden md:flex gap-6 text-sm font-medium text-mute">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:text-ink transition-colors ${
                pathname === link.href ? "text-ink font-semibold" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 오른쪽 액션 버튼들 */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1 hidden sm:inline-flex"
          >
            <a href={KAKAO_LINK} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-4 h-4" />
              <span>문의하기</span>
            </a>
          </Button>

          {/* 알림 벨 (crew_staff) */}
          {isCrewStaff && (
            <Button asChild variant="ghost" size="icon" className="relative">
              <Link href="/notifications" aria-label="알림">
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF6F1E] px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </Button>
          )}

          {/* 인증 상태에 따른 UI */}
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-16 h-4 rounded hidden sm:block" />
            </div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-1">
              <Link href="/mypage">
                <Button size="sm" className="gap-2">
                  {profile?.user_type === "crew_staff" ? (
                    <Users className="w-4 h-4 text-[#C7FF00]" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {profile?.name ?? "내 계정"}
                  </span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={async () => {
                  await signOut();
                }}
                title="로그아웃"
                className="hidden sm:inline-flex"
              >
                <LogOut className="w-4 h-4 text-mute" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="gap-1">
                <a href="/login">
                  <Users className="w-4 h-4 text-[#C7FF00]" />
                  <span className="hidden sm:inline">크루 로그인</span>
                  <span className="sm:hidden">로그인</span>
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 모바일 드로어 메뉴 */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-5 pb-3">
            <SheetTitle className="text-left">
              <span className="font-bold tracking-[0.08em] uppercase">
                <span className="text-ink">RUN HOUSE</span>{" "}
                <span className="px-1.5 py-0.5 bg-[#C7FF00] text-[#0B0C0A] text-[9px] font-extrabold tracking-[0.15em] rounded-[4px] align-middle">
                  CUSTOM
                </span>
              </span>
            </SheetTitle>
          </SheetHeader>

          <Separator />

          {/* 네비게이션 링크 */}
          <nav className="flex flex-col py-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-soft-cloud text-ink"
                        : "text-mute hover:bg-soft-cloud hover:text-ink"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                </SheetClose>
              );
            })}

            {/* 외부 링크 */}
            <SheetClose asChild>
              <a
                href={RUNHOUSE_CLUB_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-mute hover:bg-soft-cloud hover:text-ink transition-colors"
              >
                <Globe className="w-4 h-4" />
                RunHouse Club
              </a>
            </SheetClose>
            <SheetClose asChild>
              <a
                href={INSTAGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-mute hover:bg-soft-cloud hover:text-ink transition-colors"
              >
                <Instagram className="w-4 h-4" />
                Instagram
              </a>
            </SheetClose>
            <SheetClose asChild>
              <a
                href={KAKAO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-mute hover:bg-soft-cloud hover:text-ink transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                문의하기
              </a>
            </SheetClose>
          </nav>

          <Separator />

          {/* 인증 섹션 */}
          <div className="p-5">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-soft-cloud flex items-center justify-center">
                    {profile?.user_type === "crew_staff" ? (
                      <Users className="w-5 h-5 text-[#C7FF00]" />
                    ) : (
                      <User className="w-5 h-5 text-mute" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-ink">
                      {profile?.name ?? "내 계정"}
                    </p>
                    {profile?.user_type === "crew_staff" && (
                      <p className="text-kicker text-[#C7FF00]">러닝크루 운영진</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <SheetClose asChild>
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href="/mypage">마이페이지</Link>
                    </Button>
                  </SheetClose>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await signOut();
                      setMobileOpen(false);
                    }}
                    className="text-mute"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <SheetClose asChild>
                  <Button asChild className="w-full gap-2">
                    <a href="/login">
                      <Users className="w-4 h-4 text-[#C7FF00]" />
                      크루로 로그인
                    </a>
                  </Button>
                </SheetClose>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
