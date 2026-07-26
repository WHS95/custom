/**
 * 알림 읽음 상태 (클라이언트 localStorage)
 * 크루 운영진 1인 기준 — 서버 저장 없이 기기별 lastSeen으로 미읽음 계산.
 */

const KEY = "runhouse-notifications-seen-at";

export function getNotificationsSeenAt(): number {
  if (typeof window === "undefined") return 0;
  const v = localStorage.getItem(KEY);
  return v ? Number(v) || 0 : 0;
}

export function markNotificationsSeen(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, String(Date.now()));
}

export function countUnread(
  items: { createdAt: string }[],
  seenAt: number,
): number {
  return items.filter((i) => new Date(i.createdAt).getTime() > seenAt).length;
}
