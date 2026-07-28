/**
 * /store/mine — 내 크루 상점 진입점(안정 URL)
 * 상점 유무와 무관하게 헤더·마이페이지에서 이 경로로 진입한다.
 * - 상점 있음 → /store/{token}로 리다이렉트
 * - 상점 없음 → 상점 만들기 안내(스튜디오·제작 문의)
 * - 크루 운영진 아님/비로그인 → 로그인
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/infrastructure/supabase";
import { getCurrentAuthState } from "@/lib/auth/server-auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Store, Palette, ClipboardCheck } from "lucide-react";

export default async function MyStorePage() {
  const { user, profile } = await getCurrentAuthState();

  if (!user) {
    redirect("/login?redirect=/store/mine");
  }
  if (profile?.user_type !== "crew_staff") {
    redirect("/mypage");
  }

  const supabase = createServerSupabaseClient();
  const { data: store } = await supabase
    .from("crew_stores")
    .select("store_token")
    .eq("creator_user_id", user.id)
    .maybeSingle();

  if (store?.store_token) {
    redirect(`/store/${store.store_token}`);
  }

  // 아직 상점이 없는 크루 — 만들기 안내
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="border border-hairline">
          <CardHeader className="text-center pb-2">
            <div className="w-14 h-14 bg-[#C7FF00]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Store className="w-7 h-7 text-[#C7FF00]" />
            </div>
            <CardTitle className="text-xl font-bold text-ink">아직 상점이 없어요</CardTitle>
            <CardDescription className="text-mute">
              디자인을 제작 승인받아 상점에 올리면 우리 크루 상점이 만들어져요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <Button asChild className="w-full">
              <Link href="/">
                <Palette className="w-4 h-4 mr-1.5" />
                스튜디오에서 디자인 시작
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/manufacture-reviews">
                <ClipboardCheck className="w-4 h-4 mr-1.5" />
                내 제작 문의에서 상점에 등록
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
