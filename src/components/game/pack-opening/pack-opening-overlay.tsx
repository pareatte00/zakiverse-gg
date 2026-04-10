"use client"

import { useGameSound } from "@/lib/hook/use-game-sound"
import { AnimatePresence, motion } from "framer-motion"
import { Loader2, Volume2, VolumeX } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { CardReveal } from "./card-reveal"
import { PullSummary } from "./pull-summary"
import type { PackOpeningState } from "./use-pack-opening"

const SKIP_FAN_DELAY_MS = 120

interface PackOpeningOverlayProps {
  state:       PackOpeningState
  onTapReveal: () => void
  onClose:     () => void
}

export function PackOpeningOverlay({ state, onTapReveal, onClose }: PackOpeningOverlayProps) {
  const { play, muted, toggleMute } = useGameSound()
  const exitDirRef = useRef<"left" | "right" | "up">("right")
  const [ skipping, setSkipping ] = useState(false)
  const handleAdvance = useCallback((dir?: "left" | "right") => {
    exitDirRef.current = dir ?? "right"
    onTapReveal()
  }, [ onTapReveal ])
  // Local skip handler — starts fan-out instead of jumping to summary
  const handleSkipAll = useCallback(() => {
    exitDirRef.current = "up"
    setSkipping(true)
    onTapReveal()
  }, [ onTapReveal ])

  // Auto-advance remaining cards during skip fan-out
  useEffect(() => {
    if (!skipping) return

    // Once we leave revealing phase (last TAP_REVEAL transitions to summary), stop
    if (state.phase !== "revealing") {
      setSkipping(false)

      return
    }

    const timer = setTimeout(() => {
      exitDirRef.current = "up"
      play("card-skip")
      onTapReveal()
    }, SKIP_FAN_DELAY_MS)

    return () => clearTimeout(timer)
  }, [ skipping, state.currentRevealIdx, state.phase, onTapReveal, play ])

  const isOpen = state.phase !== "idle"
  const isUp = exitDirRef.current === "up"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          animate={{ opacity: 1 }}
          className={"fixed inset-0 z-[70] bg-black/95"}
          exit={{ opacity: 0 }}
          initial={{ opacity: state.phase === "revealing" ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Mute toggle */}
          <button
            className={"absolute right-4 top-4 z-10 rounded-full bg-stone-800/60 p-2 text-stone-400 transition-colors hover:bg-stone-700/80 hover:text-stone-200"}
            type={"button"}
            onClick={(e) => {
              e.stopPropagation()
              toggleMute()
            }}
          >
            {muted
              ? <VolumeX className={"h-4 w-4"} />
              : <Volume2 className={"h-4 w-4"} />}
          </button>

          {/* Loading state */}
          {state.phase === "loading" && (
            <div className={"flex h-full flex-col items-center justify-center gap-3"}>
              <Loader2 className={"h-8 w-8 animate-spin text-amber-500"} />
              <p className={"text-sm text-stone-500"}>Opening pack...</p>
            </div>
          )}

          {/* Error state */}
          {state.phase === "error" && (
            <div className={"flex h-full flex-col items-center justify-center gap-4"}>
              <p className={"text-sm text-red-400"}>{state.error}</p>

              <button
                className={"rounded-lg bg-stone-800 px-4 py-2 text-sm text-stone-300 transition-colors hover:bg-stone-700"}
                type={"button"}
                onClick={onClose}
              >
                Close
              </button>
            </div>
          )}

          {/* Card reveal phase */}
          <AnimatePresence mode={"popLayout"}>
            {state.phase === "revealing" && state.pulledCards[state.currentRevealIdx] && (
              <motion.div
                animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                className={"absolute inset-0"}
                exit={{
                  x:       isUp ? 0 : exitDirRef.current === "left" ? -80 : 80,
                  y:       isUp ? -300 : 0,
                  scale:   isUp ? 0.8 : 1,
                  opacity: 0,
                }}
                key={`${state.currentRevealIdx}-${state.pulledCards[state.currentRevealIdx].card_id}`}
                transition={{ duration: skipping ? 0.2 : 0.12, ease: "easeOut" }}
              >
                <CardReveal
                  card={state.pulledCards[state.currentRevealIdx]}
                  index={state.currentRevealIdx}
                  nextCardRarity={state.pulledCards[state.currentRevealIdx + 1]?.rarity}
                  total={state.pulledCards.length}
                  onAdvance={handleAdvance}
                  onSkipAll={handleSkipAll}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary phase */}
          {state.phase === "summary" && (
            <PullSummary
              cards={state.pulledCards}
              onClose={onClose}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
