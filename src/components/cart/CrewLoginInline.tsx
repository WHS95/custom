"use client";

/**
 * 인라인 크루 로그인 폼 (장바구니 비로그인 분기)
 *
 * 인스타 핸들 + PIN 을 입력받아 crewLoginInline Server Action 으로
 * 백채널 SSO 검증을 수행한다. 성공 시 onSuccess() 로 auth 새로고침을
 * 트리거하여 크루 신원 + 10% 할인이 그 자리에서 반영된다.
 *
 * 백채널 장애 시 기존 "크루로 로그인" 리다이렉트 링크(/api/sso/initiate)를
 * 폴백으로 노출한다.
 */
import { useState, useTransition, useEffect, useCallback } from "react";
import Link from "next/link";
import { Users as UsersIcon, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  crewLoginInline,
  type CrewLoginInlineResult,
} from "@/app/actions/crew-login";

const RUNHOUSE_URL = "https://www.runhouse.club";

type InlineError =
  | { kind: "invalid" }
  | { kind: "locked"; unlocksAt?: string }
  | { kind: "no-pin" }
  | { kind: "generic" }
  | null;

interface CrewLoginInlineProps {
  /** 로그인 성공 시 auth 상태 새로고침 콜백 */
  onSuccess: () => void;
}

/** 남은 잠금 시간 카운트다운 텍스트 */
function useUnlockCountdown(unlocksAt?: string): string | null {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!unlocksAt) {
      setRemaining(null);
      return;
    }
    const target = new Date(unlocksAt).getTime();
    if (Number.isNaN(target)) {
      setRemaining(null);
      return;
    }

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setRemaining(null);
        return;
      }
      const totalSec = Math.ceil(diff / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      setRemaining(`${min}:${String(sec).padStart(2, "0")}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [unlocksAt]);

  return remaining;
}

export function CrewLoginInline({ onSuccess }: CrewLoginInlineProps) {
  const [instagram, setInstagram] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<InlineError>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [isPending, startTransition] = useTransition();

  const lockedUnlocksAt = error?.kind === "locked" ? error.unlocksAt : undefined;
  const countdown = useUnlockCountdown(lockedUnlocksAt);

  const handleResult = useCallback(
    (result: CrewLoginInlineResult) => {
      if (result.ok) {
        setError(null);
        setShowFallback(false);
        setPin("");
        onSuccess();
        return;
      }

      if (result.reason === "backchannel_unavailable") {
        // 백채널 장애 → 리다이렉트 폴백 노출
        setShowFallback(true);
        setError({ kind: "generic" });
        return;
      }

      switch (result.reason) {
        case "locked":
          setError({ kind: "locked", unlocksAt: result.unlocksAt });
          break;
        case "no-pin":
          setError({ kind: "no-pin" });
          break;
        case "invalid":
        case "replay":
        case "forbidden":
        case "bad-request":
        default:
          setError({ kind: "invalid" });
          break;
      }
    },
    [onSuccess],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const handle = instagram.trim().replace(/^@/, "");
    if (!handle || pin.length < 4 || pin.length > 8) {
      setError({ kind: "invalid" });
      return;
    }

    startTransition(async () => {
      const result = await crewLoginInline(handle, pin);
      handleResult(result);
    });
  };

  return (
    <div className="rounded-lg border border-hairline bg-soft-cloud/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <UsersIcon className="h-4 w-4 text-purple-600" />
        <p className="text-sm font-medium text-ink">
          크루로 로그인하면 10% 할인
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="crew-instagram" className="text-xs text-gray-500">
            인스타 핸들
          </Label>
          <Input
            id="crew-instagram"
            name="instagram"
            type="text"
            inputMode="text"
            autoComplete="username"
            placeholder="@runhouse"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            disabled={isPending}
            aria-invalid={error?.kind === "invalid"}
            className="h-10 text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="crew-pin" className="text-xs text-gray-500">
            PIN (4-8자리)
          </Label>
          <Input
            id="crew-pin"
            name="pin"
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            minLength={4}
            maxLength={8}
            placeholder="••••"
            value={pin}
            onChange={(e) =>
              setPin(e.target.value.replace(/\D/g, "").slice(0, 8))
            }
            disabled={isPending}
            aria-invalid={error?.kind === "invalid"}
            className="h-10 text-sm"
          />
        </div>

        {/* 인라인 에러 상태 */}
        {error?.kind === "invalid" && (
          <p className="text-xs text-danger">
            인스타 또는 PIN이 올바르지 않습니다
          </p>
        )}
        {error?.kind === "locked" && (
          <p className="text-xs text-danger">
            로그인 시도가 많아 일시적으로 잠겼습니다
            {countdown ? ` (${countdown} 후 재시도)` : " (잠시 후 재시도)"}
          </p>
        )}
        {error?.kind === "no-pin" && (
          <p className="text-xs text-gray-600">
            아직 PIN이 설정되지 않았습니다.{" "}
            <a
              href={RUNHOUSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-purple-600 underline underline-offset-2"
            >
              런하우스에서 PIN 설정하기
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        )}
        {error?.kind === "generic" && !showFallback && (
          <p className="text-xs text-danger">
            로그인 처리 중 문제가 발생했습니다
          </p>
        )}

        <Button
          type="submit"
          size="sm"
          className="w-full"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              로그인 중...
            </>
          ) : (
            "크루 로그인"
          )}
        </Button>
      </form>

      {/* 백채널 장애 시 기존 리다이렉트 SSO 폴백 */}
      {showFallback && (
        <div className="mt-3 border-t border-hairline pt-3 text-center">
          <p className="mb-2 text-xs text-gray-500">
            바로 로그인이 어려우면 아래로 진행해 주세요
          </p>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/api/sso/initiate">크루로 로그인 (런하우스 연동)</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
