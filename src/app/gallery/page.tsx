"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Loader2, MessageSquare, Crown, X, ChevronLeft, ChevronRight } from "lucide-react"
import type { Review } from "@/domain/review"

export default function GalleryPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [featuredReviews, setFeaturedReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // 이미지 모달 핸들러
  const openImageModal = (review: Review, index: number = 0) => {
    setSelectedReview(review)
    setCurrentImageIndex(index)
  }

  const closeImageModal = () => {
    setSelectedReview(null)
    setCurrentImageIndex(0)
  }

  const goToPrevImage = () => {
    if (selectedReview && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  const goToNextImage = () => {
    if (selectedReview && currentImageIndex < selectedReview.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedReview) return
      if (e.key === "ArrowLeft") goToPrevImage()
      if (e.key === "ArrowRight") goToNextImage()
      if (e.key === "Escape") closeImageModal()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedReview, currentImageIndex])

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        // 승인된 후기만 가져옴
        const [allRes, featuredRes] = await Promise.all([
          fetch("/api/reviews?limit=50"),
          fetch("/api/reviews?featured=true&limit=5"),
        ])

        const allData = await allRes.json()
        const featuredData = await featuredRes.json()

        if (allData.success) {
          setReviews(allData.data)
        }
        if (featuredData.success) {
          setFeaturedReviews(featuredData.data)
        }
      } catch (error) {
        console.error("Fetch reviews error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReviews()
  }, [])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500">후기를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8" />
            고객 후기
          </h1>
          <p className="text-muted-foreground">실제 고객분들의 생생한 후기를 확인하세요</p>
        </div>
        <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-lg">
          배송 완료 후 주문 내역에서 후기 작성 가능
        </div>
      </div>

      {/* Featured Reviews */}
      {featuredReviews.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            베스트 후기
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredReviews.map((review) => (
              <Card key={review.id} className="overflow-hidden border-2 border-yellow-200 bg-yellow-50/30">
                {review.images.length > 0 && (
                  <div
                    className="aspect-video relative bg-gray-100 cursor-pointer"
                    onClick={() => openImageModal(review)}
                  >
                    <img
                      src={review.images[0].url}
                      alt={review.images[0].caption || "후기 이미지"}
                      className="w-full h-full object-cover"
                    />
                    {review.images.length > 1 && (
                      <Badge className="absolute bottom-2 right-2 bg-black/70">
                        +{review.images.length - 1}
                      </Badge>
                    )}
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{review.authorName}</span>
                    {review.organizationName && (
                      <span className="text-sm text-gray-500">({review.organizationName})</span>
                    )}
                  </div>
                  <div className="flex text-yellow-500 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < review.rating ? "fill-current" : "stroke-current fill-none"}
                      />
                    ))}
                  </div>
                  {review.title && (
                    <h3 className="font-medium text-gray-800 mb-1">{review.title}</h3>
                  )}
                  <p className="text-gray-600 text-sm line-clamp-3">{review.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* All Reviews */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">아직 등록된 후기가 없습니다</p>
          <p className="text-sm text-gray-400 mt-2">
            주문 완료 후 주문 내역 페이지에서 후기를 작성할 수 있습니다
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold mb-4">
            전체 후기 ({reviews.length}개)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <Card key={review.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {review.images.length > 0 && (
                  <div
                    className="aspect-video relative bg-gray-100 cursor-pointer"
                    onClick={() => openImageModal(review)}
                  >
                    <img
                      src={review.images[0].url}
                      alt={review.images[0].caption || "후기 이미지"}
                      className="w-full h-full object-cover"
                    />
                    {review.images.length > 1 && (
                      <Badge className="absolute bottom-2 right-2 bg-black/70">
                        +{review.images.length - 1}
                      </Badge>
                    )}
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{review.authorName}</span>
                    {review.organizationName && (
                      <span className="text-sm text-gray-500">({review.organizationName})</span>
                    )}
                  </div>
                  <div className="flex text-yellow-500 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < review.rating ? "fill-current" : "stroke-current fill-none"}
                      />
                    ))}
                  </div>
                  {review.title && (
                    <h3 className="font-medium text-gray-800 mb-1">{review.title}</h3>
                  )}
                  <p className="text-gray-600 text-sm line-clamp-3">{review.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Image Modal */}
      {selectedReview && selectedReview.images.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeImageModal}
        >
          {/* 닫기 버튼 */}
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            onClick={closeImageModal}
          >
            <X className="h-8 w-8" />
          </button>

          {/* 이미지 카운터 */}
          {selectedReview.images.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {selectedReview.images.length}
            </div>
          )}

          {/* 이전 버튼 */}
          {selectedReview.images.length > 1 && currentImageIndex > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
              onClick={(e) => {
                e.stopPropagation()
                goToPrevImage()
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* 다음 버튼 */}
          {selectedReview.images.length > 1 && currentImageIndex < selectedReview.images.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 bg-black/50 rounded-full p-2"
              onClick={(e) => {
                e.stopPropagation()
                goToNextImage()
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* 메인 이미지 */}
          <img
            src={selectedReview.images[currentImageIndex].url}
            alt={selectedReview.images[currentImageIndex].caption || "후기 이미지"}
            className="max-w-full max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* 하단 인디케이터 dots */}
          {selectedReview.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {selectedReview.images.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentImageIndex ? "bg-white" : "bg-white/40 hover:bg-white/70"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentImageIndex(idx)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
