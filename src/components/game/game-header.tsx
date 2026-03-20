"use client"

import { cn } from "@/lib/utils"
import { Bell } from "lucide-react"
import { usePathname } from "next/navigation"

const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/packs": "Packs",
  "/collection": "Collection",
  "/shop": "Shop",
  "/profile": "Profile",
}

export function GameHeader() {
  const pathname = usePathname()
  const title = PAGE_TITLES[pathname] ?? "Zakiverse"

  return (
    <header className={cn(
      "sticky top-0 z-40 flex items-center justify-between",
      "border-b border-stone-800/40 bg-stone-900/95 px-4 py-3 backdrop-blur-md",
    )}>
      {/* Page title */}
      <h1 className={"text-base font-bold text-stone-100 tracking-wide"}>
        {title}
      </h1>

      {/* Status items */}
      <div className={"flex items-center gap-3"}>
        {/* Currency */}
        <div className={"flex items-center gap-1.5 rounded-full bg-stone-800/60 px-3 py-1"}>
          <span className={"text-xs text-stone-400"}>◆</span>
          <span className={"text-xs font-semibold text-stone-200"}>1,250</span>
        </div>

        {/* Notifications */}
        <button className={"relative p-1 text-stone-500 transition-colors active:text-stone-300"} type={"button"}>
          <Bell className={"h-4.5 w-4.5"} />
          {/* Unread dot */}
          <span className={"absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-red-500"} />
        </button>
      </div>
    </header>
  )
}
