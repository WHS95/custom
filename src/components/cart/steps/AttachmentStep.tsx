"use client"

import { useState, useRef } from "react"
import { Paperclip, ArrowLeft, X, Upload, FileText, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface AttachmentStepProps {
  files: File[]
  onFilesChange: (files: File[]) => void
  onNext: () => void
  onBack: () => void
  isActive: boolean
}

const ALLOWED_EXTENSIONS = [".ai", ".eps", ".pdf", ".psd"]
const MAX_FILES = 5
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentStep({
  files,
  onFilesChange,
  onNext,
  onBack,
  isActive,
}: AttachmentStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    const newFiles: File[] = []
    const errors: string[] = []

    for (const file of Array.from(selectedFiles)) {
      // 개수 제한
      if (files.length + newFiles.length >= MAX_FILES) {
        errors.push(`최대 ${MAX_FILES}개 파일만 업로드 가능합니다.`)
        break
      }

      // 확장자 검증
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."))
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`${file.name}: 허용되지 않는 파일 형식입니다.`)
        continue
      }

      // 크기 검증
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: 파일 크기가 50MB를 초과합니다.`)
        continue
      }

      // 중복 검증
      if (files.some((f) => f.name === file.name)) {
        errors.push(`${file.name}: 이미 추가된 파일입니다.`)
        continue
      }

      newFiles.push(file)
    }

    if (errors.length > 0) {
      toast.error(errors[0])
    }

    if (newFiles.length > 0) {
      onFilesChange([...files, ...newFiles])
      toast.success(`${newFiles.length}개 파일이 추가되었습니다.`)
    }
  }

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5 text-blue-600" />
          디자인 파일 첨부
        </CardTitle>
        <p className="text-sm text-gray-500">
          디자인 원본 파일(.ai)이 있으시면 첨부해주세요 (선택)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 안내 메시지 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">원본 파일 안내</p>
              <ul className="text-xs space-y-0.5 text-blue-700">
                <li>• 허용 형식: .ai, .eps, .pdf, .psd</li>
                <li>• 최대 5개, 파일당 50MB 이하</li>
                <li>• 원본 파일이 있으면 더 정확한 인쇄가 가능합니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 파일 드래그 영역 */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
            ${isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
            ${files.length >= MAX_FILES ? "opacity-50 cursor-not-allowed" : ""}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => files.length < MAX_FILES && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS.join(",")}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <p className="text-sm font-medium text-gray-700">
            파일을 드래그하거나 클릭하여 선택
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {ALLOWED_EXTENSIONS.join(", ")} (최대 {MAX_FILES}개)
          </p>
        </div>

        {/* 첨부된 파일 목록 */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              첨부된 파일 ({files.length}/{MAX_FILES})
            </p>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <FileText className="w-8 h-8 text-orange-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 text-gray-400 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveFile(index)
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 네비게이션 버튼 */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onBack} className="flex-shrink-0">
            <ArrowLeft className="h-4 w-4 mr-1" />
            이전
          </Button>
          <Button onClick={onNext} className="flex-1">
            {files.length > 0 ? "다음 단계로" : "건너뛰기"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
