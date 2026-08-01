/**
 * /create — 무료로 크루 굿즈 만들기 (프로모, 무로그인)
 * 싱글렛·반팔 등 베이스 상품을 골라 스튜디오에서 디자인 → PNG 다운로드(인스타 스토리용).
 */
import Link from "next/link";
import type { Metadata } from "next";
import { getProductsByTenant } from "@/application/product-service";
import { DEFAULT_TENANT_ID } from "@/application/tenant-service";
import type { Product } from "@/domain/product/types";
import { Palette, Download, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "무료로 크루 굿즈 만들기 — RunHouse Custom",
  description: "로그인 없이 크루 싱글렛·반팔을 디자인하고 인스타 스토리용 PNG로 저장하세요.",
};

export default async function CreatePage() {
  let products: Product[] = [];
  try {
    products = await getProductsByTenant(DEFAULT_TENANT_ID);
  } catch (err) {
    console.error("create products fetch error:", err);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 pb-20">
      <p className="text-kicker text-[#C7FF00]">· FREE · NO SIGN-UP ·</p>
      <h1 className="mt-2 font-display text-3xl uppercase tracking-tight text-ink sm:text-4xl">
        무료로 크루 굿즈 만들기
      </h1>
      <p className="mt-2 max-w-xl text-sm text-mute sm:text-base">
        로그인 없이 크루 싱글렛·반팔에 로고와 문구를 얹어보고, 완성한 디자인을
        <span className="inline-flex items-center gap-1 font-medium text-ink">
          <Download className="h-4 w-4" /> PNG
        </span>
        로 저장해 인스타 스토리에 올려보세요.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {products.map((p) => {
          const thumb =
            p.images.find((img) => img.view === "front")?.url ??
            p.images[0]?.url ??
            null;
          return (
            <Link
              key={p.id}
              href={`/studio/${p.id}`}
              className="group rounded-xl border border-hairline bg-canvas p-3 transition-colors hover:border-ink"
            >
              <div className="aspect-square overflow-hidden rounded-lg bg-soft-cloud">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumb} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-mute">
                    <Palette className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between gap-1">
                <span className="min-w-0 truncate text-sm font-medium text-ink">
                  {p.name}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-mute transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
