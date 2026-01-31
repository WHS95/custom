/**
 * Supabase Storage 유틸리티
 * 상품 이미지 업로드/삭제 기능
 * 주문 첨부파일 업로드/다운로드 기능
 */

import { createServerSupabaseClient, getSupabaseClient } from "./client";

const BUCKET_NAME = "product-images";
const ORDER_ATTACHMENTS_BUCKET = "order-attachments";

/**
 * 파일을 Supabase Storage에 업로드
 * @param file Base64 데이터 또는 File 객체
 * @param path 저장 경로 (예: "products/{productId}/{colorId}/{view}.png")
 * @param isServer 서버 사이드 여부
 */
export async function uploadProductImage(
  fileData: string | File,
  path: string,
  isServer = false
): Promise<string | null> {
  const supabase = isServer
    ? createServerSupabaseClient()
    : getSupabaseClient();

  let fileToUpload: File | Blob;

  if (typeof fileData === "string") {
    // Base64 데이터인 경우
    if (fileData.startsWith("data:")) {
      const base64Data = fileData.split(",")[1];
      const mimeType = fileData.split(";")[0].split(":")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      fileToUpload = new Blob([byteArray], { type: mimeType });
    } else {
      console.error("Invalid file data format");
      return null;
    }
  } else {
    fileToUpload = fileData;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, fileToUpload, {
      upsert: true,
      contentType: fileToUpload.type || "image/png",
    });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  // Public URL 반환
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * 상품 이미지 삭제
 */
export async function deleteProductImage(
  path: string,
  isServer = false
): Promise<boolean> {
  const supabase = isServer
    ? createServerSupabaseClient()
    : getSupabaseClient();

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    console.error("Delete error:", error);
    return false;
  }

  return true;
}

/**
 * 상품 이미지 경로 생성
 */
export function getProductImagePath(
  productId: string,
  colorId: string,
  view: string,
  extension = "png"
): string {
  return `products/${productId}/${colorId}/${view}.${extension}`;
}

/**
 * 상품의 모든 이미지 삭제 (상품 삭제 시)
 */
export async function deleteAllProductImages(
  productId: string,
  isServer = false
): Promise<boolean> {
  const supabase = isServer
    ? createServerSupabaseClient()
    : getSupabaseClient();

  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`products/${productId}`, { limit: 100 });

  if (listError) {
    console.error("List error:", listError);
    return false;
  }

  if (!files || files.length === 0) {
    return true;
  }

  // 재귀적으로 모든 파일 삭제
  const filePaths = files.map((f) => `products/${productId}/${f.name}`);
  const { error: deleteError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(filePaths);

  if (deleteError) {
    console.error("Delete all error:", deleteError);
    return false;
  }

  return true;
}

// ============================================
// 주문 첨부파일 관련 함수
// ============================================

/**
 * 주문 첨부파일 업로드
 * @param file File 객체
 * @param orderNumber 주문번호
 * @param fileName 파일명
 * @param isServer 서버 사이드 여부
 */
export async function uploadOrderAttachment(
  file: File | Blob,
  orderNumber: string,
  fileName: string,
  isServer = false
): Promise<{ url: string; size: number } | null> {
  const supabase = isServer
    ? createServerSupabaseClient()
    : getSupabaseClient();

  const path = getOrderAttachmentPath(orderNumber, fileName);

  const { data, error } = await supabase.storage
    .from(ORDER_ATTACHMENTS_BUCKET)
    .upload(path, file, {
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });

  if (error) {
    console.error("Order attachment upload error:", error);
    return null;
  }

  // Public URL 반환
  const { data: urlData } = supabase.storage
    .from(ORDER_ATTACHMENTS_BUCKET)
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    size: file.size,
  };
}

/**
 * 주문 첨부파일 경로 생성
 */
export function getOrderAttachmentPath(
  orderNumber: string,
  fileName: string
): string {
  // 파일명에서 특수문자 제거 (URL 안전)
  const safeFileName = fileName.replace(/[^a-zA-Z0-9가-힣._-]/g, "_");
  return `orders/${orderNumber}/${safeFileName}`;
}

/**
 * 주문 첨부파일 삭제
 */
export async function deleteOrderAttachment(
  orderNumber: string,
  fileName: string,
  isServer = false
): Promise<boolean> {
  const supabase = isServer
    ? createServerSupabaseClient()
    : getSupabaseClient();

  const path = getOrderAttachmentPath(orderNumber, fileName);

  const { error } = await supabase.storage
    .from(ORDER_ATTACHMENTS_BUCKET)
    .remove([path]);

  if (error) {
    console.error("Delete order attachment error:", error);
    return false;
  }

  return true;
}

/**
 * 주문의 모든 첨부파일 목록 조회
 */
export async function listOrderAttachments(
  orderNumber: string,
  isServer = false
): Promise<{ name: string; url: string; size: number }[]> {
  const supabase = isServer
    ? createServerSupabaseClient()
    : getSupabaseClient();

  const { data: files, error } = await supabase.storage
    .from(ORDER_ATTACHMENTS_BUCKET)
    .list(`orders/${orderNumber}`, { limit: 10 });

  if (error) {
    console.error("List order attachments error:", error);
    return [];
  }

  if (!files || files.length === 0) {
    return [];
  }

  return files.map((file) => {
    const { data: urlData } = supabase.storage
      .from(ORDER_ATTACHMENTS_BUCKET)
      .getPublicUrl(`orders/${orderNumber}/${file.name}`);

    return {
      name: file.name,
      url: urlData.publicUrl,
      size: file.metadata?.size || 0,
    };
  });
}
