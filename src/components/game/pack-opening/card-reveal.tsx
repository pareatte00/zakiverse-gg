"use client"

import { GameCard } from "@/components/game/game-card"
import { useGameSound } from "@/lib/hook/use-game-sound"
import type { SoundId } from "@/lib/sound/sound-manager"
import { type PanInfo, motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { PARTICLE_PRESETS } from "./particles"
import type { EnrichedPulledCard } from "./use-pack-opening"

const KEYFRAMES = `
@keyframes sparkle-shimmer {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes prismatic-rotate {
  0%   { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

/* Converging rings — each ring lands at scale(1) and holds */
@keyframes ring-converge {
  0%   { opacity: 0; transform: scale(var(--ring-start-scale)); filter: blur(var(--ring-blur)); }
  20%  { opacity: var(--ring-peak-opacity); }
  90%  { opacity: var(--ring-peak-opacity); filter: blur(0px); }
  100% { opacity: var(--ring-peak-opacity); transform: scale(1); filter: blur(0px); }
}

/* Final flash when rings converge */
@keyframes ring-flash {
  0%   { opacity: 0; }
  30%  { opacity: 1; }
  100% { opacity: 0; }
}
`
// ── Rarity configs ─────────────────────────────────────────────
const RARITY_REVEAL_CONFIG: Record<string, {
  preRevealMs:     number
  dissolveMs:      number
  glowColor:       string
  glowColorDim:    string
  glowSize:        string
  particles:       keyof typeof PARTICLE_PRESETS | null
  overlayGradient: string
  // Converging rings (legendary/prismatic)
  rings?:          { colors: string[], count: number, durationMs: number }
}> = {
  common: {
    preRevealMs:     0,
    dissolveMs:      200,
    glowColor:       "rgba(168,162,158,0.4)",
    glowColorDim:    "rgba(168,162,158,0.15)",
    glowSize:        "15px",
    particles:       null,
    overlayGradient: "linear-gradient(135deg, rgba(168,162,158,0.95) 0%, rgba(214,211,209,0.7) 50%, rgba(168,162,158,0.95) 100%)",
  },
  rare: {
    preRevealMs:     100,
    dissolveMs:      250,
    glowColor:       "rgba(59,130,246,0.8)",
    glowColorDim:    "rgba(59,130,246,0.3)",
    glowSize:        "30px",
    particles:       "blue_burst",
    overlayGradient: "linear-gradient(135deg, rgba(59,130,246,0.95) 0%, rgba(96,165,250,0.7) 50%, rgba(59,130,246,0.95) 100%)",
  },
  epic: {
    preRevealMs:     350,
    dissolveMs:      300,
    glowColor:       "rgba(168,85,247,0.8)",
    glowColorDim:    "rgba(168,85,247,0.3)",
    glowSize:        "40px",
    particles:       "purple_burst",
    overlayGradient: "linear-gradient(135deg, rgba(168,85,247,0.95) 0%, rgba(232,121,249,0.7) 50%, rgba(168,85,247,0.95) 100%)",
    rings:           { colors: [ "rgba(168,85,247,0.5)" ], count: 2, durationMs: 300 },
  },
  legendary: {
    preRevealMs:     600,
    dissolveMs:      350,
    glowColor:       "rgba(245,158,11,0.9)",
    glowColorDim:    "rgba(245,158,11,0.4)",
    glowSize:        "50px",
    particles:       "gold_explosion",
    overlayGradient: "linear-gradient(135deg, rgba(245,158,11,0.95) 0%, rgba(251,191,36,0.7) 30%, rgba(239,68,68,0.5) 70%, rgba(245,158,11,0.95) 100%)",
    rings:           { colors: [ "rgba(245,158,11,0.7)" ], count: 4, durationMs: 500 },
  },
  prismatic: {
    preRevealMs:     800,
    dissolveMs:      400,
    glowColor:       "rgba(34,211,238,0.8)",
    glowColorDim:    "rgba(232,121,249,0.4)",
    glowSize:        "60px",
    particles:       "rainbow_cascade",
    overlayGradient: "conic-gradient(from 0deg, rgba(196,181,253,0.95), rgba(249,168,212,0.95), rgba(165,243,252,0.95), rgba(221,214,254,0.95), rgba(251,207,232,0.95), rgba(153,246,228,0.95), rgba(196,181,253,0.95))",
    rings:           {
      colors: [
        "rgba(196,181,253,0.7)", // violet
        "rgba(249,168,212,0.7)", // pink
        "rgba(165,243,252,0.7)", // cyan
        "rgba(134,239,172,0.7)", // green
        "rgba(253,224,71,0.7)", // yellow
        "rgba(251,146,60,0.7)", // orange
      ],
      count:      6,
      durationMs: 650,
    },
  },
}
// ── Swipe constants ─────────────────────────────────────────────
const dragClamp_CQW = 10
const DRAG_ROTATION = 4
const SWIPE_THRESHOLD_PX = 40 // minimum drag distance to trigger dismiss
const SKIP_THRESHOLD_PX = 120 // minimum upward drag to trigger skip-to-summary

// ── Sub-phase type ─────────────────────────────────────────────

type RevealSubPhase = "covered" | "dissolving" | "revealed"

// ── Component ──────────────────────────────────────────────────

interface CardRevealProps {
  card:            EnrichedPulledCard
  index:           number
  total:           number
  nextCardRarity?: string
  onAdvance:       (dir?: "left" | "right") => void
  onSkipAll?:      () => void
}

export function CardReveal({ card, index, total, nextCardRarity, onAdvance, onSkipAll }: CardRevealProps) {
  const { play } = useGameSound()
  const cardWidth = Math.min(260, typeof window !== "undefined" ? window.innerWidth * 0.62 : 260)
  const cardHeight = cardWidth * 1.5
  const cardRadius = Math.round(cardWidth * 0.08) // match game-card rounded-[8cqw]
  const dragClamp = cardWidth * (dragClamp_CQW / 100)
  const remaining = total - index
  const [ subPhase, setSubPhase ] = useState<RevealSubPhase>("covered")
  const config = RARITY_REVEAL_CONFIG[card.rarity] ?? RARITY_REVEAL_CONFIG.common
  const advancedRef = useRef(false)
  const rawOffsetRef = useRef(0)
  const wasPanningRef = useRef(false)
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const springX = useSpring(dragX, { stiffness: 300, damping: 25, mass: 0.8 })
  const springY = useSpring(dragY, { stiffness: 300, damping: 25, mass: 0.8 })
  const dragVisualX = useTransform(springX, [ -dragClamp, 0, dragClamp ], [ -cardWidth * 0.3, 0, cardWidth * 0.3 ])
  const dragVisualY = useTransform(springY, (v) => Math.min(0, v * 0.6))
  const dragRotate = useTransform(springX, [ -dragClamp, 0, dragClamp ], [ -DRAG_ROTATION, 0, DRAG_ROTATION ])
  const dragScale = useTransform(springY, (v) => v < 0 ? 1 - Math.min(0.15, Math.abs(v) / (cardHeight * 2)) : 1)
  const dragOpacity = useTransform(springY, (v) => v < 0 ? 1 - Math.min(0.5, Math.abs(v) / (cardHeight * 1.5)) : 1)
  const nextCardOpacity = useTransform(springX, (v) => Math.min(1, Math.abs(v) / (dragClamp * 0.3)))

  // Reset state on card change
  useEffect(() => {
    setSubPhase("covered")
    advancedRef.current = false
    dragX.set(0)
    play("card-appear")

    // Covered → dissolving transition
    const preTimer = setTimeout(() => {
      setSubPhase("dissolving")
    }, config.preRevealMs)

    return () => clearTimeout(preTimer)
  }, [ index, config.preRevealMs, dragX, play ])

  // Dissolving → revealed transition
  useEffect(() => {
    if (subPhase !== "dissolving") return

    play(`reveal-${card.rarity}` as SoundId)

    const dissolveTimer = setTimeout(() => {
      setSubPhase("revealed")
    }, config.dissolveMs)

    return () => clearTimeout(dissolveTimer)
  }, [ subPhase, config.dissolveMs, play, card.rarity ])

  const dismiss = useCallback((dir?: "left" | "right") => {
    if (advancedRef.current) return

    advancedRef.current = true
    play("card-swipe")
    onAdvance(dir)
  }, [ onAdvance, play ])

  function handleTap() {
    if (advancedRef.current) return

    if (wasPanningRef.current) {
      wasPanningRef.current = false

      return
    }

    if (subPhase === "covered") {
      setSubPhase("dissolving")
    }
    else if (subPhase === "dissolving") {
      setSubPhase("revealed")
    }
    else if (subPhase === "revealed") {
      dismiss()
    }
  }

  const canSwipe = subPhase === "revealed"
  const rawOffsetYRef = useRef(0)
  const handlePan = useCallback((_: unknown, info: PanInfo) => {
    if (!canSwipe) return

    wasPanningRef.current = true
    rawOffsetRef.current = info.offset.x
    rawOffsetYRef.current = info.offset.y
    dragX.set(Math.max(-dragClamp, Math.min(dragClamp, info.offset.x)))
    dragY.set(Math.max(-cardHeight * 0.5, Math.min(0, info.offset.y)))
  }, [ canSwipe, cardHeight, dragClamp, dragX, dragY ])
  const handlePanEnd = useCallback(() => {
    if (!canSwipe) return
    const rawX = rawOffsetRef.current
    const rawY = rawOffsetYRef.current

    // Swipe up → trigger skip (overlay handles fan-out animation)
    if (rawY < -SKIP_THRESHOLD_PX && Math.abs(rawY) > Math.abs(rawX) && onSkipAll) {
      rawOffsetRef.current = 0
      rawOffsetYRef.current = 0
      dragX.set(0)
      dragY.set(0)
      onSkipAll()

      return
    }

    if (Math.abs(rawX) >= SWIPE_THRESHOLD_PX) {
      dismiss(rawX < 0 ? "left" : "right")
      rawOffsetRef.current = 0
      rawOffsetYRef.current = 0
      dragY.set(0)

      return
    }

    rawOffsetRef.current = 0
    rawOffsetYRef.current = 0
    dragX.set(0)
    dragY.set(0)
  }, [ canSwipe, dragX, dragY, dismiss, onSkipAll ])

  return (
    <div
      className={"flex h-full flex-col items-center justify-center"}
      onClick={handleTap}
    >
      <style>{KEYFRAMES}</style>

      {/* Card stack area */}
      <div className={"relative"} style={{ width: cardWidth, height: cardHeight }}>

        {/* Next card preview — fades in only during swipe */}
        {remaining > 1 && (() => {
          const nextConfig = nextCardRarity
            ? RARITY_REVEAL_CONFIG[nextCardRarity] ?? RARITY_REVEAL_CONFIG.common
            : null

          return (
            <motion.div
              className={"absolute inset-0 overflow-hidden border-2 border-stone-700/60"}
              style={{
                borderRadius: cardRadius,
                opacity:      nextCardOpacity,
                background:   nextConfig
                  ? nextConfig.overlayGradient
                  : "linear-gradient(to bottom right, #292524, #1c1917)",
                backgroundSize: "200% 200%",
                animation:      nextConfig
                  ? "sparkle-shimmer 2s linear infinite"
                  : undefined,
              }}
            />
          )
        })()}

        {/* Active card — swipeable after reveal */}
        <motion.div
          className={"absolute inset-0"}
          style={{
            x:           dragVisualX,
            y:           dragVisualY,
            rotate:      dragRotate,
            scale:       dragScale,
            opacity:     dragOpacity,
            touchAction: "none",
          }}
          onPan={handlePan}
          onPanEnd={handlePanEnd}
        >
          <div className={"relative h-full w-full"}>
            {/* Actual card — hidden during covered, fades in on dissolve */}
            <div
              style={{
                opacity:    subPhase === "covered" ? 0 : 1,
                transition: `opacity ${config.dissolveMs}ms ease-out`,
              }}
            >
              <GameCard
                noModal
                anime={card.anime_title}
                backgroundImage={card.background_image}
                image={card.image}
                name={card.name}
                rarity={card.rarity}
                tag={card.tag_name ?? undefined}
                tiltDelay={1000}
              />
            </div>

            {/* Sparkle overlay — covers card, then dissolves */}
            <div
              className={"pointer-events-none absolute inset-0 z-10 overflow-hidden"}
              style={{
                borderRadius:   cardRadius,
                background:     config.overlayGradient,
                backgroundSize: "200% 200%",
                opacity:        subPhase === "covered" ? 1 : 0,
                transition:     `opacity ${config.dissolveMs}ms ease-out`,
                animation:      `sparkle-shimmer 2s linear infinite${card.rarity === "prismatic" ? ", prismatic-rotate 3s linear infinite" : ""}`,
                ...(subPhase === "covered" && config.preRevealMs > 0
                  ? {
                    boxShadow: `0 0 ${config.glowSize} ${config.glowColor}, 0 0 calc(${config.glowSize} * 2) ${config.glowColorDim}`,
                  } as React.CSSProperties
                  : {}),
              }}
            >
            </div>

            {/* Converging rings — all land at card border, then vanish together */}
            {subPhase !== "revealed" && config.rings && Array.from({ length: config.rings.count }).map((_, i) => {
              const { colors, count, durationMs } = config.rings!
              const t = count > 1 ? i / (count - 1) : 0
              const color = colors[i % colors.length]
              const startScale = 1.15 + (i * 0.12)
              // All rings finish at the same time; outer rings start earlier (longer duration)
              const ringDuration = durationMs * (0.5 + t * 0.5)
              const delay = durationMs - ringDuration
              const borderWidth = 1 + t * 2.5
              const peakOpacity = 0.35 + t * 0.65
              const blur = (1 - t) * 4

              return (
                <div
                  className={"pointer-events-none absolute z-[11]"}
                  key={i}
                  style={{
                    inset:                 "-2px",
                    border:                `${borderWidth}px solid ${color}`,
                    borderRadius:          cardRadius + 2,
                    boxShadow:             `0 0 ${8 + t * 12}px ${color}`,
                    "--ring-start-scale":  startScale,
                    "--ring-peak-opacity": peakOpacity,
                    "--ring-blur":         `${blur}px`,
                    animation:             `ring-converge ${ringDuration}ms cubic-bezier(0.4,0,1,1) ${delay}ms forwards`,
                    opacity:               subPhase === "dissolving" ? 0 : undefined,
                    transition:            subPhase === "dissolving" ? "opacity 100ms ease-out" : undefined,
                  } as React.CSSProperties}
                />
              )
            })}

            {/* Flash when rings finish converging */}
            {subPhase === "dissolving" && config.rings && (
              <div
                className={"pointer-events-none absolute inset-0 z-[12]"}
                style={{
                  borderRadius: cardRadius,
                  background:   "radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)",
                  animation:    "ring-flash 200ms ease-out forwards",
                }}
              />
            )}

          </div>
        </motion.div>

        {/* Swipe hint — positioned below card */}
        <p
          className={"w-[200px] text-center absolute left-1/2 -translate-x-1/2 select-none text-xs text-stone-600"}
          style={{ top: cardHeight + 16 }}
        >
          {subPhase === "revealed" ? "← Swipe or tap to continue →" : "\u00A0"}
        </p>

        {/* Skip hint — positioned above card */}
        {subPhase === "revealed" && remaining > 1 && (
          <p
            className={"absolute left-1/2 -translate-x-1/2 select-none text-xs text-stone-600"}
            style={{ top: -32 }}
          >
            ↑ Swipe up to skip all
          </p>
        )}
      </div>
    </div>
  )
}
