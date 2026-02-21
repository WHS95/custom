"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Type } from "lucide-react";
import { COLOR_PRESETS, FONT_LIST } from "./constants";
import { useStudioConfig } from "@/lib/store/studio-context";

interface TextEditToolbarProps {
  fontFamily: string;
  color: string;
  fontSize: number;
  onFontFamilyChange: (fontFamily: string) => void;
  onColorChange: (color: string) => void;
  onFontSizeChange: (fontSize: number) => void;
}

export function TextEditToolbar({
  fontFamily,
  color,
  fontSize,
  onFontFamilyChange,
  onColorChange,
  onFontSizeChange,
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
    <div className='absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap max-w-[520px]'>
      <div className='flex items-center gap-1.5 text-gray-500'>
        <Type className='w-4 h-4' />
        <span className='text-xs font-medium hidden sm:inline'>
          텍스트 편집
        </span>
      </div>

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
                    ? "bg-blue-50 text-blue-700"
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
                    ? "bg-blue-50 text-blue-700"
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

      {/* 색상 선택 */}
      <div className='flex items-center gap-1'>
        {textColorPresets.map((c) => (
          <button
            key={c.hex}
            onClick={() => onColorChange(c.hex)}
            className={`w-5 h-5 rounded-full border transition-all shrink-0 ${
              color === c.hex
                ? "border-blue-500 scale-125 ring-1 ring-blue-300"
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
          className='w-20 accent-blue-500'
        />
        <span className='text-xs text-gray-500 font-medium w-8 text-right tabular-nums'>
          {fontSize}px
        </span>
      </div>
    </div>
  );
}
