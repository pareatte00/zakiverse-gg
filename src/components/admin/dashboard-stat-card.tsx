import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface DashboardStatCardProps {
  icon:     LucideIcon
  label:    string
  value:    string | number
  accent?:  string
  loading?: boolean
}

export function DashboardStatCard({ icon: Icon, label, value, accent = "text-amber-400", loading = false }: DashboardStatCardProps) {
  return (
    <div className={"rounded-xl border border-zinc-800/40 bg-zinc-900 p-5"}>
      <div className={"flex items-center gap-3"}>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800", accent)}>
          <Icon className={"h-5 w-5"} />
        </div>

        <div className={"min-w-0"}>
          <p className={"text-xs text-zinc-500"}>{label}</p>

          {loading
            ? <div className={"mt-1 h-7 w-12 animate-pulse rounded bg-zinc-800"} />
            : <p className={"text-2xl font-bold text-zinc-100"}>{value}</p>}
        </div>
      </div>
    </div>
  )
}
