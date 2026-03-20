"use client"

import { cn } from "@/lib/utils"
import { BookOpen, Home, ShoppingCart, Sparkles, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/", icon: Home },
  { href: "/collection", icon: BookOpen },
  { href: "/packs", icon: Sparkles },
  { href: "/shop", icon: ShoppingCart },
  { href: "/profile", icon: User },
]

export function GameNavbar() {
  const pathname = usePathname()

  return (
    <div className={"fixed bottom-0 left-1/2 z-50 w-full max-w-[480px] -translate-x-1/2 pb-safe"}>
      <nav className={"flex items-end gap-1"}>
        {NAV_ITEMS.map((item, i) => {
          const isCenter = i === 2
          const isActive = pathname === item.href

          return (
            <Link
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1.5",
                "rounded-t-3xl border-b-0 pb-4 -mb-4",
                "bg-gradient-to-b",
                "shadow-[0_3px_0_0_rgba(28,25,23,0.95)]",
                "transition-all duration-150",
                "hover:-translate-y-1.5 hover:shadow-[0_5px_0_0_rgba(28,25,23,0.95),0_8px_12px_rgba(0,0,0,0.2)]",
                "active:translate-y-[2px] active:shadow-[0_1px_0_0_rgba(28,25,23,0.95)]",
                isActive ? "h-[84px] -translate-y-2" : "h-[72px]",
                isCenter
                  ? cn(
                    "nav-center-btn",
                    isActive
                      ? "from-amber-700/90 to-amber-900 border-amber-600/30 text-amber-100"
                      : "from-amber-800/70 to-amber-950 border-amber-700/20 text-amber-400/80 hover:from-amber-700/80 hover:text-amber-300",
                  )
                  : isActive
                    ? "from-stone-500 to-stone-700 border-stone-500/30 text-stone-100"
                    : "from-stone-600 to-stone-800 border-stone-600/20 text-stone-400 hover:from-stone-500 hover:text-stone-200",
              )}
              href={item.href}
              key={item.href}
            >
              <item.icon className={isCenter ? "h-7 w-7" : "h-5 w-5"} />

              {isActive && (
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    isCenter ? "bg-amber-300" : "bg-stone-300",
                  )}
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
