"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { useCallback, useRef } from "react"
import { CardReveal } from "./card-reveal"
import { PullSummary } from "./pull-summary"
import type { PackOpeningState } from "./use-pack-opening"

interface PackOpeningOverlayProps {
  state:         PackOpeningState
  onTapReveal:   () => void
  onSkipAll?:    () => void
  onClose:       () => void
}

export function PackOpeningOverlay({ state, onTapReveal, onSkipAll, onClose }: PackOpeningOverlayProps) {
  const exitDirRef = useRef<"left" | "right">("right")

  const handleAdvance = useCallback((dir?: "left" | "right") => {
    exitDirRef.current = dir ?? "right"
    onTapReveal()
  }, [ onTapReveal ])
  const isOpen = state.phase !== "idle"

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
                animate={{ x: 0, opacity: 1 }}
                className={"absolute inset-0"}
                exit={{ x: exitDirRef.current === "left" ? -80 : 80, opacity: 0 }}
                key={`${state.currentRevealIdx}-${state.pulledCards[state.currentRevealIdx].card_id}`}
                transition={{ duration: 0.12, ease: "easeOut" }}
              >
                <CardReveal
                  card={state.pulledCards[state.currentRevealIdx]}
                  index={state.currentRevealIdx}
                  nextCardRarity={state.pulledCards[state.currentRevealIdx + 1]?.rarity}
                  total={state.pulledCards.length}
                  onAdvance={handleAdvance}
                  onSkipAll={onSkipAll}
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
