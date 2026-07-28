"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { Save, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Trash2, Upload, AlertCircle, Download, Paperclip, Image as ImageIcon } from "lucide-react";
import type { DesignLayer } from "@/components/shared/HatDesignCanvas";

export interface OrderToolsPanelProps {
  canEdit: boolean;
  hasChanges: boolean;
  saving: boolean;
  viewLayers: DesignLayer[];
  selectedLayerId: string | null;
  selectedLayer: DesignLayer | undefined;
  hasAttachments: boolean;
  attachmentCount: number;
  onSave: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRotate: (degrees: number) => void;
  onFlip: (axis: "x" | "y") => void;
  onLayerRemove: (layerId: string) => void;
  onLayerSelect: (layerId: string) => void;
  onDownloadAllImages: () => void;
  onDownloadAttachments: () => void;
  onDownloadImage: (layer: DesignLayer, index: number) => void;
}

export default function OrderToolsPanel({
  canEdit,
  hasChanges,
  saving,
  viewLayers,
  selectedLayerId,
  selectedLayer,
  hasAttachments,
  attachmentCount,
  onSave,
  onImageUpload,
  onRotate,
  onFlip,
  onLayerRemove,
  onLayerSelect,
  onDownloadAllImages,
  onDownloadAttachments,
  onDownloadImage,
}: OrderToolsPanelProps) {
  return (
    <div className="p-4 space-y-4">
      <Button
        onClick={onDownloadAllImages}
        variant="outline"
        className="w-full"
      >
        <Download className="w-4 h-4 mr-2" />
        모든 디자인 이미지 다운로드
      </Button>

      {hasAttachments && (
        <Button
          onClick={onDownloadAttachments}
          variant="outline"
          className="w-full bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
        >
          <Paperclip className="w-4 h-4 mr-2" />
          주문자 첨부파일 ({attachmentCount}개)
        </Button>
      )}

      {canEdit && (
        <Button
          onClick={onSave}
          disabled={!hasChanges || saving}
          className="w-full"
        >
          {saving ? (
            <Spinner className="w-4 h-4 mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {saving ? "저장 중..." : hasChanges ? "디자인 저장" : "저장됨"}
        </Button>
      )}

      {canEdit && (
        <>
          <Separator />
          <div>
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                className="hidden"
              />
              <Button variant="outline" className="w-full" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  이미지 추가
                </span>
              </Button>
            </label>
          </div>
        </>
      )}

      {canEdit && selectedLayer && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="font-medium text-sm">레이어 편집</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => onRotate(-45)}>
                <RotateCcw className="w-4 h-4 mr-1" />
                -45°
              </Button>
              <Button variant="outline" size="sm" onClick={() => onRotate(45)}>
                <RotateCw className="w-4 h-4 mr-1" />
                +45°
              </Button>
              <Button variant="outline" size="sm" onClick={() => onFlip("x")}>
                <FlipHorizontal className="w-4 h-4 mr-1" />
                좌우
              </Button>
              <Button variant="outline" size="sm" onClick={() => onFlip("y")}>
                <FlipVertical className="w-4 h-4 mr-1" />
                상하
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => onLayerRemove(selectedLayerId!)}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              삭제
            </Button>
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              회전: {selectedLayer.rotation}°
              {selectedLayer.flipX && " · 좌우반전"}
              {selectedLayer.flipY && " · 상하반전"}
            </div>
          </div>
        </>
      )}

      <Separator />
      <div>
        <h4 className="font-medium text-sm mb-2">
          레이어 ({viewLayers.length})
        </h4>
        {viewLayers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            이 뷰에 디자인이 없습니다
          </p>
        ) : (
          <div className="space-y-2">
            {viewLayers.map((layer, index) => (
              <div
                key={layer.id}
                className={`p-2 rounded border text-sm ${
                  selectedLayerId === layer.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => canEdit && onLayerSelect(layer.id)}
                >
                  {layer.type === "image" ? (
                    <ImageIcon className="w-4 h-4 text-gray-400" />
                  ) : (
                    <span className="text-xs">Aa</span>
                  )}
                  <span className="truncate flex-1">
                    {layer.type === "image"
                      ? `이미지 ${index + 1}`
                      : layer.content}
                  </span>
                  {layer.type === "image" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadImage(layer, index);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="이미지 다운로드"
                    >
                      <Download className="w-3 h-3 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!canEdit && (
        <>
          <Separator />
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">수정 불가</p>
                <p className="text-yellow-700 text-xs mt-1">
                  디자인이 확정되어 더 이상 수정할 수 없습니다.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
