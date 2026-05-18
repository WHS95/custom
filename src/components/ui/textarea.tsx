import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Textarea — Input과 동일한 underline 패턴, 최소 높이 96px
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-24 w-full bg-transparent px-0 py-3 text-base text-ink",
        "border-0 border-b border-hairline rounded-none",
        "placeholder:text-mute selection:bg-ink selection:text-canvas",
        "outline-none transition-colors resize-y",
        "focus-visible:border-b-2 focus-visible:border-ink",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-b-2 aria-invalid:border-danger",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
