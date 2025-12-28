/**
 * 상품 이미지 API
 * POST: 이미지 업로드
 * DELETE: 이미지 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  uploadProductImage,
  deleteProductImage,
  getProductImagePath,
} from '@/infrastructure/supabase/storage'
import { updateProduct, getProductById } from '@/application/product-service'
import type { ProductImage } from '@/domain/product/types'

interface Params {
  params: Promise<{ productId: string }>
}

/**
 * POST /api/products/[productId]/images
 * 상품 이미지 업로드
 * Body: { colorId, view, imageData (base64) }
 */
export async function POST(
  request: NextRequest,
  { params }: Params
) {
  try {
    const adminAuth = request.cookies.get('admin_auth')?.value
    if (adminAuth !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { productId } = await params
    const body = await request.json()
    const { colorId, view, imageData } = body as {
      colorId: string
      view: string
      imageData: string // base64
    }

    if (!colorId || !view || !imageData) {
      return NextResponse.json(
        { error: 'colorId, view, imageData are required' },
        { status: 400 }
      )
    }

    // 상품 존재 확인
    const product = await getProductById(productId)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // 이미지 업로드
    const path = getProductImagePath(productId, colorId, view)
    const publicUrl = await uploadProductImage(imageData, path, true)

    if (!publicUrl) {
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // 상품의 images 배열 업데이트
    const existingImages = product.images || []
    const imageIndex = existingImages.findIndex(
      (img) => img.colorId === colorId && img.view === view
    )

    let updatedImages: ProductImage[]
    if (imageIndex >= 0) {
      // 기존 이미지 업데이트
      updatedImages = [...existingImages]
      updatedImages[imageIndex] = { colorId, view: view as ProductImage['view'], url: publicUrl }
    } else {
      // 새 이미지 추가
      updatedImages = [
        ...existingImages,
        { colorId, view: view as ProductImage['view'], url: publicUrl }
      ]
    }

    await updateProduct(productId, { images: updatedImages })

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        colorId,
        view,
      },
    })
  } catch (error) {
    console.error('POST /api/products/[productId]/images error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/products/[productId]/images
 * 상품 이미지 삭제
 * Query: colorId, view
 */
export async function DELETE(
  request: NextRequest,
  { params }: Params
) {
  try {
    const adminAuth = request.cookies.get('admin_auth')?.value
    if (adminAuth !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { productId } = await params
    const { searchParams } = new URL(request.url)
    const colorId = searchParams.get('colorId')
    const view = searchParams.get('view')

    if (!colorId || !view) {
      return NextResponse.json(
        { error: 'colorId and view are required' },
        { status: 400 }
      )
    }

    // 상품 확인
    const product = await getProductById(productId)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // 스토리지에서 삭제
    const path = getProductImagePath(productId, colorId, view)
    await deleteProductImage(path, true)

    // 상품의 images 배열에서 제거
    const updatedImages = (product.images || []).filter(
      (img) => !(img.colorId === colorId && img.view === view)
    )

    await updateProduct(productId, { images: updatedImages })

    return NextResponse.json({
      success: true,
      message: 'Image deleted',
    })
  } catch (error) {
    console.error('DELETE /api/products/[productId]/images error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
