"use client"

import { GameButton } from "@/components/game/game-button"
import { Badge } from "@/components/ui/badge"
import { Cookie } from "@/lib/const/const.cookie"
import { Admin, Private, Public } from "@/lib/const/const.url"
import { useCardCreation } from "@/lib/context/card-creation-context"
import { deleteCookie } from "@/lib/hook/cookie"
import { CreditCard, FileStack, Gamepad2, Gift, Layers, LayoutDashboard, LogOut, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"

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
    items: [
      { label: "Manage Cards", href: Admin.Cards.List, icon: Layers },
      { label: "Create Cards", href: Admin.Cards.Create, icon: Plus },
    ],
  },
  {
    label: "Packs",
    items: [
      { label: "Manage Packs", href: Admin.Packs.List, icon: Gift },
      { label: "Create Pack", href: Admin.Packs.Create, icon: Plus },
    ],
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
        <Badge className={"ml-auto bg-amber-500/15 text-amber-400 hover:bg-amber-500/20"} variant={"secondary"}>
          {draft.length}
        </Badge>
      )}
    </GameButton>
  )
}

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await deleteCookie(Cookie.accessToken)
    await deleteCookie(Cookie.refreshToken)
    toast.success("Logged out")
    router.push(Public.Login)
  }

  return (
    <aside className={"flex w-64 shrink-0 flex-col border-r border-border bg-card"}>
      {/* Branding */}
      <div className={"flex items-center gap-2 border-b border-border px-5 py-4"}>
        <CreditCard className={"h-5 w-5 text-amber-500"} />
        <span className={"text-sm font-bold tracking-wider text-foreground"}>ZAKIVERSE</span>

        <Badge className={"bg-amber-500/15 text-amber-400 hover:bg-amber-500/20"} variant={"secondary"}>
          ADMIN
        </Badge>
      </div>

      {/* Navigation */}
      <nav className={"flex-1 space-y-6 px-3 py-4"}>
        {NAV.map((group) => (
          <div key={group.label}>
            <p className={"mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"}>
              {group.label}
            </p>

            <div className={"space-y-3"}>
              {group.items.map((item) => {
                const isActive = item.href === Admin.Dashboard || item.href === Admin.Cards.List || item.href === Admin.Packs.List
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

              {group.label === "Cards" && <DraftToggleButton />}
            </div>
          </div>
        ))}
      </nav>

      {/* Back to game */}
      <div className={"space-y-3 border-t border-border px-3 py-3"}>
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

        <GameButton
          className={"w-full justify-start hover:!text-red-400"}
          variant={"ghost"}
          onClick={() => void handleLogout()}
        >
          <LogOut className={"h-4 w-4"} />
          Logout
        </GameButton>
      </div>
    </aside>
  )
}
