"use client";

import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Type, Info, Undo2, Redo2 } from "lucide-react";
import { useDesignStore } from "@/lib/store/design-store";

interface DesignToolbarProps {
  onUploadClick: () => void;
  onTextClick: () => void;
  currentView?: string;
}

export function DesignToolbar({
  onUploadClick,
  onTextClick,
  currentView,
}: DesignToolbarProps) {
  const undo = useDesignStore((state) => state.undo);
  const redo = useDesignStore((state) => state.redo);
  const canUndo = useDesignStore((state) => state.canUndo);
  const canRedo = useDesignStore((state) => state.canRedo);

  return (
    <div className='absolute top-3 left-1/2 -translate-x-1/2 flex flex-row items-center gap-1 bg-white/85 backdrop-blur-sm rounded-full ring-1 ring-black/5 shadow-sm px-1.5 py-1 z-20'>
      <UploadButton onClick={onUploadClick} />

      {/* 텍스트 추가 버튼 */}
      <Button
        variant='ghost'
        size='icon'
        className='rounded-full h-10 w-10 hover:bg-black hover:text-white transition-colors'
        onClick={onTextClick}
        title='텍스트 추가'
      >
        <Type className='h-5 w-5' />
      </Button>

      {/* 구분선 (가로 도킹: 세로 헤어라인) */}
      <div className='w-px h-5 bg-gray-200 mx-0.5' />

      {/* Undo 버튼 */}
      <Button
        variant='ghost'
        size='icon'
        className='rounded-full h-10 w-10 hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current'
        onClick={undo}
        disabled={!canUndo()}
        title='되돌리기 (Ctrl+Z)'
      >
        <Undo2 className='h-5 w-5' />
      </Button>

      {/* Redo 버튼 */}
      <Button
        variant='ghost'
        size='icon'
        className='rounded-full h-10 w-10 hover:bg-black hover:text-white transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current'
        onClick={redo}
        disabled={!canRedo()}
        title='다시하기 (Ctrl+Shift+Z)'
      >
        <Redo2 className='h-5 w-5' />
      </Button>

      {/* 현재 뷰 표시 (도킹 바 우측, 옅게) */}
      {currentView && (
        <span className='ml-0.5 pr-1.5 text-[11px] font-medium text-gray-400 capitalize select-none'>
          {currentView}
        </span>
      )}
    </div>
  );
}

function UploadButton({ onClick }: { onClick: () => void }) {
  return (
    <div className='group relative'>
      <Button
        variant='ghost'
        size='icon'
        className='rounded-full h-10 w-10 hover:bg-black hover:text-white transition-colors'
        onClick={onClick}
      >
        <ImageIcon className='h-5 w-5' />
      </Button>
      {/* 업로드 요구사항 툴팁 */}
      <div className='absolute top-full mt-3 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl min-w-[200px]'>
        <div className='flex items-center gap-1.5 mb-2 pb-2 border-b border-gray-700'>
          <Info className='h-3.5 w-3.5 text-blue-400' />
          <span className='font-medium'>이미지 업로드 안내</span>
        </div>
        <ul className='space-y-1.5 text-gray-200'>
          <li className='flex items-start gap-1.5'>
            <span className='text-blue-400 mt-0.5'>•</span>
            <span>PNG 파일만 가능</span>
          </li>
          <li className='flex items-start gap-1.5'>
            <span className='text-blue-400 mt-0.5'>•</span>
            <span>이미지 크기 2500px 이상</span>
          </li>
          <li className='flex items-start gap-1.5'>
            <span className='text-yellow-400 mt-0.5'>•</span>
            <span>.ai 파일은 주문시 첨부해주세요</span>
          </li>
          <li className='flex items-start gap-1.5'>
            <span className='text-yellow-400 mt-0.5'>•</span>
            <span>이미지 색상은 인쇄 가능 색상으로 별도 안내됩니다</span>
          </li>
        </ul>
        {/* 화살표 (위쪽 아이콘을 가리킴) */}
        <div className='absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full'>
          <div className='border-8 border-transparent border-b-gray-900'></div>
        </div>
      </div>
    </div>
  );
}
