"use client";

/**
 * 크루 정보 편집 카드 (상점 설정) — 로고·크루명·활동지역·소개글.
 * 상점 둘러보기 배너·상점 헤더에 노출된다. 운영진 전용.
 */
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";

export function CrewProfileEditor() {
  const { profile, refreshProfile } = useAuth();
  const [crewName, setCrewName] = useState("");
  const [intro, setIntro] = useState("");
  const [region, setRegion] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setCrewName(profile.crew_name || "");
      setIntro(profile.crew_intro || "");
      setRegion(profile.crew_region || "");
      setLogoUrl(profile.crew_logo_url || null);
    }
  }, [profile]);

  if (profile && profile.user_type !== "crew_staff") return null;

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/auth/crew-logo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "업로드 실패");
      setLogoUrl(data.data.url);
      await refreshProfile();
      toast.success("로고를 변경했어요.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!crewName.trim()) {
      toast.error("크루명을 입력해 주세요.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile?.name || crewName.trim(),
          crewName: crewName.trim(),
          crewIntro: intro,
          crewRegion: region,
          defaultAddress: profile?.default_address ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "저장 실패");
      await refreshProfile();
      toast.success("크루 정보를 저장했어요.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">크루 정보</CardTitle>
        <p className="text-xs text-muted-foreground">
          상점 헤더·크루 상점 둘러보기 카드에 표시돼요.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 로고 */}
        <div className="flex items-center gap-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#C7FF00] text-xl font-black text-[#0B0C0A]">
              {(crewName || "?").trim().charAt(0) || "?"}
            </span>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={uploadLogo}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            로고 변경
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cp-name">크루명</Label>
          <Input
            id="cp-name"
            value={crewName}
            onChange={(e) => setCrewName(e.target.value)}
            placeholder="런하우스 크루"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp-region">활동지역</Label>
          <Input
            id="cp-region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="예: 서울 · 한강"
            maxLength={60}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp-intro">소개글</Label>
          <Textarea
            id="cp-intro"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            placeholder="우리 크루를 한 줄로 소개해 주세요."
            rows={2}
            maxLength={300}
          />
        </div>

        <Button className="w-full" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "크루 정보 저장"}
        </Button>
      </CardContent>
    </Card>
  );
}
