"use client"

import type { Rarity } from "@/components/game/game-card"
import { PackCard } from "@/components/game/pack-card"
import type { EnrichedPulledCard } from "@/components/game/pack-opening/use-pack-opening"
import type { CardPayload } from "@/lib/api/db/api.card"
import { cardFindOneById } from "@/lib/api/db/api.card"
import type { PackPayload, PullMode } from "@/lib/api/db/api.pack"
import { packPull } from "@/lib/api/db/api.pack"
import { RARITIES } from "@/lib/const/const.rarity"
import { useGameSound } from "@/lib/hook/use-game-sound"
import { cn } from "@/lib/utils"
import type { MotionValue } from "framer-motion"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react"

/* ── Constants ── */

const KEYFRAMES = `
@keyframes pi-fade-in {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes pi-fade-out {
  0%   { opacity: 1; }
  100% { opacity: 0; }
}
@keyframes sparkle-shimmer {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
`
const RARITY_CARD_BG: Record<string, string> = {
  common:    "linear-gradient(135deg, rgba(168,162,158,0.95) 0%, rgba(214,211,209,0.7) 50%, rgba(168,162,158,0.95) 100%)",
  rare:      "linear-gradient(135deg, rgba(59,130,246,0.95) 0%, rgba(96,165,250,0.7) 50%, rgba(59,130,246,0.95) 100%)",
  epic:      "linear-gradient(135deg, rgba(168,85,247,0.95) 0%, rgba(232,121,249,0.7) 50%, rgba(168,85,247,0.95) 100%)",
  legendary: "linear-gradient(135deg, rgba(245,158,11,0.95) 0%, rgba(251,191,36,0.7) 30%, rgba(239,68,68,0.5) 70%, rgba(245,158,11,0.95) 100%)",
  prismatic: "conic-gradient(from 0deg, rgba(196,181,253,0.95), rgba(249,168,212,0.95), rgba(165,243,252,0.95), rgba(221,214,254,0.95), rgba(251,207,232,0.95), rgba(153,246,228,0.95), rgba(196,181,253,0.95))",
}
const DISMISS_MS = 300
const PACK_MAX_WIDTH = 288
const PACK_WIDTH_VW = 72 // vw — responsive cap
const PACK_CQW_TOTAL = 192.1 // 18.5 + 169 + 4.6 (cqw units)
const SEAL_CQW = 18.5
const SEAL_CENTER_PCT = (SEAL_CQW / 2) / PACK_CQW_TOTAL // ~4.8%
const ZOOM_SCALE_MAX = 2.8
const LOCK_THRESHOLD_VH = 0.08

function calcPackWidth() {
  if (typeof window === "undefined") return PACK_MAX_WIDTH

  const fromWidth = window.innerWidth * PACK_WIDTH_VW / 100
  // Leave room for lock zones + padding — pack should fit in ~55% of viewport height
  const maxHeight = window.innerHeight * 0.55
  const fromHeight = maxHeight / (PACK_CQW_TOTAL / 100)

  return Math.min(PACK_MAX_WIDTH, fromWidth, fromHeight)
}

/* ── State Machine ── */

type InspectPhase = "inspect" | "selected" | "waiting" | "zooming" | "tearing" | "sliding" | "done" | "error"

interface InspectState {
  phase:         InspectPhase
  selectedMode:  PullMode | null
  cards:         EnrichedPulledCard[] | null
  highestRarity: Rarity | null
  error:         string | null
}

type InspectAction =
  | { type: "SELECT_MODE", mode: PullMode }
  | { type: "SPRING_DONE" }
  | { type: "API_LOADED", cards: EnrichedPulledCard[], highestRarity: Rarity }
  | { type: "API_ERROR", error: string }
  | { type: "ZOOM_DONE" }
  | { type: "TEAR_COMPLETE" }
  | { type: "SLIDE_DONE" }
  | { type: "RESET" }

const INITIAL_INSPECT: InspectState = {
  phase:         "inspect",
  selectedMode:  null,
  cards:         null,
  highestRarity: null,
  error:         null,
}

