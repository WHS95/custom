/**
 * 크루 승인 Slack 알림 API
 *
 * POST /api/crew-approval/notify
 * 프로필 생성 후 Slack으로 알림 발송 (fire-and-forget)
 */

import { NextRequest, NextResponse } from "next/server";
import { sendCrewApprovalNotification } from "@/lib/slack-notify";

export async function POST(request: NextRequest) {
  try {
    const { crewName, userName, email } = await request.json();

    if (!crewName || !userName || !email) {
      return NextResponse.json(
        { error: "크루명, 이름, 이메일이 필요합니다." },
        { status: 400 }
      );
    }

    // fire-and-forget: 실패해도 200 반환
    sendCrewApprovalNotification({ crewName, userName, email }).catch((err) => {
      console.error("Slack 알림 발송 실패:", err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("알림 API 에러:", error);
    return NextResponse.json({ success: true });
  }
}
