"use client"

import { ChobLogo } from "@/components/chob-logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { defaultInfo } from "@/lib/api/db/api.default"
import { Route } from "@/lib/const/main/const.url"
import { LangConst, useTranslation } from "@/lib/hook/use-translation"
import { cn } from "@/lib/utils"
import { HttpStatusCode } from "axios"
import {
  ChartNoAxesColumn,
  ChevronDown,
  ChevronUp,
  Database,
  Facebook,
  FileText,
  GitBranch,
  Home,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Target,
  Upload,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

interface NavigationItem {
  key:       string
  href?:     string
  icon:      any
  children?: (NavigationItem | { type: "separator", title: string })[]
}

const navigationConfig: (NavigationItem | { type: "separator", title: string })[] = [
  // Dashboard & Reports Group
  { type: "separator", title: "navigation.groups.dashboard" },
  { key: "navigation.overview", href: Route.Private.Overview, icon: Home },
  { key: "navigation.voluum", href: Route.Private.Voluum, icon: ChartNoAxesColumn },
  { key: "navigation.reports", href: Route.Private.Reports, icon: FileText },

  // Data Management Group
  { type: "separator", title: "navigation.groups.dataManagement" },
  { key: "navigation.workbench", href: Route.Private.Workbench, icon: Database },
  {
    key:  "navigation.dataExplorer",
    href: Route.Private.DataExplorer,
    icon: Search,
  },
  {
    key:  "navigation.dataPipeline",
    href: Route.Private.DataPipeline,
    icon: Upload,
  },

  // Marketing Metrics Group
  { type: "separator", title: "navigation.groups.marketingMetrics" },
  { key: "navigation.facebookAd", href: Route.Private.FacebookAd, icon: Facebook },
  { key: "navigation.serp", href: Route.Private.Serp, icon: Target },

  // System Configuration Group
  // { type: "separator", title: "navigation.groups.system" },
  // { key: "navigation.settings", href: Route.Private.Setting, icon: Settings },
]

interface SidebarProps {
  className?: string
  isOpen:     boolean
  setIsOpen:  (open: boolean) => void
}

export function Sidebar({ className, isOpen, setIsOpen }: SidebarProps) {
  const [ isCollapsed, setIsCollapsed ] = useState(false) // Desktop collapse state
  const [ expandedItems, setExpandedItems ] = useState<Set<string>>(new Set()) // Expanded navigation items
  const [ loadingItem, setLoadingItem ] = useState<string | null>(null) // Loading state for navigation items
  const [ version, setVersion ] = useState<string>("") // App version state
  const pathname = usePathname()
  const t = useTranslation()
  const navRef = useRef<HTMLElement>(null)
  const activeItemRef = useRef<HTMLDivElement>(null)
  const activeLinkRef = useRef<HTMLAnchorElement>(null)
  // Convert snake_case to Title Case
  const snakeToTitleCase = (str: string) => {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  // Load collapse state from localStorage on mount
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar-collapsed")

    if (savedCollapsed !== null) {
      setIsCollapsed(JSON.parse(savedCollapsed) as boolean)
    }
  }, [ setIsCollapsed ])

  // Auto-expand navigation items when on child pages and clear loading state
  useEffect(() => {
    // Clear loading state when route changes
    setLoadingItem(null)

    navigationConfig.forEach((item) => {
      if ("children" in item && item.children) {
        const hasActiveChild = item.children.some((child) =>
          "href" in child && pathname === child.href)

        if (hasActiveChild) {
          setExpandedItems((prev) => new Set([ ...prev, item.key ]))
        }
      }
    })
  }, [ pathname ])

  // Scroll to active item when pathname changes
  useEffect(() => {
    if (!isCollapsed && navRef.current) {
      const elementToScroll = activeLinkRef.current || activeItemRef.current

      if (elementToScroll) {
        setTimeout(() => {
          elementToScroll.scrollIntoView({
            behavior: "smooth",
            block:    "center",
          })
        }, 100) // Small delay to ensure DOM is updated
      }
    }
  }, [ pathname, isCollapsed, expandedItems ])

  // Fetch app version on mount
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

  // Save collapse state to localStorage when it changes
  const toggleCollapsed = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newCollapsed))
  }
  // Toggle expanded state for navigation items with children
  const toggleExpanded = (key: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)

      if (newSet.has(key)) {
        newSet.delete(key)
      }
      else {
        newSet.add(key)
      }

      return newSet
    })
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "h-full w-64 inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out",
          // 2.5D styling with rounded borders (left side only)
          "bg-gradient-to-br from-background via-background to-background/95",
          "border border-border/50 md:rounded-l-none md:rounded-r-none border-r",
          "shadow-2xl shadow-black/10 dark:shadow-black/30",
          "backdrop-blur-xl bg-background/95",
          // Mobile behavior
          isOpen ? "translate-x-0 fixed" : "-translate-x-full fixed",
          // Desktop behavior with collapse - use sticky positioning with full height
          "md:translate-x-0 md:sticky md:top-0 md:h-screen md:flex md:shrink-0",
          "md:border-r-2 md:border-l-0 md:border-t-0 md:border-b-0",
          isCollapsed ? "md:w-16" : "md:w-64",
          className,
        )}
      >
        <div className={"flex w-full flex-col h-full relative overflow-hidden"}>
          {/* Sidebar Header with Epic Logo */}
          <div className={`flex justify-between items-center gap-2, ${isCollapsed && !isOpen ? "flex-col mt-3" : "flex-row mt-2"} px-4 py-4 border-border/30`}>
            <ChobLogo variant={isCollapsed && !isOpen ? "compact" : "full"} />

            <div
              className={cn("hidden cursor-pointer md:flex items-center justify-center w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-accent/80 hover:shadow-md hover:shadow-black/5")}
              onClick={toggleCollapsed}
            >
              <div className={"flex items-center justify-center w-full h-full"}>
                {isCollapsed ? <PanelLeftOpen className={"h-4 w-4"} /> : <PanelLeftClose className={"h-4 w-4"} />}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className={`flex flex-col flex-1 w-full px-4 space-y-1 overflow-scroll ${isCollapsed && !isOpen ? "items-center pt-4" : ""}`} ref={navRef}>
            {navigationConfig.map((item, index) => {
              // Handle main-level separators
              if ("type" in item && item.type === "separator") {
                if (index == 0 && isCollapsed) return null

                return isCollapsed && !isOpen
                  ? (
                  // Line separator for collapsed mode
                    <div className={"w-6 mx-auto my-2"} key={`main-separator-${index}`}>
                      <div className={"h-px bg-muted-foreground/20"}></div>
                    </div>
                  )
                  : (
                  // Text separator for full mode
                    <div className={"px-0 py-2 mt-3 mb-1"} key={`main-separator-${index}`}>
                      <div className={"text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide text-nowrap"}>
                        {t(item.title as LangConst)}
                      </div>
                    </div>
                  )
              }

              // Handle regular navigation items
              const navigationItem = item as NavigationItem
              const isActive = pathname === navigationItem.href
              const hasChildren = navigationItem.children && navigationItem.children.length > 0
              const isExpanded = expandedItems.has(navigationItem.key)
              const isChildActive = hasChildren && navigationItem.children?.some((child) =>
                "href" in child && pathname === child.href)

              return (
                <div key={navigationItem.key} ref={(isActive || isChildActive) ? activeItemRef : null}>
                  {/* Main navigation item */}
                  {isCollapsed && !isOpen
                    ? (
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-xl text-sm font-medium transition-all duration-200",
                                isActive || isChildActive
                                  ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent/80 hover:shadow-md hover:shadow-black/5",
                              )}
                            >
                              {navigationItem.href
                                ? (
                                  <Link
                                    className={"flex items-center justify-center w-full h-full"}
                                    href={(isActive || isChildActive) ? "#" : navigationItem.href}
                                    onClick={() => {
                                      if (isActive || isChildActive) return

                                      setLoadingItem(navigationItem.key)
                                      setIsOpen(false)
                                    }}
                                  >
                                    {loadingItem === navigationItem.key
                                      ? (
                                        <Loader2 className={"h-4 w-4 animate-spin"} />
                                      )
                                      : (
                                        <navigationItem.icon className={"h-4 w-4"} />
                                      )}
                                  </Link>
                                )
                                : (
                                  <navigationItem.icon className={"h-4 w-4"} />
                                )}
                            </div>
                          </TooltipTrigger>

                          <TooltipContent
                            className={"rounded-2xl shadow-lg shadow-black/10 backdrop-blur-sm font-medium text-sm px-3 py-2"}
                            side={"right"}
                            sideOffset={20}
                          >
                            <p className={"text-nowrap text-foreground"}>{t(navigationItem.key as LangConst)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                    : (
                      <div
                        className={cn(
                          "flex items-center rounded-xl text-sm font-medium transition-all duration-200 space-x-3",
                          isActive || isChildActive
                            ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/80 hover:shadow-md hover:shadow-black/5",
                        )}
                      >
                        {navigationItem.href
                          ? (
                            <Link
                              className={"flex items-center flex-1 px-3 py-2"}
                              href={(isActive || isChildActive) ? "#" : navigationItem.href}
                              onClick={() => {
                                if (isActive || isChildActive) return

                                setLoadingItem(navigationItem.key)
                                setIsOpen(false)
                              }}
                            >
                              {loadingItem === navigationItem.key
                                ? (
                                  <Loader2 className={"h-4 w-4 animate-spin"} />
                                )
                                : (
                                  <navigationItem.icon className={"h-4 w-4"} />
                                )}

                              <span className={"ml-3 text-nowrap"}>{t(navigationItem.key as LangConst)}</span>
                            </Link>
                          )
                          : (
                            <>
                              <navigationItem.icon className={"h-4 w-4"} />
                              <span className={"ml-3 text-nowrap"}>{t(navigationItem.key as LangConst)}</span>
                            </>
                          )}

                        {/* Expand/collapse button for items with children */}
                        {hasChildren && (
                          <Button
                            className={"h-6 w-6 p-0"}
                            size={"sm"}
                            variant={"ghost"}
                            onClick={() => toggleExpanded(navigationItem.key)}
                          >
                            {isExpanded ? <ChevronUp className={"h-3 w-3"} /> : <ChevronDown className={"h-3 w-3"} />}
                          </Button>
                        )}
                      </div>
                    )}

                  {/* Sub-navigation items */}
                  {hasChildren && isExpanded && !isCollapsed && (
                    <div className={"ml-4 mt-1 space-y-1"}>
                      {navigationItem.children?.map((child, index) => {
                        // Handle separators
                        if ("type" in child && child.type === "separator") {
                          return (
                            <div className={"px-3 py-1 mt-2 mb-1"} key={`separator-${index}`}>
                              <div className={"text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wide text-nowrap"}>
                                {t(child.title as LangConst)}
                              </div>
                            </div>
                          )
                        }

                        // Handle regular navigation items
                        const navigationChild = child as NavigationItem
                        const isChildItemActive = pathname === navigationChild.href

                        return (
                          <Link
                            className={cn(
                              "flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs transition-all duration-200",
                              isChildItemActive
                                ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary font-medium shadow-sm shadow-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-accent/70 hover:shadow-sm hover:shadow-black/5",
                            )}
                            href={(isActive || isChildActive) ? "#" : navigationItem.href!}
                            key={navigationChild.key}
                            ref={isChildItemActive ? activeLinkRef : null}
                            onClick={() => {
                              if (isActive || isChildActive) return

                              setLoadingItem(navigationChild.key)
                              setIsOpen(false)
                            }}
                          >
                            {loadingItem === navigationChild.key
                              ? (
                                <Loader2 className={"w-2 h-2 animate-spin"} />
                              )
                              : (
                                <div className={"w-2 h-2 rounded-full bg-current opacity-60"}></div>
                              )}

                            <span>{snakeToTitleCase(navigationChild.key.split(".")[1])}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer content at bottom of sidebar */}
          <div className={cn(
            "border-t border-border/30 bg-background/50 transition-all duration-200",
            isCollapsed && !isOpen ? "p-2" : "p-3",
          )}
          >
            {isCollapsed && !isOpen
              ? (
              // Collapsed view - just version badge
                <div className={"flex flex-col justify-center items-center gap-2 py-1"}>
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className={"cursor-pointer text-xs h-6 w-6 rounded-full p-0 flex items-center justify-center"} variant={"outline"}>
                          ©
                        </Badge>
                      </TooltipTrigger>

                      <TooltipContent
                        className={"border-none flex flex-col text-[10px]"}
                        side={"right"}
                        sideOffset={28}
                      >
                        <p className={"text-nowrap"}>© 2024 {t("common.copyrightText")}</p>
                        <p className={"text-nowrap"}>{t("common.marketingPlatform")} / CHOB</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className={"cursor-pointer text-xs h-6 w-6 rounded-full p-0 flex items-center justify-center"} variant={"outline"}>
                          <GitBranch className={"h-2.5 w-2.5"} />
                        </Badge>
                      </TooltipTrigger>

                      <TooltipContent
                        className={"border-none shadow-lg rounded-full! flex items-center justify-center text-[10px]"}
                        side={"right"}
                        sideOffset={28}
                      >
                        {version == "" ? <Spinner /> : version}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )
              : (
              // Expanded view - full footer
                <div className={"flex flex-col space-y-2"}>
                  <div className={"flex flex-col text-[10px] text-muted-foreground/60"}>
                    <p className={"text-nowrap"}>© 2024 {t("common.copyrightText")}</p>
                    <p className={"text-nowrap"}>{t("common.marketingPlatform")} / CHOB</p>
                  </div>

                  <div className={"flex justify-center"}>
                    <Badge className={"text-[8px] text-nowrap"} variant={"outline"}>
                      <GitBranch className={"h-3 w-3 mr-1"} />
                      {version == "" ? <Spinner /> : version}
                    </Badge>
                  </div>
                </div>
              )}
          </div>
        </div>
      </aside>
    </>
  )
}
