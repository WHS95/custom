import { getOrderByNumber } from "@/application/order-service";
import { WriteReviewClient } from "@/components/review/WriteReviewClient";

interface WriteReviewPageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function WriteReviewPage({
  searchParams,
}: WriteReviewPageProps) {
  const { order } = await searchParams;

  if (!order) {
    return (
      <WriteReviewClient error='주문번호가 필요합니다. 주문 상세 페이지에서 후기 작성 버튼을 클릭해주세요.' />
    );
  }

  try {
    const orderData = await getOrderByNumber(order);

    if (!orderData) {
      return <WriteReviewClient error='주문을 찾을 수 없습니다.' />;
    }

    if (orderData.status !== "delivered") {
      return (
        <WriteReviewClient error='배송이 완료된 주문만 후기를 작성할 수 있습니다.' />
      );
    }

    return (
      <WriteReviewClient
        orderNumber={orderData.orderNumber}
        initialAuthorName={orderData.customerName}
        initialOrganizationName={orderData.shippingInfo?.organizationName || ""}
      />
    );
  } catch (err) {
    console.error("Fetch order error:", err);
    return <WriteReviewClient error='주문 정보를 불러오는데 실패했습니다.' />;
  }
}
