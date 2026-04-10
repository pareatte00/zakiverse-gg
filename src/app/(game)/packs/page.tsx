"use client"

import type { Rarity } from "@/components/game/game-card"
import { GameCard } from "@/components/game/game-card"
import { PackCard } from "@/components/game/pack-card"
import { PackInspectOverlay } from "@/components/game/pack-inspect-overlay"
import { PackOpeningOverlay } from "@/components/game/pack-opening/pack-opening-overlay"
import type { EnrichedPulledCard } from "@/components/game/pack-opening/use-pack-opening"
import { usePackOpening } from "@/components/game/pack-opening/use-pack-opening"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import type { PackPayload, PullMode } from "@/lib/api/db/api.pack"
import { packFindAll, packFindOneById } from "@/lib/api/db/api.pack"
import { RARITY_COLORS } from "@/lib/const/const.rarity"
import { useGameSound } from "@/lib/hook/use-game-sound"
import { Calendar, Clock, Gift, Layers, Loader2, Package, Sparkles } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const RARITY_DOT_COLORS: Record<string, string> = {
  common:    "bg-stone-500",
  rare:      "bg-blue-500",
  epic:      "bg-purple-500",
  legendary: "bg-amber-500",
  prismatic: "bg-cyan-400",
}

export default function PacksPage() {
  const [ packs, setPacks ] = useState<PackPayload[]>([])
  const [ loading, setLoading ] = useState(true)
  const initialized = useRef(false)
  const { state, startRevealing, tapReveal, close } = usePackOpening()
  const [ inspectPack, setInspectPack ] = useState<PackPayload | null>(null)
  const [ infoPack, setInfoPack ] = useState<PackPayload | null>(null)
  const [ infoLoading, setInfoLoading ] = useState(false)
  const handleInfo = useCallback(async (pack: PackPayload) => {
    setInfoPack(pack)
    setInfoLoading(true)

    const { response } = await packFindOneById(pack.id)

    if (response?.payload) {
      setInfoPack(response.payload)
    }

    setInfoLoading(false)
  }, [])

  useEffect(() => {
    if (initialized.current) return

    initialized.current = true

    void (async () => {
      const { response } = await packFindAll({ active_only: true, page: 1, limit: 20 })

      setPacks(response?.payload ?? [])
      setLoading(false)
    })()
  }, [])

  const limitedPacks = useMemo(() => packs.filter((p) => p.close_at), [ packs ])
  const standardPacks = useMemo(() => packs.filter((p) => !p.close_at), [ packs ])
  const { play } = useGameSound()
  const handleInspect = useCallback((pack: PackPayload) => {
    play("pack-select")
    setInspectPack(pack)
  }, [ play ])
  const lastOpenedPackRef = useRef<PackPayload | null>(null)
  const [ returningFromOpen, setReturningFromOpen ] = useState(false)
  const handleInspectComplete = useCallback((mode: PullMode, cards: EnrichedPulledCard[]) => {
    if (!inspectPack) return

    lastOpenedPackRef.current = inspectPack
    setInspectPack(null)
    startRevealing(inspectPack.id, inspectPack.name, inspectPack.image, cards)
  }, [ inspectPack, startRevealing ])
  const handleClose = useCallback(() => {
    close()

    // Go back to the peek 1/10 inspect overlay for the same pack
    // Delay so the opening overlay exit animation (0.3s) finishes first
    if (lastOpenedPackRef.current) {
      const pack = lastOpenedPackRef.current

      lastOpenedPackRef.current = null

      setTimeout(() => {
        setReturningFromOpen(true)
        setInspectPack(pack)
      }, 350)
    }
  }, [ close ])

  // Scroll lock when inspect overlay is open
  useEffect(() => {
    if (inspectPack) {
      document.body.style.overflow = "hidden"
    }
    else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [ inspectPack ])

  if (loading) {
    return (
      <div className={"flex flex-col items-center justify-center py-20"}>
        <Loader2 className={"h-6 w-6 animate-spin text-stone-500"} />
        <p className={"mt-3 text-sm text-stone-600"}>Loading packs...</p>
      </div>
    )
  }

  if (packs.length === 0) {
    return (
      <div className={"flex flex-col items-center justify-center py-20"}>
        <Gift className={"h-10 w-10 text-stone-700"} />
        <p className={"mt-3 text-sm text-stone-500"}>No packs available right now.</p>
        <p className={"mt-1 text-xs text-stone-600"}>Check back soon!</p>
      </div>
    )
  }

  return (
    <>
      <div className={"space-y-6 py-4"}>
        {/* Limited Time Packs */}
        {limitedPacks.length > 0 && (
          <PackSection
            icon={<Clock className={"h-4 w-4 text-rose-400"} />}
            label={"Limited Time"}
            labelClass={"text-rose-400"}
            packs={limitedPacks}
            onInfo={handleInfo}
            onPackClick={handleInspect}
          />
        )}

        {/* Standard Packs */}
        {standardPacks.length > 0 && (
          <PackSection
            icon={<Package className={"h-4 w-4 text-stone-400"} />}
            label={"Standard"}
            labelClass={"text-stone-400"}
            packs={standardPacks}
            onInfo={handleInfo}
            onPackClick={handleInspect}
          />
        )}

      </div>

      {state.phase === "idle" && inspectPack && (
        <PackInspectOverlay
          pack={inspectPack}
          skipEntry={returningFromOpen}
          onClose={() => setInspectPack(null)}
          onEntryDone={() => setReturningFromOpen(false)}
          onOpenWithCards={handleInspectComplete}
        />
      )}

      <PackOpeningOverlay
        state={state}
        onClose={handleClose}
        onTapReveal={tapReveal}
      />

      {/* Pack info drawer */}
      <Drawer open={!!infoPack} onOpenChange={(open: boolean) => !open && setInfoPack(null)}>
        <DrawerContent className={"max-h-[85vh] border-stone-800 bg-stone-950 text-stone-100"}>
          {infoPack && (
            <>
              <DrawerHeader>
                <DrawerTitle className={"text-white"}>{infoPack.name}</DrawerTitle>
              </DrawerHeader>

              <div className={"overflow-y-auto px-4 pb-6"}>
                <div className={"space-y-4"}>
                  {infoPack.description && (
                    <p className={"text-sm text-stone-400"}>{infoPack.description}</p>
                  )}

                  <div className={"grid grid-cols-2 gap-3"}>
                    <div className={"flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-2"}>
                      <Sparkles className={"h-4 w-4 text-amber-400"} />

                      <div>
                        <p className={"text-xs text-stone-500"}>Cards per pull</p>
                        <p className={"text-sm font-semibold"}>{infoPack.cards_per_pull}</p>
                      </div>
                    </div>

                    <div className={"flex items-center gap-2 rounded-lg bg-stone-900 px-3 py-2"}>
                      <Layers className={"h-4 w-4 text-blue-400"} />

                      <div>
                        <p className={"text-xs text-stone-500"}>Total cards</p>

                        <p className={"text-sm font-semibold"}>
                          {infoPack.total_cards}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Drop rate badges */}
                  {infoPack.config?.rarity_rates && Object.keys(infoPack.config.rarity_rates).length > 0 && (
                    <div className={"space-y-2"}>
                      <p className={"text-xs font-semibold uppercase tracking-wider text-stone-500"}>Drop rates</p>

                      <div className={"flex flex-wrap gap-2"}>
                        {([ "prismatic", "legendary", "epic", "rare", "common" ] as const)
                          .filter((rarity) => rarity in infoPack.config.rarity_rates)
                          .map((rarity) => {
                            const rate = infoPack.config.rarity_rates[rarity]
                            const colors = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS]
                            const dotColor = RARITY_DOT_COLORS[rarity] ?? "bg-stone-500"

                            return (
                              <span
                                className={"flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1.5 text-xs"}
                                key={rarity}
                              >
                                <span className={`h-2 w-2 rounded-full ${dotColor}`} />

                                <span className={colors?.text ?? "text-stone-300"}>
                                  {colors?.label ?? rarity}
                                </span>

                                <span className={`font-mono font-semibold ${colors?.text ?? "text-stone-400"}`}>
                                  {rate}%
                                </span>
                              </span>
                            )
                          })}
                      </div>
                    </div>
                  )}

                  {/* Card list by rarity */}
                  {infoPack.config?.rarity_rates && (
                    <div className={"space-y-3"}>
                      {([ "prismatic", "legendary", "epic", "rare", "common" ] as const)
                        .filter((rarity) => rarity in infoPack.config.rarity_rates)
                        .map((rarity) => {
                          const colors = RARITY_COLORS[rarity as keyof typeof RARITY_COLORS]
                          const dotColor = RARITY_DOT_COLORS[rarity] ?? "bg-stone-500"
                          const cards = infoPack.cards?.filter((c) => c.rarity === rarity) ?? []

                          if (cards.length === 0 && !infoLoading) return null

                          return (
                            <div className={"rounded-lg bg-stone-900 px-3 py-2"} key={rarity}>
                              <div className={"flex items-center gap-2 text-xs text-stone-500"}>
                                <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />

                                <span className={colors?.text ?? "text-stone-300"}>
                                  {colors?.label ?? rarity}
                                </span>

                                <span className={"text-stone-600"}>({cards.length})</span>
                              </div>

                              {cards.length > 0 && (
                                <div className={"mt-2 grid grid-cols-3 gap-2 sm:grid-cols-10"}>
                                  {cards.map((card) => (
                                    <GameCard
                                      anime={typeof card.anime === "string" ? card.anime : (card.anime as { title: string })?.title}
                                      image={card.image}
                                      key={card.id}
                                      name={card.name}
                                      rarity={rarity as Rarity}
                                    />
                                  ))}
                                </div>
                              )}

                              {infoLoading && cards.length === 0 && (
                                <div className={"mt-2 flex justify-center py-1"}>
                                  <Loader2 className={"h-3.5 w-3.5 animate-spin text-stone-600"} />
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  )}

                  {/* Availability dates */}
                  {(infoPack.open_at || infoPack.close_at) && (
                    <div className={"flex items-center gap-2 text-xs text-stone-500"}>
                      <Calendar className={"h-3.5 w-3.5"} />
                      {infoPack.open_at && <span>Opens {new Date(infoPack.open_at).toLocaleDateString()}</span>}
                      {infoPack.open_at && infoPack.close_at && <span>·</span>}
                      {infoPack.close_at && <span>Closes {new Date(infoPack.close_at).toLocaleDateString()}</span>}
                    </div>
                  )}

                </div>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

/* ── Pack carousel section ── */

interface PackSectionProps {
  label:       string
  labelClass:  string
  icon:        React.ReactNode
  packs:       PackPayload[]
  onPackClick: (pack: PackPayload) => void
  onInfo:      (pack: PackPayload) => void
}

function PackSection({ label, labelClass, icon, packs, onPackClick, onInfo }: PackSectionProps) {
  return (
    <section>
      <div className={"flex items-center gap-2 px-4"}>
        {icon}
        <h2 className={`text-sm font-bold uppercase tracking-wider ${labelClass}`}>{label}</h2>
        <span className={"text-xs text-stone-600"}>({packs.length})</span>
      </div>

      <Carousel
        opts={{
          loop:     true,
          dragFree: true,
          align:    "center",
        }}
      >
        <CarouselContent className={"ml-2 pt-4"}>
          {packs.map((pack) => (
            <CarouselItem className={"basis-[280px] pl-2"} key={pack.id}>
              <PackCard
                pack={pack}
                onClick={() => onPackClick(pack)}
                onInfo={() => onInfo(pack)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  )
}
