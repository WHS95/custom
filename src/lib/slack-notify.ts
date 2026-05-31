/**
 * Slack Webhook 알림 유틸리티
 */

const SLACK_CREW_WEBHOOK_URL =
  process.env.SLACK_CREW_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;

export async function sendCrewApprovalNotification({
  crewName,
  userName,
  email,
}: {
  crewName: string;
  userName: string;
  email: string;
}) {
  if (!SLACK_CREW_WEBHOOK_URL) {
    console.warn("Slack webhook URL이 설정되지 않았습니다.");
    return;
  }

  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  const message = {
    text: `🏃 새 크루 멤버 인증 요청\n────────────────\n크루: ${crewName}\n이름: ${userName}\n이메일: ${email}\n요청일시: ${now}\n────────────────\n👉 관리자 페이지에서 확인하세요`,
  };

  await fetch(SLACK_CREW_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
}
