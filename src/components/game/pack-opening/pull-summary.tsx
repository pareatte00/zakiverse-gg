"use client"

import { GameCard } from "@/components/game/game-card"
import { RARITY_COLORS } from "@/lib/const/const.rarity"
import { motion } from "framer-motion"
import { PullConfetti } from "./pull-confetti"
import type { EnrichedPulledCard } from "./use-pack-opening"

const SUMMARY_KEYFRAMES = `
@keyframes summary-shimmer {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes summary-dissolve {
  0%   { opacity: 1; }
  100% { opacity: 0; pointer-events: none; }
}
@keyframes summary-prismatic-hue {
  0%   { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}
@keyframes summary-glow-epic {
  0%   { box-shadow: 0 0 0px rgba(168,85,247,0); }
  40%  { box-shadow: 0 0 20px rgba(168,85,247,0.7), 0 0 40px rgba(168,85,247,0.3); }
  100% { box-shadow: 0 0 8px rgba(168,85,247,0.2); }
}
@keyframes summary-glow-legendary {
  0%   { box-shadow: 0 0 0px rgba(245,158,11,0); }
  40%  { box-shadow: 0 0 24px rgba(245,158,11,0.8), 0 0 48px rgba(245,158,11,0.3); }
  100% { box-shadow: 0 0 10px rgba(245,158,11,0.25); }
}
@keyframes summary-glow-prismatic {
  0%   { box-shadow: 0 0 0px rgba(165,243,252,0); }
  40%  { box-shadow: 0 0 28px rgba(165,243,252,0.8), 0 0 56px rgba(232,121,249,0.4); }
  100% { box-shadow: 0 0 12px rgba(196,181,253,0.3); }
}
`
const REVEAL_CONFIG: Record<string, {
  overlayGradient: string
  coverMs:         number // how long the overlay stays fully opaque
  dissolveMs:      number // how long the overlay fades out
  glowAnim:        string | null
  glowRadius:      string
  extraDelay:      number // extra stagger for higher rarities
}> = {
  common: {
    overlayGradient: "linear-gradient(135deg, rgb(168,162,158) 0%, rgb(214,211,209) 50%, rgb(168,162,158) 100%)",
    coverMs:         100,
    dissolveMs:      250,
    glowAnim:        null,
    glowRadius:      "0",
    extraDelay:      0,
  },
  rare: {
    overlayGradient: "linear-gradient(135deg, rgb(59,130,246) 0%, rgb(96,165,250) 50%, rgb(59,130,246) 100%)",
    coverMs:         150,
    dissolveMs:      300,
    glowAnim:        null,
    glowRadius:      "0",
    extraDelay:      0,
  },
  epic: {
    overlayGradient: "linear-gradient(135deg, rgb(168,85,247) 0%, rgb(232,121,249) 50%, rgb(168,85,247) 100%)",
    coverMs:         250,
    dissolveMs:      350,
    glowAnim:        "summary-glow-epic 0.5s ease-out forwards",
    glowRadius:      "12px",
    extraDelay:      0.25,
  },
  legendary: {
    overlayGradient: "linear-gradient(135deg, rgb(245,158,11) 0%, rgb(251,191,36) 30%, rgb(239,68,68) 70%, rgb(245,158,11) 100%)",
    coverMs:         400,
    dissolveMs:      400,
    glowAnim:        "summary-glow-legendary 0.6s ease-out forwards",
    glowRadius:      "14px",
    extraDelay:      0.4,
  },
  prismatic: {
    overlayGradient: "conic-gradient(from 0deg, rgb(196,181,253), rgb(249,168,212), rgb(165,243,252), rgb(221,214,254), rgb(251,207,232), rgb(153,246,228), rgb(196,181,253))",
    coverMs:         550,
    dissolveMs:      450,
    glowAnim:        "summary-glow-prismatic 0.8s ease-out forwards",
    glowRadius:      "16px",
    extraDelay:      0.55,
  },
}

function computeDelays(cards: EnrichedPulledCard[]) {
  const BASE_GAP = 0.08
  const OFFSET = 0.1

  return cards.map((_card, i) => OFFSET + i * BASE_GAP)
}

