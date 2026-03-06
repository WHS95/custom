"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/language-context";
import { useAuth } from "@/lib/auth/auth-context";
import { useCartStore } from "@/lib/store/cart-store";
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
  ShoppingCart,
  User,
  LogIn,
  LogOut,
  Users,
  MessageCircle,
  Menu,
  Home,
  Palette,
  Image,
  Package,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const KAKAO_LINK = "https://open.kakao.com/me/runhouse";

export function Navbar() {
  const { t } = useLanguage();
  const { profile, isLoading, isAuthenticated, signOut } = useAuth();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 라우트 변경 시 모바일 메뉴 자동 닫기
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/", label: t("common.studio"), icon: Home },
    { href: "/gallery", label: t("common.showcase"), icon: Image },
    ...(isAuthenticated
      ? [{ href: "/mypage/orders", label: t("common.myOrders"), icon: Package }]
      : []),
  ];

  return (
    <header className="border-b sticky top-0 bg-white/80 backdrop-blur-md z-50">
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
            className="flex items-center gap-2 font-bold text-xl tracking-tighter hover:opacity-80 transition"
          >
            <span className="text-primary">RUN</span>HOUSE
            <span className="px-1.5 py-0.5 rounded text-xs bg-black text-white font-medium">
              CUSTOM
            </span>
          </Link>
        </div>

        {/* 데스크탑 네비게이션 */}
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:text-black transition-colors ${
                pathname === link.href ? "text-black font-semibold" : ""
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

          {/* 장바구니 */}
          <Button asChild variant="ghost" size="icon" className="relative">
            <Link href="/cart">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </Button>

          {/* 인증 상태에 따른 UI */}
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full" />
              <Skeleton className="w-16 h-4 rounded hidden sm:block" />
            </div>
          ) : isAuthenticated ? (
            <div className="flex items-center gap-1">
              <Link href="/mypage">
                <Button variant="ghost" size="sm" className="gap-2">
                  {profile?.user_type === "crew_staff" ? (
                    <Users className="w-4 h-4 text-blue-600" />
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
                <LogOut className="w-4 h-4 text-gray-500" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="gap-1">
                <Link href="/login">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">로그인</span>
                </Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/signup">회원가입</Link>
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
              <span className="font-bold text-lg tracking-tighter">
                <span className="text-primary">RUN</span>HOUSE{" "}
                <span className="px-1.5 py-0.5 rounded text-xs bg-black text-white font-medium align-middle">
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
                        ? "bg-gray-100 text-black"
                        : "text-gray-600 hover:bg-gray-50 hover:text-black"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                </SheetClose>
              );
            })}

            {/* 문의하기 */}
            <SheetClose asChild>
              <a
                href={KAKAO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-black transition-colors"
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
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                    {profile?.user_type === "crew_staff" ? (
                      <Users className="w-5 h-5 text-blue-600" />
                    ) : (
                      <User className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {profile?.name ?? "내 계정"}
                    </p>
                    {profile?.user_type === "crew_staff" && (
                      <p className="text-xs text-blue-600">러닝크루 운영진</p>
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
                    className="text-gray-500"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <SheetClose asChild>
                  <Button asChild className="w-full">
                    <Link href="/login">로그인</Link>
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/signup">회원가입</Link>
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
