"use client"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { GameButton } from "@/components/game/game-button"
import { PackCard } from "@/components/game/pack-card"
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
import { packDeleteOneById, packFindAll } from "@/lib/api/db/api.pack"
import { Admin } from "@/lib/const/const.url"
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
  const [ totalPages, setTotalPages ] = useState(1)
  const initialized = useRef(false)
  const fetchPacks = useCallback(async (p: number) => {
    setLoading(true)

    const { response } = await packFindAll({ page: p, limit: PAGE_LIMIT })

    setPacks(response?.payload ?? [])
    setTotal(response?.meta?.total ?? response?.payload?.length ?? 0)
    setTotalPages(response?.meta?.total_pages ?? 1)
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

      {/* Pack grid */}
      <div className={"mt-6"}>
        {loading
          ? (
            <div className={"grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4"}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div className={"aspect-[1/1.5] animate-pulse rounded-xl bg-zinc-800/40"} key={i} />
              ))}
            </div>
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
            : (
              <div className={"grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4"}>
                {packs.map((pack) => (
                  <div className={"relative"} key={pack.id}>
                    {/* Pool status badge */}
                    {pack.pool_id
                      ? (
                        <Link
                          className={"absolute left-2 top-2 z-40 flex items-center gap-1 rounded-full bg-emerald-950 px-2.5 py-1 text-[8px] font-semibold uppercase text-emerald-400 transition-colors hover:bg-emerald-900"}
                          href={Admin.Pools.Edit(pack.pool_id)}
                        >
                          <span className={"h-1.5 w-1.5 rounded-full bg-emerald-400"} />
                          In Pool
                        </Link>
                      )
                      : (
                        <span className={"absolute left-2 top-2 z-40 flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-1 text-[8px] font-semibold uppercase text-zinc-500"}>
                          <span className={"h-1.5 w-1.5 rounded-full bg-zinc-600"} />
                          No Pool
                        </span>
                      )}

                    <PackCard
                      actions={(
                        <>
                          <GameButton
                            asChild
                            className={"!p-[5cqw] drop-shadow-lg"}
                            variant={"ghost"}
                          >
                            <Link href={Admin.Packs.Edit(pack.id)}>
                              <Pencil style={{ width: "8cqw", height: "8cqw" }} />
                            </Link>
                          </GameButton>

                          <GameButton
                            className={"!p-[5cqw] drop-shadow-lg hover:!text-red-400"}
                            variant={"ghost"}
                            onClick={() => setDeleteTarget(pack)}
                          >
                            <Trash2 style={{ width: "8cqw", height: "8cqw" }} />
                          </GameButton>
                        </>
                      )}
                      pack={pack}
                      tiltEnabled={false}
                    />
                  </div>
                ))}
              </div>
            )}
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
