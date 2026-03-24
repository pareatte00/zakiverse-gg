"use client"

import { useCardCreation, type BuilderCardData } from "@/lib/context/card-creation-context"
import type { RarityPayload } from "@/lib/api/db/api.rarity"
import { cn } from "@/lib/utils"
import { Check, CircleAlert, Loader2 } from "lucide-react"
import { ImagePicker } from "./image-picker"

interface BuilderCardFormProps {
  data:     BuilderCardData
  rarities: RarityPayload[]
}

export function BuilderCardForm({ data, rarities }: BuilderCardFormProps) {
  const { updateBuilderCard } = useCardCreation()
  const malId = data.draft_item.mal_id

  function update(updates: Partial<BuilderCardData>) {
    updateBuilderCard(malId, updates)
  }

  return (
    <div className={cn(
      "rounded-xl border bg-zinc-800/50 p-5",
      data.status === "success"
        ? "border-green-500/30"
        : data.status === "error"
          ? "border-red-500/30"
          : "border-zinc-700/30",
    )}
    >
      {/* Header */}
      <div className={"flex items-center justify-between"}>
        <div>
          <h3 className={"font-medium text-zinc-200"}>{data.draft_item.name}</h3>
          <p className={"text-xs text-zinc-500"}>MAL ID: {malId}</p>
        </div>

        {/* Status */}
        {data.status === "creating" && (
          <span className={"flex items-center gap-1.5 text-xs text-amber-400"}>
            <Loader2 className={"h-3.5 w-3.5 animate-spin"} />
            Creating...
          </span>
        )}

        {data.status === "success" && (
          <span className={"flex items-center gap-1.5 text-xs text-green-400"}>
            <Check className={"h-3.5 w-3.5"} />
            Created
          </span>
        )}

        {data.status === "error" && (
          <span className={"flex items-center gap-1.5 text-xs text-red-400"}>
            <CircleAlert className={"h-3.5 w-3.5"} />
            {data.error_message || "Failed"}
          </span>
        )}
      </div>

      {data.status === "success"
        ? null
        : (
          <div className={"mt-4 space-y-4"}>
            {/* Image picker */}
            <div>
              <label className={"mb-2 block text-sm text-zinc-400"}>Image</label>

              <ImagePicker
                defaultImage={data.draft_item.image_url}
                pictures={data.pictures}
                selected={data.selected_image}
                onSelect={(url) => update({ selected_image: url })}
              />
            </div>

            {/* Name */}
            <div>
              <label className={"mb-1.5 block text-sm text-zinc-400"}>Card Name</label>

              <input
                className={"w-full rounded-lg border border-zinc-700/50 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"}
                type={"text"}
                value={data.display_name}
                onChange={(e) => update({ display_name: e.target.value })}
              />
            </div>

            {/* Rarity */}
            <div>
              <label className={"mb-1.5 block text-sm text-zinc-400"}>Rarity</label>

              <select
                className={"w-full rounded-lg border border-zinc-700/50 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"}
                value={data.rarity_id}
                onChange={(e) => update({ rarity_id: e.target.value })}
              >
                <option value={""}>Select rarity...</option>

                {rarities.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Anime */}
            <div>
              <label className={"mb-1.5 block text-sm text-zinc-400"}>Anime</label>

              {data.anime_options.length > 1
                ? (
                  <select
                    className={"w-full rounded-lg border border-zinc-700/50 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:border-zinc-600 focus:outline-none"}
                    value={data.selected_anime?.mal_id ?? ""}
                    onChange={(e) => {
                      const opt = data.anime_options.find((a) => a.mal_id === Number(e.target.value))

                      update({ selected_anime: opt ?? null })
                    }}
                  >
                    <option value={""}>Select anime...</option>

                    {data.anime_options.map((a) => (
                      <option key={a.mal_id} value={a.mal_id}>{a.title}</option>
                    ))}
                  </select>
                )
                : data.selected_anime
                  ? (
                    <p className={"text-sm text-zinc-300"}>{data.selected_anime.title}</p>
                  )
                  : (
                    <p className={"text-sm text-zinc-500"}>No anime detected</p>
                  )}
            </div>

            {/* Config */}
            <div>
              <label className={"mb-1.5 block text-sm text-zinc-400"}>Config (JSON)</label>

              <textarea
                className={"w-full rounded-lg border border-zinc-700/50 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"}
                defaultValue={JSON.stringify(data.config, null, 2)}
                rows={3}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value) as Record<string, unknown>

                    update({ config: parsed })
                  }
                  catch {
                  // Allow editing even if invalid JSON temporarily
                  }
                }}
              />
            </div>
          </div>
        )}
    </div>
  )
}
