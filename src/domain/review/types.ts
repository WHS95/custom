/**
 * 후기/갤러리 도메인 타입
 */

export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type AuthorType = 'admin' | 'customer'

export interface ReviewImage {
  url: string
  caption?: string
}

export interface Review {
  id: string
  tenantId: string
  orderId?: string | null

  // 작성자 정보
  authorType: AuthorType
  authorName: string
  organizationName?: string | null

  // 후기 내용
  title?: string | null
  content: string
  rating: number  // 1-5

  // 이미지
  images: ReviewImage[]

  // 상태
  status: ReviewStatus

  // 관리자 메모
  adminMemo?: string | null

  // 메타
  isFeatured: boolean
  sortOrder: number

  // 타임스탬프
  createdAt: string
  updatedAt: string
  approvedAt?: string | null
}

export interface CreateReviewDTO {
  orderId?: string
  authorType?: AuthorType
  authorName: string
  organizationName?: string
  title?: string
  content: string
  rating: number
  images?: ReviewImage[]
}

export interface UpdateReviewDTO {
  title?: string
  content?: string
  rating?: number
  images?: ReviewImage[]
  status?: ReviewStatus
  adminMemo?: string
  isFeatured?: boolean
  sortOrder?: number
}

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '거절됨',
}

export const AUTHOR_TYPE_LABELS: Record<AuthorType, string> = {
  admin: '관리자',
  customer: '고객',
}
