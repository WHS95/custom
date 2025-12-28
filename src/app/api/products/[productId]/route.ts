/**
 * 상품 상세 API
 * GET: 상품 상세 조회
 * PATCH: 상품 수정 (관리자용)
 * DELETE: 상품 삭제 (관리자용)
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getProductById,
  getProductWithAreas,
  updateProduct,
  deleteProduct,
} from '@/application/product-service'
import type { UpdateProductDTO } from '@/domain/product/types'

interface Params {
  params: Promise<{ productId: string }>
}

/**
 * GET /api/products/[productId]
 * 상품 상세 조회 (커스터마이즈 영역 포함)
 */
export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { productId } = await params
    const { searchParams } = new URL(request.url)
    const withAreas = searchParams.get('withAreas') === 'true'

    if (withAreas) {
      const product = await getProductWithAreas(productId)
      if (!product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({
        success: true,
        data: product,
      })
    }

    const product = await getProductById(productId)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('GET /api/products/[productId] error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/products/[productId]
 * 상품 수정 (관리자용)
 */
export async function PATCH(
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

    const dto: UpdateProductDTO = {}
    if (body.name !== undefined) dto.name = body.name
    if (body.slug !== undefined) dto.slug = body.slug
    if (body.description !== undefined) dto.description = body.description
    if (body.category !== undefined) dto.category = body.category
    if (body.basePrice !== undefined) dto.basePrice = body.basePrice
    if (body.images !== undefined) dto.images = body.images
    if (body.variants !== undefined) dto.variants = body.variants
    if (body.isActive !== undefined) dto.isActive = body.isActive
    if (body.sortOrder !== undefined) dto.sortOrder = body.sortOrder

    const product = await updateProduct(productId, dto)

    return NextResponse.json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('PATCH /api/products/[productId] error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/products/[productId]
 * 상품 삭제 (관리자용)
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
    await deleteProduct(productId)

    return NextResponse.json({
      success: true,
      message: 'Product deleted',
    })
  } catch (error) {
    console.error('DELETE /api/products/[productId] error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
