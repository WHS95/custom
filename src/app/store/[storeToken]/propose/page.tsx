/**
 * /store/[storeToken]/propose — 크루원 디자인 제안 시작(상품 선택)
 * 크루원이 베이스 상품을 고르면 스튜디오(?propose=토큰)로 이동해 디자인 후 제안한다.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getProductsByTenant } from "@/application/product-service";
import { DEFAULT_TENANT_ID } from "@/application/tenant-service";
import type { Product } from "@/domain/product/types";
import { Palette, ArrowRight } from "lucide-react";

interface Props {
  params: Promise<{ storeToken: string }>;
}

export default async function ProposePage({ params }: Props) {
  const { storeToken } = await params;

  const supabase = createServerSupabaseClient();
  const { data: store } = await supabase
    .from("crew_stores")
    .select("crew_name")
    .eq("store_token", storeToken)
    .maybeSingle();
  if (!store) notFound();

  let products: Product[] = [];
  try {
    products = await getProductsByTenant(DEFAULT_TENANT_ID);
  } catch (err) {
    console.error("propose products fetch error:", err);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-20">
      <p className="text-kicker text-[#C7FF00]">· CREW DESIGN PROPOSAL ·</p>
      <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
        {store.crew_name}에 디자인 제안하기
      </h1>
      <p className="mt-2 text-sm text-mute sm:text-base">
        만들고 싶은 굿즈의 베이스 상품을 고르면 스튜디오에서 바로 디자인할 수 있어요.
        완성한 디자인을 운영진에게 제안하면, 채택 후 공장 확인을 거쳐 상점에 올라가요.
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
              href={`/studio/${p.id}?propose=${encodeURIComponent(storeToken)}`}
              className="group rounded-xl border border-hairline bg-canvas p-3 transition-colors hover:border-ink"
            >
              <div className="aspect-square overflow-hidden rounded-lg bg-soft-cloud">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
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
