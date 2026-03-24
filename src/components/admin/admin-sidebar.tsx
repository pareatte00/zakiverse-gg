"use client"

import { GameButton } from "@/components/game/game-button"
import { Admin, Private } from "@/lib/const/const.url"
import { useCardCreation } from "@/lib/context/card-creation-context"
import { CreditCard, FileStack, Gamepad2, LayoutDashboard, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavItem {
  label: string
  href:  string
  icon:  React.ElementType
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV: NavGroup[] = [
  {
    label: "General",
    items: [ { label: "Dashboard", href: Admin.Dashboard, icon: LayoutDashboard } ],
  },
  {
    label: "Cards",
    items: [ { label: "Create Cards", href: Admin.Cards.Create, icon: Plus } ],
  },
]

function DraftToggleButton() {
  const { draft, toggleDraft } = useCardCreation()

  return (
    <GameButton
      className={"w-full justify-start"}
      variant={"ghost"}
      onClick={toggleDraft}
    >
      <FileStack className={"h-4 w-4"} />
      Draft

      {draft.length > 0 && (
        <span className={"ml-auto rounded-full bg-amber-500/15 px-1.5 py-0.5 text-xs font-semibold text-amber-400"}>
          {draft.length}
        </span>
      )}
    </GameButton>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className={"flex w-64 shrink-0 flex-col border-r border-zinc-800/40 bg-zinc-900"}>
      {/* Branding */}
      <div className={"flex items-center gap-2 border-b border-zinc-800/40 px-5 py-4"}>
        <CreditCard className={"h-5 w-5 text-amber-500"} />
        <span className={"text-sm font-bold tracking-wider text-zinc-100"}>ZAKIVERSE</span>

        <span className={"rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400"}>
          ADMIN
        </span>
      </div>

      {/* Navigation */}
      <nav className={"flex-1 space-y-6 px-3 py-4"}>
        {NAV.map((group) => (
          <div key={group.label}>
            <p className={"mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500"}>
              {group.label}
            </p>

            <div className={"space-y-1.5"}>
              {group.items.map((item) => {
                const isActive = item.href === Admin.Dashboard
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(item.href + "/")

                return (
                  <GameButton
                    asChild
                    className={"justify-start"}
                    key={item.href}
                    pressed={isActive}
                    variant={"ghost"}
                  >
                    <Link href={item.href}>
                      <item.icon className={"h-4 w-4"} />
                      {item.label}
                    </Link>
                  </GameButton>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Draft toggle */}
      <div className={"border-t border-zinc-800/40 px-3 py-3"}>
        <DraftToggleButton />
      </div>

      {/* Back to game */}
      <div className={"border-t border-zinc-800/40 px-3 py-3"}>
        <GameButton
          asChild
          className={"w-full justify-start"}
          variant={"amber"}
        >
          <Link href={Private.Home}>
            <Gamepad2 className={"h-4 w-4"} />
            Back to Game
          </Link>
        </GameButton>
      </div>
    </aside>
  )
}
