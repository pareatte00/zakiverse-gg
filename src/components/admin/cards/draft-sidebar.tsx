/* eslint-disable @next/next/no-img-element */
"use client"

import { GameButton } from "@/components/game/game-button"
import { Admin } from "@/lib/const/const.url"
import { useCardCreation } from "@/lib/context/card-creation-context"
import { cn } from "@/lib/utils"
import { ArrowRight, FileStack, Sparkles, Trash2, X } from "lucide-react"
import Link from "next/link"

export function DraftSidebar() {
  const { draft, draftOpen, setDraftOpen, removeFromDraft } = useCardCreation()

  return (
    <>
      {/* Backdrop */}
      {draftOpen && (
        <div
          className={"fixed inset-0 z-40 bg-black/50 transition-opacity"}
          onClick={() => setDraftOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-zinc-800/40 bg-zinc-900 shadow-2xl transition-transform duration-200",
          draftOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className={"flex items-center gap-2 border-b border-zinc-800/40 px-4 py-3"}>
          <FileStack className={"h-4 w-4 text-zinc-400"} />
          <span className={"text-sm font-medium text-zinc-200"}>Draft</span>

          {draft.length > 0 && (
            <span className={"rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400"}>
              {draft.length}
            </span>
          )}

          <button
            className={"ml-auto p-1 text-zinc-500 transition-colors hover:text-zinc-200"}
            type={"button"}
            onClick={() => setDraftOpen(false)}
          >
            <X className={"h-4 w-4"} />
          </button>
        </div>

        {/* Draft items */}
        <div className={"flex-1 overflow-y-auto p-3"}>
          {draft.length === 0
            ? (
              <p className={"mt-4 text-center text-sm text-zinc-500"}>No characters selected yet.</p>
            )
            : (
              <div className={"space-y-2"}>
                {draft.map((item) => (
                  <div
                    className={"flex items-center gap-2.5 rounded-lg bg-zinc-800/60 p-2"}
                    key={item.mal_id}
                  >
                    <img
                      alt={item.name}
                      className={"h-10 w-8 shrink-0 rounded object-cover"}
                      src={item.image_url}
                    />

                    <div className={"min-w-0 flex-1"}>
                      <p className={"truncate text-sm text-zinc-200"}>{item.name}</p>
                    </div>

                    <button
                      className={"shrink-0 p-1 text-zinc-500 transition-colors hover:text-red-400"}
                      type={"button"}
                      onClick={() => removeFromDraft(item.mal_id)}
                    >
                      <Trash2 className={"h-3.5 w-3.5"} />
                    </button>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Action */}
        {draft.length > 0 && (
          <div className={"border-t border-zinc-800/40 p-3 pb-5"}>
            <GameButton
              asChild
              className={"group/build w-full justify-between"}
              variant={"amber"}
              onClick={() => setDraftOpen(false)}
            >
              <Link href={Admin.Cards.Builder}>
                <span className={"flex items-center gap-2"}>
                  <Sparkles className={"h-4 w-4"} />
                  Build Cards (
                  {draft.length}
                  )
                </span>

                <ArrowRight className={"h-4 w-4 transition-transform group-hover/build:translate-x-1"} />
              </Link>
            </GameButton>
          </div>
        )}
      </div>
    </>
  )
}
