"use client"

import { MessageCircle } from "lucide-react"

const KAKAO_LINK = "https://open.kakao.com/me/runhouse"

export function CustomerSupportLink() {
  return (
    <a
      href={KAKAO_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 z-40"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="font-medium text-sm">문의하기</span>
    </a>
  )
}
