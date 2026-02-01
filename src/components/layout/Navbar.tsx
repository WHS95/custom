"use client";

import { useLanguage } from "@/lib/i18n/language-context";
import { useAuth } from "@/lib/auth/auth-context";
import { useCartStore } from "@/lib/store/cart-store";
import Link from "next/link";
import { LanguageToggle } from "./LanguageToggle";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User, LogIn, LogOut, Loader2, Users } from "lucide-react";

export function Navbar() {
  const { t } = useLanguage();
  const { user, profile, isLoading, isAuthenticated, signOut } = useAuth();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className='border-b sticky top-0 bg-white/80 backdrop-blur-md z-50'>
      <div className='container mx-auto px-4 h-16 flex items-center justify-between'>
        <Link
          href='/'
          className='flex items-center gap-2 font-bold text-xl tracking-tighter hover:opacity-80 transition'
        >
          <span className='text-primary'>RUN</span>HOUSE
          <span className='px-1.5 py-0.5 rounded text-xs bg-black text-white font-medium'>
            CUSTOM
          </span>
        </Link>

        <nav className='hidden md:flex gap-6 text-sm font-medium text-gray-600'>
          <Link href='/' className='hover:text-black'>
            {t("common.studio")}
          </Link>
          <Link href='/gallery' className='hover:text-black'>
            {t("common.showcase")}
          </Link>
          {isAuthenticated && (
            <Link href='/mypage/orders' className='hover:text-black'>
              {t("common.myOrders")}
            </Link>
          )}
        </nav>

        <div className='flex items-center gap-3'>
          <LanguageToggle />

          {/* 장바구니 */}
          <Link href='/cart'>
            <Button variant='ghost' size='icon' className='relative'>
              <ShoppingCart className='w-5 h-5' />
              {cartCount > 0 && (
                <span className='absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center'>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Button>
          </Link>

          {/* 인증 상태에 따른 UI */}
          {isLoading ? (
            <div className='w-8 h-8 flex items-center justify-center'>
              <Loader2 className='w-4 h-4 animate-spin text-gray-400' />
            </div>
          ) : isAuthenticated && profile ? (
            <div className='flex items-center gap-2'>
              {/* 사용자 메뉴 */}
              <Link href='/mypage'>
                <Button variant='ghost' size='sm' className='gap-2'>
                  {profile.user_type === 'crew_staff' ? (
                    <Users className='w-4 h-4 text-blue-600' />
                  ) : (
                    <User className='w-4 h-4' />
                  )}
                  <span className='hidden sm:inline max-w-[100px] truncate'>
                    {profile.name}
                  </span>
                </Button>
              </Link>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => signOut()}
                title='로그아웃'
              >
                <LogOut className='w-4 h-4 text-gray-500' />
              </Button>
            </div>
          ) : (
            <div className='flex items-center gap-2'>
              <Link href='/login'>
                <Button variant='ghost' size='sm' className='gap-1'>
                  <LogIn className='w-4 h-4' />
                  <span className='hidden sm:inline'>로그인</span>
                </Button>
              </Link>
              <Link href='/signup'>
                <Button size='sm' className='hidden sm:inline-flex'>
                  회원가입
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
