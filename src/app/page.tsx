import { ProductGrid } from "@/components/products/ProductGrid";
import { getProductsByTenant } from "@/application/product-service";
import { DEFAULT_TENANT_ID } from "@/application/tenant-service";
import type { Product } from "@/domain/product/types";
import Link from "next/link";
import { Palette, Truck, Users, Star, ArrowRight, MessageCircle, Instagram } from "lucide-react";
import { CREW_DISCOUNT_RATE } from "@/lib/pricing/crew-discount";

const KAKAO_LINK = "https://open.kakao.com/me/runhouse";
const INSTAGRAM_LINK = "https://www.instagram.com/run_house_club/";
const RUNHOUSE_CLUB_LINK = "https://www.runhouse.club/home";

const features = [
  {
    icon: Palette,
    title: "자유로운 커스텀 디자인",
    description: "로고, 텍스트, 이미지를 자유롭게 배치하세요",
  },
  {
    icon: Users,
    title: `등록 크루 ${Math.round(CREW_DISCOUNT_RATE * 100)}% 할인`,
    description: "런하우스 크루 회원은 전 상품 즉시 할인",
  },
  {
    icon: Truck,
    title: "전 상품 무료배송",
    description: "수량에 관계없이 무료배송",
  },
  {
    icon: Star,
    title: "대량 주문 추가 할인",
    description: "수량이 많을수록 더 저렴한 단가",
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
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 py-20 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Create Your
              <br />
              <span className="text-blue-400">Crew&apos;s Identity</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-300 leading-relaxed max-w-lg">
              나만의 러닝크루를 위한 프리미엄 커스텀 굿즈.
              <br />
              모자부터 의류까지, 직접 디자인하세요.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="#products"
                className="inline-flex items-center justify-center gap-2 bg-white text-black font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                상품 둘러보기
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/gallery"
                className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                갤러리 보기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="text-center sm:text-left">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 mb-3">
                    <Icon className="w-6 h-6 text-gray-700" />
                  </div>
                  <h3 className="font-semibold text-sm sm:text-base">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="bg-gray-50/50">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold">상품 목록</h2>
            <p className="text-gray-500 mt-2">커스텀하고 싶은 상품을 선택하세요</p>
          </div>
          <ProductGrid products={products} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-white border-t">
        <div className="container mx-auto px-4 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-bold mb-3">
              주문이 궁금하신가요?
            </h2>
            <p className="text-gray-500 mb-6">
              대량 주문, 커스텀 상담 등 무엇이든 편하게 문의해주세요.
            </p>
            <a
              href={KAKAO_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FEE500] text-black font-semibold px-6 py-3 rounded-lg hover:bg-[#FDD800] transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              카카오톡으로 문의하기
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-center sm:text-left">
              <p className="font-bold tracking-tighter">
                <span className="text-blue-400">RUN</span>HOUSE CUSTOM
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Premium custom gear for professional crews
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a
                href={RUNHOUSE_CLUB_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                RunHouse Club
              </a>
              <Link href="/gallery" className="hover:text-white transition-colors">
                갤러리
              </Link>
              <a
                href={KAKAO_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                문의하기
              </a>
              <a
                href={INSTAGRAM_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
