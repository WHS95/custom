"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CrewLoginInline } from "./CrewLoginInline";
import { ArrowRight, ArrowUpRight, Users as UsersIcon } from "lucide-react";

const CREW_REGISTER_URL = "https://www.runhouse.club/register";

interface GuestIntentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 비회원으로 그대로 주문 진행 */
  onContinueAsGuest: () => void;
  /** 크루 로그인 성공 시 (10% 할인 적용 후 주문 단계로) */
  onCrewLoginSuccess: () => void;
}

/**
 * 비로그인 상태에서 "주문하기" 클릭 시 1회만 노출되는 유도 모달.
 * 세션당 한 번만 표시 (sessionStorage로 제어 — 호출부 책임).
 *
 * 3가지 액션:
 * 1. 비회원으로 바로 주문 (가장 큰 primary)
 * 2. 크루 로그인 (인스타+PIN) → 10% 할인
 * 3. 크루 등록 (외부 사이트) → 등록 후 다음 주문에 할인
 */
export function GuestIntentModal({
  open,
  onOpenChange,
  onContinueAsGuest,
  onCrewLoginSuccess,
}: GuestIntentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-lg font-bold">
            주문 진행 방식을 선택해주세요
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            크루 로그인 시 10% 즉시 할인이 적용됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="px-5 pb-5 space-y-4">
          {/* 옵션 1: 비회원 진행 (primary CTA) */}
          <Button
            className="w-full justify-between h-12"
            onClick={onContinueAsGuest}
          >
            <span className="font-semibold">비회원으로 주문 진행</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
          <p className="text-[11px] text-center text-gray-500 -mt-2">
            주문번호로 진행 상황을 추적하실 수 있어요.
          </p>

          <div className="relative flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
              또는 할인받고 주문
            </span>
            <Separator className="flex-1" />
          </div>

          {/* 옵션 2: 크루 로그인 — 10% 할인 */}
          <div className="border border-hairline rounded-lg p-3 bg-soft-cloud">
            <div className="flex items-center gap-1.5 mb-2">
              <UsersIcon className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-semibold text-ink">
                이미 등록된 크루라면
              </span>
              <span className="ml-auto text-[10px] font-bold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded">
                10% 할인
              </span>
            </div>
            <CrewLoginInline onSuccess={onCrewLoginSuccess} />
          </div>

          {/* 옵션 3: 크루 등록 (외부) */}
          <div className="text-center">
            <Link
              href={CREW_REGISTER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-mute hover:text-ink transition-colors underline underline-offset-2"
            >
              크루 등록하고 다음 주문부터 할인받기
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
