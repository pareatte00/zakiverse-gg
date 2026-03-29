"use client"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { BuilderCardForm, isCardReady } from "@/components/admin/cards/builder-card-form"
import { GameButton } from "@/components/game/game-button"
import type { Rarity } from "@/components/game/game-card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { cardCreateOne } from "@/lib/api/db/api.card"
import { getCharacterFull, getCharacterPictures } from "@/lib/api/jikan/api.character"
import { Admin } from "@/lib/const/const.url"
import { useCardCreation, type BuilderCardData } from "@/lib/context/card-creation-context"
import { cn } from "@/lib/utils"
import { ArrowDownAZ, ChevronDown, ChevronUp, FoldVertical, Heart, Loader2, PackagePlus, UnfoldVertical } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

type SortMode = "alpha" | "favorites"

export default function BuilderPage() {
  const router = useRouter()
  const { draft, builderData, setBuilderData, updateBuilderCard, clearDraft } = useCardCreation()
  const [ loadingProgress, setLoadingProgress ] = useState({ current: 0, total: 0 })
  const [ loading, setLoading ] = useState(true)
  const [ submitting, setSubmitting ] = useState(false)
  const [ confirmOpen, setConfirmOpen ] = useState(false)
  const [ clearDraftOpen, setClearDraftOpen ] = useState(false)
  const [ collapsedMap, setCollapsedMap ] = useState<Record<number, boolean>>({})
  const [ animeCollapsedMap, setAnimeCollapsedMap ] = useState<Record<string, boolean>>({})
  const [ sortMode, setSortMode ] = useState<SortMode>("favorites")
  const initialized = useRef(false)

  // Redirect if draft is empty and no builder data
  useEffect(() => {
    if (draft.length === 0 && builderData.length === 0) {
      router.replace(Admin.Cards.Create)
    }
  }, [ draft.length, builderData.length, router ])

  // Load character data on mount
  const loadData = useCallback(async () => {
    if (initialized.current || draft.length === 0) return

    initialized.current = true

    setLoadingProgress({ current: 0, total: draft.length })

    // Jikan rate limit: 3 req/s, 60 req/min → 1s between requests
    const delay = () => new Promise((r) => setTimeout(r, 1000))
    const results: BuilderCardData[] = []

    for (let i = 0; i < draft.length; i++) {
      const item = draft[i]

      setLoadingProgress({ current: i + 1, total: draft.length })

      const charRes = await getCharacterFull(item.mal_id)
      await delay()
      const picRes = await getCharacterPictures(item.mal_id)
      const character = charRes.response?.data ?? null
      const pictures = picRes.response?.data ?? []
      const animeOptions = (character?.anime ?? []).map((a) => ({
        mal_id: a.anime.mal_id,
        title:  a.anime.title,
      }))
      // Auto-select anime: use draft anime if available, otherwise first from list
      const selectedAnime = item.anime
        ? { mal_id: item.anime.mal_id, title: item.anime.title }
        : animeOptions[0] ?? null

      results.push({
        draft_item:          item,
        character,
        pictures,
        anime_options:       animeOptions,
        selected_image:      item.image_url,
        selected_background: "",
        custom_images:       [],
        display_name:        character?.name ?? item.name,
        rarity_id:           "common",
        selected_anime:      selectedAnime,
        config:              {},
        status:              "idle",
        error_message:       "",
      })

      if (i < draft.length - 1) {
        await delay()
      }
    }

    setBuilderData(results)
    setLoading(false)
  }, [ draft, setBuilderData ])

  useEffect(() => {
    void loadData()
  }, [ loadData ])

  // Group by anime, sort characters within each group
  const groupedData = useMemo(() => {
    const groups = new Map<string, { title: string, cards: BuilderCardData[] }>()

    for (const card of builderData) {
      const key = card.selected_anime?.title ?? "No Anime"

      if (!groups.has(key)) {
        groups.set(key, { title: key, cards: [] })
      }

      groups.get(key)!.cards.push(card)
    }

    // Sort characters within each group
    for (const group of groups.values()) {
      group.cards.sort((a, b) => {
        if (sortMode === "favorites") {
          return (b.character?.favorites ?? 0) - (a.character?.favorites ?? 0)
        }

        return (a.display_name || a.draft_item.name).localeCompare(b.display_name || b.draft_item.name)
      })
    }

    // Sort anime groups alphabetically
    return [ ...groups.values() ].sort((a, b) => a.title.localeCompare(b.title))
  }, [ builderData, sortMode ])

  // Collapse helpers
  function setCardCollapsed(malId: number, value: boolean) {
    setCollapsedMap((prev) => ({ ...prev, [malId]: value }))
  }

  function collapseAll() {
    const cardMap: Record<number, boolean> = {}

    for (const d of builderData) {
      if (d.status !== "success") cardMap[d.draft_item.mal_id] = true
    }
    setCollapsedMap(cardMap)

    const animeMap: Record<string, boolean> = {}

    for (const g of groupedData) {
      animeMap[g.title] = true
    }
    setAnimeCollapsedMap(animeMap)
  }

  function expandAll() {
    setCollapsedMap({})
    setAnimeCollapsedMap({})
  }

  function collapseAllAnime() {
    const map: Record<string, boolean> = {}

    for (const g of groupedData) {
      map[g.title] = true
    }
    setAnimeCollapsedMap(map)
  }

  function expandAllAnime() {
    setAnimeCollapsedMap({})
  }

  const allCollapsed = builderData.filter((d) => d.status !== "success").every((d) => collapsedMap[d.draft_item.mal_id])
    && groupedData.every((g) => animeCollapsedMap[g.title])
  const allAnimeCollapsed = groupedData.length > 0 && groupedData.every((g) => animeCollapsedMap[g.title])

  // Scroll to first incomplete card
  function scrollToFirstIncomplete() {
    const first = builderData.find((d) => d.status !== "success" && !isCardReady(d))

    if (first) {
      // Expand it if collapsed
      setCollapsedMap((prev) => ({ ...prev, [first.draft_item.mal_id]: false }))

      setTimeout(() => {
        const el = document.querySelector(`[data-card-id="${first.draft_item.mal_id}"]`)

        el?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
  }

  // Submit all cards
  async function handleSubmitAll() {
    setConfirmOpen(false)
    setSubmitting(true)

    for (const card of builderData) {
      if (card.status === "success") continue

      if (!card.rarity_id || !card.selected_anime) {
        updateBuilderCard(card.draft_item.mal_id, {
          status:        "error",
          error_message: !card.rarity_id ? "Rarity required" : "Anime required",
        })

        continue
      }

      updateBuilderCard(card.draft_item.mal_id, { status: "creating" })

      try {
        const { response: cardRes, status: cardStatus } = await cardCreateOne({
          mal_id:            card.draft_item.mal_id,
          rarity:            card.rarity_id as Rarity,
          name:              card.display_name,
          image:             card.selected_image,
          anime_mal_id:      card.selected_anime.mal_id,
          anime_title:       card.selected_anime.title,
          anime_cover_image: card.draft_item.image_url,
          config:            {
            ...card.config,
            ...(card.rarity_id === "prismatic" && card.selected_background
              ? { background_image: card.selected_background }
              : {}),
          },
        })

        if (cardStatus < 400 && cardRes?.payload) {
          updateBuilderCard(card.draft_item.mal_id, { status: "success" })
        }
        else {
          updateBuilderCard(card.draft_item.mal_id, {
            status:        "error",
            error_message: cardRes?.error?.message ?? "Failed to create card",
          })
        }
      }
      catch {
        updateBuilderCard(card.draft_item.mal_id, {
          status:        "error",
          error_message: "Network error",
        })
      }
    }

    setSubmitting(false)
  }

  const allDone = builderData.length > 0 && builderData.every((d) => d.status === "success")

  // Auto-open clear draft modal when all cards are created
  useEffect(() => {
    if (allDone) setClearDraftOpen(true)
  }, [ allDone ])
  const hasErrors = builderData.some((d) => d.status === "error")
  const canSubmit = builderData.length > 0 && builderData.some((d) => d.status === "idle" || d.status === "error")
  const readyCount = builderData.filter((d) => d.status !== "success" && isCardReady(d)).length

  if (draft.length === 0 && builderData.length === 0) return null

  // Loading state
  if (loading) {
    return (
      <div className={"flex min-h-screen flex-col items-center justify-center"}>
        <Loader2 className={"h-8 w-8 animate-spin text-zinc-500"} />

        <p className={"mt-4 text-sm text-zinc-400"}>
          Loading character {loadingProgress.current} of {loadingProgress.total}...
        </p>
      </div>
    )
  }

  return (
    <div className={"p-8 pb-28"}>
      {/* Header */}
      <AdminPageHeader
        actions={allDone
          ? (
            <GameButton
              variant={"default"}
              onClick={() => setClearDraftOpen(true)}
            >
              Create More
            </GameButton>
          )
          : undefined}
        description={"Configure each card before creating."}
        title={"Card Builder"}
      />

      {/* Sort toggle */}
      <div className={"mt-6 flex items-center gap-2"}>
        <span className={"text-[11px] uppercase tracking-wider text-zinc-500"}>Sort by</span>

        <div className={"flex gap-1.5"}>
          <button
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-50",
              sortMode === "alpha"
                ? "bg-zinc-700/50 text-zinc-100 translate-y-[3px] shadow-none"
                : "bg-zinc-800/60 text-zinc-500 shadow-[0_3px_0_0_rgba(63,63,70,0.7)] hover:text-zinc-300 hover:shadow-[0_3px_0_0_rgba(63,63,70,0.7),0_6px_12px_rgba(0,0,0,0.15)] active:translate-y-[3px] active:shadow-none",
            )}
            type={"button"}
            onClick={() => setSortMode("alpha")}
          >
            <ArrowDownAZ className={"h-3.5 w-3.5"} />
            A-Z
          </button>

          <button
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-50",
              sortMode === "favorites"
                ? "bg-zinc-700/50 text-zinc-100 translate-y-[3px] shadow-none"
                : "bg-zinc-800/60 text-zinc-500 shadow-[0_3px_0_0_rgba(63,63,70,0.7)] hover:text-zinc-300 hover:shadow-[0_3px_0_0_rgba(63,63,70,0.7),0_6px_12px_rgba(0,0,0,0.15)] active:translate-y-[3px] active:shadow-none",
            )}
            type={"button"}
            onClick={() => setSortMode("favorites")}
          >
            <Heart className={"h-3.5 w-3.5"} />
            Favorites
          </button>
        </div>
      </div>

      {/* Card forms — grouped by anime */}
      <div className={"mt-4 space-y-4"}>
        {groupedData.map((group) => {
          const isAnimeCollapsed = !!animeCollapsedMap[group.title]

          return (
            <div className={"rounded-xl border border-zinc-800/40 bg-zinc-900/40"} key={group.title}>
              {/* Anime group header — clickable */}
              <button
                className={"flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-800/30"}
                type={"button"}
                onClick={() => setAnimeCollapsedMap((prev) => ({ ...prev, [group.title]: !isAnimeCollapsed }))}
              >
                {isAnimeCollapsed
                  ? <ChevronDown className={"h-4 w-4 shrink-0 text-zinc-500"} />
                  : <ChevronUp className={"h-4 w-4 shrink-0 text-zinc-500"} />}

                <h3 className={"text-sm font-semibold text-zinc-300"}>{group.title}</h3>
                <span className={"text-[10px] font-medium text-zinc-600"}>{group.cards.length} {group.cards.length === 1 ? "card" : "cards"}</span>
                <div className={"h-px flex-1 bg-zinc-800/60"} />
              </button>

              {/* Cards in group */}
              {!isAnimeCollapsed && (
                <div className={"space-y-4 px-4 pb-4"}>
                  {group.cards.map((data) => (
                    <div data-card-id={data.draft_item.mal_id} key={data.draft_item.mal_id}>
                      <BuilderCardForm
                        collapsed={!!collapsedMap[data.draft_item.mal_id]}
                        data={data}
                        onCollapsedChange={(v) => setCardCollapsed(data.draft_item.mal_id, v)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Floating island */}
      {!allDone && (
        <div className={"fixed bottom-6 left-1/2 z-30 -translate-x-1/2"}>
          <div className={"flex items-center gap-2 rounded-xl border border-zinc-700/50 bg-zinc-900/95 px-3 pt-2 pb-3.5 shadow-2xl shadow-black/40 backdrop-blur"}>
            {/* Collapse / Expand anime groups */}
            <GameButton
              variant={"ghost"}
              onClick={allAnimeCollapsed ? expandAllAnime : collapseAllAnime}
            >
              {allAnimeCollapsed
                ? (
                  <>
                    <UnfoldVertical className={"h-4 w-4"} />
                    {" "}
                    Expand Anime
                  </>
                )
                : (
                  <>
                    <FoldVertical className={"h-4 w-4"} />
                    {" "}
                    Collapse Anime
                  </>
                )}
            </GameButton>

            {/* Collapse / Expand all cards */}
            <GameButton
              variant={"ghost"}
              onClick={allCollapsed ? expandAll : collapseAll}
            >
              {allCollapsed
                ? (
                  <>
                    <ChevronDown className={"h-4 w-4"} />
                    {" "}
                    Expand All
                  </>
                )
                : (
                  <>
                    <ChevronUp className={"h-4 w-4"} />
                    {" "}
                    Collapse All
                  </>
                )}
            </GameButton>

            {/* Divider */}
            <div className={"h-6 w-px bg-zinc-700/50"} />

            {/* Create All */}
            {canSubmit && (
              <GameButton
                disabled={submitting}
                variant={"amber"}
                onClick={() => {
                  const hasIncomplete = builderData.some((d) => d.status !== "success" && !isCardReady(d))

                  if (hasIncomplete) {
                    scrollToFirstIncomplete()

                    return
                  }

                  setConfirmOpen(true)
                }}
              >
                {submitting
                  ? (
                    <>
                      <Loader2 className={"h-4 w-4 animate-spin"} />
                      {" "}
                      Creating...
                    </>
                  )
                  : (
                    <>
                      <PackagePlus className={"h-4 w-4"} />
                      {" "}
                      {hasErrors ? "Retry Failed" : `Create All (${readyCount})`}
                    </>
                  )}
              </GameButton>
            )}
          </div>
        </div>
      )}

      {/* Confirm creation modal */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className={"border-zinc-800 bg-zinc-900"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={"text-zinc-100"}>
              Create {readyCount} {readyCount === 1 ? "card" : "cards"}?
            </AlertDialogTitle>

            <AlertDialogDescription className={"text-zinc-400"}>
              This will create {readyCount} {readyCount === 1 ? "card" : "cards"} and their associated anime entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className={"border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"}>
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              className={"bg-amber-600 text-white hover:bg-amber-500"}
              onClick={() => void handleSubmitAll()}
            >
              Create {readyCount} {readyCount === 1 ? "Card" : "Cards"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear draft modal — shown after all cards created */}
      <AlertDialog open={clearDraftOpen} onOpenChange={setClearDraftOpen}>
        <AlertDialogContent className={"border-zinc-800 bg-zinc-900"}>
          <AlertDialogHeader>
            <AlertDialogTitle className={"text-zinc-100"}>
              All cards created!
            </AlertDialogTitle>

            <AlertDialogDescription className={"text-zinc-400"}>
              All {builderData.length} {builderData.length === 1 ? "card has" : "cards have"} been created successfully. Would you like to clear the draft and start fresh?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className={"border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100"}>
              Keep Draft
            </AlertDialogCancel>

            <AlertDialogAction
              className={"bg-amber-600 text-white hover:bg-amber-500"}
              onClick={() => {
                clearDraft()
                router.push(Admin.Cards.Create)
              }}
            >
              Clear Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
