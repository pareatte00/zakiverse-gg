/* eslint-disable @next/next/no-img-element */
"use client"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { GameButton } from "@/components/game/game-button"
import { Admin } from "@/lib/const/const.url"
import { useCardCreation } from "@/lib/context/card-creation-context"
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function DraftPage() {
  const router = useRouter()
  const { draft, removeFromDraft, clearDraft } = useCardCreation()

  useEffect(() => {
    if (draft.length === 0) {
      router.replace(Admin.Cards.Create)
    }
  }, [ draft.length, router ])

  if (draft.length === 0) return null

  return (
    <div className={"p-8"}>
      {/* Header */}
      <AdminPageHeader
        actions={(
          <button
            className={"text-sm text-zinc-500 transition-colors hover:text-red-400"}
            type={"button"}
            onClick={clearDraft}
          >
            Clear all
          </button>
        )}
        description={`${draft.length} character${draft.length !== 1 ? "s" : ""} selected`}
        title={"Review Draft"}
      />

      {/* Draft grid */}
      <div className={"mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}>
        {draft.map((item) => (
          <div
            className={"group relative overflow-hidden rounded-xl bg-zinc-800"}
            key={item.mal_id}
          >
            <div className={"aspect-[3/4] w-full overflow-hidden"}>
              <img
                alt={item.name}
                className={"h-full w-full object-cover"}
                src={item.image_url}
              />
            </div>

            <div className={"p-2.5"}>
              <p className={"truncate text-sm font-medium text-zinc-200"}>{item.name}</p>

              {item.anime && (
                <p className={"mt-0.5 truncate text-xs text-zinc-500"}>{item.anime.title}</p>
              )}
            </div>

            {/* Remove button */}
            <button
              className={"absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/80 text-zinc-400 transition-all hover:bg-red-500/90 hover:text-white"}
              type={"button"}
              onClick={() => removeFromDraft(item.mal_id)}
            >
              <Trash2 className={"h-4 w-4"} />
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className={"mt-8 flex items-center justify-between"}>
        <GameButton asChild variant={"default"}>
          <Link href={Admin.Cards.Create}>
            <ArrowLeft className={"h-4 w-4"} />
            Back to Search
          </Link>
        </GameButton>

        <GameButton asChild variant={"default"}>
          <Link href={Admin.Cards.Builder}>
            Build Cards
            <ArrowRight className={"h-4 w-4"} />
          </Link>
        </GameButton>
      </div>
    </div>
  )
}
