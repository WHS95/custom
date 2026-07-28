import { ProductGrid } from "@/components/products/ProductGrid";
import { getProductsByTenant } from "@/application/product-service";
import { DEFAULT_TENANT_ID } from "@/application/tenant-service";
import type { Product } from "@/domain/product/types";
import Link from "next/link";
import { Palette, Store, Link2, PackageCheck, ArrowRight, MessageCircle, Instagram } from "lucide-react";

const KAKAO_LINK = "https://open.kakao.com/me/runhouse";
const INSTAGRAM_LINK = "https://www.instagram.com/run_house_club/";
const RUNHOUSE_CLUB_LINK = "https://www.runhouse.club/home";

// 크루 상점 흐름: 디자인 → 등록 → 링크 공유 → 일괄 주문
const features = [
  {
    icon: Palette,
    title: "1. 굿즈 디자인",
    description: "스튜디오에서 로고·텍스트를 자유롭게 배치",
  },
  {
    icon: Store,
    title: "2. 크루 상점에 등록",
    description: "우리 크루만의 굿즈 상점이 자동으로 생겨요",
  },
  {
    icon: Link2,
    title: "3. 링크 공유·사이즈 취합",
    description: "크루원은 로그인 없이 이름만으로 참여",
  },
  {
    icon: PackageCheck,
    title: "4. 일괄 주문·배송",
    description: "취합 끝나면 한 번에 주문, 한 곳으로 배송",
  },
];

export default async function Home() {
  let products: Product[] = [];
  try {
    products = await getProductsByTenant(DEFAULT_TENANT_ID);
  } catch (err) {
    console.error("Failed to fetch products:", err);
  }

  return (
    <div className="min-h-screen">
      {/* Hero — RunHouse Cartographic Dark DNA: ink 배경 + lime 액센트 */}
      <section className="relative bg-ink text-canvas overflow-hidden">
        <div className="container mx-auto px-4 py-[72px] sm:py-[72px] lg:py-[96px]">
          <div className="max-w-2xl">
            {/* Kicker — JetBrains Mono, RunHouse cartographic 시그니처 */}
            <p className="text-kicker text-[#C7FF00] mb-4">
              · CREW STORE · CREW GEAR ·
            </p>
            <h1 className="font-display text-[48px] sm:text-[64px] lg:text-[96px] leading-[0.9] uppercase tracking-[0]">
              Your Crew&apos;s
              <br />
              Own Store
            </h1>
            <p className="mt-6 text-base sm:text-lg text-stone leading-relaxed max-w-lg">
              우리 크루 굿즈, 링크 하나로 취합까지.
              <br />
              디자인하고 상점에 올리면 크루원 사이즈 취합부터 일괄 주문까지 한
              번에.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="#products"
                className="inline-flex items-center justify-center gap-2 bg-[#C7FF00] text-[#0B0C0A] font-bold px-8 py-3 h-12 rounded-[4px] hover:brightness-95 transition-all active:scale-[0.98]"
              >
                크루 상점 만들기
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/gallery"
                className="inline-flex items-center justify-center gap-2 border border-canvas/20 text-canvas font-medium px-8 py-3 h-12 rounded-[4px] hover:bg-canvas/5 transition-colors"
              >
                갤러리 보기
              </Link>
            </div>
            <Link
              href="/guide"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-stone underline underline-offset-4 hover:text-canvas transition-colors"
            >
              처음이세요? 주문·운영이 어떻게 되는지 보기
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights — Nike 시스템, 밝은 표면 */}
      <section className="bg-canvas border-b border-hairline">
        <div className="container mx-auto px-4 py-12 sm:py-[48px]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="text-center sm:text-left">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-soft-cloud mb-3">
                    <Icon className="w-6 h-6 text-ink" />
                  </div>
                  <h3 className="font-medium text-sm sm:text-base text-ink">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-mute mt-1">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products Section — 쇼핑 영역, 기존 유지 */}
      <section id="products" className="bg-soft-cloud">
        <div className="container mx-auto px-4 py-12 sm:py-[48px]">
          <div className="mb-8">
            <h2 className="text-[32px] font-bold text-ink leading-[1.2]">굿즈 베이스 상품</h2>
            <p className="text-mute mt-2">
              크루 굿즈로 만들 상품을 선택해 디자인을 시작하세요
            </p>
          </div>
          <ProductGrid products={products} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-canvas border-t border-hairline">
        <div className="container mx-auto px-4 py-12 sm:py-[48px]">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-ink mb-3">
              주문이 궁금하신가요?
            </h2>
            <p className="text-mute mb-6">
              대량 주문, 커스텀 상담 등 무엇이든 편하게 문의해주세요.
            </p>
            <a
              href={KAKAO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FEE500] text-ink font-medium px-8 py-3 h-12 rounded-[30px] hover:bg-[#FDD800] transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              카카오톡으로 문의하기
            </a>
          </div>
        </div>
      </section>

      {/* Footer — ink 배경, 브랜드 시그니처 */}
      <footer className="bg-ink text-canvas">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-center sm:text-left">
              <p className="font-bold tracking-[0.12em] uppercase text-canvas">
                RUN HOUSE{" "}
                <span className="inline-block px-1.5 py-0.5 bg-[#C7FF00] text-[#0B0C0A] text-[9px] font-extrabold tracking-[0.15em] rounded-[4px] align-middle ml-1">
                  CUSTOM
                </span>
              </p>
              <p className="text-kicker text-stone mt-2">
                · Premium custom gear for professional crews ·
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-stone">
              <a
                href={RUNHOUSE_CLUB_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-canvas transition-colors"
              >
                RunHouse Club
              </a>
              <Link href="/gallery" className="hover:text-canvas transition-colors">
                갤러리
              </Link>
              <a
                href={KAKAO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-canvas transition-colors"
              >
                문의하기
              </a>
              <a
                href={INSTAGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-canvas transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-canvas/10 text-center">
            <p className="text-utility-xs text-stone">
              © {new Date().getFullYear()} RunHouse Custom. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
