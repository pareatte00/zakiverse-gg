/* eslint-disable react-hooks/exhaustive-deps */
"use client"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ImagePicker } from "@/components/admin/cards/image-picker"
import { GameButton } from "@/components/game/game-button"
import { GameCard, type Rarity } from "@/components/game/game-card"
import { PackCard } from "@/components/game/pack-card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import type { CardFindAllQuery, CardPayload, CardSortField, CardSortOrder } from "@/lib/api/db/api.card"
import { cardFindAll } from "@/lib/api/db/api.card"
import type { CardTagPayload } from "@/lib/api/db/api.card-tag"
import { cardTagFindAll } from "@/lib/api/db/api.card-tag"
import type { AddPackCardsRequestItem, PackConfig, PackPayload } from "@/lib/api/db/api.pack"
import { packAddCards, packCreateOne } from "@/lib/api/db/api.pack"
import { RARITIES, RARITY_COLORS } from "@/lib/const/const.rarity"
import { Admin } from "@/lib/const/const.url"
import { cn } from "@/lib/utils"
import { ArrowDown01, ArrowDownAZ, ArrowLeft, ArrowUp01, ArrowUpZA, Check, ChevronDown, ChevronsUpDown, Gift, Loader2, Save, Search, Tag, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

const DEFAULT_RARITY_RATES: Record<string, number> = {
  common:    60,
  rare:      25,
  epic:      10,
  legendary: 4,
  prismatic: 1,
}

export default function CreatePackPage() {
  const router = useRouter()
  const [ saving, setSaving ] = useState(false)
  // Pack fields
  const [ name, setName ] = useState("")
  const [ code, setCode ] = useState("")
  const [ description, setDescription ] = useState("")
  const [ image, setImage ] = useState("")
  const [ nameImage, setNameImage ] = useState("")
  const [ customImages, setCustomImages ] = useState<string[]>([])
  const [ nameImageCustoms, setNameImageCustoms ] = useState<string[]>([])
  const [ cardsPerPull, setCardsPerPull ] = useState(5)
  // Config
  const [ rarityRates, setRarityRates ] = useState<Record<string, number>>({ ...DEFAULT_RARITY_RATES })
  const [ pity, setPity ] = useState<Record<string, number>>({})
  const totalRate = Object.values(rarityRates).reduce((sum, r) => sum + r, 0)
  // Card selector
  const [ selectedCards, setSelectedCards ] = useState<Map<string, { card: CardPayload, weight: number }>>(new Map())
  const [ cardSearch, setCardSearch ] = useState("")
  const [ debouncedCardSearch, setDebouncedCardSearch ] = useState("")
  const [ searchResults, setSearchResults ] = useState<CardPayload[]>([])
  const [ searchLoading, setSearchLoading ] = useState(false)
  const [ searchTotal, setSearchTotal ] = useState(0)
  const [ loadingMore, setLoadingMore ] = useState(false)
  const [ filterRarity, setFilterRarity ] = useState<Rarity | "">("")
  const [ filterTag, setFilterTag ] = useState("")
  const [ tags, setTags ] = useState<CardTagPayload[]>([])
  const [ tagOpen, setTagOpen ] = useState(false)
  const [ sortField, setSortField ] = useState<CardSortField>("name")
  const [ sortOrder, setSortOrder ] = useState<CardSortOrder>("asc")
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const initialized = useRef(false)
  const [ expandedRarities, setExpandedRarities ] = useState<Set<string>>(new Set(RARITIES))

  // Load cards and tags on mount
  useEffect(() => {
    if (initialized.current) return

    initialized.current = true

    void (async () => {
      setSearchLoading(true)

      const [ cardsResult, tagsResult ] = await Promise.all([
        cardFindAll({ page: 1, limit: 10, sort: sortField, order: sortOrder }),
        cardTagFindAll({ page: 1, limit: 100 }),
      ])
      const cards = cardsResult.response?.payload ?? []

      setSearchResults(cards)
      setSearchTotal(cardsResult.response?.meta?.total ?? cards.length)
      setTags(tagsResult.response?.payload ?? [])
      setSearchLoading(false)
    })()
  }, [])

  // Debounce card search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current)

    searchTimeout.current = setTimeout(() => {
      setDebouncedCardSearch(cardSearch)
    }, 400)

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [ cardSearch ])

  function buildCardQuery(page: number): CardFindAllQuery {
    const query: CardFindAllQuery = { page, limit: 10, sort: sortField, order: sortOrder }

    if (debouncedCardSearch) query.search = debouncedCardSearch
    if (filterRarity) query.rarity = filterRarity
    if (filterTag) query.tag_id = filterTag

    return query
  }

  function toggleSort(field: CardSortField) {
    if (sortField === field) {
      setSortOrder((prev) => prev === "asc" ? "desc" : "asc")
    }
    else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  // Fetch search results when filters change
  useEffect(() => {
    if (!initialized.current) return

    void (async () => {
      setSearchLoading(true)

      const { response } = await cardFindAll(buildCardQuery(1))

      setSearchResults(response?.payload ?? [])
      setSearchTotal(response?.meta?.total ?? response?.payload?.length ?? 0)
      setSearchLoading(false)
    })()
  }, [ debouncedCardSearch, filterRarity, filterTag, sortField, sortOrder ])

  async function handleLoadMore() {
    const nextPage = Math.floor(searchResults.length / 10) + 1

    setLoadingMore(true)

    const { response } = await cardFindAll(buildCardQuery(nextPage))

    setSearchResults((prev) => [ ...prev, ...(response?.payload ?? []) ])
    setLoadingMore(false)
  }

  function updateRate(rarity: string, value: string) {
    const num = parseFloat(value)

    if (isNaN(num) || num < 0) return

    setRarityRates((prev) => ({ ...prev, [rarity]: num }))
  }

  function updatePity(rarity: string, value: string) {
    const num = parseInt(value, 10)

    if (value === "") {
      setPity((prev) => {
        const next = { ...prev }
        delete next[rarity]

        return next
      })

      return
    }

    if (isNaN(num) || num < 0) return

    setPity((prev) => ({ ...prev, [rarity]: num }))
  }

  function toggleCard(card: CardPayload) {
    setSelectedCards((prev) => {
      const next = new Map(prev)

      if (next.has(card.id)) {
        next.delete(card.id)
      }
      else {
        next.set(card.id, { card, weight: 1 })
      }

      return next
    })
  }

  function updateWeight(cardId: string, value: string) {
    const num = parseInt(value, 10)

    if (isNaN(num) || num < 1) return

    setSelectedCards((prev) => {
      const next = new Map(prev)
      const entry = next.get(cardId)

      if (entry) next.set(cardId, { ...entry, weight: num })

      return next
    })
  }

  function removeCard(cardId: string) {
    setSelectedCards((prev) => {
      const next = new Map(prev)
      next.delete(cardId)

      return next
    })
  }

  async function handleSave() {
    if (!name.trim() || !code.trim() || !image) {
      if (!name.trim()) toast.error("Pack name is required")
      else if (!code.trim()) toast.error("Pack code is required")
      else toast.error("Pack image is required")

      return
    }

    if (selectedCards.size === 0) {
      toast.error("At least one card must be selected")

      return
    }

    if (Math.abs(totalRate - 100) >= 0.01) {
      toast.error(`Rarity rates must total 100% (currently ${totalRate.toFixed(1)}%)`)

      return
    }

    setSaving(true)

    const config: PackConfig = {
      rarity_rates: rarityRates,
    }

    if (Object.keys(pity).length > 0) config.pity = pity

    const { response, status } = await packCreateOne({
      name:           name.trim(),
      code:           code.trim(),
      description:    description.trim() || undefined,
      image,
      name_image:     nameImage.trim() || undefined,
      cards_per_pull: cardsPerPull,
      config,
    })

    if (status >= 400 || !response?.payload) {
      setSaving(false)
      toast.error("Failed to create pack")

      return
    }

    // Add selected cards to the newly created pack
    if (selectedCards.size > 0) {
      const cards: AddPackCardsRequestItem[] = Array.from(selectedCards.values()).map((entry) => ({
        card_id:     entry.card.id,
        weight:      entry.weight,
        is_featured: false,
      }))
      const { status: addStatus } = await packAddCards(response.payload.id, { cards })

      if (addStatus >= 400) {
        toast.error("Pack created but failed to add cards")
      }
    }

    setSaving(false)
    toast.success("Pack created")
    router.push(Admin.Packs.List)
  }

  const selectedCardIds = new Set(selectedCards.keys())
  const underlineInput = "h-auto rounded-none border-x-0 border-t-0 border-b border-zinc-700/60 bg-transparent px-0 pb-1.5 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-amber-500/50 focus-visible:ring-0 focus-visible:ring-offset-0"

  return (
    <div className={"p-8"}>
      <AdminPageHeader
        actions={(
          <div className={"flex items-center gap-2"}>
            <GameButton
              disabled={saving || !name.trim() || !code.trim() || !image || selectedCards.size === 0}
              variant={"amber"}
              onClick={() => void handleSave()}
            >
              {saving
                ? (
                  <>
                    <Loader2 className={"h-4 w-4 animate-spin"} />
                    {" "}
                    Creating...
                  </>
                )
                : (
                  <>
                    <Save className={"h-4 w-4"} />
                    {" "}
                    Create Pack
                  </>
                )}
            </GameButton>

            <GameButton asChild variant={"ghost"}>
              <Link href={Admin.Packs.List}>
                <ArrowLeft className={"h-4 w-4"} />
                {" "}
                Back
              </Link>
            </GameButton>
          </div>
        )}
        description={"Configure a new card pack."}
        title={"Create Pack"}
      />

      {/* Settings panel */}
      <div className={"mt-6 flex gap-8"}>
        {/* Preview */}
        <div className={"w-48 shrink-0"}>
          <PackCard
            pack={{
              id:             "00000000-0000-0000-0000-000000000000",
              code:           code || "CODE",
              name:           name || "Pack Name",
              description:    description || null,
              image:          image || "/placeholder.png",
              name_image:     nameImage || null,
              cards_per_pull: cardsPerPull,
              sort_order:     0,
              config:         { rarity_rates: rarityRates },
              pool_id:        "",
              rotation_order: null,
              total_cards:    selectedCards.size,
            } satisfies PackPayload}
            tiltEnabled={false}
          />
        </div>

        {/* Form */}
        <div className={"min-w-0 flex-1 rounded-xl border border-zinc-800/40 bg-zinc-900/60 p-5"}>
          {/* Row 1 — Name, Code + Cards/Pull */}
          <div className={"grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]"}>
            <div className={"space-y-4"}>
              <div>
                <Label className={"mb-1 block text-[11px] uppercase tracking-wider text-zinc-500"}>Name</Label>

                <Input
                  className={underlineInput}
                  placeholder={"Pack name..."}
                  type={"text"}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <Label className={"mb-1 block text-[11px] uppercase tracking-wider text-zinc-500"}>Code</Label>

                <Input
                  className={underlineInput}
                  placeholder={"Pack slug..."}
                  type={"text"}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div>
                <Label className={"mb-1 block text-[11px] uppercase tracking-wider text-zinc-500"}>Description</Label>

                <Textarea
                  className={"min-h-0 resize-none rounded-none border-x-0 border-t-0 border-b border-zinc-700/60 bg-transparent px-0 pb-1.5 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-amber-500/50 focus-visible:ring-0 focus-visible:ring-offset-0"}
                  placeholder={"Optional description..."}
                  rows={1}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label className={"mb-1 block text-[11px] uppercase tracking-wider text-zinc-500"}>Cards/Pull</Label>

              <Input
                className={cn(underlineInput, "w-20")}
                min={1}
                type={"number"}
                value={cardsPerPull}
                onChange={(e) => setCardsPerPull(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>
          </div>

          {/* Row 2 — Name Image */}
          <div className={"mt-5"}>
            <Label className={"mb-2 block text-[11px] uppercase tracking-wider text-zinc-500"}>Name Image</Label>

            <ImagePicker
              customImages={nameImageCustoms}
              defaultImage={""}
              pictures={[]}
              selected={nameImage}
              onCustomImageAdd={(url) => setNameImageCustoms((prev) => [ ...prev, url ])}
              onSelect={setNameImage}
            />

            <p className={"mt-1 text-[10px] text-zinc-600"}>
              Optional image displayed as the pack name. Leave empty to use text.
            </p>
          </div>

          {/* Row 4 — Image */}
          <div className={"mt-5"}>
            <Label className={"mb-2 block text-[11px] uppercase tracking-wider text-zinc-500"}>Image</Label>

            <ImagePicker
              customImages={customImages}
              defaultImage={""}
              pictures={[]}
              selected={image}
              onCustomImageAdd={(url) => setCustomImages((prev) => [ ...prev, url ])}
              onSelect={setImage}
            />
          </div>
        </div>
      </div>

      {/* Card selector — full width */}
      <div className={"mt-6"}>
        <h2 className={"mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500"}>
          Browse Cards
        </h2>

        <div className={"space-y-3 pb-3"}>
          <div className={"relative max-w-sm"}>
            <Search className={"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"} />

            <Input
              className={"h-9 rounded-lg border border-zinc-700/60 bg-zinc-800/40 pl-9 pr-9 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-amber-500/50 focus-visible:ring-0 focus-visible:ring-offset-0"}
              placeholder={"Search cards..."}
              type={"text"}
              value={cardSearch}
              onChange={(e) => setCardSearch(e.target.value)}
            />

            {cardSearch && (
              <button
                className={"absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"}
                type={"button"}
                onClick={() => setCardSearch("")}
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
          <div className={"flex flex-wrap items-center gap-4"}>
            {/* Rarity pills */}
            <div className={"flex items-center gap-1.5"}>
              <span className={"text-[11px] uppercase tracking-wider text-zinc-500"}>Rarity</span>

              <GameButton
                className={"!px-2.5 !py-1 !text-xs !font-semibold"}
                pressed={filterRarity === ""}
                variant={"ghost"}
                onClick={() => setFilterRarity("")}
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
                    onClick={() => setFilterRarity(r)}
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

              <GameButton
                className={"!px-2.5 !py-1 !text-xs !font-semibold"}
                pressed={sortField === "favorite"}
                variant={"ghost"}
                onClick={() => toggleSort("favorite")}
              >
                {sortField === "favorite" && sortOrder === "desc"
                  ? <ArrowUp01 className={"h-3.5 w-3.5"} />
                  : <ArrowDown01 className={"h-3.5 w-3.5"} />}
                Favorite
              </GameButton>
            </div>
          </div>
        </div>

        {searchLoading
          ? (
            <div className={"flex items-center justify-center py-12"}>
              <Loader2 className={"h-5 w-5 animate-spin text-zinc-500"} />
            </div>
          )
          : searchResults.length === 0
            ? (
              <div className={"flex flex-col items-center gap-3 py-12"}>
                <Gift className={"h-8 w-8 text-zinc-700"} />
                <p className={"text-sm text-zinc-600"}>No cards found.</p>
              </div>
            )
            : (
              <>
                <div className={"grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4"}>
                  {searchResults.map((card) => {
                    const isSelected = selectedCardIds.has(card.id)

                    return (
                      <button
                        className={"relative text-left"}
                        key={card.id}
                        type={"button"}
                        onClick={() => toggleCard(card)}
                      >
                        <div className={cn("transition-opacity", isSelected && "opacity-40")}>
                          <GameCard
                            static
                            anime={card.anime?.title}
                            className={"!w-full"}
                            image={card.image}
                            name={card.name}
                            rarity={card.rarity}
                          />
                        </div>

                        {isSelected && (
                          <div className={"absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow-lg"}>
                            <Check className={"h-3 w-3 text-white"} strokeWidth={3} />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {searchResults.length < searchTotal && (
                  <div className={"mt-3 flex items-center justify-center gap-2"}>
                    <button
                      className={"text-xs text-zinc-500 transition-colors hover:text-zinc-300"}
                      disabled={loadingMore}
                      type={"button"}
                      onClick={() => void handleLoadMore()}
                    >
                      {loadingMore
                        ? <Loader2 className={"inline h-3 w-3 animate-spin"} />
                        : `Load more (${searchResults.length} of ${searchTotal})`}
                    </button>
                  </div>
                )}
              </>
            )}
      </div>

      {/* Selected cards grouped by rarity */}
      {selectedCards.size > 0 && (
        <div className={"mt-6"}>
          <div className={"mb-3 flex items-center justify-between"}>
            <div className={"flex items-center gap-3"}>
              <h2 className={"text-sm font-semibold uppercase tracking-wider text-zinc-500"}>
                Selected ({selectedCards.size})
              </h2>

              <span
                className={cn(
                  "text-xs font-medium",
                  Math.abs(totalRate - 100) < 0.01 ? "text-emerald-400" : "text-red-400",
                )}
              >
                Total: {totalRate.toFixed(1)}%
              </span>
            </div>

            <button
              className={"text-xs text-zinc-600 transition-colors hover:text-zinc-400"}
              type={"button"}
              onClick={() => setSelectedCards(new Map())}
            >
              Clear all
            </button>
          </div>

          <div className={"space-y-2"}>
            {[ ...RARITIES ].reverse().map((rarity) => {
              const entries = Array.from(selectedCards.values()).filter((entry) => entry.card.rarity === rarity)

              if (entries.length === 0) return null

              const colors = RARITY_COLORS[rarity]
              const isExpanded = expandedRarities.has(rarity)

              return (
                <div className={"rounded-lg border border-zinc-800/40 bg-zinc-900/40"} key={rarity}>
                  <button
                    className={"flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-zinc-800/40"}
                    type={"button"}
                    onClick={() => {
                      setExpandedRarities((prev) => {
                        const next = new Set(prev)

                        if (next.has(rarity)) next.delete(rarity)
                        else next.add(rarity)

                        return next
                      })
                    }}
                  >
                    <ChevronDown className={cn("h-3 w-3 text-zinc-600 transition-transform", isExpanded && "rotate-180")} />
                    <span className={cn("text-xs font-semibold", colors.text)}>{colors.label}</span>
                    <span className={"text-[10px] text-zinc-600"}>({entries.length})</span>
                  </button>

                  {isExpanded && (
                    <div className={"border-t border-zinc-800/40 px-3 py-3"}>
                      {/* Rate & Pity config for this rarity */}
                      <div className={"mb-3 flex flex-wrap items-center gap-4"}>
                        <div className={"flex items-center gap-2"}>
                          <span className={"text-[10px] uppercase tracking-wider text-zinc-600"}>Rate</span>

                          <Input
                            className={cn(underlineInput, "w-16 text-right text-xs")}
                            min={0}
                            step={0.1}
                            type={"number"}
                            value={rarityRates[rarity] ?? 0}
                            onChange={(e) => updateRate(rarity, e.target.value)}
                          />

                          <span className={"text-xs text-zinc-600"}>%</span>
                        </div>

                        {rarity !== "common" && (
                          <div className={"flex items-center gap-2"}>
                            <span className={"text-[10px] uppercase tracking-wider text-zinc-600"}>Pity</span>

                            <Input
                              className={cn(underlineInput, "w-16 text-right text-xs")}
                              min={0}
                              placeholder={"—"}
                              type={"number"}
                              value={pity[rarity] ?? ""}
                              onChange={(e) => updatePity(rarity, e.target.value)}
                            />

                            <span className={"text-xs text-zinc-600"}>pulls</span>
                          </div>
                        )}
                      </div>

                      {/* Cards grid with weight inputs */}
                      <div className={"grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4"}>
                        {entries.map((entry) => (
                          <div key={entry.card.id}>
                            <div className={"relative"}>
                              <GameCard
                                static
                                anime={entry.card.anime?.title}
                                className={"!w-full"}
                                image={entry.card.image}
                                name={entry.card.name}
                                rarity={entry.card.rarity}
                              />

                              {/* Remove button */}
                              <button
                                className={"absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 shadow-lg transition-opacity hover:bg-red-600"}
                                type={"button"}
                                onClick={() => removeCard(entry.card.id)}
                              >
                                <X className={"h-3 w-3 text-white"} strokeWidth={3} />
                              </button>
                            </div>

                            {/* Weight input */}
                            <div className={"mt-5 flex items-center justify-center gap-1"}>
                              <span className={"text-[9px] text-zinc-600"}>W</span>

                              <Input
                                className={"h-6 w-12 rounded border-zinc-700/60 bg-zinc-800/60 px-1 text-center text-xs text-zinc-300 focus-visible:ring-0 focus-visible:ring-offset-0"}
                                min={1}
                                type={"number"}
                                value={entry.weight}
                                onChange={(e) => updateWeight(entry.card.id, e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
