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
import type { PackPayload } from "@/lib/api/db/api.pack"
import { packDeleteOneById, packFindAll, packUpdateOneById } from "@/lib/api/db/api.pack"
import { RARITY_COLORS } from "@/lib/const/const.rarity"
import { Admin } from "@/lib/const/const.url"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Gift, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

const PAGE_LIMIT = 20

export default function PacksListPage() {
  const [ packs, setPacks ] = useState<PackPayload[]>([])
  const [ loading, setLoading ] = useState(true)
  const [ page, setPage ] = useState(1)
  const [ total, setTotal ] = useState(0)
  const [ deleteTarget, setDeleteTarget ] = useState<PackPayload | null>(null)
  const [ deleting, setDeleting ] = useState(false)
  const [ togglingId, setTogglingId ] = useState<string | null>(null)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT))
  const initialized = useRef(false)
  const fetchPacks = useCallback(async (p: number) => {
    setLoading(true)

    const { response } = await packFindAll({ page: p, limit: PAGE_LIMIT })

    setPacks(response?.payload ?? [])
    setTotal(response?.meta?.total ?? response?.payload?.length ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (initialized.current) return

    initialized.current = true
    void fetchPacks(page)
  }, [ fetchPacks, page ])

  function handlePageChange(p: number) {
    setPage(p)
    initialized.current = false
  }

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      void fetchPacks(page)
    }
  }, [ page, fetchPacks ])

  async function handleToggleActive(pack: PackPayload) {
    setTogglingId(pack.id)

    const { status } = await packUpdateOneById(pack.id, { is_active: !pack.is_active })

    setTogglingId(null)

    if (status < 400) {
      setPacks((prev) => prev.map((p) => p.id === pack.id ? { ...p, is_active: !p.is_active } : p))
      toast.success(pack.is_active ? "Pack deactivated" : "Pack activated")
    }
    else {
      toast.error("Failed to update pack")
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return

    setDeleting(true)

    const { status } = await packDeleteOneById(deleteTarget.id)

    setDeleting(false)
    setDeleteTarget(null)

    if (status < 400) {
      toast.success(`Deleted "${deleteTarget.name}"`)
      void fetchPacks(page)
    }
    else {
      toast.error("Failed to delete pack")
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
            <Link href={Admin.Packs.Create}>
              <Plus className={"h-4 w-4"} />
              {" "}
              Create Pack
            </Link>
          </GameButton>
        )}
        description={"View and manage all card packs."}
        title={"Packs"}
      />

      {/* Pack list */}
      <div className={"mt-6 space-y-3"}>
        {loading
          ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div className={"h-20 animate-pulse rounded-xl bg-zinc-800/40"} key={i} />
            ))
          )
          : packs.length === 0
            ? (
              <div className={"flex flex-col items-center gap-4 py-20"}>
                <Gift className={"h-10 w-10 text-zinc-700"} />
                <p className={"text-sm text-zinc-500"}>No packs found.</p>

                <GameButton asChild variant={"amber"}>
                  <Link href={Admin.Packs.Create}>
                    <Plus className={"h-4 w-4"} />
                    {" "}
                    Create Pack
                  </Link>
                </GameButton>
              </div>
            )
            : packs.map((pack) => (
              <div
                className={"flex items-center gap-4 rounded-xl border border-zinc-800/40 bg-zinc-900/60 px-5 py-4 transition-colors hover:bg-zinc-800/40"}
                key={pack.id}
              >
                {/* Pack image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={pack.name}
                  className={"h-14 w-14 shrink-0 rounded-lg object-cover"}
                  src={pack.image}
                />

                {/* Pack info */}
                <div className={"min-w-0 flex-1"}>
                  <div className={"flex items-center gap-2"}>
                    <p className={"truncate text-sm font-medium text-zinc-200"}>{pack.name}</p>

                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                        pack.is_active
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-zinc-700/30 text-zinc-500",
                      )}
                    >
                      {pack.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {pack.description && (
                    <p className={"mt-0.5 truncate text-xs text-zinc-500"}>{pack.description}</p>
                  )}

                  <div className={"mt-1.5 flex items-center gap-3 text-[11px] text-zinc-600"}>
                    <span>{pack.cards_per_pull} cards/pull</span>
                    <span className={"text-zinc-700"}>|</span>
                    <span>Open: {formatDate(pack.open_at)}</span>
                    <span className={"text-zinc-700"}>|</span>
                    <span>Close: {formatDate(pack.close_at)}</span>

                    {/* Rarity rates preview */}
                    {pack.config?.rarity_rates && (
                      <>
                        <span className={"text-zinc-700"}>|</span>

                        <span className={"flex items-center gap-1"}>
                          {Object.entries(pack.config.rarity_rates).map(([ rarity, rate ]) => {
                            const colors = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS]

                            return (
                              <span className={cn("font-medium", colors?.text ?? "text-zinc-400")} key={rarity}>
                                {rate}%
                              </span>
                            )
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className={"flex shrink-0 items-center gap-2"}>
                  <GameButton
                    className={"!px-2.5 !py-1.5 !text-xs"}
                    disabled={togglingId === pack.id}
                    variant={"ghost"}
                    onClick={() => void handleToggleActive(pack)}
                  >
                    {togglingId === pack.id
                      ? <Loader2 className={"h-3.5 w-3.5 animate-spin"} />
                      : pack.is_active ? "Deactivate" : "Activate"}
                  </GameButton>

                  <GameButton asChild className={"!px-2.5 !py-1.5"} variant={"ghost"}>
                    <Link href={Admin.Packs.Edit(pack.id)}>
                      <Pencil className={"h-3.5 w-3.5"} />
                    </Link>
                  </GameButton>

                  <GameButton
                    className={"!px-2.5 !py-1.5 hover:!text-red-400"}
                    variant={"ghost"}
                    onClick={() => setDeleteTarget(pack)}
                  >
                    <Trash2 className={"h-3.5 w-3.5"} />
                  </GameButton>
                </div>
              </div>
            ))}
      </div>

      {/* Pagination */}
      {!loading && packs.length > 0 && (
        <div className={"mt-6 flex items-center justify-between"}>
          <p className={"text-xs text-zinc-500"}>
            Page {page} of {totalPages} ({total} {total === 1 ? "pack" : "packs"})
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
              Delete pack?
            </AlertDialogTitle>

            <AlertDialogDescription className={"text-zinc-400"}>
              This will permanently delete
              {" "}
              <span className={"font-medium text-zinc-200"}>{deleteTarget?.name}</span>
              . This action cannot be undone.
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
                : "Delete Pack"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
