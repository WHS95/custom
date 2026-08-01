/**
 * /stores — 크루 상점 둘러보기 (마켓플레이스식 디스커버리)
 * 크루 정체성 + 전체 크루 굿즈를 둘러본다. 일반 사용자(크루원)의 메인 진입점.
 */
import type { Metadata } from "next";
import { StoreDiscovery } from "@/components/store/StoreDiscovery";

export const metadata: Metadata = {
  title: "크루 상점 둘러보기 — RunHouse Custom",
  description: "러닝 크루들의 아이덴티티와 커스텀 굿즈를 만나보세요.",
};

export default function StoresPage() {
  return <StoreDiscovery />;
}
