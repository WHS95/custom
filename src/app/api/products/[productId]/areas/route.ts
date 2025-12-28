/**
 * 커스터마이즈 영역 API
 * GET: 영역 목록 조회
 * PUT: 영역 저장 (upsert)
 * DELETE: 영역 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getCustomizableAreas,
  saveCustomizableArea,
  deleteCustomizableArea,
} from '@/application/product-service'
import type { UpsertCustomizableAreaDTO } from '@/domain/product/types'

interface Params {
  params: Promise<{ productId: string }>
}

/**
 * GET /api/products/[productId]/areas
 * 커스터마이즈 영역 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { productId } = await params
    const areas = await getCustomizableAreas(productId)

    return NextResponse.json({
      success: true,
      data: areas,
    })
  } catch (error) {
    console.error('GET /api/products/[productId]/areas error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/products/[productId]/areas
 * 커스터마이즈 영역 저장 (upsert)
 */
export async function PUT(
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

    const dto: UpsertCustomizableAreaDTO = {
      viewName: body.viewName,
      displayName: body.displayName,
      zoneX: body.zoneX,
      zoneY: body.zoneY,
      zoneWidth: body.zoneWidth,
      zoneHeight: body.zoneHeight,
      imageUrl: body.imageUrl,
      isEnabled: body.isEnabled,
      sortOrder: body.sortOrder,
    }

    // 필수 필드 검증
    if (!dto.viewName || !dto.displayName) {
      return NextResponse.json(
        { error: 'viewName, displayName are required' },
        { status: 400 }
      )
    }

    const area = await saveCustomizableArea(productId, dto)

    return NextResponse.json({
      success: true,
      data: area,
    })
  } catch (error) {
    console.error('PUT /api/products/[productId]/areas error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/products/[productId]/areas
 * 커스터마이즈 영역 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params: _params }: Params
) {
  try {
    const adminAuth = request.cookies.get('admin_auth')?.value
    if (adminAuth !== 'true') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const areaId = searchParams.get('areaId')

    if (!areaId) {
      return NextResponse.json(
        { error: 'areaId is required' },
        { status: 400 }
      )
    }

    await deleteCustomizableArea(areaId)

    return NextResponse.json({
      success: true,
      message: 'Area deleted',
    })
  } catch (error) {
    console.error('DELETE /api/products/[productId]/areas error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
