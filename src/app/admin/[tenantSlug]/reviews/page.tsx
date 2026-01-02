"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAdminAuth } from "@/lib/hooks/useAdminAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Loader2,
  ArrowLeft,
  Plus,
  Star,
  Check,
  X,
  Trash2,
  Edit,
  MessageSquare,
  Image as ImageIcon,
  Crown,
  Upload,
} from "lucide-react"
import type { Review, ReviewStatus, CreateReviewDTO } from "@/domain/review"
import { REVIEW_STATUS_LABELS, AUTHOR_TYPE_LABELS } from "@/domain/review"

export default function AdminReviewsPage() {
  const router = useRouter()
  const params = useParams()
  const tenantSlugParam = params.tenantSlug as string

  const { isAuthenticated, isLoading: authLoading, tenantSlug } = useAdminAuth()

  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // 후기 작성 모달
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateReviewDTO & { organizationName?: string }>({
    authorName: "",
    organizationName: "",
    title: "",
    content: "",
    rating: 5,
  })
  const [isCreating, setIsCreating] = useState(false)
  const [createImages, setCreateImages] = useState<string[]>([])
  const createFileInputRef = useRef<HTMLInputElement>(null)

  // 후기 수정 모달
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    rating: 5,
    adminMemo: "",
    isFeatured: false,
    sortOrder: 0,
  })
  const [isEditing, setIsEditing] = useState(false)

  // Auth check
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/admin/login")
      } else if (tenantSlug && tenantSlug !== tenantSlugParam) {
        router.push(`/admin/${tenantSlug}/reviews`)
      }
    }
  }, [authLoading, isAuthenticated, tenantSlug, tenantSlugParam, router])

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({ admin: "true" })
      if (statusFilter !== "all") {
        params.set("status", statusFilter)
      }

      const response = await fetch(`/api/reviews?${params}`)
      const result = await response.json()

      if (result.success) {
        setReviews(result.data)
      } else {
        toast.error("후기 목록을 불러오는데 실패했습니다")
      }
    } catch (error) {
      console.error("Fetch reviews error:", error)
      toast.error("오류가 발생했습니다")
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (isAuthenticated) {
      fetchReviews()
    }
  }, [isAuthenticated, fetchReviews])

  // 이미지 선택 처리 (관리자 후기 작성)
  const handleCreateImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const remainingSlots = 5 - createImages.length
    const filesToProcess = Array.from(files).slice(0, remainingSlots)

    filesToProcess.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("이미지 파일만 업로드 가능합니다")
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("이미지 크기는 5MB 이하여야 합니다")
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setCreateImages((prev) => [...prev, result])
      }
      reader.readAsDataURL(file)
    })

    if (createFileInputRef.current) {
      createFileInputRef.current.value = ""
    }
  }

  // 이미지 제거 (관리자 후기 작성)
  const removeCreateImage = (index: number) => {
    setCreateImages((prev) => prev.filter((_, i) => i !== index))
  }

  // 후기 생성
  const handleCreate = async () => {
    if (!createForm.authorName || !createForm.content) {
      toast.error("작성자명과 내용은 필수입니다")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          authorType: "admin",
          imageDataList: createImages,
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(result.message || "후기가 등록되었습니다")
        setIsCreateOpen(false)
        setCreateForm({
          authorName: "",
          organizationName: "",
          title: "",
          content: "",
          rating: 5,
        })
        setCreateImages([])
        fetchReviews()
      } else {
        toast.error(result.error || "후기 등록에 실패했습니다")
      }
    } catch (error) {
      console.error("Create review error:", error)
      toast.error("오류가 발생했습니다")
    } finally {
      setIsCreating(false)
    }
  }

  // 후기 상태 변경
  const handleStatusChange = async (reviewId: string, status: ReviewStatus) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(result.message)
        fetchReviews()
      } else {
        toast.error(result.error || "상태 변경에 실패했습니다")
      }
    } catch (error) {
      console.error("Status change error:", error)
      toast.error("오류가 발생했습니다")
    }
  }

  // 후기 수정 열기
  const openEditModal = (review: Review) => {
    setEditingReview(review)
    setEditForm({
      title: review.title || "",
      content: review.content,
      rating: review.rating,
      adminMemo: review.adminMemo || "",
      isFeatured: review.isFeatured,
      sortOrder: review.sortOrder,
    })
  }

  // 후기 수정 저장
  const handleEdit = async () => {
    if (!editingReview) return

    setIsEditing(true)
    try {
      const response = await fetch(`/api/reviews/${editingReview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })

      const result = await response.json()
      if (result.success) {
        toast.success("후기가 수정되었습니다")
        setEditingReview(null)
        fetchReviews()
      } else {
        toast.error(result.error || "수정에 실패했습니다")
      }
    } catch (error) {
      console.error("Edit review error:", error)
      toast.error("오류가 발생했습니다")
    } finally {
      setIsEditing(false)
    }
  }

  // 후기 삭제
  const handleDelete = async (reviewId: string) => {
    if (!confirm("정말 이 후기를 삭제하시겠습니까?")) return

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
      })

      const result = await response.json()
      if (result.success) {
        toast.success("후기가 삭제되었습니다")
        fetchReviews()
      } else {
        toast.error(result.error || "삭제에 실패했습니다")
      }
    } catch (error) {
      console.error("Delete review error:", error)
      toast.error("오류가 발생했습니다")
    }
  }

  // 대표 후기 토글
  const handleToggleFeatured = async (review: Review) => {
    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !review.isFeatured }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(review.isFeatured ? "대표 후기 해제됨" : "대표 후기로 설정됨")
        fetchReviews()
      } else {
        toast.error(result.error || "변경에 실패했습니다")
      }
    } catch (error) {
      console.error("Toggle featured error:", error)
      toast.error("오류가 발생했습니다")
    }
  }

  const getStatusBadgeClass = (status: ReviewStatus) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500">후기 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/admin/${tenantSlugParam}/dashboard`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              후기 관리
            </h1>
            <p className="text-gray-500">
              <span className="font-medium text-blue-600">[{tenantSlugParam}]</span> 고객 후기를 관리합니다.
            </p>
          </div>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          후기 작성
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Label>상태 필터</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="pending">승인 대기</SelectItem>
                <SelectItem value="approved">승인됨</SelectItem>
                <SelectItem value="rejected">거절됨</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">
              총 {reviews.length}개
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {statusFilter === "all"
              ? "등록된 후기가 없습니다"
              : `${REVIEW_STATUS_LABELS[statusFilter as ReviewStatus]} 상태의 후기가 없습니다`}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className={review.isFeatured ? "border-yellow-400 border-2" : ""}>
              <CardContent className="py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {review.isFeatured && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Crown className="h-3 w-3" />
                          대표
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                          review.status
                        )}`}
                      >
                        {REVIEW_STATUS_LABELS[review.status]}
                      </span>
                      <span className="text-xs text-gray-500">
                        {AUTHOR_TYPE_LABELS[review.authorType]}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{review.authorName}</span>
                      {review.organizationName && (
                        <span className="text-sm text-gray-500">
                          ({review.organizationName})
                        </span>
                      )}
                      <div className="flex items-center text-yellow-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? "fill-current" : "stroke-current fill-none"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {review.title && (
                      <h4 className="font-medium text-gray-800 mb-1">{review.title}</h4>
                    )}
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{review.content}</p>

                    {review.images.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {review.images.map((img, idx) => (
                          <div
                            key={idx}
                            className="w-16 h-16 rounded border overflow-hidden"
                          >
                            <img
                              src={img.url}
                              alt={img.caption || `이미지 ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {review.adminMemo && (
                      <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                        <span className="font-medium">관리자 메모:</span> {review.adminMemo}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    {review.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleStatusChange(review.id, "approved")}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleStatusChange(review.id, "rejected")}
                        >
                          <X className="h-4 w-4 mr-1" />
                          거절
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleFeatured(review)}
                    >
                      <Crown
                        className={`h-4 w-4 mr-1 ${
                          review.isFeatured ? "fill-yellow-400 text-yellow-400" : ""
                        }`}
                      />
                      {review.isFeatured ? "해제" : "대표"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(review)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      수정
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(review.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      삭제
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Review Modal */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => { if (!open) setCreateImages([]); setIsCreateOpen(open); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>후기 작성</DialogTitle>
            <DialogDescription>
              관리자가 직접 후기를 작성합니다. 바로 승인됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>작성자명 *</Label>
              <Input
                value={createForm.authorName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, authorName: e.target.value })
                }
                placeholder="홍길동"
              />
            </div>
            <div className="space-y-2">
              <Label>단체/회사명</Label>
              <Input
                value={createForm.organizationName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, organizationName: e.target.value })
                }
                placeholder="ABC 회사"
              />
            </div>
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm({ ...createForm, title: e.target.value })
                }
                placeholder="후기 제목"
              />
            </div>
            <div className="space-y-2">
              <Label>내용 *</Label>
              <Textarea
                value={createForm.content}
                onChange={(e) =>
                  setCreateForm({ ...createForm, content: e.target.value })
                }
                placeholder="후기 내용을 작성해주세요..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>별점</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, rating: star })}
                    className="p-1"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= createForm.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>사진 첨부 (최대 5장)</Label>
              <div className="grid grid-cols-5 gap-2">
                {createImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                    <img
                      src={img}
                      alt={`업로드 이미지 ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeCreateImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {createImages.length < 5 && (
                  <button
                    type="button"
                    onClick={() => createFileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <Upload className="h-5 w-5 mb-1" />
                    <span className="text-xs">추가</span>
                  </button>
                )}
              </div>
              <input
                ref={createFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleCreateImageSelect}
              />
              <p className="text-xs text-gray-500">JPG, PNG 파일 (최대 5MB)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Review Modal */}
      <Dialog open={!!editingReview} onOpenChange={(open) => !open && setEditingReview(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>후기 수정</DialogTitle>
            <DialogDescription>
              후기 내용을 수정하고 관리자 메모를 남길 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>내용</Label>
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>별점</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, rating: star })}
                    className="p-1"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= editForm.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>관리자 메모</Label>
              <Textarea
                value={editForm.adminMemo}
                onChange={(e) => setEditForm({ ...editForm, adminMemo: e.target.value })}
                placeholder="내부용 메모 (공개되지 않음)"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={editForm.isFeatured}
                onChange={(e) => setEditForm({ ...editForm, isFeatured: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isFeatured">대표 후기로 표시</Label>
            </div>
            <div className="space-y-2">
              <Label>정렬 순서</Label>
              <Input
                type="number"
                value={editForm.sortOrder}
                onChange={(e) => setEditForm({ ...editForm, sortOrder: Number(e.target.value) })}
              />
              <p className="text-xs text-gray-500">숫자가 작을수록 먼저 표시됩니다</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReview(null)}>
              취소
            </Button>
            <Button onClick={handleEdit} disabled={isEditing}>
              {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
