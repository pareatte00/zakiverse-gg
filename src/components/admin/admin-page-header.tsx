import type { ReactNode } from "react"

interface AdminPageHeaderProps {
  title:        string
  description?: string
  actions?:     ReactNode
}

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className={"flex items-center justify-between"}>
      <div>
        <h1 className={"text-2xl font-bold text-zinc-100"}>{title}</h1>

        {description && (
          <p className={"mt-1 text-sm text-zinc-500"}>{description}</p>
        )}
      </div>

      {actions && (
        <div className={"flex items-center gap-2"}>
          {actions}
        </div>
      )}
    </div>
  )
}
