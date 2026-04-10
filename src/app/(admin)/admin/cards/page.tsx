"use client"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { GameButton } from "@/components/game/game-button"
import { GameCard, type Rarity } from "@/components/game/game-card"
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { CardFindAllQuery, CardPayload, CardSortField, CardSortOrder } from "@/lib/api/db/api.card"
import { cardDeleteOneById, cardFindAll } from "@/lib/api/db/api.card"
import type { CardTagPayload } from "@/lib/api/db/api.card-tag"
import { cardTagFindAll } from "@/lib/api/db/api.card-tag"
import { RARITIES, RARITY_COLORS } from "@/lib/const/const.rarity"
import { Admin } from "@/lib/const/const.url"
import { cn } from "@/lib/utils"
import { ArrowDownAZ, ArrowUpZA, Check, ChevronLeft, ChevronRight, ChevronsUpDown, Layers, Loader2, Pencil, Plus, Search, Tag, Trash2, X } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

const PAGE_LIMIT = 20

export default function CardsListPage() {
  const [ cards, setCards ] = useState<CardPayload[]>([])
  const [ loading, setLoading ] = useState(true)
  const [ page, setPage ] = useState(1)
  const [ total, setTotal ] = useState(0)
  const [ deleteTarget, setDeleteTarget ] = useState<CardPayload | null>(null)
  const [ deleting, setDeleting ] = useState(false)
  const [ search, setSearch ] = useState("")
  const [ filterRarity, setFilterRarity ] = useState<Rarity | "">("")
  const [ filterTag, setFilterTag ] = useState("")
  const [ tags, setTags ] = useState<CardTagPayload[]>([])
  const [ tagOpen, setTagOpen ] = useState(false)
  const [ sortField, setSortField ] = useState<CardSortField>("name")
  const [ sortOrder, setSortOrder ] = useState<CardSortOrder>("asc")
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const [ debouncedSearch, setDebouncedSearch ] = useState("")
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT))

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

  // Fetch tags for filter
  useEffect(() => {
    void cardTagFindAll({ page: 1, limit: 100 }).then(({ response }) => {
      setTags(response?.payload ?? [])
    })
  }, [])

  const fetchCards = useCallback(async (query: CardFindAllQuery) => {
    setLoading(true)

    const { response } = await cardFindAll(query)

    setCards(response?.payload ?? [])
    setTotal(response?.meta?.total ?? response?.payload?.length ?? 0)
    setLoading(false)
  }, [])

  // Fetch when query params change
  useEffect(() => {
    const query: CardFindAllQuery = {
      page,
      limit: PAGE_LIMIT,
      sort:  sortField,
      order: sortOrder,
    }

    if (debouncedSearch) query.search = debouncedSearch
    if (filterRarity) query.rarity = filterRarity
    if (filterTag) query.tag_id = filterTag

    void fetchCards(query)
  }, [ page, debouncedSearch, filterRarity, filterTag, sortField, sortOrder, fetchCards ])

  function handlePageChange(p: number) {
    setPage(p)
  }

  function toggleSort(field: CardSortField) {
    if (sortField === field) {
      setSortOrder((prev) => prev === "asc" ? "desc" : "asc")
    }
    else {
      setSortField(field)
      setSortOrder("asc")
    }

    setPage(1)
  }

  // Delete
  async function handleDelete() {
    if (!deleteTarget) return

    setDeleting(true)

    const { status } = await cardDeleteOneById(deleteTarget.id)

    setDeleting(false)
    setDeleteTarget(null)

    if (status < 400) {
      toast.success(`Deleted "${deleteTarget.name}"`)

      const query: CardFindAllQuery = {
        page,
        limit: PAGE_LIMIT,
        sort:  sortField,
        order: sortOrder,
      }

      if (debouncedSearch) query.search = debouncedSearch
      if (filterRarity) query.rarity = filterRarity
      if (filterTag) query.tag_id = filterTag

      void fetchCards(query)
    }
    else {
      toast.error("Failed to delete card")
    }
  }

  return (
    <div className={"p-8"}>
      <AdminPageHeader
        actions={(
          <GameButton asChild variant={"amber"}>
            <Link href={Admin.Cards.Create}>
              <Plus className={"h-4 w-4"} />
              {" "}
              Create Cards
            </Link>
          </GameButton>
        )}
        description={"View and manage all created cards."}
        title={"Cards"}
      />

      {/* Search & Filters */}
      <div className={"mt-6 space-y-3"}>
        {/* Search input */}
        <div className={"relative max-w-sm"}>
          <Search className={"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"} />

          <input
            className={"w-full rounded-lg border border-zinc-700/60 bg-zinc-800/40 py-2 pl-9 pr-9 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-amber-500/50"}
            placeholder={"Search cards..."}
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

        {/* Tag filter */}
        {tags.length > 0 && (
          <Popover open={tagOpen} onOpenChange={setTagOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  "flex w-full max-w-sm items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                  filterTag
                    ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                    : "border-zinc-700/60 bg-zinc-800/40 text-zinc-500",
                )}
                type={"button"}
              >
                <Tag className={"h-4 w-4 shrink-0"} />
                {tags.find((t) => t.id === filterTag)?.name ?? "All Tags"}
                <ChevronsUpDown className={"ml-auto h-3.5 w-3.5 text-zinc-500"} />

                {filterTag && (
                  <button
                    className={"text-zinc-400 transition-colors hover:text-zinc-200"}
                    type={"button"}
                    onClick={(e) => {
                      e.stopPropagation()
                      setFilterTag("")
                      setPage(1)
                    }}
                  >
                    <X className={"h-3.5 w-3.5"} />
                  </button>
                )}
              </button>
            </PopoverTrigger>

            <PopoverContent align={"start"} className={"p-0"} style={{ width: "var(--radix-popover-trigger-width)" }}>
              <Command>
                <CommandInput placeholder={"Search tags..."} />

                <CommandList>
                  <CommandEmpty>No tags found.</CommandEmpty>

                  <CommandGroup>
                    <CommandItem
                      value={"__all__"}
                      onSelect={() => {
                        setFilterTag("")
                        setPage(1)
                        setTagOpen(false)
                      }}
                    >
                      <Check className={cn("mr-2 h-3.5 w-3.5", !filterTag ? "opacity-100" : "opacity-0")} />
                      All Tags
                    </CommandItem>

                    {tags.map((tag) => (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => {
                          setFilterTag(filterTag === tag.id ? "" : tag.id)
                          setPage(1)
                          setTagOpen(false)
                        }}
                      >
                        <Check className={cn("mr-2 h-3.5 w-3.5", filterTag === tag.id ? "opacity-100" : "opacity-0")} />
                        {tag.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {/* Rarity filter pills + Sort controls */}
        <div className={"flex items-center gap-4"}>
          {/* Rarity pills */}
          <div className={"flex items-center gap-1.5"}>
            <span className={"text-[11px] uppercase tracking-wider text-zinc-500"}>Rarity</span>

            <GameButton
              className={"!px-2.5 !py-1 !text-xs !font-semibold"}
              pressed={filterRarity === ""}
              variant={"ghost"}
              onClick={() => {
                setFilterRarity("")
                setPage(1)
              }}
            >
              All
            </GameButton>

            {RARITIES.map((r) => {
              const colors = RARITY_COLORS[r]
              const isActive = filterRarity === r

              return (
                <GameButton
                  className={cn(
                    "!px-2.5 !py-1 !text-xs !font-semibold",
                    isActive
                      ? cn(colors.bg, colors.text)
                      : cn("!bg-zinc-800/60 !text-zinc-500", colors.shadow, colors.hoverShadow),
                  )}
                  key={r}
                  pressed={isActive}
                  variant={"ghost"}
                  onClick={() => {
                    setFilterRarity(r)
                    setPage(1)
                  }}
                >
                  {colors.label}
                </GameButton>
              )
            })}
          </div>

          {/* Divider */}
          <div className={"h-5 w-px bg-zinc-700/50"} />

          {/* Sort controls */}
          <div className={"flex items-center gap-1.5"}>
            <span className={"text-[11px] uppercase tracking-wider text-zinc-500"}>Sort</span>

            <GameButton
              className={"!px-2.5 !py-1 !text-xs !font-semibold"}
              pressed={sortField === "name"}
              variant={"ghost"}
              onClick={() => toggleSort("name")}
            >
              {sortField === "name" && sortOrder === "desc"
                ? <ArrowUpZA className={"h-3.5 w-3.5"} />
                : <ArrowDownAZ className={"h-3.5 w-3.5"} />}
              Name
            </GameButton>

            <GameButton
              className={"!px-2.5 !py-1 !text-xs !font-semibold"}
              pressed={sortField === "rarity"}
              variant={"ghost"}
              onClick={() => toggleSort("rarity")}
            >
              {sortField === "rarity" && sortOrder === "desc"
                ? <ArrowUpZA className={"h-3.5 w-3.5"} />
                : <ArrowDownAZ className={"h-3.5 w-3.5"} />}
              Rarity
            </GameButton>
          </div>
        </div>
      </div>

      {/* Card grid */}
      <div className={"mt-6"}>
        {loading
          ? (
            <div className={"grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4"}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div className={"aspect-[2/3] animate-pulse rounded-xl bg-zinc-800/40"} key={i} />
              ))}
            </div>
          )
          : cards.length === 0
            ? (
              <div className={"flex flex-col items-center gap-4 py-20"}>
                <Layers className={"h-10 w-10 text-zinc-700"} />

                <p className={"text-sm text-zinc-500"}>
                  {debouncedSearch || filterRarity || filterTag ? "No cards match your filters." : "No cards found."}
                </p>

                {(debouncedSearch || filterRarity || filterTag)
                  ? (
                    <GameButton
                      variant={"ghost"}
                      onClick={() => {
                        setSearch("")
                        setFilterRarity("")
                        setFilterTag("")
                      }}
                    >
                      <X className={"h-4 w-4"} />
                      {" "}
                      Clear Filters
                    </GameButton>
                  )
                  : (
                    <GameButton asChild variant={"amber"}>
                      <Link href={Admin.Cards.Create}>
                        <Plus className={"h-4 w-4"} />
                        {" "}
                        Create Cards
                      </Link>
                    </GameButton>
                  )}
              </div>
            )
            : (
              <div className={"grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4"}>
                {cards.map((card) => (
                  <div key={card.id}>
                    <GameCard
                      static
                      actions={(
                        <>
                          <GameButton
                            asChild
                            className={"!p-[5cqw] drop-shadow-lg mb-1"}
                            variant={"ghost"}
                          >
                            <Link href={Admin.Cards.Edit(card.id)}>
                              <Pencil style={{ width: "8cqw", height: "8cqw" }} />
                            </Link>
                          </GameButton>

                          <GameButton
                            className={"!p-[5cqw] hover:!text-red-400 drop-shadow-lg"}
                            variant={"ghost"}
                            onClick={() => setDeleteTarget(card)}
                          >
                            <Trash2 style={{ width: "8cqw", height: "8cqw" }} />
                          </GameButton>
                        </>
                      )}
                      anime={card.anime?.title}
                      backgroundImage={card.config?.background_image}
                      className={"!w-full"}
                      image={card.image}
                      name={card.name}
                      rarity={card.rarity}
                      tag={card.tag_name ?? undefined}
                    />

                  </div>
                ))}
              </div>
            )}
      </div>

      {/* Pagination */}
      {!loading && cards.length > 0 && (
        <div className={"mt-6 flex items-center justify-between"}>
          <p className={"text-xs text-zinc-500"}>
            Page {page} of {totalPages} ({total} {total === 1 ? "card" : "cards"})
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
              Delete card?
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
                : "Delete Card"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
