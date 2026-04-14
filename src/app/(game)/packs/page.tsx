"use client"

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
import { packFindOneById } from "@/lib/api/db/api.pack"
import type { BannerType, PackPoolPackItem, PackPoolPayload } from "@/lib/api/db/api.pack-pool"
import { packPoolFindActiveBanners, packPoolFindNextPacks } from "@/lib/api/db/api.pack-pool"
import { RARITY_COLORS } from "@/lib/const/const.rarity"
import { useGameSound } from "@/lib/hook/use-game-sound"
import { cn } from "@/lib/utils"
import { Clock, Gift, Layers, Loader2, Package, Sparkles, Star } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const RARITY_DOT_COLORS: Record<string, string> = {
  common:    "bg-stone-500",
  rare:      "bg-blue-500",
  epic:      "bg-purple-500",
  legendary: "bg-amber-500",
  prismatic: "bg-cyan-400",
}
const BANNER_ORDER: BannerType[] = [ "featured", "standard" ]

interface BannerConfig {
  label:  string
  icon:   React.ReactNode
  color:  string
  ribbon: string
  border: string
}

const BANNER_CONFIG: Record<BannerType, BannerConfig> = {
  featured: {
    label:  "Featured",
    icon:   <Star className={"h-3.5 w-3.5"} />,
    color:  "text-amber-400",
    ribbon: "bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent",
    border: "border-l-amber-500",
  },
  standard: {
    label:  "Standard",
    icon:   <Package className={"h-3.5 w-3.5"} />,
    color:  "text-stone-400",
    ribbon: "bg-gradient-to-r from-stone-600/20 via-stone-600/5 to-transparent",
    border: "border-l-stone-600",
  },
}

interface PoolStyle {
  nameColor: string
  lineColor: string
  lineFade:  string
  glowColor: string
  descColor: string
}

const POOL_STYLE: Record<BannerType, PoolStyle> = {
  featured: {
    nameColor: "text-amber-200",
    lineColor: "bg-amber-500/30",
    lineFade:  "from-amber-500/30",
    glowColor: "rgba(251,191,36,0.3)",
    descColor: "text-amber-400/60",
  },
  standard: {
    nameColor: "text-stone-200",
    lineColor: "bg-stone-500/20",
    lineFade:  "from-stone-500/20",
    glowColor: "rgba(168,162,158,0.15)",
    descColor: "text-stone-500",
  },
}

/* ── Countdown ── */

interface CountdownParts {
  segments: { value: number, unit: string }[]
  urgency:  "calm" | "warning" | "urgent" | "critical"
}

function parseCountdown(targetDate: string): CountdownParts | null {
  const diff = new Date(targetDate).getTime() - Date.now()

  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (days > 0) return { segments: [ { value: days, unit: "d" }, { value: hours, unit: "h" } ], urgency: "calm" }
  if (hours > 0) return { segments: [ { value: hours, unit: "h" }, { value: minutes, unit: "m" } ], urgency: "warning" }
  if (minutes > 0) return { segments: [ { value: minutes, unit: "m" }, { value: seconds, unit: "s" } ], urgency: "urgent" }

  return { segments: [ { value: seconds, unit: "s" } ], urgency: "critical" }
}

const URGENCY_STYLE = {
  calm:     { text: "text-stone-400", unit: "text-stone-600", pill: "bg-stone-800/60", icon: "text-stone-500" },
  warning:  { text: "text-amber-300", unit: "text-amber-500/60", pill: "bg-amber-500/10", icon: "text-amber-400/70" },
  urgent:   { text: "text-rose-300", unit: "text-rose-500/60", pill: "bg-rose-500/10", icon: "text-rose-400/70" },
  critical: { text: "text-rose-400", unit: "text-rose-500/60", pill: "bg-rose-500/15", icon: "text-rose-400" },
}

function Countdown({ targetDate, label }: { targetDate: string, label: string }) {
  const [ parts, setParts ] = useState<CountdownParts | null>(() => parseCountdown(targetDate))

  useEffect(() => {
    const update = () => setParts(parseCountdown(targetDate))

    update()

    const id = setInterval(update, 1000)

    return () => clearInterval(id)
  }, [ targetDate ])

  if (!parts) return null

  const s = URGENCY_STYLE[parts.urgency]
  const pulse = parts.urgency === "urgent" || parts.urgency === "critical"

  return (
    <span className={"flex items-center gap-1.5"}>
      <Clock className={cn("h-3.5 w-3.5", s.icon, pulse && "animate-pulse")} />
      <span className={cn("text-[11px]", s.unit)}>{label}</span>

      <span className={"flex items-center gap-1"}>
        {parts.segments.map((seg) => (
          <span
            className={cn("rounded-md px-2 py-0.5 text-sm font-mono font-semibold tabular-nums", s.pill, s.text)}
            key={seg.unit}
          >
            {seg.value}
            {" "}
            <span className={cn("text-[10px] font-normal", s.unit)}>{seg.unit}</span>
          </span>
        ))}
      </span>
    </span>
  )
}

