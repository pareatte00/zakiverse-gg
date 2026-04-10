"use client"

import { Badge } from "@/components/ui/badge"
import { Cookie } from "@/lib/const/const.cookie"
import { Admin, Private, Public } from "@/lib/const/const.url"
import { useCardCreation } from "@/lib/context/card-creation-context"
import { deleteCookie } from "@/lib/hook/cookie"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronRight, CreditCard, FileStack, Gamepad2, Gift, Layers, LayoutDashboard, LogOut, Plus, Tag } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

interface NavItem {
  label: string
  href:  string
  icon:  React.ElementType
}

interface NavGroup {
  label:           string
  items?:          NavItem[]
  children?:       NavGroup[]
  ExtraComponent?: React.ComponentType
}

// Exact-match routes (list pages) — prevents /admin/cards/create from highlighting "Manage Cards"
const EXACT_MATCH_ROUTES: Set<string> = new Set([
  Admin.Dashboard,
  Admin.Cards.List,
  Admin.Packs.List,
  Admin.Tags.List,
])

function DraftToggleButton() {
  const { draft, toggleDraft } = useCardCreation()

  return (
    <button
      className={"flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200"}
      type={"button"}
      onClick={toggleDraft}
    >
      <FileStack className={"h-4 w-4 shrink-0"} />
      Draft

      {draft.length > 0 && (
        <Badge className={"ml-auto bg-amber-500/15 text-amber-400 hover:bg-amber-500/20"} variant={"secondary"}>
          {draft.length}
        </Badge>
      )}
    </button>
  )
}

const NAV: NavGroup[] = [
  {
    label: "General",
    items: [ { label: "Dashboard", href: Admin.Dashboard, icon: LayoutDashboard } ],
  },
  {
    label:    "Collection",
    children: [
      {
        label: "Cards",
        items: [
          { label: "Manage Cards", href: Admin.Cards.List, icon: Layers },
          { label: "Create Cards", href: Admin.Cards.Create, icon: Plus },
        ],
        ExtraComponent: DraftToggleButton,
      },
      {
        label: "Tags",
        items: [ { label: "Manage Tags", href: Admin.Tags.List, icon: Tag } ],
      },
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

function collectHrefs(group: NavGroup): string[] {
  const hrefs = (group.items ?? []).map((i) => i.href)

  for (const child of group.children ?? []) {
    hrefs.push(...collectHrefs(child))
  }

  return hrefs
}

function isGroupActive(group: NavGroup, pathname: string): boolean {
  return collectHrefs(group).some((href) => {
    return EXACT_MATCH_ROUTES.has(href)
      ? pathname === href
      : pathname === href || pathname.startsWith(href + "/")
  })
}

function getInitialExpanded(groups: NavGroup[], pathname: string): Record<string, boolean> {
  const result: Record<string, boolean> = {}

  function walk(g: NavGroup) {
    result[g.label] = isGroupActive(g, pathname)

    for (const child of g.children ?? []) walk(child)
  }

  for (const g of groups) walk(g)

  return result
}

function isActive(href: string, pathname: string): boolean {
  return EXACT_MATCH_ROUTES.has(href)
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/")
}

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [ expanded, setExpanded ] = useState<Record<string, boolean>>(() => getInitialExpanded(NAV, pathname))

  // Auto-expand groups when navigating to a new section
  useEffect(() => {
    setExpanded((prev) => {
      const active = getInitialExpanded(NAV, pathname)
      const merged = { ...prev }

      for (const [ key, val ] of Object.entries(active)) {
        if (val) merged[key] = true
      }

      return merged
    })
  }, [ pathname ])

  const toggleGroup = useCallback((label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))
  }, [])

  async function handleLogout() {
    await deleteCookie(Cookie.accessToken)
    await deleteCookie(Cookie.refreshToken)
    toast.success("Logged out")
    router.push(Public.Login)
  }

  function renderNavItem(item: NavItem) {
    const active = isActive(item.href, pathname)

    return (
      <Link
        className={cn(
          "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
          active
            ? "bg-amber-500/10 text-amber-400"
            : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200",
        )}
        href={item.href}
        key={item.href}
      >
        <item.icon className={"h-4 w-4 shrink-0"} />
        {item.label}
      </Link>
    )
  }

  function renderGroup(group: NavGroup, depth: number) {
    const hasCollapsibleContent = (group.items && group.items.length > 0) || group.children
    const isCollapsible = depth > 0 || (hasCollapsibleContent && ((group.items?.length ?? 0) > 1 || group.children))
    const isOpen = expanded[group.label] ?? false

    // Simple non-collapsible group (e.g. "General" with one item, no children)
    if (!isCollapsible) {
      return (
        <div key={group.label}>
          <p className={"mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500"}>
            {group.label}
          </p>

          <div className={"space-y-0.5"}>
            {(group.items ?? []).map((item) => renderNavItem(item))}
          </div>
        </div>
      )
    }

    const Chevron = isOpen ? ChevronDown : ChevronRight

    // Top-level collapsible group
    if (depth === 0) {
      return (
        <div key={group.label}>
          <button
            className={"mb-2 flex w-full items-center justify-between px-2 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-300"}
            type={"button"}
            onClick={() => toggleGroup(group.label)}
          >
            {group.label}
            <Chevron className={"h-3 w-3"} />
          </button>

          {isOpen && (
            <div className={"space-y-0.5"}>
              {(group.items ?? []).map((item) => renderNavItem(item))}
              {group.ExtraComponent && <group.ExtraComponent />}
              {(group.children ?? []).map((child) => renderGroup(child, depth + 1))}
            </div>
          )}
        </div>
      )
    }

    // Nested collapsible sub-group (e.g. "Cards", "Tags" under "Collection")
    return (
      <div className={"mt-1 border-l border-zinc-700/40 pl-2"} key={group.label}>
        <button
          className={"flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 transition-colors hover:text-zinc-300"}
          type={"button"}
          onClick={() => toggleGroup(group.label)}
        >
          {group.label}
          <Chevron className={"h-3 w-3"} />
        </button>

        {isOpen && (
          <div className={"mt-0.5 space-y-0.5"}>
            {(group.items ?? []).map((item) => renderNavItem(item))}
            {group.ExtraComponent && <group.ExtraComponent />}
            {(group.children ?? []).map((child) => renderGroup(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className={"flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950"}>
      {/* Branding */}
      <div className={"flex items-center gap-2 border-b border-zinc-800 px-5 py-4"}>
        <CreditCard className={"h-5 w-5 text-amber-500"} />
        <span className={"text-sm font-bold tracking-wider text-zinc-100"}>ZAKIVERSE</span>

        <Badge className={"bg-amber-500/15 text-amber-400 hover:bg-amber-500/20"} variant={"secondary"}>
          ADMIN
        </Badge>
      </div>

      {/* Navigation */}
      <nav className={"flex-1 space-y-5 overflow-y-auto px-3 py-4"}>
        {NAV.map((group) => renderGroup(group, 0))}
      </nav>

      {/* Footer */}
      <div className={"space-y-0.5 border-t border-zinc-800 px-3 py-3"}>
        <Link
          className={"flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium text-amber-400 transition-colors hover:bg-amber-500/10"}
          href={Private.Home}
        >
          <Gamepad2 className={"h-4 w-4 shrink-0"} />
          Back to Game
        </Link>

        <button
          className={"flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-red-400"}
          type={"button"}
          onClick={() => void handleLogout()}
        >
          <LogOut className={"h-4 w-4 shrink-0"} />
          Logout
        </button>
      </div>
    </aside>
  )
}
