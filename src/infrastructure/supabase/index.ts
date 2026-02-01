/**
 * Supabase 인프라 모듈 진입점
 */

// 클라이언트 (브라우저용)
export { 
  getSupabaseClient, 
  getSupabaseBrowserClient,
  createServerSupabaseClient, 
  SCHEMA_NAME 
} from './client'

// 서버 클라이언트 (서버 컴포넌트, API Route용)
export { 
  getSupabaseServerClient,
  getSupabaseRouteClient,
  getCurrentUser,
  getCurrentUserProfile,
} from './server'

// Repository
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
