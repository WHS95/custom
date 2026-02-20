"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLOR_PRESETS = [
  { label: "검정", hex: "#000000" },
  { label: "흰색", hex: "#FFFFFF" },
  { label: "빨강", hex: "#EF4444" },
  { label: "파랑", hex: "#3B82F6" },
  { label: "노랑", hex: "#EAB308" },
  { label: "초록", hex: "#22C55E" },
  { label: "주황", hex: "#F97316" },
  { label: "보라", hex: "#A855F7" },
  { label: "분홍", hex: "#EC4899" },
  { label: "회색", hex: "#6B7280" },
];

/** 상업적 무료 폰트 목록 (Google Fonts) */
const FONT_LIST = [
  { label: "Noto Sans KR", family: "'Noto Sans KR'", category: "한글" },
  { label: "Nanum Gothic", family: "'Nanum Gothic'", category: "한글" },
  { label: "Nanum Myeongjo", family: "'Nanum Myeongjo'", category: "한글" },
  { label: "Gothic A1", family: "'Gothic A1'", category: "한글" },
  { label: "Black Han Sans", family: "'Black Han Sans'", category: "한글" },
  { label: "Jua", family: "'Jua'", category: "한글" },
  { label: "Do Hyeon", family: "'Do Hyeon'", category: "한글" },
  { label: "Gugi", family: "'Gugi'", category: "한글" },
  { label: "Gasoek One", family: "'Gasoek One'", category: "한글" },
  { label: "Sunflower", family: "'Sunflower'", category: "한글" },
  { label: "Inter", family: "'Inter'", category: "영문" },
  { label: "Oswald", family: "'Oswald'", category: "영문" },
  { label: "Bebas Neue", family: "'Bebas Neue'", category: "영문" },
  { label: "Permanent Marker", family: "'Permanent Marker'", category: "영문" },
  { label: "Bangers", family: "'Bangers'", category: "영문" },
];

interface TextAddModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { text: string; color: string; fontSize: number; fontFamily: string }) => void;
}

export function TextAddModal({ open, onClose, onConfirm }: TextAddModalProps) {
  const [text, setText] = useState("");
  const [color, setColor] = useState("#000000");
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState(FONT_LIST[0].family);

  if (!open) return null;

  const handleConfirm = () => {
    if (!text.trim()) return;
    onConfirm({ text: text.trim(), color, fontSize, fontFamily });
    setText("");
    setColor("#000000");
    setFontSize(24);
    setFontFamily(FONT_LIST[0].family);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleConfirm();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">텍스트 추가</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 텍스트 입력 */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            텍스트
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="텍스트를 입력하세요"
            className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            autoFocus
          />
        </div>

        {/* 폰트 선택 */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            폰트
          </label>
          <div className="border rounded-lg max-h-[200px] overflow-y-auto">
            {/* 한글 폰트 */}
            <div className="px-2 py-1 bg-gray-50 text-xs font-semibold text-gray-500 sticky top-0">
              한글
            </div>
            {FONT_LIST.filter(f => f.category === "한글").map((font) => (
              <button
                key={font.family}
                onClick={() => setFontFamily(font.family)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  fontFamily === font.family
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                <span style={{ fontFamily: font.family }} className="text-base">
                  {font.label} - 모자 인쇄
                </span>
              </button>
            ))}
            {/* 영문 폰트 */}
            <div className="px-2 py-1 bg-gray-50 text-xs font-semibold text-gray-500 sticky top-0">
              영문 (English)
            </div>
            {FONT_LIST.filter(f => f.category === "영문").map((font) => (
              <button
                key={font.family}
                onClick={() => setFontFamily(font.family)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  fontFamily === font.family
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-50"
                }`}
              >
                <span style={{ fontFamily: font.family }} className="text-base">
                  {font.label} - Hat Print
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 색상 선택 */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            색상
          </label>
          <div className="flex flex-wrap gap-2">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.hex}
                onClick={() => setColor(c.hex)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color === c.hex
                    ? "border-blue-500 scale-110 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-400"
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* 폰트 크기 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            크기: {fontSize}px
          </label>
          <input
            type="range"
            min={12}
            max={72}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>12px</span>
            <span>72px</span>
          </div>
        </div>

        {/* 미리보기 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border min-h-[60px] flex items-center justify-center">
          {text.trim() ? (
            <span
              style={{
                color,
                fontSize: `${Math.min(fontSize, 40)}px`,
                fontFamily,
              }}
              className="font-medium break-all text-center"
            >
              {text}
            </span>
          ) : (
            <span className="text-gray-300 text-sm">미리보기</span>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            취소
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={!text.trim()}
          >
            추가
          </Button>
        </div>
      </div>
    </div>
  );
}