interface PullSummaryProps {
  cards:   EnrichedPulledCard[]
  onClose: () => void
}

export function PullSummary({ cards, onClose }: PullSummaryProps) {
  const newCount = cards.filter((c) => c.is_new).length
  const delays = computeDelays(cards)
  const lastDelay = delays[delays.length - 1] ?? 0

  return (
    <div className={"flex h-full flex-col items-center"} onClick={onClose}>
      <style>{SUMMARY_KEYFRAMES}</style>
      <PullConfetti />

      {/* Scrollable 3-column grid */}
      <div className={"min-h-0 w-full flex-1 overflow-y-auto px-4"}>
        <div className={"mx-auto flex min-h-full max-w-md flex-wrap content-center justify-center gap-3 pb-4"}>
          {cards.map((card, i) => {
            const cfg = REVEAL_CONFIG[card.rarity] ?? REVEAL_CONFIG.common
            const appearDelay = delays[i]
            // dissolve starts after card appears + cover hold + extra rarity delay
            const dissolveDelay = appearDelay + cfg.coverMs / 1000 + cfg.extraDelay

            return (
              <motion.div
                animate={{ opacity: 1, scale: 1 }}
                className={"relative w-[30%] rounded-xl"}
                initial={{ opacity: 0, scale: 0.92 }}
                key={`${i}-${card.card_id}`}
                transition={{ delay: appearDelay, duration: 0.15, ease: "easeOut" }}
              >
                {/* The actual card — always rendered underneath */}
                <GameCard
                  anime={card.anime_title}
                  backgroundImage={card.background_image}
                  image={card.image}
                  name={card.name}
                  rarity={card.rarity}
                />

                {/* Rarity color overlay — covers card, then dissolves */}
                <div
                  className={"pointer-events-none absolute inset-0 z-[5] overflow-hidden rounded-xl"}
                  style={{
                    background:     cfg.overlayGradient,
                    backgroundSize: "200% 200%",
                    animation:      `summary-shimmer 1.5s linear infinite, summary-dissolve ${cfg.dissolveMs}ms ease-out ${dissolveDelay}s forwards${card.rarity === "prismatic" ? ", summary-prismatic-hue 2s linear infinite" : ""}`,
                  }}
                />

                {/* NEW badge */}
                {card.is_new && (
                  <div
                    className={"absolute -right-1 -top-1 z-10 rounded-full bg-emerald-500 px-1 py-0.5 text-[7px] font-bold text-white shadow-lg"}
                    style={{ transform: "rotate(-12deg)" }}
                  >
                    NEW
                  </div>
                )}

                {/* Rarity glow */}
                <div
                  className={"pointer-events-none absolute -inset-1 -z-10 rounded-xl opacity-30 blur-md"}
                  style={{
                    boxShadow: `0 0 16px ${RARITY_COLORS[card.rarity as keyof typeof RARITY_COLORS]?.shadow ?? "transparent"}`,
                  }}
                />

                {/* Glow flash for epic+ */}
                {cfg.glowAnim && (
                  <div
                    className={"pointer-events-none absolute -inset-0.5 -z-10"}
                    style={{
                      borderRadius:      cfg.glowRadius,
                      animation:         cfg.glowAnim,
                      animationDelay:    `${dissolveDelay}s`,
                      animationFillMode: "both",
                    }}
                  />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      {newCount > 0 && (
        <motion.p
          animate={{ opacity: 1 }}
          className={"shrink-0 pt-3 text-sm font-medium text-emerald-400"}
          initial={{ opacity: 0 }}
          transition={{ delay: lastDelay + 0.3 }}
        >
          {newCount} new {newCount === 1 ? "card" : "cards"}!
        </motion.p>
      )}

      {/* Tap to dismiss hint */}
      <motion.p
        animate={{ opacity: 1 }}
        className={"shrink-0 pb-8 pt-4 text-xs text-stone-600"}
        initial={{ opacity: 0 }}
        transition={{ delay: lastDelay + 0.4 }}
      >
        Tap anywhere to continue
      </motion.p>
    </div>
  )
}
