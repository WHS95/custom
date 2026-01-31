/**
 * Supabase 인프라 모듈 진입점
 */

export { getSupabaseClient, createServerSupabaseClient, SCHEMA_NAME } from './client'
export { orderRepository, SupabaseOrderRepository } from './order-repository'
export type { Database } from './database.types'

// Storage 유틸리티
export {
  uploadProductImage,
  deleteProductImage,
  getProductImagePath,
  deleteAllProductImages,
  uploadOrderAttachment,
  deleteOrderAttachment,
  listOrderAttachments,
  getOrderAttachmentPath,
} from './storage'