function inspectReducer(state: InspectState, action: InspectAction): InspectState {
  switch (action.type) {
    case "SELECT_MODE":
      return { ...state, phase: "selected", selectedMode: action.mode }

    case "SPRING_DONE":
      if (state.phase !== "selected") return state

      return { ...state, phase: state.cards ? "zooming" : "waiting" }

    case "API_LOADED":
      if (state.phase === "waiting") return { ...state, cards: action.cards, highestRarity: action.highestRarity, phase: "zooming" }

      return { ...state, cards: action.cards, highestRarity: action.highestRarity }

    case "API_ERROR":
      return { ...state, phase: "error", error: action.error }

    case "ZOOM_DONE":
      if (state.phase !== "zooming") return state

      return { ...state, phase: "tearing" }

    case "TEAR_COMPLETE":
      if (state.phase !== "tearing") return state

      return { ...state, phase: "sliding" }

    case "SLIDE_DONE":
      if (state.phase !== "sliding") return state

      return { ...state, phase: "done" }

    case "RESET":
      return { ...INITIAL_INSPECT }

    default:
      return state
  }
}

/* ── API helper ── */

async function pullAndEnrich(packId: string, mode: PullMode) {
  const { response, status } = await packPull(packId, mode)

  if (status >= 400 || !response?.payload?.cards) {
    throw new Error(`Failed to open pack (${status})`)
  }

  const pulled = response.payload.cards
  const cardResults = await Promise.allSettled(pulled.map((pc) => cardFindOneById(pc.card_id)))
  const cardMap = new Map<string, CardPayload>()

  for (let i = 0; i < pulled.length; i++) {
    const result = cardResults[i]

    if (result.status === "fulfilled" && result.value.response?.payload) {
      cardMap.set(pulled[i].card_id, result.value.response.payload)
    }
  }

  const enriched: EnrichedPulledCard[] = pulled.map((pc) => {
    const card = cardMap.get(pc.card_id)

    return {
      card_id:          pc.card_id,
      rarity:           pc.rarity as Rarity,
      is_new:           pc.is_new,
      is_pity:          pc.is_pity,
      name:             card?.name ?? "Unknown Card",
      image:            card?.image ?? "",
      background_image: card?.config?.background_image,
      anime_title:      card?.anime?.title,
    }
  })
  const highestRarity = enriched.reduce<Rarity>(
    (max, c) => RARITIES.indexOf(c.rarity) > RARITIES.indexOf(max) ? c.rarity : max,
    "common",
  )

  return { enriched, highestRarity }
}

/* ── Main Component ── */

interface PackInspectOverlayProps {
  pack:            PackPayload | null
  skipEntry?:      boolean
  onOpenWithCards: (mode: PullMode, cards: EnrichedPulledCard[]) => void
  onClose:         () => void
  onEntryDone?:    () => void
}

