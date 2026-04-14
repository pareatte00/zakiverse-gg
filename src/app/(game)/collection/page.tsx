"use client"

import { GameCard, type Rarity } from "@/components/game/game-card"
import { PackCard } from "@/components/game/pack-card"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import type { AnimePayload } from "@/lib/api/db/api.anime"
import { animeFindAll } from "@/lib/api/db/api.anime"
import type { CardFindAllQuery, CardPayload } from "@/lib/api/db/api.card"
import { cardFindAll } from "@/lib/api/db/api.card"
import type { CardTagPayload } from "@/lib/api/db/api.card-tag"
import { cardTagFindAll } from "@/lib/api/db/api.card-tag"
import type { PackPayload } from "@/lib/api/db/api.pack"
import { packFindAll } from "@/lib/api/db/api.pack"
import { RARITIES, RARITY_COLORS } from "@/lib/const/const.rarity"
import { cn } from "@/lib/utils"
import { Diamond, Film, Loader2, Package, Search, Tag, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

type Tab = "cards" | "packs"

type SearchMode = "card" | "anime" | "tag"

const PAGE_LIMIT = 24
const RARITY_GLOWS: Record<Rarity, string> = {
  common:    "0 0 12px rgba(168,162,158,0.25), 0 0 4px rgba(168,162,158,0.15)",
  rare:      "0 0 12px rgba(59,130,246,0.35), 0 0 4px rgba(59,130,246,0.2)",
  epic:      "0 0 12px rgba(168,85,247,0.35), 0 0 4px rgba(168,85,247,0.2)",
  legendary: "0 0 12px rgba(245,158,11,0.35), 0 0 4px rgba(245,158,11,0.2)",
  prismatic: "0 0 12px rgba(34,211,238,0.35), 0 0 4px rgba(34,211,238,0.2)",
}

export default function CollectionPage() {
  const [ tab, setTab ] = useState<Tab>("cards")
  // ── Cards state ──
  const [ cards, setCards ] = useState<CardPayload[]>([])
  const [ cardPage, setCardPage ] = useState(1)
  const [ hasMoreCards, setHasMoreCards ] = useState(false)
  const [ cardsLoading, setCardsLoading ] = useState(true)
  const [ cardsLoadingMore, setCardsLoadingMore ] = useState(false)
  // ── Cards filters ──
  const [ searchMode, setSearchMode ] = useState<SearchMode>("card")
  const [ search, setSearch ] = useState("")
  const [ debouncedSearch, setDebouncedSearch ] = useState("")
  const [ rarity, setRarity ] = useState<Rarity | null>("common")
  const [ tagId, setTagId ] = useState<string | null>(null)
  const [ tagName, setTagName ] = useState<string | null>(null)
  const [ tags, setTags ] = useState<CardTagPayload[]>([])
  // ── Anime filter ──
  const [ animeId, setAnimeId ] = useState<string | null>(null)
  const [ animeName, setAnimeName ] = useState<string | null>(null)
  const [ animes, setAnimes ] = useState<AnimePayload[]>([])
  // ── Autocomplete dropdown ──
  const [ dropdownOpen, setDropdownOpen ] = useState(false)
  // ── Packs state ──
  const [ packs, setPacks ] = useState<PackPayload[]>([])
  const [ packPage, setPackPage ] = useState(1)
  const [ hasMorePacks, setHasMorePacks ] = useState(false)
  const [ packsLoading, setPacksLoading ] = useState(true)
  const [ packsLoadingMore, setPacksLoadingMore ] = useState(false)
  const initializedCards = useRef(false)
  const initializedPacks = useRef(false)

  // ── Debounce search ──
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)

    return () => clearTimeout(timer)
  }, [ search ])

  // ── Fetch animes on debounced search in anime mode (server-side search) ──
  useEffect(() => {
    if (searchMode !== "anime" || !debouncedSearch) {
      if (searchMode === "anime") setAnimes([])

      return
    }

    let cancelled = false

    void (async () => {
      const { response } = await animeFindAll({ page: 1, limit: 20, search: debouncedSearch })

      if (!cancelled) setAnimes(response?.payload ?? [])
    })()

    return () => {
      cancelled = true
    }
  }, [ searchMode, debouncedSearch ])

  // ── Fetch tags on debounced search in tag mode (server-side search) ──
  useEffect(() => {
    if (searchMode !== "tag" || !debouncedSearch) {
      if (searchMode === "tag") setTags([])

      return
    }

    void (async () => {
      const { response } = await cardTagFindAll({ page: 1, limit: 20, search: debouncedSearch })

      setTags(response?.payload ?? [])
    })()
  }, [ searchMode, debouncedSearch ])

  // ── Card search — only tracks debouncedSearch when in card mode ──
  const cardSearch = searchMode === "card" ? debouncedSearch : ""
  // ── Fetch cards ──
  const fetchCards = useCallback(async (page: number, append: boolean) => {
    if (page === 1) setCardsLoading(true)
    else setCardsLoadingMore(true)

    const query: CardFindAllQuery = { page, limit: PAGE_LIMIT }

    if (cardSearch) query.search = cardSearch
    if (rarity) query.rarity = rarity
    if (tagId) query.tag_id = tagId
    if (animeId) query.anime_id = animeId

    const { response } = await cardFindAll(query)
    const payload = response?.payload ?? []
    const totalPages = response?.meta?.total_pages ?? 0

    if (append) setCards((prev) => [ ...prev, ...payload ])
    else setCards(payload)

    setCardPage(page)
    setHasMoreCards(page < totalPages)
    setCardsLoading(false)
    setCardsLoadingMore(false)
  }, [ animeId, cardSearch, rarity, tagId ])

  // ── Refetch cards when filters change ──
  useEffect(() => {
    if (!initializedCards.current) {
      initializedCards.current = true
    }

    fetchCards(1, false)
  }, [ fetchCards ])

  // ── Fetch packs (lazy on first tab switch) ──
  const fetchPacks = useCallback(async (page: number, append: boolean) => {
    if (page === 1) setPacksLoading(true)
    else setPacksLoadingMore(true)

    const { response } = await packFindAll({ page, limit: PAGE_LIMIT })
    const payload = response?.payload ?? []
    const meta = response?.meta

    if (append) setPacks((prev) => [ ...prev, ...payload ])
    else setPacks(payload)

    setPackPage(page)
    setHasMorePacks(meta ? page < meta.total_pages : false)
    setPacksLoading(false)
    setPacksLoadingMore(false)
  }, [])

  useEffect(() => {
    if (tab !== "packs" || initializedPacks.current) return

    initializedPacks.current = true
    fetchPacks(1, false)
  }, [ tab, fetchPacks ])

  // ── Search mode helpers ──
  const SEARCH_MODES: SearchMode[] = [ "card", "anime", "tag" ]

  function cycleSearchMode() {
    const idx = SEARCH_MODES.indexOf(searchMode)

    setSearchMode(SEARCH_MODES[(idx + 1) % SEARCH_MODES.length])
    setSearch("")
    setDropdownOpen(false)
  }

  function handleAnimeSelect(anime: AnimePayload) {
    setAnimeId(anime.id)
    setAnimeName(anime.title)
    setDropdownOpen(false)
    setTagId(null)
    setTagName(null)
  }

  function handleAnimeClear() {
    setAnimeId(null)
    setAnimeName(null)
    setRarity("common")
  }

  function handleTagSelect(tag: CardTagPayload) {
    setTagId(tag.id)
    setTagName(tag.name)
    setDropdownOpen(false)
    setAnimeId(null)
    setAnimeName(null)
  }

  function handleTagClear() {
    setTagId(null)
    setTagName(null)
    setRarity("common")
  }

  return (
    <div className={"flex min-h-full"}>
      {/* ── Left sidebar ── */}
      <div className={"w-14 shrink-0 bg-gradient-to-b from-stone-950 from-60% to-transparent"}>
        <div className={"sticky top-0 flex flex-col items-center gap-1.5 px-1.5 pt-3"}>
          {/* Tab toggles */}
          {([ "cards", "packs" ] as const).map((t) => {
            const isActive = tab === t
            const Icon = t === "cards" ? Diamond : Package

            return (
              <button
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                  isActive
                    ? t === "cards" ? "text-stone-200" : "text-amber-300"
                    : "text-stone-600 hover:text-stone-500",
                )}
                key={t}
                onClick={() => setTab(t)}
              >
                {isActive && (
                  <div
                    className={"absolute inset-0 rounded-xl"}
                    style={{
                      background: t === "cards"
                        ? "linear-gradient(135deg, rgba(168,162,158,0.15) 0%, rgba(120,113,108,0.08) 100%)"
                        : "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.06) 100%)",
                      boxShadow: t === "cards"
                        ? "0 0 12px rgba(168,162,158,0.08)"
                        : "0 0 12px rgba(245,158,11,0.08)",
                      border: t === "cards"
                        ? "1px solid rgba(168,162,158,0.1)"
                        : "1px solid rgba(245,158,11,0.1)",
                    }}
                  />
                )}

                <Icon className={"relative z-10 h-4 w-4"} />
              </button>
            )
          })}

          {/* Separator + Rarity filters (cards tab only) */}
          {tab === "cards" && (
            <>
              <div className={"my-1 h-px w-6 bg-stone-800"} />

              {/* Each rarity — icon always shows its rarity color */}
              {RARITIES.map((r) => {
                const colors = RARITY_COLORS[r]
                const isActive = rarity === r

                return (
                  <button
                    className={cn(
                      "relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200",
                      isActive ? colors.text : cn(colors.text, "opacity-30 hover:opacity-50"),
                    )}
                    key={r}
                    onClick={() => setRarity(r)}
                  >
                    {isActive && (
                      <div
                        className={cn("absolute inset-0 rounded-lg", colors.bg)}
                        style={{ boxShadow: RARITY_GLOWS[r] }}
                      />
                    )}

                    <Diamond className={"relative z-10 h-3.5 w-3.5"} />
                  </button>
                )
              })}
            </>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      <div className={"flex min-w-0 flex-1 flex-col gap-3 px-3 py-4"}>
        {/* ── Cards tab ── */}
        {tab === "cards" && (
          <>
            {/* Active anime chip (inline, search bar stays below) */}
            {animeId && (
              <div className={"flex items-center gap-2 rounded-lg bg-violet-500/10 px-2 py-1.5 ring-1 ring-violet-500/20"}>
                <Film className={"h-3 w-3 shrink-0 text-violet-400"} />
                <span className={"flex-1 truncate text-[10px] font-medium text-violet-300"}>{animeName}</span>

                <button
                  className={"rounded-full p-0.5 text-violet-400 hover:bg-violet-500/20 hover:text-violet-300"}
                  onClick={handleAnimeClear}
                >
                  <X className={"h-2.5 w-2.5"} />
                </button>
              </div>
            )}

            {/* Active tag chip (inline, search bar stays below) */}
            {!animeId && tagId && (
              <div className={"flex items-center gap-2 rounded-lg bg-amber-500/10 px-2 py-1.5 ring-1 ring-amber-500/20"}>
                <Tag className={"h-3 w-3 shrink-0 text-amber-400"} />
                <span className={"flex-1 truncate text-[10px] font-medium text-amber-300"}>{tagName}</span>

                <button
                  className={"rounded-full p-0.5 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"}
                  onClick={handleTagClear}
                >
                  <X className={"h-2.5 w-2.5"} />
                </button>
              </div>
            )}

            {/* Unified search with icon-only mode toggle */}
            <div className={"relative"}>
              <Command className={"overflow-visible bg-transparent"} shouldFilter={false}>
                <div className={"flex items-center rounded-lg bg-stone-950"}>
                  {/* Mode toggle — icon only */}
                  <button
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-l-md border-r border-stone-800 ms-1 my-1 px-3 py-2.5 transition-colors hover:bg-stone-900",
                      searchMode === "card" && "text-stone-500",
                      searchMode === "anime" && "text-violet-400",
                      searchMode === "tag" && "text-amber-400",
                    )}
                    onClick={cycleSearchMode}
                  >
                    {searchMode === "card" && <Search className={"h-3.5 w-3.5"} />}
                    {searchMode === "anime" && <Film className={"h-3.5 w-3.5"} />}
                    {searchMode === "tag" && <Tag className={"h-3.5 w-3.5"} />}
                  </button>

                  <input
                    className={"h-10 w-full bg-transparent px-3 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none"}
                    placeholder={
                      searchMode === "card" ? "Search cards..." : searchMode === "anime" ? "Search anime..." : "Search tags..."
                    }
                    type={"text"}
                    value={search}
                    onBlur={() => { if (searchMode !== "card") setTimeout(() => setDropdownOpen(false), 150) }}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      if (searchMode !== "card" && !dropdownOpen) setDropdownOpen(true)
                    }}
                    onFocus={() => { if (searchMode !== "card") setDropdownOpen(true) }}
                  />

                  {search && (
                    <button
                      className={"pr-3 text-stone-600 hover:text-stone-400"}
                      onClick={() => setSearch("")}
                    >
                      <X className={"h-3.5 w-3.5"} />
                    </button>
                  )}
                </div>

                {/* Anime autocomplete dropdown */}
                {searchMode === "anime" && dropdownOpen && search.length > 0 && (
                  <CommandList className={"absolute inset-x-0 top-full z-30 mt-1 max-h-64 rounded-lg border border-stone-800 bg-stone-950 shadow-xl"}>
                    <CommandEmpty className={"py-4 text-center text-xs text-stone-600"}>No anime found.</CommandEmpty>

                    <CommandGroup>
                      {animes.map((anime) => (
                        <CommandItem
                          className={"gap-2 px-3 py-2 text-xs text-stone-300 data-[selected=true]:bg-stone-800/50 data-[selected=true]:text-stone-200"}
                          key={anime.id}
                          value={anime.title}
                          onSelect={() => handleAnimeSelect(anime)}
                        >
                          {anime.cover_image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              alt={anime.title}
                              className={"h-7 w-5 rounded object-cover"}
                              src={anime.cover_image}
                            />
                          )}

                          <span className={"truncate"}>{anime.title}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                )}

                {/* Tag autocomplete dropdown */}
                {searchMode === "tag" && dropdownOpen && search.length > 0 && (
                  <CommandList className={"absolute inset-x-0 top-full z-30 mt-1 max-h-64 rounded-lg border border-stone-800 bg-stone-950 shadow-xl"}>
                    <CommandEmpty className={"py-4 text-center text-xs text-stone-600"}>No tags found.</CommandEmpty>

                    <CommandGroup>
                      {tags.map((tag) => (
                        <CommandItem
                          className={"gap-2 px-3 py-2 text-xs text-stone-300 data-[selected=true]:bg-stone-800/50 data-[selected=true]:text-stone-200"}
                          key={tag.id}
                          value={tag.name}
                          onSelect={() => handleTagSelect(tag)}
                        >
                          <Tag className={"h-3.5 w-3.5 shrink-0 text-amber-400/50"} />
                          <span className={"truncate"}>{tag.name}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                )}
              </Command>
            </div>

            {/* Cards grid */}
            {cardsLoading
              ? (
                <div className={"flex flex-col items-center justify-center py-16"}>
                  <Loader2 className={"h-5 w-5 animate-spin text-stone-600"} />
                  <p className={"mt-2 text-xs text-stone-600"}>Loading cards...</p>
                </div>
              )
              : cards.length === 0
                ? (
                  <div className={"flex flex-col items-center justify-center py-16"}>
                    <p className={"text-sm text-stone-600"}>No cards found.</p>
                  </div>
                )
                : (
                  <>
                    <div className={"grid grid-cols-3 gap-2"}>
                      {cards.map((card) => (
                        <div
                          className={cn(!card.is_owned && "pointer-events-none grayscale opacity-40")}
                          key={card.id}
                        >
                          <GameCard
                            static
                            anime={card.anime?.title}
                            backgroundImage={card.config?.background_image}
                            image={card.image}
                            name={card.name}
                            noModal={!card.is_owned}
                            rarity={card.rarity}
                            tag={card.tag_name ?? undefined}
                          />
                        </div>
                      ))}
                    </div>

                    {hasMoreCards && (
                      <button
                        className={"mx-auto flex items-center gap-2 rounded-lg bg-stone-800/60 px-5 py-2 text-xs font-semibold text-stone-400 transition-colors hover:bg-stone-800 hover:text-stone-300"}
                        disabled={cardsLoadingMore}
                        onClick={() => fetchCards(cardPage + 1, true)}
                      >
                        {cardsLoadingMore
                          ? <Loader2 className={"h-3.5 w-3.5 animate-spin"} />
                          : "Load more"}
                      </button>
                    )}
                  </>
                )}
          </>
        )}

        {/* ── Packs tab ── */}
        {tab === "packs" && (
          <>
            {packsLoading
              ? (
                <div className={"flex flex-col items-center justify-center py-16"}>
                  <Loader2 className={"h-5 w-5 animate-spin text-stone-600"} />
                  <p className={"mt-2 text-xs text-stone-600"}>Loading packs...</p>
                </div>
              )
              : packs.length === 0
                ? (
                  <div className={"flex flex-col items-center justify-center py-16"}>
                    <p className={"text-sm text-stone-600"}>No packs found.</p>
                  </div>
                )
                : (
                  <>
                    <div className={"grid grid-cols-2 gap-3"}>
                      {packs.map((pack) => (
                        <PackCard
                          key={pack.id}
                          pack={pack}
                          tiltEnabled={false}
                        />
                      ))}
                    </div>

                    {hasMorePacks && (
                      <button
                        className={"mx-auto flex items-center gap-2 rounded-lg bg-stone-800/60 px-5 py-2 text-xs font-semibold text-stone-400 transition-colors hover:bg-stone-800 hover:text-stone-300"}
                        disabled={packsLoadingMore}
                        onClick={() => fetchPacks(packPage + 1, true)}
                      >
                        {packsLoadingMore
                          ? <Loader2 className={"h-3.5 w-3.5 animate-spin"} />
                          : "Load more"}
                      </button>
                    )}
                  </>
                )}
          </>
        )}
      </div>
    </div>
  )
}
