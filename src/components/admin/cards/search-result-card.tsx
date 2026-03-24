/* eslint-disable @next/next/no-img-element */
"use client"

import { useCardCreation, type DraftItemAnime } from "@/lib/context/card-creation-context"
import { cn } from "@/lib/utils"
import { Check, Heart, Plus } from "lucide-react"

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`

  return String(n)
}

interface SearchResultCardProps {
  malId:      number
  name:       string
  imageUrl:   string
  anime:      DraftItemAnime | null
  subtitle?:  string
  favorites?: number
}

export function SearchResultCard({ malId, name, imageUrl, anime, subtitle, favorites }: SearchResultCardProps) {
  const { addToDraft, isInDraft } = useCardCreation()
  const added = isInDraft(malId)

  function handleAdd() {
    if (added) return

    addToDraft({
      mal_id:    malId,
      name,
      image_url: imageUrl,
      anime,
    })
  }

  return (
    <div className={"group relative overflow-hidden rounded-xl bg-zinc-800 transition-colors hover:bg-zinc-750"}>
      {/* Image */}
      <div className={"aspect-[3/4] w-full overflow-hidden"}>
        <img
          alt={name}
          className={"h-full w-full object-cover"}
          src={imageUrl}
        />
      </div>

      {/* Info */}
      <div className={"p-2.5"}>
        <div className={"flex items-center justify-between text-xs text-zinc-500"}>
          <span>#{malId}{subtitle && ` · ${subtitle}`}</span>

          {favorites != null && (
            <span className={"flex items-center gap-1"}>
              {formatCount(favorites)}
              <Heart className={"h-3 w-3"} />
            </span>
          )}
        </div>

        <p className={"mt-1 truncate text-sm font-medium text-zinc-200"}>{name}</p>
      </div>

      {/* Add button */}
      <button
        className={cn(
          "absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-100",
          added
            ? "translate-y-[3px] bg-green-500/90 text-white shadow-none"
            : "bg-zinc-900/80 text-zinc-300 shadow-[0_3px_0_0_rgba(0,0,0,0.4)] hover:bg-amber-500 hover:text-white hover:shadow-[0_3px_0_0_rgba(146,64,14,0.5)] active:translate-y-[3px] active:shadow-none",
        )}
        disabled={added}
        type={"button"}
        onClick={handleAdd}
      >
        {added ? <Check className={"h-4 w-4"} /> : <Plus className={"h-4 w-4"} />}
      </button>
    </div>
  )
}
