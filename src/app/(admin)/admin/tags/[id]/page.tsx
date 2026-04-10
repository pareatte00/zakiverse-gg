"use client"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { GameButton } from "@/components/game/game-button"
import { GameCard } from "@/components/game/game-card"
import type { CardFindAllQuery, CardPayload } from "@/lib/api/db/api.card"
import { cardFindAll } from "@/lib/api/db/api.card"
import type { CardTagPayload } from "@/lib/api/db/api.card-tag"
import { cardTagFindOneById } from "@/lib/api/db/api.card-tag"
import { Admin } from "@/lib/const/const.url"
import { ArrowLeft, ChevronLeft, ChevronRight, Layers, Pencil } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

const PAGE_LIMIT = 20

export default function TagDetailPage() {
  const params = useParams<{ id: string }>()
  const tagId = params.id
  const [ tag, setTag ] = useState<CardTagPayload | null>(null)
  const [ cards, setCards ] = useState<CardPayload[]>([])
  const [ loading, setLoading ] = useState(true)
  const [ cardsLoading, setCardsLoading ] = useState(true)
  const [ page, setPage ] = useState(1)
  const [ total, setTotal ] = useState(0)
  const [ totalPages, setTotalPages ] = useState(1)

  // Fetch tag info
  useEffect(() => {
    async function load() {
      const { response, status } = await cardTagFindOneById(tagId)

      if (status < 400 && response?.payload) {
        setTag(response.payload)
      }

      setLoading(false)
    }

    void load()
  }, [ tagId ])

  // Fetch cards with this tag
  const fetchCards = useCallback(async (p: number) => {
    setCardsLoading(true)

    const query: CardFindAllQuery = {
      page:   p,
      limit:  PAGE_LIMIT,
      tag_id: tagId,
      sort:   "name",
      order:  "asc",
    }
    const { response } = await cardFindAll(query)

    setCards(response?.payload ?? [])
    setTotal(response?.meta?.total ?? response?.payload?.length ?? 0)
    setTotalPages(response?.meta?.total_pages ?? 1)
    setCardsLoading(false)
  }, [ tagId ])

  useEffect(() => {
    void fetchCards(page)
  }, [ page, fetchCards ])

  if (loading) {
    return (
      <div className={"p-8"}>
        <div className={"h-8 w-48 animate-pulse rounded-lg bg-zinc-800/40"} />

        <div className={"mt-6 grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4"}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div className={"aspect-[2/3] animate-pulse rounded-xl bg-zinc-800/40"} key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (!tag) {
    return (
      <div className={"flex flex-col items-center gap-4 p-8 py-20"}>
        <p className={"text-sm text-zinc-500"}>Tag not found.</p>

        <GameButton asChild variant={"ghost"}>
          <Link href={Admin.Tags.List}>
            <ArrowLeft className={"h-4 w-4"} />
            {" "}
            Back to Tags
          </Link>
        </GameButton>
      </div>
    )
  }

  return (
    <div className={"p-8"}>
      <AdminPageHeader
        actions={(
          <GameButton asChild variant={"ghost"}>
            <Link href={Admin.Tags.List}>
              <ArrowLeft className={"h-4 w-4"} />
              {" "}
              All Tags
            </Link>
          </GameButton>
        )}
        description={`${total} ${total === 1 ? "card" : "cards"} with this tag`}
        title={tag.name}
      />

      {/* Tag info */}
      <div className={"mt-4 flex items-center gap-4 text-xs text-zinc-500"}>
        <span>Created {new Date(tag.created_at).toLocaleDateString()}</span>
        <span>Updated {new Date(tag.updated_at).toLocaleDateString()}</span>
      </div>

      {/* Cards grid */}
      <div className={"mt-6"}>
        {cardsLoading
          ? (
            <div className={"grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4"}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div className={"aspect-[2/3] animate-pulse rounded-xl bg-zinc-800/40"} key={i} />
              ))}
            </div>
          )
          : cards.length === 0
            ? (
              <div className={"flex flex-col items-center gap-4 py-20"}>
                <Layers className={"h-10 w-10 text-zinc-700"} />
                <p className={"text-sm text-zinc-500"}>No cards with this tag yet.</p>
              </div>
            )
            : (
              <div className={"grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4"}>
                {cards.map((card) => (
                  <div key={card.id}>
                    <GameCard
                      static
                      actions={(
                        <GameButton
                          asChild
                          className={"!p-[5cqw] drop-shadow-lg"}
                          variant={"ghost"}
                        >
                          <Link href={Admin.Cards.Edit(card.id)}>
                            <Pencil style={{ width: "8cqw", height: "8cqw" }} />
                          </Link>
                        </GameButton>
                      )}
                      anime={card.anime?.title}
                      backgroundImage={card.config?.background_image}
                      className={"!w-full"}
                      image={card.image}
                      name={card.name}
                      rarity={card.rarity}
                      tag={card.tag_name ?? undefined}
                    />
                  </div>
                ))}
              </div>
            )}
      </div>

      {/* Pagination */}
      {!cardsLoading && cards.length > 0 && (
        <div className={"mt-6 flex items-center justify-between"}>
          <p className={"text-xs text-zinc-500"}>
            Page {page} of {totalPages} ({total} {total === 1 ? "card" : "cards"})
          </p>

          <div className={"flex items-center gap-2"}>
            <GameButton
              disabled={page <= 1}
              variant={"ghost"}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className={"h-4 w-4"} />
              {" "}
              Previous
            </GameButton>

            <GameButton
              disabled={page >= totalPages}
              variant={"ghost"}
              onClick={() => setPage(page + 1)}
            >
              Next
              {" "}
              <ChevronRight className={"h-4 w-4"} />
            </GameButton>
          </div>
        </div>
      )}
    </div>
  )
}
