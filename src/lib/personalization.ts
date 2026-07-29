/**
 * 크루원 이름 개인화 판별 유틸.
 * design_snapshot(DesignLayer[])에 "이름 자리"(text 레이어 nameField=true)가 있으면
 * 그 굿즈는 개인화 굿즈 — 상점 주문 시 크루원마다 이름을 입력받는다.
 */
interface MaybeLayer {
  type?: string;
  nameField?: boolean;
}

export function hasNameField(
  layers: MaybeLayer[] | null | undefined,
): boolean {
  return (
    Array.isArray(layers) &&
    layers.some((l) => l?.type === "text" && l?.nameField === true)
  );
}
