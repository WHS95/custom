"use client"

import { Button } from "@/components/ui/button"
import { Image as ImageIcon } from "lucide-react"

interface DesignToolbarProps {
  onUploadClick: () => void
}

export function DesignToolbar({ onUploadClick }: DesignToolbarProps) {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 bg-white rounded-full shadow-lg border p-2 z-20">
      <ToolButton icon={ImageIcon} label="Upload" onClick={onUploadClick} />
    </div>
  )
}

function ToolButton({ icon: Icon, label, onClick }: any) {
  return (
    <div className="group relative">
        <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-10 w-10 hover:bg-black hover:text-white transition-colors"
            onClick={onClick}
        >
            <Icon className="h-5 w-5" />
        </Button>
        <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">
            {label}
        </div>
    </div>
  )
}