/* ── Main Page ── */

export default function PacksPage() {
  const [ banners, setBanners ] = useState<PackPoolPayload[]>([])
  const [ loading, setLoading ] = useState(true)
  const initialized = useRef(false)
  const { state, startRevealing, tapReveal, close } = usePackOpening()
  const [ inspectPack, setInspectPack ] = useState<PackPayload | null>(null)
  const [ infoPack, setInfoPack ] = useState<PackPayload | null>(null)
  const [ infoLoading, setInfoLoading ] = useState(false)
  const { play } = useGameSound()
  const handleInfo = useCallback(async (pack: PackPayload) => {
    setInfoPack(pack)
    setInfoLoading(true)

    const { response } = await packFindOneById(pack.id)

    if (response?.payload) {
      setInfoPack(response.payload)
    }

    setInfoLoading(false)
  }, [])
  const handleInspect = useCallback((pack: PackPayload) => {
    play("pack-select")
    setInspectPack(pack)
  }, [ play ])

  useEffect(() => {
    if (initialized.current) return

    initialized.current = true

    void (async () => {
      const { response } = await packPoolFindActiveBanners()

      setBanners(response?.payload ?? [])
      setLoading(false)
    })()
  }, [])

  const grouped = useMemo(() => {
    const map: Record<BannerType, PackPoolPayload[]> = {
      featured: [],
      standard: [],
    }

    for (const banner of banners) {
      map[banner.banner_type].push(banner)
    }

    return map
  }, [ banners ])
  const hasPacks = banners.some((b) => (b.packs?.length ?? 0) > 0)
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

  if (!hasPacks) {
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
        {BANNER_ORDER.map((type) => {
          const pools = grouped[type]

          if (pools.length === 0) return null

          const config = BANNER_CONFIG[type]

          return (
            <section className={"space-y-4"} key={type}>
              {/* Banner type header — once per type */}
              <div className={cn(
                "mx-3 flex items-center gap-2.5 rounded-lg border-l-[3px] px-4 py-2",
                config.ribbon,
                config.border,
              )}
              >
                <span className={config.color}>{config.icon}</span>

                <span className={cn("text-[11px] font-bold uppercase tracking-widest", config.color)}>
                  {config.label}
                </span>
              </div>

              {/* Pool sections */}
              <div className={"space-y-5"}>
                {pools.map((pool) => (
                  <PoolSection
                    key={pool.id}
                    pool={pool}
                    onInfo={handleInfo}
                    onPackClick={handleInspect}
                  />
                ))}
              </div>
            </section>
          )
        })}
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
                          const rarityRate = infoPack.config.rarity_rates[rarity] ?? 0
                          const totalWeight = cards.reduce((sum, c) => sum + c.weight, 0)

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
                                <div className={"mt-2 space-y-1"}>
                                  {cards.map((card) => {
                                    const cardRate = totalWeight > 0
                                      ? (rarityRate * card.weight / totalWeight)
                                      : 0
                                    const animeName = typeof card.anime === "string" ? card.anime : (card.anime as { title: string })?.title

                                    return (
                                      <div className={"rounded-md bg-stone-800/50 px-2.5 py-1.5 text-xs"} key={card.id}>
                                        <div className={"flex items-center gap-2"}>
                                          <span className={"min-w-0 flex-1 truncate font-medium text-stone-200"}>
                                            {card.name}

                                            {card.tag_name && (
                                              <span className={"ml-1.5 text-[10px] font-normal text-stone-500"}>
                                                {card.tag_name}
                                              </span>
                                            )}
                                          </span>

                                          {card.is_featured && (
                                            <Star className={"h-3 w-3 shrink-0 text-amber-400"} />
                                          )}

                                          <span className={cn("shrink-0 font-mono text-[10px]", colors?.text ?? "text-stone-500")}>
                                            {cardRate < 0.01 ? "<0.01" : cardRate.toFixed(2)}%
                                          </span>
                                        </div>

                                        {animeName && (
                                          <p className={"mt-0.5 truncate text-[10px] text-stone-500"}>
                                            {animeName}
                                          </p>
                                        )}
                                      </div>
                                    )
                                  })}
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

                </div>
              </div>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  )
}

/* ── Pool section with countdown ── */

interface PoolSectionProps {
  pool:        PackPoolPayload
  onPackClick: (pack: PackPayload) => void
  onInfo:      (pack: PackPayload) => void
}