export function PackInspectOverlay({ pack, skipEntry, onOpenWithCards, onClose, onEntryDone }: PackInspectOverlayProps) {
  const { play } = useGameSound()
  const [ state, dispatch ] = useReducer(inspectReducer, INITIAL_INSPECT)
  // ── Responsive pack width ──
  const [ packWidth, setPackWidth ] = useState(calcPackWidth)

  useEffect(() => {
    function handleResize() {
      setPackWidth(calcPackWidth())
    }

    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])
  // ── Swipe spring physics ──
  const rawY = useMotionValue(0)
  const springY = useSpring(rawY, { stiffness: 300, damping: 30, mass: 0.8 })
  const rawDelta = useMotionValue(0) // un-rubber-banded, used for lock zone + threshold
  const [ isDragging, setIsDragging ] = useState(false)
  const dragStartRef = useRef(0)
  // ── API tracking ──
  const apiCalledRef = useRef(false)
  // ── Frozen zoom target — prevents re-animation on phase change ──
  const zoomTargetRef = useRef({ scale: ZOOM_SCALE_MAX })
  const zoomFrozenRef = useRef(false)
  // ── Dismiss animation ──
  const [ isDismissing, setIsDismissing ] = useState(false)
  // ── Skip backdrop fade-in when returning from summary ──
  const skipFadeInRef = useRef(!!skipEntry)

  // ── Reset on pack change (layout to position before paint) ──
  useLayoutEffect(() => {
    if (pack) {
      dispatch({ type: "RESET" })
      rawDelta.set(0)
      apiCalledRef.current = false
      zoomTargetRef.current = { scale: ZOOM_SCALE_MAX }
      zoomFrozenRef.current = false
      setIsDragging(false)
      setIsDismissing(false)

      if (skipEntry) {
        // Returning from summary — just center it, no fade-in
        skipFadeInRef.current = true
        rawY.set(0)
        springY.jump(0)
        onEntryDone?.()
      }
      else {
        skipFadeInRef.current = false
        // Fresh open — animate from bottom
        const entryOffset = typeof window !== "undefined" ? window.innerHeight * 0.6 : 500

        rawY.set(entryOffset)
        springY.jump(entryOffset)

        // Next frame: change target so spring animates to center
        requestAnimationFrame(() => rawY.set(0))
      }
    }
  }, [ pack, rawY, springY, rawDelta, skipEntry, onEntryDone ])

  const threshold = typeof window !== "undefined" ? window.innerHeight * LOCK_THRESHOLD_VH : 300
  // ── Rubber-band ──
  const rubberBand = useCallback((delta: number) => {
    const max = typeof window !== "undefined" ? window.innerHeight * 0.05 : 40
    const sign = Math.sign(delta)
    const abs = Math.min(Math.abs(delta), max)

    return sign * abs * (1 - abs / (2 * max))
  }, [])
  // ── Pointer handlers (swipe) ──
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (state.phase !== "inspect") return

    setIsDragging(true)
    dragStartRef.current = e.clientY
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [ state.phase ])
  const snapDist = typeof window !== "undefined" ? window.innerHeight * 0.08 : 60
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || state.phase !== "inspect") return

    const delta = e.clientY - dragStartRef.current

    rawDelta.set(delta)

    // Snap pack toward zone when past threshold
    if (delta <= -threshold) {
      rawY.set(-snapDist)
    }
    else if (delta >= threshold) {
      rawY.set(snapDist)
    }
    else {
      rawY.set(rubberBand(delta))
    }
  }, [ isDragging, state.phase, rawY, rawDelta, rubberBand, threshold, snapDist ])
  const handlePointerUp = useCallback(() => {
    if (!isDragging) return

    setIsDragging(false)

    const delta = rawDelta.get()

    if (delta <= -threshold) {
      play("pull-select")
      dispatch({ type: "SELECT_MODE", mode: "single" })
    }
    else if (delta >= threshold) {
      play("pull-select")
      dispatch({ type: "SELECT_MODE", mode: "multi" })
    }

    rawDelta.set(0)
    rawY.set(0)
  }, [ isDragging, rawDelta, threshold, rawY, play ])

  // ── Fire API on selection ──
  useEffect(() => {
    if (state.phase !== "selected" || !pack || apiCalledRef.current) return

    apiCalledRef.current = true

    void (async () => {
      try {
        const { enriched, highestRarity } = await pullAndEnrich(pack.id, state.selectedMode!)

        dispatch({ type: "API_LOADED", cards: enriched, highestRarity })
      }
      catch (err) {
        console.error("[pack-inspect] API error:", err)
        dispatch({ type: "API_ERROR", error: err instanceof Error ? err.message : "Something went wrong." })
      }
    })()
  }, [ state.phase, state.selectedMode, pack ])

  // ── Spring-back → zooming (or waiting for API) ──
  useEffect(() => {
    if (state.phase !== "selected") return

    const timer = setTimeout(() => dispatch({ type: "SPRING_DONE" }), 400)

    return () => clearTimeout(timer)
  }, [ state.phase ])

  // ── Phase-based sound effects ──
  useEffect(() => {
    if (state.phase === "tearing") play("pack-tear")
    if (state.phase === "sliding") play("pack-slide")
  }, [ state.phase, play ])

  // ── Dismiss animation ──
  const handleDismiss = useCallback(() => {
    if (isDismissing) return

    setIsDismissing(true)

    // Slide pack down
    const exitOffset = typeof window !== "undefined" ? window.innerHeight * 0.8 : 600

    rawY.set(exitOffset)

    // Fire onClose after animation
    setTimeout(() => {
      setIsDismissing(false)
      onClose()
    }, DISMISS_MS)
  }, [ isDismissing, rawY, onClose ])

  // ── Done → hand off ──
  useEffect(() => {
    if (state.phase !== "done" || !state.cards || !state.selectedMode) return

    onOpenWithCards(state.selectedMode, state.cards)
  }, [ state.phase, state.cards, state.selectedMode, onOpenWithCards ])

  if (!pack) return null

  const showControls = state.phase === "inspect"
  const isZoomed = state.phase === "zooming" || state.phase === "tearing" || state.phase === "sliding"
  const useSpringDrag = state.phase === "inspect" || state.phase === "selected" || state.phase === "waiting"
  // Dynamic zoom: fit zoomed pack within viewport (leave 8% padding each side)
  const vw = typeof window !== "undefined" ? window.innerWidth : 400
  const vh = typeof window !== "undefined" ? window.innerHeight : 800
  const maxZoomByWidth = (vw * 0.84) / packWidth
  const maxZoomByHeight = (vh * 0.84) / (packWidth * (PACK_CQW_TOTAL / 100))
  const zoomScale = Math.min(ZOOM_SCALE_MAX, maxZoomByWidth, maxZoomByHeight)
  const packHeightPx = packWidth * (PACK_CQW_TOTAL / 100)

  // Freeze zoom target on first entry — same ref across zooming → tearing
  if (state.phase === "zooming" && !zoomFrozenRef.current) {
    zoomTargetRef.current = { scale: zoomScale }
    zoomFrozenRef.current = true
  }

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* Dark backdrop */}
      <div
        className={"fixed inset-0 z-[70]"}
        style={{
          backgroundColor: isZoomed ? "rgba(0,0,0,0.95)" : "rgba(0,0,0,0.8)",
          transition:      "background-color 0.3s ease",
          animation:       isDismissing
            ? `pi-fade-out ${DISMISS_MS}ms ease forwards`
            : skipFadeInRef.current
              ? "none"
              : "pi-fade-in 0.2s ease",
        }}
        onClick={showControls && !isDismissing ? handleDismiss : undefined}
      />

      {/* Lock zones */}
      {(state.phase === "inspect" || isDismissing) && (
        <>
          <LockZone dismissing={isDismissing} dragY={rawDelta} label={"1"} position={"top"} skipFadeIn={skipFadeInRef.current} threshold={threshold} />
          <LockZone dismissing={isDismissing} dragY={rawDelta} label={`${pack.cards_per_pull}`} position={"bottom"} skipFadeIn={skipFadeInRef.current} threshold={threshold} />
        </>
      )}

      {/* Main content */}
      <div className={"pointer-events-none fixed inset-0 z-[80] overflow-hidden"}>

        {/* Card preview behind pack — revealed as pack slides away */}
        {(state.phase === "tearing" || state.phase === "sliding") && state.cards?.[0] && (() => {
          const previewW = Math.min(260, vw * 0.62)
          const previewH = previewW * 1.5
          const previewR = Math.round(previewW * 0.08)
          const bg = RARITY_CARD_BG[state.cards[0].rarity] ?? RARITY_CARD_BG.common

          return (
            <div className={"absolute inset-0 z-0 flex items-center justify-center"}>
              <div
                style={{
                  width:          previewW,
                  height:         previewH,
                  borderRadius:   previewR,
                  background:     bg,
                  backgroundSize: "200% 200%",
                  animation:      "sparkle-shimmer 2s linear infinite",
                }}
              />
            </div>
          )
        })()}

        {/* Pack wrapper — absolutely centered, spring drag + zoom */}
        <motion.div
          animate={
            state.phase === "sliding"
              ? { ...zoomTargetRef.current, y: vh }
              : isZoomed
                ? zoomTargetRef.current
                : { scale: 1, ...(useSpringDrag ? {} : { y: 0 }) }
          }
          className={"pointer-events-auto absolute left-1/2 top-1/2 z-10 touch-none select-none"}
          style={{
            width:           packWidth,
            x:               "-50%",
            y:               useSpringDrag ? springY : undefined,
            marginTop:       -packHeightPx / 2,
            transformOrigin: `50% ${SEAL_CENTER_PCT * 100}%`,
          }}
          transition={
            state.phase === "sliding"
              ? { type: "tween", duration: 0.25, ease: [ 0.4, 0, 1, 1 ] }
              : state.phase === "tearing"
                ? { duration: 0 }
                : isZoomed
                  ? { type: "spring", stiffness: 200, damping: 25 }
                  : { type: "spring", stiffness: 300, damping: 30 }
          }
          onAnimationComplete={() => {
            if (state.phase === "zooming") dispatch({ type: "ZOOM_DONE" })
            if (state.phase === "sliding") setTimeout(() => dispatch({ type: "SLIDE_DONE" }), 200)
          }}
          onPointerCancel={state.phase === "inspect" ? handlePointerUp : undefined}
          onPointerDown={state.phase === "inspect" ? handlePointerDown : undefined}
          onPointerMove={state.phase === "inspect" ? handlePointerMove : undefined}
          onPointerUp={state.phase === "inspect" ? handlePointerUp : undefined}
        >
          <PackCard
            highestRarity={state.highestRarity}
            isTearing={state.phase === "tearing"}
            pack={pack}
            tiltEnabled={!isDragging && state.phase === "inspect"}
            onTearComplete={() => dispatch({ type: "TEAR_COMPLETE" })}
          />
        </motion.div>

        {/* Labels removed — integrated into LockZone */}

        {/* Error state */}
        {state.phase === "error" && (
          <div
            className={"pointer-events-auto absolute left-1/2 top-1/2 flex -translate-x-1/2 flex-col items-center gap-3"}
            style={{ marginTop: packHeightPx / 2 + 16 }}
          >
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
      </div>
    </>
  )
}

