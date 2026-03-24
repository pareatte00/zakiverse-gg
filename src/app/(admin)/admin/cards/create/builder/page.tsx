"use client"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { BuilderCardForm } from "@/components/admin/cards/builder-card-form"
import { GameButton } from "@/components/game/game-button"
import { animeCreateOne } from "@/lib/api/db/api.anime"
import { cardCreateOne } from "@/lib/api/db/api.card"
import type { RarityPayload } from "@/lib/api/db/api.rarity"
import { rarityFindAll } from "@/lib/api/db/api.rarity"
import { getCharacterFull, getCharacterPictures } from "@/lib/api/jikan/api.character"
import { Admin } from "@/lib/const/const.url"
import { useCardCreation, type BuilderCardData } from "@/lib/context/card-creation-context"
import { ArrowLeft, Loader2, PackagePlus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

export default function BuilderPage() {
  const router = useRouter()
  const { draft, builderData, setBuilderData, updateBuilderCard, clearDraft } = useCardCreation()
  const [ rarities, setRarities ] = useState<RarityPayload[]>([])
  const [ loadingProgress, setLoadingProgress ] = useState({ current: 0, total: 0 })
  const [ loading, setLoading ] = useState(true)
  const [ submitting, setSubmitting ] = useState(false)
  const initialized = useRef(false)

  // Redirect if draft is empty and no builder data
  useEffect(() => {
    if (draft.length === 0 && builderData.length === 0) {
      router.replace(Admin.Cards.Create)
    }
  }, [ draft.length, builderData.length, router ])

  // Load character data + rarities on mount
  const loadData = useCallback(async () => {
    if (initialized.current || draft.length === 0) return

    initialized.current = true

    setLoadingProgress({ current: 0, total: draft.length })

    // Load rarities
    const { response: rarityRes } = await rarityFindAll()

    if (rarityRes?.payload) {
      setRarities(rarityRes.payload)
    }

    // Load character data in sequence (Jikan rate limit: ~3 req/s)
    const results: BuilderCardData[] = []

    for (let i = 0; i < draft.length; i++) {
      const item = draft[i]

      setLoadingProgress({ current: i + 1, total: draft.length })

      // Fetch full character (includes anime list) + pictures in parallel
      const [ charRes, picRes ] = await Promise.all([
        getCharacterFull(item.mal_id),
        getCharacterPictures(item.mal_id),
      ])
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
        draft_item:     item,
        character,
        pictures,
        anime_options:  animeOptions,
        selected_image: item.image_url,
        display_name:   character?.name ?? item.name,
        rarity_id:      "",
        selected_anime: selectedAnime,
        config:         {},
        status:         "idle",
        error_message:  "",
      })

      // Small delay between characters to respect Jikan rate limits
      if (i < draft.length - 1) {
        await new Promise((r) => setTimeout(r, 350))
      }
    }

    setBuilderData(results)
    setLoading(false)
  }, [ draft, setBuilderData ])

  useEffect(() => {
    void loadData()
  }, [ loadData ])

  // Submit all cards
  async function handleSubmitAll() {
    setSubmitting(true)

    // Cache for anime DB IDs: mal_id → db_id
    const animeCache = new Map<number, string>()

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
        // Resolve anime_id
        let animeDbId = animeCache.get(card.selected_anime.mal_id)

        if (!animeDbId) {
          const { response: animeRes, status: animeStatus } = await animeCreateOne({
            mal_id:      card.selected_anime.mal_id,
            title:       card.selected_anime.title,
            cover_image: card.draft_item.image_url,
          })

          if (animeStatus < 400 && animeRes?.payload) {
            animeDbId = animeRes.payload.id
            animeCache.set(card.selected_anime.mal_id, animeDbId)
          }
          else {
            // Might already exist — check error
            const errMsg = animeRes?.error?.message ?? "Failed to create anime"

            updateBuilderCard(card.draft_item.mal_id, {
              status:        "error",
              error_message: errMsg,
            })

            continue
          }
        }

        // Create card
        const { response: cardRes, status: cardStatus } = await cardCreateOne({
          mal_id:    card.draft_item.mal_id,
          anime_id:  animeDbId,
          rarity_id: card.rarity_id,
          name:      card.display_name,
          image:     card.selected_image,
          config:    JSON.stringify(card.config),
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
  const hasErrors = builderData.some((d) => d.status === "error")
  const canSubmit = builderData.length > 0 && builderData.some((d) => d.status === "idle" || d.status === "error")

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
    <div className={"p-8"}>
      {/* Header */}
      <AdminPageHeader
        actions={allDone
          ? (
            <GameButton
              variant={"default"}
              onClick={() => {
                clearDraft()
                router.push(Admin.Cards.Create)
              }}
            >
              Create More
            </GameButton>
          )
          : undefined}
        description={"Configure each card before creating."}
        title={"Card Builder"}
      />

      {/* Card forms */}
      <div className={"mt-6 space-y-4"}>
        {builderData.map((data) => (
          <BuilderCardForm
            data={data}
            key={data.draft_item.mal_id}
            rarities={rarities}
          />
        ))}
      </div>

      {/* Actions */}
      <div className={"mt-8 flex items-center justify-between"}>
        <GameButton asChild variant={"default"}>
          <Link href={Admin.Cards.Draft}>
            <ArrowLeft className={"h-4 w-4"} />
            Back to Draft
          </Link>
        </GameButton>

        {canSubmit && (
          <GameButton
            disabled={submitting}
            variant={"default"}
            onClick={() => void handleSubmitAll()}
          >
            {submitting
              ? (
                <>
                  <Loader2 className={"h-4 w-4 animate-spin"} />
                  Creating...
                </>
              )
              : (
                <>
                  <PackagePlus className={"h-4 w-4"} />
                  {hasErrors ? "Retry Failed" : "Create All"}
                </>
              )}
          </GameButton>
        )}
      </div>
    </div>
  )
}
