"use client"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { GameButton } from "@/components/game/game-button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { BannerType, PackPoolPayload } from "@/lib/api/db/api.pack-pool"
import { packPoolDeleteOneById, packPoolFindAll, packPoolUpdateOneById } from "@/lib/api/db/api.pack-pool"
import { Admin } from "@/lib/const/const.url"
import { cn } from "@/lib/utils"
import { Boxes, ChevronLeft, ChevronRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

const PAGE_LIMIT = 20
const BANNER_TYPE_STYLES: Record<BannerType, string> = {
  standard: "bg-zinc-700/30 text-zinc-400",
  featured: "bg-amber-500/10 text-amber-400",
  event:    "bg-purple-500/10 text-purple-400",
  beginner: "bg-emerald-500/10 text-emerald-400",
  seasonal: "bg-sky-500/10 text-sky-400",
}
const BANNER_TYPES: Array<{ value: BannerType | "all", label: string }> = [
  { value: "all", label: "All" },
  { value: "standard", label: "Standard" },
  { value: "featured", label: "Featured" },
  { value: "event", label: "Event" },
  { value: "beginner", label: "Beginner" },
  { value: "seasonal", label: "Seasonal" },
]

export default function PoolsListPage() {
  const [ pools, setPools ] = useState<PackPoolPayload[]>([])
  const [ loading, setLoading ] = useState(true)
  const [ page, setPage ] = useState(1)
  const [ total, setTotal ] = useState(0)
  const [ totalPages, setTotalPages ] = useState(1)
  const [ deleteTarget, setDeleteTarget ] = useState<PackPoolPayload | null>(null)
  const [ deleting, setDeleting ] = useState(false)
  const [ togglingId, setTogglingId ] = useState<string | null>(null)
  const [ bannerFilter, setBannerFilter ] = useState<BannerType | "all">("all")
  const initialized = useRef(false)
  const fetchPools = useCallback(async (p: number, filter: BannerType | "all") => {
    setLoading(true)

    const { response } = await packPoolFindAll({
      page:        p,
      limit:       PAGE_LIMIT,
      banner_type: filter === "all" ? undefined : filter,
    })

    setPools(response?.payload ?? [])
    setTotal(response?.meta?.total ?? response?.payload?.length ?? 0)
    setTotalPages(response?.meta?.total_pages ?? 1)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (initialized.current) return

    initialized.current = true
    void fetchPools(page, bannerFilter)
  }, [ fetchPools, page, bannerFilter ])

  function handlePageChange(p: number) {
    setPage(p)
    initialized.current = false
  }

  function handleFilterChange(filter: BannerType | "all") {
    setBannerFilter(filter)
    setPage(1)
    initialized.current = false
  }

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      void fetchPools(page, bannerFilter)
    }
  }, [ page, bannerFilter, fetchPools ])

  async function handleToggleActive(pool: PackPoolPayload) {
    setTogglingId(pool.id)

    const { status } = await packPoolUpdateOneById(pool.id, { is_active: !pool.is_active })

    setTogglingId(null)

    if (status < 400) {
      setPools((prev) => prev.map((p) => p.id === pool.id ? { ...p, is_active: !p.is_active } : p))
      toast.success(pool.is_active ? "Pool deactivated" : "Pool activated")
    }
    else {
      toast.error("Failed to update pool")
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return

    setDeleting(true)

    const { status } = await packPoolDeleteOneById(deleteTarget.id)

    setDeleting(false)
    setDeleteTarget(null)

    if (status < 400) {
      toast.success(`Deleted "${deleteTarget.name}"`)
      void fetchPools(page, bannerFilter)
    }
    else {
      toast.error("Failed to delete pool")
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—"

    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  return (
    <div className={"p-8"}>
      <AdminPageHeader
        actions={(
          <GameButton asChild variant={"amber"}>
            <Link href={Admin.Pools.Create}>
              <Plus className={"h-4 w-4"} />
              {" "}
              Create Pool
            </Link>
          </GameButton>
        )}
        description={"View and manage pack pools (banners)."}
        title={"Pools"}
      />

      {/* Banner type filter */}
      <div className={"mt-6 flex items-center gap-1.5"}>
        {BANNER_TYPES.map((t) => (
          <button
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              bannerFilter === t.value
                ? "bg-amber-500/15 text-amber-400"
                : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300",
            )}
            key={t.value}
            type={"button"}
            onClick={() => handleFilterChange(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Pool list */}
      <div className={"mt-4 space-y-3"}>
        {loading
          ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div className={"h-20 animate-pulse rounded-xl bg-zinc-800/40"} key={i} />
            ))
          )
          : pools.length === 0
            ? (
              <div className={"flex flex-col items-center gap-4 py-20"}>
                <Boxes className={"h-10 w-10 text-zinc-700"} />
                <p className={"text-sm text-zinc-500"}>No pools found.</p>

                <GameButton asChild variant={"amber"}>
                  <Link href={Admin.Pools.Create}>
                    <Plus className={"h-4 w-4"} />
                    {" "}
                    Create Pool
                  </Link>
                </GameButton>
              </div>
            )
            : pools.map((pool) => (
              <div
                className={"flex items-center gap-4 rounded-xl border border-zinc-800/40 bg-zinc-900/60 px-5 py-4 transition-colors hover:bg-zinc-800/40"}
                key={pool.id}
              >
                {/* Pool image or icon */}
                {pool.image
                  ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={pool.name}
                      className={"h-14 w-14 shrink-0 rounded-lg object-cover"}
                      src={pool.image}
                    />
                  )
                  : (
                    <div className={"flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-800/60"}>
                      <Boxes className={"h-6 w-6 text-zinc-600"} />
                    </div>
                  )}

                {/* Pool info */}
                <div className={"min-w-0 flex-1"}>
                  <div className={"flex items-center gap-2"}>
                    <p className={"truncate text-sm font-medium text-zinc-200"}>{pool.name}</p>

                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                        BANNER_TYPE_STYLES[pool.banner_type],
                      )}
                    >
                      {pool.banner_type}
                    </span>

                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                        pool.is_active
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-zinc-700/30 text-zinc-500",
                      )}
                    >
                      {pool.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {pool.description && (
                    <p className={"mt-0.5 truncate text-xs text-zinc-500"}>{pool.description}</p>
                  )}

                  <div className={"mt-1.5 flex items-center gap-3 text-[11px] text-zinc-600"}>
                    <span>{pool.active_count} {pool.active_count === 1 ? "pack" : "packs"}</span>
                    <span className={"text-zinc-700"}>|</span>
                    <span>Open: {formatDate(pool.open_at)}</span>
                    <span className={"text-zinc-700"}>|</span>
                    <span>Close: {formatDate(pool.close_at)}</span>

                    {pool.rotation_type !== "none" && (
                      <>
                        <span className={"text-zinc-700"}>|</span>
                        <span className={"capitalize"}>{pool.rotation_type} rotation</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className={"flex shrink-0 items-center gap-2"}>
                  <GameButton
                    className={"!px-2.5 !py-1.5 !text-xs"}
                    disabled={togglingId === pool.id}
                    variant={"ghost"}
                    onClick={() => void handleToggleActive(pool)}
                  >
                    {togglingId === pool.id
                      ? <Loader2 className={"h-3.5 w-3.5 animate-spin"} />
                      : pool.is_active ? "Deactivate" : "Activate"}
                  </GameButton>

                  <GameButton asChild className={"!px-2.5 !py-1.5"} variant={"ghost"}>
                    <Link href={Admin.Pools.Edit(pool.id)}>
                      <Pencil className={"h-3.5 w-3.5"} />
                    </Link>
                  </GameButton>

                  <GameButton
                    className={"!px-2.5 !py-1.5 hover:!text-red-400"}
                    variant={"ghost"}
                    onClick={() => setDeleteTarget(pool)}
                  >
                    <Trash2 className={"h-3.5 w-3.5"} />
                  </GameButton>
                </div>
              </div>
            ))}
      </div>

      {/* Pagination */}
      {!loading && pools.length > 0 && (
        <div className={"mt-6 flex items-center justify-between"}>
          <p className={"text-xs text-zinc-500"}>
            Page {page} of {totalPages} ({total} {total === 1 ? "pool" : "pools"})
          </p>

          <div className={"flex items-center gap-2"}>
            <GameButton
              disabled={page <= 1}
              variant={"ghost"}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeft className={"h-4 w-4"} />
              {" "}
              Previous
            </GameButton>

            <GameButton
              disabled={page >= totalPages}
              variant={"ghost"}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
              {" "}
              <ChevronRight className={"h-4 w-4"} />
            </GameButton>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent className={"border-zinc-800 bg-zinc-900"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={"text-zinc-100"}>
              Delete pool?
            </AlertDialogTitle>

            <AlertDialogDescription asChild>
              <div className={"text-zinc-400"}>
                <p>
                  This will permanently delete
                  {" "}
                  <span className={"font-medium text-zinc-200"}>{deleteTarget?.name}</span>
                  . This action cannot be undone.
                </p>

                {deleteTarget && deleteTarget.active_count > 0 && (
                  <p className={"mt-2 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300"}>
                    This pool currently contains
                    {" "}

                    <span className={"font-semibold text-red-200"}>
                      {deleteTarget.active_count} {deleteTarget.active_count === 1 ? "pack" : "packs"}
                    </span>
                    . Deleting it may affect active banners.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className={"border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"}
              disabled={deleting}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className={"bg-red-600 text-white hover:bg-red-500"}
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault()
                void handleDelete()
              }}
            >
              {deleting
                ? (
                  <>
                    <Loader2 className={"h-4 w-4 animate-spin"} />
                    {" "}
                    Deleting...
                  </>
                )
                : "Delete Pool"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
