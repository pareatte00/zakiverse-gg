"use client"

import { GameCard } from "@/components/game/game-card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Rarity } from "@/components/game/game-card"
import { RARITIES, RARITY_COLORS } from "@/lib/const/const.rarity"
import { useCardCreation, type BuilderCardData } from "@/lib/context/card-creation-context"
import { cn } from "@/lib/utils"
import { Check, ChevronDown, ChevronUp, ChevronsUpDown, CircleAlert, Heart, Loader2 } from "lucide-react"
import { useState } from "react"
import { ImagePicker } from "./image-picker"

export function isCardReady(data: BuilderCardData): boolean {
  return !!(data.display_name && data.rarity_id && data.selected_anime && data.selected_image && (data.rarity_id !== "prismatic" || data.selected_background))
}

interface BuilderCardFormProps {
  data:              BuilderCardData
  collapsed:         boolean
  onCollapsedChange: (collapsed: boolean) => void
}

export function BuilderCardForm({ data, collapsed, onCollapsedChange }: BuilderCardFormProps) {
  const { updateBuilderCard } = useCardCreation()
  const [ animeOpen, setAnimeOpen ] = useState(false)
  const malId = data.draft_item.mal_id

  function update(updates: Partial<BuilderCardData>) {
    updateBuilderCard(malId, updates)
  }

  const gameRarity = (RARITIES.includes(data.rarity_id as Rarity) ? data.rarity_id : "common") as Rarity
  const rarityColors = data.rarity_id ? RARITY_COLORS[data.rarity_id as Rarity] : null
  const isReady = isCardReady(data)

  if (data.status === "success") {
    return (
      <div className={"flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3"}>
        <Check className={"h-4 w-4 text-green-400"} />
        <span className={"text-sm font-medium text-green-300"}>{data.display_name}</span>
        <span className={"text-xs text-green-500/60"}>Created</span>
      </div>
    )
  }

  // Collapsed view — compact summary row
  if (collapsed) {
    return (
      <div className={cn(
        "flex items-center gap-4 rounded-xl border bg-zinc-900/60 px-4 py-3",
        data.status === "error"
          ? "border-red-500/30"
          : isReady
            ? "border-green-500/30"
            : "border-zinc-800/60",
      )}
      >
        {/* Expand button */}
        <button
          className={"rounded-lg bg-zinc-800/60 p-1.5 text-zinc-500 transition-all duration-50 shadow-[0_3px_0_0_rgba(63,63,70,0.7)] hover:text-zinc-300 hover:shadow-[0_3px_0_0_rgba(63,63,70,0.7),0_6px_12px_rgba(0,0,0,0.15)] active:translate-y-[3px] active:shadow-none"}
          type={"button"}
          onClick={() => onCollapsedChange(false)}
        >
          <ChevronDown className={"h-4 w-4"} />
        </button>

        {/* Summary info */}
        <span className={"text-[11px] uppercase tracking-wider text-zinc-600"}>#{malId}</span>
        <span className={"text-sm font-medium text-zinc-200"}>{data.display_name || "Unnamed"}</span>

        {rarityColors && (
          <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase", rarityColors.bg, rarityColors.text)}>
            {rarityColors.label}
          </span>
        )}

        {data.selected_anime && (
          <span className={"text-xs text-zinc-500"}>{data.selected_anime.title}</span>
        )}

        {data.character?.favorites != null && data.character.favorites > 0 && (
          <span className={"flex items-center gap-1 text-[10px] text-zinc-600"}>
            <Heart className={"h-3 w-3"} />
            {data.character.favorites.toLocaleString()}
          </span>
        )}

        {/* Ready / Error indicator */}
        {data.status === "error"
          ? <span className={"ml-auto text-xs text-red-400"}>{data.error_message || "Error"}</span>
          : isReady
            ? <Check className={"ml-auto h-4 w-4 text-green-400"} />
            : <CircleAlert className={"ml-auto h-4 w-4 text-amber-500/60"} />}
      </div>
    )
  }

  return (
    <div className={cn(
      "relative rounded-xl border bg-zinc-900/60 p-5",
      data.status === "error"
        ? "border-red-500/30"
        : isReady
          ? "border-green-500/30"
          : "border-zinc-800/60",
    )}
    >
      {/* Top-right controls */}
      <div className={"absolute right-3 top-3 flex items-center gap-2"}>
        {/* Ready indicator */}
        {isReady && <Check className={"h-4 w-4 text-green-400"} />}

        {/* 3D Collapse button */}
        <button
          className={"rounded-lg border border-zinc-700/50 bg-zinc-800/60 p-1.5 text-zinc-500 transition-all duration-50 shadow-[0_3px_0_0_rgba(63,63,70,0.7)] hover:text-zinc-300 hover:shadow-[0_3px_0_0_rgba(63,63,70,0.7),0_6px_12px_rgba(0,0,0,0.15)] active:translate-y-[3px] active:shadow-none"}
          title={"Collapse"}
          type={"button"}
          onClick={() => onCollapsedChange(true)}
        >
          <ChevronUp className={"h-4 w-4"} />
        </button>
      </div>

      {/* Status bar */}
      {data.status === "creating" && (
        <div className={"mb-4 flex items-center gap-2 text-xs text-amber-400"}>
          <Loader2 className={"h-3.5 w-3.5 animate-spin"} />
          Creating card...
        </div>
      )}

      {data.status === "error" && (
        <div className={"mb-4 flex items-center gap-2 text-xs text-red-400"}>
          <CircleAlert className={"h-3.5 w-3.5"} />
          {data.error_message || "Failed to create"}
        </div>
      )}

      <div className={"flex gap-6"}>
        {/* Preview */}
        <div className={"shrink-0"}>
          <div className={"mb-1.5 flex items-center gap-2"}>
            <span className={"text-[11px] uppercase tracking-wider text-zinc-500"}>#{malId}</span>

            {data.character?.favorites != null && data.character.favorites > 0 && (
              <span className={"flex items-center gap-1 text-[10px] text-zinc-600"}>
                <Heart className={"h-3 w-3"} />
                {data.character.favorites.toLocaleString()}
              </span>
            )}
          </div>

          <GameCard
            anime={data.selected_anime?.title}
            image={data.selected_image}
            name={data.display_name || "Card Name"}
            rarity={gameRarity}
          />
        </div>

        {/* Fields */}
        <div className={"min-w-0 flex-1 space-y-5"}>
          {/* Name input — underline style */}
          <div>
            <label className={"mb-1 block text-[11px] uppercase tracking-wider text-zinc-500"}>Name</label>

            <input
              className={"w-full border-b border-zinc-700/60 bg-transparent pb-1.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-amber-500/50"}
              placeholder={"Character name..."}
              type={"text"}
              value={data.display_name}
              onChange={(e) => update({ display_name: e.target.value })}
            />
          </div>

          {/* Rarity pills */}
          <div>
            <label className={"mb-2 block text-[11px] uppercase tracking-wider text-zinc-500"}>Rarity</label>

            <div className={"flex flex-wrap gap-1.5"}>
              {RARITIES.map((r) => {
                const colors = RARITY_COLORS[r]
                const isSelected = data.rarity_id === r

                return (
                  <button
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-50",
                      isSelected
                        ? cn(colors.bg, colors.text, "translate-y-[3px] shadow-none")
                        : cn("bg-zinc-800/60 text-zinc-500", colors.shadow, colors.hoverShadow, "hover:text-zinc-300 active:translate-y-[3px] active:shadow-none"),
                    )}
                    key={r}
                    type={"button"}
                    onClick={() => update({ rarity_id: r })}
                  >
                    {colors.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Anime */}
          <div>
            <label className={"mb-2 block text-[11px] uppercase tracking-wider text-zinc-500"}>Anime</label>

            {data.anime_options.length > 1
              ? (
                <Popover open={animeOpen} onOpenChange={setAnimeOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors",
                        data.selected_anime
                          ? "border-zinc-700/60 bg-zinc-800/40 text-zinc-100"
                          : "border-zinc-700/40 bg-zinc-800/20 text-zinc-500",
                      )}
                      type={"button"}
                    >
                      {data.selected_anime?.title ?? "Select anime..."}
                      <ChevronsUpDown className={"ml-2 h-3.5 w-3.5 shrink-0 text-zinc-500"} />
                    </button>
                  </PopoverTrigger>

                  <PopoverContent
                    align={"start"}
                    className={"p-0"}
                    style={{ width: "var(--radix-popover-trigger-width)" }}
                  >
                    <Command>
                      <CommandInput placeholder={"Search anime..."} />

                      <CommandList>
                        <CommandEmpty>No anime found.</CommandEmpty>

                        <CommandGroup>
                          {data.anime_options.map((a) => (
                            <CommandItem
                              key={a.mal_id}
                              value={a.title}
                              onSelect={() => {
                                update({ selected_anime: a })
                                setAnimeOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-3.5 w-3.5",
                                  data.selected_anime?.mal_id === a.mal_id ? "opacity-100" : "opacity-0",
                                )}
                              />

                              {a.title}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )
              : data.selected_anime
                ? <p className={"text-sm text-zinc-300"}>{data.selected_anime.title}</p>
                : <p className={"text-sm text-zinc-600"}>No anime detected</p>}
          </div>

          {/* Character image picker */}
          <div>
            <label className={"mb-2 block text-[11px] uppercase tracking-wider text-zinc-500"}>
              {data.rarity_id === "prismatic" ? "Character Image" : "Image"}
            </label>

            <ImagePicker
              customImages={data.custom_images}
              defaultImage={data.draft_item.image_url}
              pictures={data.pictures}
              selected={data.selected_image}
              onCustomImageAdd={(url) => update({ custom_images: [ ...data.custom_images, url ] })}
              onSelect={(url) => update({ selected_image: url })}
            />
          </div>

          {/* Background image picker — prismatic only */}
          {data.rarity_id === "prismatic" && (
            <div>
              <label className={"mb-2 block text-[11px] uppercase tracking-wider text-zinc-500"}>Background Image</label>

              <ImagePicker
                customImages={data.custom_images}
                defaultImage={data.draft_item.image_url}
                pictures={data.pictures}
                selected={data.selected_background}
                onCustomImageAdd={(url) => update({ custom_images: [ ...data.custom_images, url ] })}
                onSelect={(url) => update({ selected_background: url })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
