import { ChevronRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"

interface QuickActionItem {
  icon:        LucideIcon
  label:       string
  description: string
  href:        string
}

interface DashboardQuickActionGroupProps {
  title: string
  items: QuickActionItem[]
}

export type { QuickActionItem }

export function DashboardQuickActionGroup({ title, items }: DashboardQuickActionGroupProps) {
  return (
    <div className={"rounded-xl border border-zinc-800/40 bg-zinc-900"}>
      <div className={"border-b border-zinc-800/40 px-5 py-3"}>
        <h3 className={"text-xs font-semibold uppercase tracking-wider text-zinc-500"}>{title}</h3>
      </div>

      <div className={"divide-y divide-zinc-800/40"}>
        {items.map((item) => (
          <Link
            className={"flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-zinc-800/40"}
            href={item.href}
            key={item.label}
          >
            <div className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800"}>
              <item.icon className={"h-4 w-4 text-amber-400"} />
            </div>

            <div className={"min-w-0 flex-1"}>
              <p className={"text-sm font-medium text-zinc-200"}>{item.label}</p>
              <p className={"text-xs text-zinc-500"}>{item.description}</p>
            </div>

            <ChevronRight className={"h-4 w-4 shrink-0 text-zinc-600"} />
          </Link>
        ))}
      </div>
    </div>
  )
}
