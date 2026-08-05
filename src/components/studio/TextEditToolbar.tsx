"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Type, UserSquare, Rows3 } from "lucide-react";
import { COLOR_PRESETS, FONT_LIST } from "./constants";
import { useStudioConfig } from "@/lib/store/studio-context";

interface TextEditToolbarProps {
  content: string;
  fontFamily: string;
  color: string;
  fontSize: number;
  onContentChange: (content: string) => void;
  onFontFamilyChange: (fontFamily: string) => void;
  onColorChange: (color: string) => void;
  onFontSizeChange: (fontSize: number) => void;
  /** 세로쓰기 (글자를 위→아래로 나열) */
  vertical?: boolean;
  onVerticalToggle?: () => void;
  /** 크루원 이름 자리(개인화) 지정 — 상점 주문 시 각자 이름이 들어감 */
  nameField?: boolean;
  onNameFieldToggle?: () => void;
}

export function TextEditToolbar({
  content,
  fontFamily,
  color,
  fontSize,
  onContentChange,
  onFontFamilyChange,
  onColorChange,
  onFontSizeChange,
  vertical,
  onVerticalToggle,
  nameField,
  onNameFieldToggle,
}: TextEditToolbarProps) {
  const { config } = useStudioConfig();
  const textColorPresets =
    config.printColorPalette?.length > 0
      ? config.printColorPalette
      : COLOR_PRESETS;
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsFontDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentFont =
    FONT_LIST.find((f) => f.family === fontFamily) || FONT_LIST[0];

  return (
    <div className='absolute top-3 lg:top-4 left-1/2 -translate-x-1/2 z-30 bg-white rounded-xl shadow-lg border border-gray-200 px-3 py-2.5 lg:px-4 lg:py-3 flex items-center gap-2 lg:gap-3 flex-wrap max-w-[calc(100vw-1.5rem)] sm:max-w-[520px]'>
      <div className='flex items-center gap-1.5 text-gray-500'>
        <Type className='w-4 h-4' />
        <span className='text-xs font-medium hidden sm:inline'>
          텍스트 편집
        </span>
      </div>

      <div className='w-px h-6 bg-gray-200' />

      {/* 텍스트 내용 편집 */}
      <input
        type='text'
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder='내용 입력'
        className='px-2.5 py-1.5 border rounded-lg text-sm w-[110px] sm:w-[140px] focus:outline-none focus:ring-1 focus:ring-gray-900'
        aria-label='텍스트 내용'
      />

      <div className='w-px h-6 bg-gray-200' />

      {/* 폰트 선택 드롭다운 */}
      <div className='relative' ref={dropdownRef}>
        <button
          onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
          className='flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors text-sm min-w-[140px]'
        >
          <span
            style={{ fontFamily: currentFont.family }}
            className='truncate max-w-[110px]'
          >
            {currentFont.label}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 ${
              isFontDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isFontDropdownOpen && (
          <div className='absolute top-full left-0 mt-1 w-64 bg-white border rounded-lg shadow-xl max-h-[280px] overflow-y-auto z-50'>
            <div className='px-2 py-1.5 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wider sticky top-0'>
              한글
            </div>
            {FONT_LIST.filter((f) => f.category === "한글").map((font) => (
              <button
                key={font.family}
                onClick={() => {
                  onFontFamilyChange(font.family);
                  setIsFontDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  fontFamily === font.family
                    ? "bg-gray-100 text-gray-900"
                    : "hover:bg-gray-50"
                }`}
              >
                <span style={{ fontFamily: font.family }}>
                  {font.label} - 텍스트
                </span>
              </button>
            ))}
            <div className='px-2 py-1.5 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wider sticky top-0'>
              붓글씨·손글씨
            </div>
            {FONT_LIST.filter((f) => f.category === "붓글씨·손글씨").map((font) => (
              <button
                key={font.family}
                onClick={() => {
                  onFontFamilyChange(font.family);
                  setIsFontDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  fontFamily === font.family
                    ? "bg-gray-100 text-gray-900"
                    : "hover:bg-gray-50"
                }`}
              >
                <span style={{ fontFamily: font.family }}>
                  {font.label} - 텍스트
                </span>
              </button>
            ))}
            <div className='px-2 py-1.5 bg-gray-50 text-[10px] font-semibold text-gray-400 uppercase tracking-wider sticky top-0'>
              영문 (English)
            </div>
            {FONT_LIST.filter((f) => f.category === "영문").map((font) => (
              <button
                key={font.family}
                onClick={() => {
                  onFontFamilyChange(font.family);
                  setIsFontDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  fontFamily === font.family
                    ? "bg-gray-100 text-gray-900"
                    : "hover:bg-gray-50"
                }`}
              >
                <span style={{ fontFamily: font.family }}>
                  {font.label} - 텍스트
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className='w-px h-6 bg-gray-200' />

      {/* 색상 선택 - 모바일에서는 가로 스크롤, 데스크탑에서는 자연 폭 */}
      <div className='flex items-center gap-1 overflow-x-auto max-w-[180px] sm:max-w-none -mx-1 px-1 py-0.5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]'>
        {textColorPresets.map((c) => (
          <button
            key={c.hex}
            onClick={() => onColorChange(c.hex)}
            className={`w-5 h-5 rounded-full border transition-all shrink-0 ${
              color === c.hex
                ? "border-gray-900 scale-125 ring-1 ring-gray-300"
                : "border-gray-200 hover:border-gray-400 hover:scale-110"
            }`}
            style={{ backgroundColor: c.hex }}
            title={c.label}
          />
        ))}
      </div>

      <div className='w-px h-6 bg-gray-200' />

      {/* 폰트 크기 */}
      <div className='flex items-center gap-2'>
        <input
          type='range'
          min={12}
          max={72}
          value={fontSize}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          className='w-20 accent-gray-900'
        />
        <span className='text-xs text-gray-500 font-medium w-8 text-right tabular-nums'>
          {fontSize}px
        </span>
      </div>

      {/* 세로쓰기 토글 */}
      {onVerticalToggle && (
        <>
          <div className='w-px h-6 bg-gray-200' />
          <button
            type='button'
            onClick={onVerticalToggle}
            title='세로쓰기 (글자를 위→아래로 나열)'
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              vertical
                ? "border-[#0B0C0A] bg-[#0B0C0A] text-white"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Rows3 className='w-4 h-4' />
            <span className='hidden sm:inline'>세로</span>
          </button>
        </>
      )}

      {/* 크루원 이름 자리 토글 (개인화) */}
      {onNameFieldToggle && (
        <>
          <div className='w-px h-6 bg-gray-200' />
          <button
            type='button'
            onClick={onNameFieldToggle}
            title='크루원 이름 자리로 지정 (상점 주문 시 각자 이름이 들어가요)'
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              nameField
                ? "border-[#0B0C0A] bg-[#0B0C0A] text-white"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <UserSquare className='w-4 h-4' />
            <span className='hidden sm:inline'>이름 자리</span>
          </button>
        </>
      )}
    </div>
  );
}
