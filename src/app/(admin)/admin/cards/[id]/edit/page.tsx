"use client"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ImagePicker } from "@/components/admin/cards/image-picker"
import { TagSelector } from "@/components/admin/cards/tag-selector"
import { GameButton } from "@/components/game/game-button"
import { GameCard, type Rarity } from "@/components/game/game-card"
import type { CardPayload } from "@/lib/api/db/api.card"
import { cardFindOneById, cardUpdateOneById } from "@/lib/api/db/api.card"
import { RARITIES, RARITY_COLORS } from "@/lib/const/const.rarity"
import { Admin } from "@/lib/const/const.url"
import { cn } from "@/lib/utils"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

export default function EditCardPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [ card, setCard ] = useState<CardPayload | null>(null)
  const [ loading, setLoading ] = useState(true)
  const [ saving, setSaving ] = useState(false)
  // Editable fields
  const [ name, setName ] = useState("")
  const [ rarity, setRarity ] = useState<Rarity>("common")
  const [ image, setImage ] = useState("")
  const [ background, setBackground ] = useState("")
  const [ tagId, setTagId ] = useState("")
  const [ customImages, setCustomImages ] = useState<string[]>([])
  const initialized = useRef(false)
  const loadCard = useCallback(async () => {
    if (initialized.current) return

    initialized.current = true

    const { response, status } = await cardFindOneById(params.id)

    if (status >= 400 || !response?.payload) {
      toast.error("Card not found")
      router.replace(Admin.Cards.List)

      return
    }

    const c = response.payload

    setCard(c)
    setName(c.name)
    setRarity(c.rarity)
    setImage(c.image)
    setBackground(c.config.background_image ?? "")
    setTagId(c.tag_id ?? "")
    setLoading(false)
  }, [ params.id, router ])

  useEffect(() => {
    void loadCard()
  }, [ loadCard ])

  async function handleSave() {
    if (!card || !name.trim()) return

    setSaving(true)

    const { status } = await cardUpdateOneById(card.id, {
      name:   name.trim(),
      rarity,
      image,
      tag_id: tagId || undefined,
      config: {
        ...(rarity === "prismatic" && background ? { background_image: background } : {}),
      },
    })

    setSaving(false)

    if (status < 400) {
      toast.success("Card updated")
      router.push(Admin.Cards.List)
    }
    else {
      toast.error("Failed to update card")
    }
  }

  if (loading) {
    return (
      <div className={"flex min-h-screen flex-col items-center justify-center"}>
        <Loader2 className={"h-8 w-8 animate-spin text-zinc-500"} />
        <p className={"mt-4 text-sm text-zinc-400"}>Loading card...</p>
      </div>
    )
  }

  if (!card) return null

  return (
    <div className={"p-8"}>
      <AdminPageHeader
        actions={(
          <GameButton asChild variant={"ghost"}>
            <Link href={Admin.Cards.List}>
              <ArrowLeft className={"h-4 w-4"} />
              {" "}
              Back to Cards
            </Link>
          </GameButton>
        )}
        description={`Editing card #${card.mal_id}`}
        title={"Edit Card"}
      />

      <div className={"mt-8 flex gap-8"}>
        {/* Preview */}
        <div className={"w-48 shrink-0"}>
          <GameCard
            anime={card.anime?.title}
            backgroundImage={rarity === "prismatic" ? background : undefined}
            image={image}
            name={name || "Card Name"}
            rarity={rarity}
          />
        </div>

        {/* Form */}
        <div className={"min-w-0 flex-1 space-y-6"}>
          {/* Name */}
          <div>
            <label className={"mb-1 block text-[11px] uppercase tracking-wider text-zinc-500"}>Name</label>

            <input
              className={"w-full border-b border-zinc-700/60 bg-transparent pb-1.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-amber-500/50"}
              placeholder={"Card name..."}
              type={"text"}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Rarity */}
          <div>
            <label className={"mb-2 block text-[11px] uppercase tracking-wider text-zinc-500"}>Rarity</label>

            <div className={"flex flex-wrap gap-1.5"}>
              {RARITIES.map((r) => {
                const colors = RARITY_COLORS[r]
                const isSelected = rarity === r

                return (
                  <GameButton
                    className={cn(
                      "!px-3 !py-1.5 !text-xs !font-semibold",
                      isSelected
                        ? cn(colors.bg, colors.text)
                        : cn("!bg-zinc-800/60 !text-zinc-500", colors.shadow, colors.hoverShadow),
                    )}
                    key={r}
                    pressed={isSelected}
                    variant={"ghost"}
                    onClick={() => setRarity(r)}
                  >
                    {colors.label}
                  </GameButton>
                )
              })}
            </div>
          </div>

          {/* Tag */}
          <div>
            <label className={"mb-2 block text-[11px] uppercase tracking-wider text-zinc-500"}>Tag</label>

            <TagSelector
              value={tagId}
              onChange={(id) => setTagId(id)}
            />
          </div>

          {/* Image */}
          <div>
            <label className={"mb-2 block text-[11px] uppercase tracking-wider text-zinc-500"}>
              {rarity === "prismatic" ? "Character Image" : "Image"}
            </label>

            <ImagePicker
              customImages={customImages}
              defaultImage={card.image}
              pictures={[]}
              selected={image}
              onCustomImageAdd={(url) => setCustomImages((prev) => [ ...prev, url ])}
              onSelect={setImage}
            />
          </div>

          {/* Background (prismatic only) */}
          {rarity === "prismatic" && (
            <div>
              <label className={"mb-2 block text-[11px] uppercase tracking-wider text-zinc-500"}>Background Image</label>

              <ImagePicker
                customImages={customImages}
                defaultImage={card.image}
                pictures={[]}
                selected={background}
                onCustomImageAdd={(url) => setCustomImages((prev) => [ ...prev, url ])}
                onSelect={setBackground}
              />
            </div>
          )}

          {/* Actions */}
          <div className={"flex items-center gap-3 pt-4"}>
            <GameButton
              disabled={saving || !name.trim()}
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
              <Link href={Admin.Cards.List}>Cancel</Link>
            </GameButton>
          </div>
        </div>
      </div>
    </div>
  )
}
