"use client"

import { DashboardTabs } from "@/components/dashboard/DashboardTabs"
import { usePageInfo } from "@/lib/contexts/page-context"
import { useTranslation } from "@/lib/hook/use-translation"

export default function Home() {
  const t = useTranslation()

  usePageInfo(t("dashboard.title"), t("dashboard.subtitle"))

  return (
    <div className={"space-y-6"}>
      <DashboardTabs />
    </div>
  )
}