/* ── Lock Zone ── */

interface LockZoneProps {
  position:    "top" | "bottom"
  dragY:       MotionValue<number>
  threshold:   number
  label:       string
  dismissing?: boolean
  skipFadeIn?: boolean
}

function LockZone({ position, dragY, threshold, label, dismissing, skipFadeIn }: LockZoneProps) {
  const isTop = position === "top"
  const opacity = useTransform(
    dragY,
    isTop ? [ -threshold, -threshold * 0.3, 0 ] : [ 0, threshold * 0.3, threshold ],
    isTop ? [ 1, 0.3, 0.15 ] : [ 0.15, 0.3, 1 ],
  )
  const isActive = useTransform(dragY, (v: number) =>
    isTop ? v <= -threshold : v >= threshold)
  const [ active, setActive ] = useState(false)

  useEffect(() => {
    const unsub = isActive.on("change", (v) => setActive(v as boolean))

    return unsub
  }, [ isActive ])

  const baseColor = active ? "245,158,11" : "255,255,255"
  const strongA = active ? 0.3 : 0.12

  return (
    <>
      {/* Background gradient — fades with drag */}
      <motion.div
        className={cn(
          "pointer-events-none fixed z-[90]",
          isTop ? "inset-x-0 top-0" : "inset-x-0 bottom-0",
        )}
        style={{
          height:     "22vh",
          opacity,
          background: isTop
            ? `linear-gradient(to bottom, rgba(${baseColor},${strongA}) 0%, rgba(${baseColor},${strongA}) 30%, transparent 100%)`
            : `linear-gradient(to top, rgba(${baseColor},${strongA}) 0%, rgba(${baseColor},${strongA}) 30%, transparent 100%)`,
          transition: "background 0.2s ease",
          ...(dismissing ? { animation: `pi-fade-out ${DISMISS_MS}ms ease forwards` } : {}),
        }}
      />

      {/* Label — fades in after pack entry */}
      <div
        className={cn(
          "pointer-events-none fixed z-[91] flex flex-col items-center",
          isTop ? "inset-x-0 top-0 justify-start pt-6" : "inset-x-0 bottom-0 justify-end pb-6",
        )}
        style={{
          height:    "16vh",
          opacity:   skipFadeIn ? 1 : 0,
          animation: dismissing
            ? `pi-fade-out ${DISMISS_MS}ms ease forwards`
            : skipFadeIn
              ? "none"
              : "pi-fade-in 0.3s ease 0.25s forwards",
        }}
      >
        {isTop && (
          <span className={cn("text-xs font-semibold uppercase tracking-widest text-white/40", active && "text-amber-200/60")}>
            Open
          </span>
        )}

        <motion.span
          animate={{ scale: active ? [ 1, 1.1, 1 ] : 1 }}
          className={cn(
            "text-4xl font-black tabular-nums text-white",
            active && "text-amber-200",
          )}
          transition={{ duration: 0.3 }}
        >
          {label}
        </motion.span>

        {!isTop && (
          <span className={cn("text-xs font-semibold uppercase tracking-widest text-white/40", active && "text-amber-200/60")}>
            Open
          </span>
        )}
      </div>
    </>
  )
}
