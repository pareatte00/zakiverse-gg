"use client"

import { Badge } from "@/components/ui/badge"
import { Toaster } from "@/components/ui/sonner"
import { defaultInfo } from "@/lib/api/db/api.default"
import { useTranslation } from "@/lib/hook/use-translation"
import { HttpStatusCode } from "axios"
import { GitBranch } from "lucide-react"
import { useEffect, useState } from "react"
import { Kbd } from "./ui/kbd"
import { Spinner } from "./ui/spinner"

export function Footer() {
  const t = useTranslation()
  const [ version, setVersion ] = useState<string>("")

  // Fetch app info on mount
  useEffect(() => {
    const fetchAppInfo = async () => {
      try {
        const response = await defaultInfo()

        if (response.status == HttpStatusCode.Ok) {
          setVersion(response.response?.version || "1.0")
        }
      }
      catch {
        setVersion("1.0")
      }
    }

    fetchAppInfo().catch(() => {})
  }, [])

  return (
    <footer className={"border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"}>
      <Toaster position={"bottom-right"} />

      <div className={"py-3 px-4"}>
        <div className={"flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0"}>
          {/* Left section - Copyright */}
          <div className={"text-xs text-muted-foreground"}>
            {t("common.copyrightText")}
          </div>

          {/* Right section - Version */}
          <div className={"flex items-center space-x-2"}>
            <Badge className={"text-xs"} variant={"outline"}>
              <GitBranch className={"h-3 w-3 mr-1"} />
              <Kbd className={"text-xs mr-1"}>V</Kbd>
              {version == "" ? <Spinner /> : version}
            </Badge>
          </div>
        </div>
      </div>
    </footer>
  )
}