function PoolSection({ pool, onPackClick, onInfo }: PoolSectionProps) {
  const packs = pool.packs ?? []
  const [ nextPacks, setNextPacks ] = useState<PackPoolPackItem[]>([])
  const [ nextPacksOpen, setNextPacksOpen ] = useState(false)
  const [ nextPacksLoading, setNextPacksLoading ] = useState(false)
  const hasPreview = pool.has_preview
  const handleNextPacksClick = useCallback(async () => {
    if (nextPacksOpen) {
      setNextPacksOpen(false)

      return
    }

    if (nextPacks.length > 0) {
      setNextPacksOpen(true)

      return
    }

    setNextPacksLoading(true)

    const { response } = await packPoolFindNextPacks(pool.id)

    if (response?.payload) {
      setNextPacks(response.payload)
    }

    setNextPacksLoading(false)
    setNextPacksOpen(true)
  }, [ nextPacksOpen, nextPacks.length, pool.id ])

  if (packs.length === 0) return null

  const countdownTarget = pool.rotation_type !== "none" ? pool.next_rotation_at : pool.close_at
  const countdownLabel = pool.rotation_type !== "none" ? "Next rotation in" : "Banner ends in"
  const style = POOL_STYLE[pool.banner_type]

  return (
    <div>
      {/* Pool header */}
      <div className={"relative mx-3 overflow-hidden rounded-xl"}>
        {/* Background: pool image or subtle gradient */}
        {pool.image
          ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={""} className={"absolute inset-0 h-full w-full object-cover"} draggable={false} src={pool.image} />
              <div className={"absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/70 to-stone-950/90"} />
            </>
          )
          : <div className={"absolute inset-0 bg-stone-900/60"} />}

        <div className={"relative px-5 py-4"}>
          {/* Name with asymmetric lines */}
          <div className={"flex items-center gap-3"}>
            <div className={cn("h-px w-5 rounded-full", style.lineColor)} />

            <h2
              className={cn("shrink-0 text-base font-bold tracking-wide", style.nameColor)}
              style={{ textShadow: `0 0 20px ${style.glowColor}` }}
            >
              {pool.name}
            </h2>

            <div className={cn("h-px flex-1 bg-gradient-to-r to-transparent", style.lineFade)} />

            {/* Next rotation preview badge */}
            {hasPreview && (
              <button
                className={cn(
                  "group relative flex shrink-0 items-center gap-1.5 overflow-hidden rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all",
                  nextPacksOpen
                    ? "border-amber-500/40 bg-amber-500/15 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.15)]"
                    : "border-stone-700/50 bg-stone-800/60 text-stone-500 hover:border-amber-500/30 hover:text-amber-400/80",
                )}
                onClick={handleNextPacksClick}
              >
                {nextPacksLoading
                  ? <Loader2 className={"h-3 w-3 animate-spin"} />
                  : <Layers className={cn("h-3 w-3 transition-transform", nextPacksOpen && "rotate-12")} />}

                <span>Next</span>

                {!nextPacksOpen && (
                  <span className={"absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent opacity-0 transition-opacity group-hover:opacity-100"} />
                )}
              </button>
            )}
          </div>

          {/* Description + countdown */}
          {(pool.description || countdownTarget) && (
            <div className={"mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-8"}>
              {pool.description && (
                <p className={cn("text-[11px]", style.descColor)}>{pool.description}</p>
              )}

              {countdownTarget && (
                <Countdown label={countdownLabel} targetDate={countdownTarget} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Packs carousel */}
      <Carousel
        opts={{
          loop:     true,
          dragFree: true,
          align:    "center",
        }}
      >
        <CarouselContent className={"ml-2 pt-2"}>
          {packs.map((pack) => (
            <CarouselItem className={"basis-[200px] pl-2"} key={pack.id}>
              <PackCard
                pack={pack as PackPayload}
                onClick={() => onPackClick(pack as PackPayload)}
                onInfo={() => onInfo(pack as PackPayload)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Next rotation packs drawer */}
      <Drawer open={nextPacksOpen} onOpenChange={setNextPacksOpen}>
        <DrawerContent className={"border-stone-800 bg-stone-950"}>
          <div className={"relative overflow-hidden px-5 pb-6 pt-2"}>
            {/* Ambient glow */}
            <div className={"pointer-events-none absolute -top-10 left-1/2 h-24 w-48 -translate-x-1/2 rounded-full bg-amber-500/8 blur-3xl"} />

            <DrawerHeader className={"relative px-0"}>
              <div className={"flex items-center gap-2"}>
                <Sparkles className={"h-4 w-4 text-amber-400/60"} />

                <DrawerTitle className={"text-sm font-semibold uppercase tracking-widest text-amber-400/60"}>
                  Coming Next
                </DrawerTitle>

                <div className={"h-px flex-1 bg-gradient-to-r from-amber-500/20 to-transparent"} />
              </div>
            </DrawerHeader>

            <div className={"flex gap-3 overflow-x-auto pb-2"}>
              {nextPacks.map((pack) => (
                <div className={"w-[140px] shrink-0"} key={pack.id}>
                  <PackCard
                    pack={pack as PackPayload}
                    tiltEnabled={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
