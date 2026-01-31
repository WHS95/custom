/**
 * 주문 첨부파일 API
 * 
 * POST /api/orders/[orderNumber]/attachments - 파일 업로드
 * GET /api/orders/[orderNumber]/attachments - 첨부파일 목록 조회
 */

import { NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient, SCHEMA_NAME } from "@/infrastructure/supabase"
import { uploadOrderAttachment } from "@/infrastructure/supabase/storage"
import type { AttachmentFile } from "@/domain/order"

// 허용 파일 확장자
const ALLOWED_EXTENSIONS = [".ai", ".eps", ".pdf", ".psd"]
const MAX_FILES = 5
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * POST - 첨부파일 업로드
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params
    
    // FormData에서 파일들 추출
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "파일이 없습니다." },
        { status: 400 }
      )
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `최대 ${MAX_FILES}개 파일만 업로드 가능합니다.` },
        { status: 400 }
      )
    }

    // 파일 검증
    for (const file of files) {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."))
      
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return NextResponse.json(
          { error: `${file.name}: 허용되지 않는 파일 형식입니다. (허용: ${ALLOWED_EXTENSIONS.join(", ")})` },
          { status: 400 }
        )
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `${file.name}: 파일 크기가 50MB를 초과합니다.` },
          { status: 400 }
        )
      }
    }

    // 주문 존재 여부 확인
    const supabase = createServerSupabaseClient()
    const { data: order, error: orderError } = await supabase
      .schema(SCHEMA_NAME)
      .from("orders")
      .select("id, attachment_files")
      .eq("order_number", orderNumber)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    // 기존 첨부파일 + 새 파일 개수 확인
    const existingFiles = (order.attachment_files || []) as AttachmentFile[]
    if (existingFiles.length + files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `첨부파일은 최대 ${MAX_FILES}개까지 가능합니다. (현재: ${existingFiles.length}개)` },
        { status: 400 }
      )
    }

    // 파일 업로드
    const uploadedFiles: AttachmentFile[] = []
    
    for (const file of files) {
      const result = await uploadOrderAttachment(file, orderNumber, file.name, true)
      
      if (result) {
        uploadedFiles.push({
          name: file.name,
          url: result.url,
          size: result.size,
          uploadedAt: new Date().toISOString(),
        })
      }
    }

    if (uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: "파일 업로드에 실패했습니다." },
        { status: 500 }
      )
    }

    // DB 업데이트
    const allFiles = [...existingFiles, ...uploadedFiles]
    const { error: updateError } = await supabase
      .schema(SCHEMA_NAME)
      .from("orders")
      .update({ attachment_files: allFiles })
      .eq("id", order.id)

    if (updateError) {
      console.error("DB update error:", updateError)
      return NextResponse.json(
        { error: "첨부파일 정보 저장에 실패했습니다." },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      totalCount: allFiles.length,
    })
  } catch (error) {
    console.error("첨부파일 업로드 에러:", error)
    return NextResponse.json(
      { error: "첨부파일 업로드에 실패했습니다." },
      { status: 500 }
    )
  }
}

/**
 * GET - 첨부파일 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params
    
    const supabase = createServerSupabaseClient()
    const { data: order, error } = await supabase
      .schema(SCHEMA_NAME)
      .from("orders")
      .select("attachment_files")
      .eq("order_number", orderNumber)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: "주문을 찾을 수 없습니다." },
        { status: 404 }
      )
    }

    const files = (order.attachment_files || []) as AttachmentFile[]

    return NextResponse.json({
      success: true,
      files,
      count: files.length,
    })
  } catch (error) {
    console.error("첨부파일 조회 에러:", error)
    return NextResponse.json(
      { error: "첨부파일 조회에 실패했습니다." },
      { status: 500 }
    )
  }
}
