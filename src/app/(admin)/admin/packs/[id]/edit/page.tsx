"use client"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ImagePicker } from "@/components/admin/cards/image-picker"
import { GameButton } from "@/components/game/game-button"
import { GameCard } from "@/components/game/game-card"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { CardFindAllQuery, CardPayload } from "@/lib/api/db/api.card"
import { cardFindAll } from "@/lib/api/db/api.card"
import type { AddPackCardsRequestItem, PackConfig } from "@/lib/api/db/api.pack"
import { packAddCards, packFindOneById, packRemoveCards, packUpdateOneById } from "@/lib/api/db/api.pack"
import { RARITIES, RARITY_COLORS } from "@/lib/const/const.rarity"
import { Admin } from "@/lib/const/const.url"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ArrowLeft, CalendarIcon, ChevronDown, Gift, Loader2, Save, Search, X } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

const DEFAULT_RARITY_RATES: Record<string, number> = {
  common:    60,
  rare:      25,
  epic:      10,
  legendary: 4,
  prismatic: 1,
}

export default function EditPackPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [ loading, setLoading ] = useState(true)
  const [ saving, setSaving ] = useState(false)
  const initialized = useRef(false)
  // Pack fields
  const [ name, setName ] = useState("")
  const [ description, setDescription ] = useState("")
  const [ image, setImage ] = useState("")
  const [ customImages, setCustomImages ] = useState<string[]>([])
  const [ cardsPerPull, setCardsPerPull ] = useState(5)
  const [ isActive, setIsActive ] = useState(false)
  const [ openAt, setOpenAt ] = useState<Date | undefined>(undefined)
  const [ closeAt, setCloseAt ] = useState<Date | undefined>(undefined)
  // Config
  const [ rarityRates, setRarityRates ] = useState<Record<string, number>>({ ...DEFAULT_RARITY_RATES })
  const [ pity, setPity ] = useState<Record<string, number>>({})
  const totalRate = Object.values(rarityRates).reduce((sum, r) => sum + r, 0)
  // Card selector — same approach as create page
  const [ selectedCards, setSelectedCards ] = useState<Map<string, { card: CardPayload, weight: number }>>(new Map())
  const [ originalCardIds, setOriginalCardIds ] = useState<Set<string>>(new Set())
  const [ cardSearch, setCardSearch ] = useState("")
  const [ debouncedCardSearch, setDebouncedCardSearch ] = useState("")
  const [ searchResults, setSearchResults ] = useState<CardPayload[]>([])
  const [ searchLoading, setSearchLoading ] = useState(false)
  const searchTimeout = useRef<NodeJS.Timeout | null>(null)
  const [ expandedRarities, setExpandedRarities ] = useState<Set<string>>(new Set(RARITIES))
  // Load pack data
  const loadPack = useCallback(async () => {
    if (initialized.current) return

    initialized.current = true

    const [ packResult, cardsResult ] = await Promise.all([
      packFindOneById(params.id),
      cardFindAll({ page: 1, limit: 50 }),
    ])

    if (packResult.status >= 400 || !packResult.response?.payload) {
      toast.error("Pack not found")
      router.replace(Admin.Packs.List)

      return
    }

    const p = packResult.response.payload

    setName(p.name)
    setDescription(p.description ?? "")
    setImage(p.image)
    setCardsPerPull(p.cards_per_pull)
    setIsActive(p.is_active)
    setOpenAt(p.open_at ? new Date(p.open_at) : undefined)
    setCloseAt(p.close_at ? new Date(p.close_at) : undefined)
    setRarityRates(p.config?.rarity_rates ?? { ...DEFAULT_RARITY_RATES })
    setPity(p.config?.pity ?? {})

    // Build selected cards from pack's existing cards
    const allCards = cardsResult.response?.payload ?? []
    const cardMap = new Map<string, CardPayload>()

    for (const card of allCards) {
      cardMap.set(card.id, card)
    }

    if (p.cards && p.cards.length > 0) {
      const selected = new Map<string, { card: CardPayload, weight: number }>()
      const origIds = new Set<string>()

      for (const pc of p.cards) {
        const card = cardMap.get(pc.card_id)

        if (card) {
          selected.set(pc.card_id, { card, weight: pc.weight })
          origIds.add(pc.card_id)
        }
      }

      setSelectedCards(selected)
      setOriginalCardIds(origIds)
    }

    setSearchResults(allCards)
    setLoading(false)
  }, [ params.id, router ])

  useEffect(() => {
    void loadPack()
  }, [ loadPack ])

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

  // Fetch search results when search changes
  useEffect(() => {
    if (!initialized.current) return

    void (async () => {
      setSearchLoading(true)

      const query: CardFindAllQuery = { page: 1, limit: 50 }

      if (debouncedCardSearch) query.search = debouncedCardSearch

      const { response } = await cardFindAll(query)

      setSearchResults(response?.payload ?? [])
      setSearchLoading(false)
    })()
  }, [ debouncedCardSearch ])

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
    if (!name.trim() || !image) {
      toast.error(!name.trim() ? "Pack name is required" : "Pack image is required")

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

    // Update pack details
    const { status } = await packUpdateOneById(params.id, {
      name:           name.trim(),
      description:    description.trim() || undefined,
      image,
      cards_per_pull: cardsPerPull,
      is_active:      isActive,
      open_at:        openAt?.toISOString(),
      close_at:       closeAt?.toISOString(),
      config,
    })

    if (status >= 400) {
      setSaving(false)
      toast.error("Failed to update pack")

      return
    }

    // Sync cards: remove cards no longer selected, add new cards
    const currentIds = new Set(selectedCards.keys())
    const toRemove = [ ...originalCardIds ].filter((id) => !currentIds.has(id))
    const toAdd: AddPackCardsRequestItem[] = []

    for (const [ cardId, entry ] of selectedCards) {
      if (!originalCardIds.has(cardId)) {
        toAdd.push({ card_id: cardId, weight: entry.weight })
      }
    }

    // Also check for weight changes on existing cards
    const toUpdateWeight: AddPackCardsRequestItem[] = []

    for (const [ cardId, entry ] of selectedCards) {
      if (originalCardIds.has(cardId)) {
        // We need to remove and re-add to update weight
        // Only if weight changed — but we don't track original weights here,
        // so always sync existing cards too
        toUpdateWeight.push({ card_id: cardId, weight: entry.weight })
      }
    }

    let cardSyncFailed = false

    if (toRemove.length > 0) {
      const { status: removeStatus } = await packRemoveCards(params.id, { card_ids: toRemove })

      if (removeStatus >= 400) cardSyncFailed = true
    }

    // Remove existing cards that need weight updates, then re-add
    if (toUpdateWeight.length > 0) {
      const updateIds = toUpdateWeight.map((c) => c.card_id)
      const { status: removeStatus } = await packRemoveCards(params.id, { card_ids: updateIds })

      if (removeStatus < 400) {
        const { status: addStatus } = await packAddCards(params.id, { cards: toUpdateWeight })

        if (addStatus >= 400) cardSyncFailed = true
      }
      else {
        cardSyncFailed = true
      }
    }

    if (toAdd.length > 0) {
      const { status: addStatus } = await packAddCards(params.id, { cards: toAdd })

      if (addStatus >= 400) cardSyncFailed = true
    }

    setSaving(false)

    if (cardSyncFailed) {
      toast.error("Pack updated but some card changes failed")
    }
    else {
      toast.success("Pack updated")
    }

    router.push(Admin.Packs.List)
  }

  if (loading) {
    return (
      <div className={"flex min-h-screen flex-col items-center justify-center"}>
        <Loader2 className={"h-8 w-8 animate-spin text-zinc-500"} />
        <p className={"mt-4 text-sm text-zinc-400"}>Loading pack...</p>
      </div>
    )
  }

  const selectedCardIds = new Set(selectedCards.keys())
  const underlineInput = "h-auto rounded-none border-x-0 border-t-0 border-b border-zinc-700/60 bg-transparent px-0 pb-1.5 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-amber-500/50 focus-visible:ring-0 focus-visible:ring-offset-0"

  return (
    <div className={"p-8"}>
      <AdminPageHeader
        actions={(
          <div className={"flex items-center gap-2"}>
            <GameButton
              disabled={saving || !name.trim() || !image || selectedCards.size === 0}
              variant={"amber"}
              onClick={() => void handleSave()}
            >
              {saving
                ? (
                  <>
                    <Loader2 className={"h-4 w-4 animate-spin"} />
                    {" "}
                    Saving...
                  </>
                )
                : (
                  <>
                    <Save className={"h-4 w-4"} />
                    {" "}
                    Save Changes
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
        description={"Edit pack configuration and cards."}
        title={"Edit Pack"}
      />

      {/* Settings panel */}
      <div className={"mt-6 rounded-xl border border-zinc-800/40 bg-zinc-900/60 p-5"}>
        {/* Active toggle — top right */}
        <div className={"flex items-center justify-end"}>
          <div className={"flex items-center gap-2"}>
            <Switch
              checked={isActive}
              className={"data-[state=checked]:bg-emerald-500"}
              onCheckedChange={setIsActive}
            />

            <Label className={"text-xs text-zinc-400"}>Active</Label>
          </div>
        </div>

        {/* Row 1 — Name + Cards/Pull */}
        <div className={"mt-3 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]"}>
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

        {/* Row 2 — Date pickers */}
        <div className={"mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4"}>
          <div>
            <Label className={"mb-1 block text-[11px] uppercase tracking-wider text-zinc-500"}>Open At</Label>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex h-9 w-full items-center gap-2 rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-3 text-left text-sm transition-colors hover:border-zinc-600",
                    openAt ? "text-zinc-200" : "text-zinc-600",
                  )}
                  type={"button"}
                >
                  <CalendarIcon className={"h-3.5 w-3.5 shrink-0 text-zinc-500"} />
                  {openAt ? format(openAt, "MMM d, yyyy") : "Not set"}
                </button>
              </PopoverTrigger>

              <PopoverContent align={"start"} className={"w-auto border-zinc-700 bg-zinc-900 p-0"}>
                <Calendar
                  className={"rounded-lg border w-60"}
                  mode={"single"}
                  selected={openAt}
                  onSelect={setOpenAt}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label className={"mb-1 block text-[11px] uppercase tracking-wider text-zinc-500"}>Close At</Label>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    "flex h-9 w-full items-center gap-2 rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-3 text-left text-sm transition-colors hover:border-zinc-600",
                    closeAt ? "text-zinc-200" : "text-zinc-600",
                  )}
                  type={"button"}
                >
                  <CalendarIcon className={"h-3.5 w-3.5 shrink-0 text-zinc-500"} />
                  {closeAt ? format(closeAt, "MMM d, yyyy") : "Not set"}
                </button>
              </PopoverTrigger>

              <PopoverContent align={"start"} className={"w-auto border-zinc-700 bg-zinc-900 p-0"}>
                <Calendar
                  className={"rounded-lg border w-60"}
                  mode={"single"}
                  selected={closeAt}
                  onSelect={setCloseAt}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Row 3 — Image */}
        <div className={"mt-5"}>
          <Label className={"mb-2 block text-[11px] uppercase tracking-wider text-zinc-500"}>Image</Label>

          <ImagePicker
            customImages={customImages}
            defaultImage={image}
            pictures={[]}
            selected={image}
            onCustomImageAdd={(url) => setCustomImages((prev) => [ ...prev, url ])}
            onSelect={setImage}
          />
        </div>

      </div>

      {/* Card selector — full width */}
      <div className={"mt-6"}>
        <div className={"mb-3 flex items-center gap-3"}>
          <h2 className={"text-sm font-semibold uppercase tracking-wider text-zinc-500"}>
            Browse Cards
          </h2>

          <div className={"relative flex-1 max-w-sm"}>
            <Search className={"absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"} />

            <Input
              className={"h-9 rounded-lg border border-zinc-700/60 bg-zinc-800/40 pl-9 pr-3 text-sm text-zinc-100 transition-colors placeholder:text-zinc-600 focus:border-amber-500/50 focus-visible:ring-0 focus-visible:ring-offset-0"}
              placeholder={"Search cards..."}
              type={"text"}
              value={cardSearch}
              onChange={(e) => setCardSearch(e.target.value)}
            />
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
              <div className={"grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3"}>
                {searchResults.map((card) => {
                  const isSelected = selectedCardIds.has(card.id)

                  return (
                    <button
                      className={"relative text-left"}
                      key={card.id}
                      type={"button"}
                      onClick={() => toggleCard(card)}
                    >
                      <GameCard
                        static
                        anime={card.anime?.title}
                        className={cn("!w-full transition-opacity", isSelected && "opacity-40")}
                        image={card.image}
                        name={card.name}
                        rarity={card.rarity}
                      />

                      {isSelected && (
                        <div className={"absolute inset-0 flex items-center justify-center"}>
                          <span className={"rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400"}>
                            Selected
                          </span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
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
                      <div className={"grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3"}>
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

                              {/* Hover remove */}
                              <button
                                className={"absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity hover:opacity-100"}
                                type={"button"}
                                onClick={() => removeCard(entry.card.id)}
                              >
                                <X className={"h-5 w-5 text-red-400"} />
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
