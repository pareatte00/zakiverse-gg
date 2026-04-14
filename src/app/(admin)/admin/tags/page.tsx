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
import { cardFindAll } from "@/lib/api/db/api.card"
import type { CardTagPayload } from "@/lib/api/db/api.card-tag"
import { cardTagCreateOne, cardTagDeleteOneById, cardTagFindAll, cardTagUpdateOneById } from "@/lib/api/db/api.card-tag"
import { Admin } from "@/lib/const/const.url"
import { cn } from "@/lib/utils"
import { Check, ChevronLeft, ChevronRight, Eye, Loader2, Pencil, Plus, Search, Tag, Trash2, X } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

const PAGE_LIMIT = 20

export default function TagsListPage() {
  const [ tags, setTags ] = useState<CardTagPayload[]>([])
  const [ loading, setLoading ] = useState(true)
  const [ page, setPage ] = useState(1)
  const [ total, setTotal ] = useState(0)
  const [ totalPages, setTotalPages ] = useState(1)
  const [ creating, setCreating ] = useState(false)
  const [ newName, setNewName ] = useState("")
  const [ showCreate, setShowCreate ] = useState(false)
  const [ editingId, setEditingId ] = useState<string | null>(null)
  const [ editName, setEditName ] = useState("")
  const [ saving, setSaving ] = useState(false)
  const [ deleteTarget, setDeleteTarget ] = useState<CardTagPayload | null>(null)
  const [ deleteCardCount, setDeleteCardCount ] = useState<number | null>(null)
  const [ deleting, setDeleting ] = useState(false)
  const [ search, setSearch ] = useState("")
  const [ debouncedSearch, setDebouncedSearch ] = useState("")
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const createInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Debounce search input
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [ search ])

  const fetchTags = useCallback(async () => {
    setLoading(true)

    const { response } = await cardTagFindAll({
      page,
      limit:  PAGE_LIMIT,
      search: debouncedSearch || undefined,
    })

    setTags(response?.payload ?? [])
    setTotal(response?.meta?.total ?? 0)
    setTotalPages(response?.meta?.total_pages ?? 1)
    setLoading(false)
  }, [ page, debouncedSearch ])

  useEffect(() => {
    void fetchTags()
  }, [ fetchTags ])

  useEffect(() => {
    if (showCreate) createInputRef.current?.focus()
  }, [ showCreate ])

  useEffect(() => {
    if (editingId) editInputRef.current?.focus()
  }, [ editingId ])

  async function handleCreate() {
    const trimmed = newName.trim()

    if (!trimmed || creating) return

    setCreating(true)

    const { status } = await cardTagCreateOne({ name: trimmed })

    if (status < 400) {
      toast.success(`Created tag "${trimmed}"`)
      setNewName("")
      setShowCreate(false)
      void fetchTags()
    }
    else {
      toast.error("Failed to create tag")
    }

    setCreating(false)
  }

  async function handleUpdate() {
    const trimmed = editName.trim()

    if (!trimmed || !editingId || saving) return

    setSaving(true)

    const { status } = await cardTagUpdateOneById(editingId, { name: trimmed })

    if (status < 400) {
      toast.success(`Updated tag to "${trimmed}"`)
      setEditingId(null)
      setEditName("")
      void fetchTags()
    }
    else {
      toast.error("Failed to update tag")
    }

    setSaving(false)
  }

  async function handleDelete() {
    if (!deleteTarget || deleting) return

    setDeleting(true)

    const { status } = await cardTagDeleteOneById(deleteTarget.id)

    if (status < 400) {
      toast.success(`Deleted tag "${deleteTarget.name}"`)
      setDeleteTarget(null)
      void fetchTags()
    }
    else {
      toast.error("Failed to delete tag")
    }

    setDeleting(false)
  }

  // Fetch card count when delete dialog opens
  useEffect(() => {
    if (!deleteTarget) {
      setDeleteCardCount(null)

      return
    }

    void cardFindAll({ tag_id: deleteTarget.id, page: 1, limit: 1 }).then(({ response }) => {
      setDeleteCardCount(response?.meta?.total ?? response?.payload?.length ?? 0)
    })
  }, [ deleteTarget ])

  function startEdit(tag: CardTagPayload) {
    setEditingId(tag.id)
    setEditName(tag.name)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName("")
  }

  return (
    <div className={"p-8"}>
      <AdminPageHeader
        actions={(
          <GameButton
            variant={"amber"}
            onClick={() => {
              setShowCreate(true)
              setNewName("")
            }}
          >
            <Plus className={"h-4 w-4"} />
            {" "}
            Create Tag
          </GameButton>
        )}
        description={"View and manage card tags."}
        title={"Tags"}
      />

      {/* Search */}
      <div className={"relative mt-6 max-w-sm"}>
        <Search className={"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"} />

        <input
          className={"w-full rounded-lg border border-zinc-700/60 bg-zinc-800/40 py-2 pl-9 pr-9 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-amber-500/50"}
          placeholder={"Search tags..."}
          type={"text"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {search && (
          <button
            className={"absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"}
            type={"button"}
            onClick={() => setSearch("")}
          >
            <X className={"h-3.5 w-3.5"} />
          </button>
        )}
      </div>

      <div className={"mt-4"}>
        {/* Create inline */}
        {showCreate && (
          <div className={"mb-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-zinc-900/60 px-4 py-3"}>
            <Tag className={"h-4 w-4 text-amber-400"} />

            <input
              className={"flex-1 border-b border-zinc-700/60 bg-transparent pb-1 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-500/50"}
              placeholder={"Tag name..."}
              ref={createInputRef}
              type={"text"}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreate()
                if (e.key === "Escape") setShowCreate(false)
              }}
            />

            <GameButton
              disabled={!newName.trim() || creating}
              variant={"amber"}
              onClick={() => void handleCreate()}
            >
              {creating
                ? <Loader2 className={"h-4 w-4 animate-spin"} />
                : <Check className={"h-4 w-4"} />}

              {" "}
              Create
            </GameButton>

            <GameButton
              className={"!p-2"}
              variant={"ghost"}
              onClick={() => setShowCreate(false)}
            >
              <X className={"h-4 w-4"} />
            </GameButton>
          </div>
        )}

        {/* Tag list */}
        {loading
          ? (
            <div className={"space-y-2"}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div className={"h-14 animate-pulse rounded-xl bg-zinc-800/40"} key={i} />
              ))}
            </div>
          )
          : tags.length === 0
            ? (
              <div className={"flex flex-col items-center gap-4 py-20"}>
                <Tag className={"h-10 w-10 text-zinc-700"} />

                <p className={"text-sm text-zinc-500"}>
                  {debouncedSearch ? "No tags match your search." : "No tags found."}
                </p>

                {debouncedSearch
                  ? (
                    <GameButton
                      variant={"ghost"}
                      onClick={() => setSearch("")}
                    >
                      <X className={"h-4 w-4"} />
                      {" "}
                      Clear Search
                    </GameButton>
                  )
                  : (
                    <GameButton
                      variant={"amber"}
                      onClick={() => {
                        setShowCreate(true)
                        setNewName("")
                      }}
                    >
                      <Plus className={"h-4 w-4"} />
                      {" "}
                      Create Tag
                    </GameButton>
                  )}
              </div>
            )
            : (
              <div className={"space-y-2"}>
                {tags.map((tag) => (
                  <div
                    className={cn(
                      "flex items-center gap-4 rounded-xl border bg-zinc-900/60 px-4 py-3",
                      editingId === tag.id ? "border-amber-500/30" : "border-zinc-800/60",
                    )}
                    key={tag.id}
                  >
                    <Tag className={"h-4 w-4 shrink-0 text-zinc-500"} />

                    {editingId === tag.id
                      ? (
                        <>
                          <input
                            className={"flex-1 border-b border-zinc-700/60 bg-transparent pb-1 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-500/50"}
                            ref={editInputRef}
                            type={"text"}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void handleUpdate()
                              if (e.key === "Escape") cancelEdit()
                            }}
                          />

                          <div className={"flex items-center gap-1.5"}>
                            <GameButton
                              className={"!p-2"}
                              disabled={!editName.trim() || saving}
                              variant={"amber"}
                              onClick={() => void handleUpdate()}
                            >
                              {saving
                                ? <Loader2 className={"h-4 w-4 animate-spin"} />
                                : <Check className={"h-4 w-4"} />}
                            </GameButton>

                            <GameButton
                              className={"!p-2"}
                              variant={"ghost"}
                              onClick={cancelEdit}
                            >
                              <X className={"h-4 w-4"} />
                            </GameButton>
                          </div>
                        </>
                      )
                      : (
                        <>
                          <div className={"min-w-0 flex-1"}>
                            <span className={"text-sm font-medium text-zinc-200"}>{tag.name}</span>

                            <p className={"text-[10px] text-zinc-600"}>
                              Updated {new Date(tag.updated_at).toLocaleString()}
                            </p>
                          </div>

                          <div className={"flex items-center gap-1.5"}>
                            <GameButton
                              asChild
                              className={"!p-2"}
                              variant={"ghost"}
                            >
                              <Link href={Admin.Tags.Detail(tag.id)}>
                                <Eye className={"h-4 w-4"} />
                              </Link>
                            </GameButton>

                            <GameButton
                              className={"!p-2"}
                              variant={"ghost"}
                              onClick={() => startEdit(tag)}
                            >
                              <Pencil className={"h-4 w-4"} />
                            </GameButton>

                            <GameButton
                              className={"!p-2 hover:!text-red-400"}
                              variant={"ghost"}
                              onClick={() => setDeleteTarget(tag)}
                            >
                              <Trash2 className={"h-4 w-4"} />
                            </GameButton>
                          </div>
                        </>
                      )}
                  </div>
                ))}
              </div>
            )}
      </div>

      {/* Pagination */}
      {!loading && tags.length > 0 && (
        <div className={"mt-6 flex items-center justify-between"}>
          <p className={"text-xs text-zinc-500"}>
            Page {page} of {totalPages} ({total} {total === 1 ? "tag" : "tags"})
          </p>

          <div className={"flex items-center gap-2"}>
            <GameButton
              disabled={page <= 1}
              variant={"ghost"}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className={"h-4 w-4"} />
              {" "}
              Previous
            </GameButton>

            <GameButton
              disabled={page >= totalPages}
              variant={"ghost"}
              onClick={() => setPage(page + 1)}
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
              Delete tag?
            </AlertDialogTitle>

            <AlertDialogDescription asChild>
              <div className={"text-zinc-400"}>
                <p>
                  This will permanently delete
                  {" "}
                  <span className={"font-medium text-zinc-200"}>{deleteTarget?.name}</span>
                  . Cards using this tag will no longer have a tag.
                </p>

                {deleteCardCount !== null && deleteCardCount > 0 && (
                  <p className={"mt-2 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300"}>
                    This tag is currently used by
                    {" "}

                    <span className={"font-semibold text-red-200"}>
                      {deleteCardCount} {deleteCardCount === 1 ? "card" : "cards"}
                    </span>
                    . Are you sure you want to proceed?
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
                : "Delete Tag"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
