/* eslint-disable @next/next/no-img-element */
"use client"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import type { QuickActionItem } from "@/components/admin/dashboard-quick-action"
import { DashboardQuickActionGroup } from "@/components/admin/dashboard-quick-action"
import { DashboardStatCard } from "@/components/admin/dashboard-stat-card"
import type { AnimePayload } from "@/lib/api/db/api.anime"
import { animeFindAll } from "@/lib/api/db/api.anime"
import { RARITIES, RARITY_COLORS } from "@/lib/const/const.rarity"
import { Admin } from "@/lib/const/const.url"
import { cn } from "@/lib/utils"
import { Film, Gift, Layers, List, Plus, Settings, Sparkles, Store, Users } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

interface DashboardData {
  recentAnime: AnimePayload[]
  animeTotal:  number
}

const CONTENT_ACTIONS: QuickActionItem[] = [
  { icon: Plus, label: "Create Cards", description: "Search characters and build new cards", href: Admin.Cards.Create },
  { icon: List, label: "Manage Cards", description: "View and manage all created cards", href: Admin.Cards.List },
  { icon: Sparkles, label: "Manage Rarities", description: "Configure rarity tiers and drop rates", href: Admin.Dashboard },
  { icon: Film, label: "Manage Anime", description: "View registered anime and their cards", href: Admin.Dashboard },
]
const GAME_ACTIONS: QuickActionItem[] = [
  { icon: Gift, label: "Manage Packs", description: "Create and configure card packs", href: Admin.Packs.List },
  { icon: Store, label: "Manage Shop", description: "Configure shop items and pricing", href: Admin.Dashboard },
]
const SYSTEM_ACTIONS: QuickActionItem[] = [
  { icon: Users, label: "Manage Players", description: "View player accounts and collections", href: Admin.Dashboard },
  { icon: Settings, label: "Settings", description: "Game settings and configuration", href: Admin.Dashboard },
]

export default function AdminDashboardPage() {
  const [ data, setData ] = useState<DashboardData | null>(null)
  const [ loading, setLoading ] = useState(true)
  const initialized = useRef(false)
  const loadDashboard = useCallback(async () => {
    if (initialized.current) return

    initialized.current = true

    const animeRes = await animeFindAll({ page: 1, limit: 5 })

    setData({
      recentAnime: animeRes.response?.payload ?? [],
      animeTotal:  animeRes.response?.meta?.total ?? animeRes.response?.payload?.length ?? 0,
    })

    setLoading(false)
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [ loadDashboard ])

  return (
    <div className={"p-8"}>
      <AdminPageHeader description={"Overview of your game data."} title={"Dashboard"} />

      {/* Stats */}
      <div className={"mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
        <DashboardStatCard
          accent={"text-purple-400"}
          icon={Sparkles}
          label={"Rarity Tiers"}
          loading={false}
          value={RARITIES.length}
        />

        <DashboardStatCard
          accent={"text-blue-400"}
          icon={Film}
          label={"Anime Registered"}
          loading={loading}
          value={data?.animeTotal ?? 0}
        />

        <DashboardStatCard
          accent={"text-amber-400"}
          icon={Layers}
          label={"Cards"}
          loading={loading}
          value={"—"}
        />
      </div>

      {/* Quick Actions + Overview */}
      <div className={"mt-10 grid grid-cols-1 gap-6 lg:grid-cols-5"}>
        {/* Quick Actions — left 3 cols */}
        <div className={"space-y-4 lg:col-span-3"}>
          <h2 className={"text-sm font-semibold uppercase tracking-wider text-zinc-500"}>Quick Actions</h2>
          <DashboardQuickActionGroup items={CONTENT_ACTIONS} title={"Content"} />
          <DashboardQuickActionGroup items={GAME_ACTIONS} title={"Game"} />
          <DashboardQuickActionGroup items={SYSTEM_ACTIONS} title={"System"} />
        </div>

        {/* Overview panels — right 2 cols */}
        <div className={"space-y-4 lg:col-span-2"}>
          <h2 className={"text-sm font-semibold uppercase tracking-wider text-zinc-500"}>Overview</h2>

          {/* Recent Anime */}
          <div className={"rounded-xl border border-zinc-800/40 bg-zinc-900 p-5"}>
            <h3 className={"text-xs font-semibold uppercase tracking-wider text-zinc-500"}>Recent Anime</h3>

            {loading
              ? (
                <div className={"mt-4 space-y-3"}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div className={"h-12 animate-pulse rounded-lg bg-zinc-800"} key={i} />
                  ))}
                </div>
              )
              : data && data.recentAnime.length > 0
                ? (
                  <div className={"mt-4 space-y-2"}>
                    {data.recentAnime.map((anime) => (
                      <div className={"flex items-center gap-3 rounded-lg bg-zinc-800/50 p-3"} key={anime.id}>
                        {anime.cover_image && (
                          <img
                            alt={anime.title}
                            className={"h-10 w-8 shrink-0 rounded object-cover"}
                            src={anime.cover_image}
                          />
                        )}

                        <div className={"min-w-0 flex-1"}>
                          <p className={"truncate text-sm font-medium text-zinc-200"}>{anime.title}</p>
                          <p className={"text-xs text-zinc-500"}>MAL #{anime.mal_id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
                : (
                  <p className={"mt-4 text-sm text-zinc-600"}>No anime registered yet.</p>
                )}
          </div>

          {/* Rarity Tiers */}
          <div className={"rounded-xl border border-zinc-800/40 bg-zinc-900 p-5"}>
            <h3 className={"text-xs font-semibold uppercase tracking-wider text-zinc-500"}>Rarity Tiers</h3>

            <div className={"mt-4 space-y-2"}>
              {RARITIES.map((r) => (
                <div
                  className={"flex items-center rounded-lg bg-zinc-800/50 px-4 py-3"}
                  key={r}
                >
                  <span className={cn("text-sm font-medium", RARITY_COLORS[r].text)}>{RARITY_COLORS[r].label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
