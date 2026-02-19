"use client";

import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Info, Undo2, Redo2 } from "lucide-react";
import { useDesignStore } from "@/lib/store/design-store";

interface DesignToolbarProps {
  onUploadClick: () => void;
}

export function DesignToolbar({ onUploadClick }: DesignToolbarProps) {
  const undo = useDesignStore((state) => state.undo);
  const redo = useDesignStore((state) => state.redo);
  const canUndo = useDesignStore((state) => state.canUndo);
  const canRedo = useDesignStore((state) => state.canRedo);

  return (
    <div className='absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-white rounded-2xl shadow-lg border p-2 z-20'>
      <UploadButton onClick={onUploadClick} />

      {/* 구분선 */}
      <div className='h-px bg-gray-200 mx-1' />

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
      <div className='absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-2.5 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl min-w-[200px]'>
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
        </ul>
        {/* 화살표 */}
        <div className='absolute right-0 top-1/2 -translate-y-1/2 translate-x-full'>
          <div className='border-8 border-transparent border-l-gray-900'></div>
        </div>
      </div>
    </div>
  );
}
