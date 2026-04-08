"use client"

import type { Rarity } from "@/components/game/game-card"
import type { CardPayload } from "@/lib/api/db/api.card"
import { cardFindOneById } from "@/lib/api/db/api.card"
import type { PullMode } from "@/lib/api/db/api.pack"
import { packPull } from "@/lib/api/db/api.pack"
import { useCallback, useEffect, useReducer, useRef } from "react"

// ── Types ──────────────────────────────────────────────────────

export interface EnrichedPulledCard {
  card_id:           string
  rarity:            Rarity
  is_new:            boolean
  is_pity:           boolean
  name:              string
  image:             string
  background_image?: string
  anime_title?:      string
}

export type OpeningPhase =
  | "idle"
  | "loading"
  | "anticipation"
  | "breaking"
  | "revealing"
  | "summary"
  | "error"

export interface PackOpeningState {
  phase:            OpeningPhase
  packId:           string | null
  packName:         string
  packImage:        string
  pulledCards:      EnrichedPulledCard[]
  currentRevealIdx: number
  error:            string | null
}

// ── Actions ────────────────────────────────────────────────────

type Action =
  | { type: "START_LOADING", packId: string, packName: string, packImage: string }
  | { type: "LOADED", cards: EnrichedPulledCard[] }
  | { type: "LOAD_ERROR", error: string }
  | { type: "TAP_PACK" }
  | { type: "BREAK_DONE" }
  | { type: "TAP_REVEAL" }
  | { type: "START_REVEALING", packId: string, packName: string, packImage: string, cards: EnrichedPulledCard[] }
  | { type: "SKIP_TO_SUMMARY" }
  | { type: "CLOSE" }

const INITIAL_STATE: PackOpeningState = {
  phase:            "idle",
  packId:           null,
  packName:         "",
  packImage:        "",
  pulledCards:      [],
  currentRevealIdx: 0,
  error:            null,
}

function reducer(state: PackOpeningState, action: Action): PackOpeningState {
  switch (action.type) {
    case "START_LOADING":
      return {
        ...INITIAL_STATE,
        phase:     "loading",
        packId:    action.packId,
        packName:  action.packName,
        packImage: action.packImage,
      }

    case "LOADED":
      if (action.cards.length === 0) {
        return { ...state, phase: "error", error: "No cards were pulled. The pack may be empty." }
      }

      return { ...state, phase: "anticipation", pulledCards: action.cards }

    case "LOAD_ERROR":
      return { ...state, phase: "error", error: action.error }

    case "TAP_PACK":
      if (state.phase !== "anticipation") return state

      return { ...state, phase: "breaking" }

    case "BREAK_DONE":
      if (state.phase !== "breaking") return state

      return { ...state, phase: "revealing", currentRevealIdx: 0 }

    case "TAP_REVEAL":
      if (state.phase !== "revealing") return state

      const nextIdx = state.currentRevealIdx + 1

      if (nextIdx >= state.pulledCards.length) {
        return { ...state, phase: "summary" }
      }

      return { ...state, currentRevealIdx: nextIdx }

    case "START_REVEALING":
      return {
        ...INITIAL_STATE,
        phase:            "revealing",
        packId:           action.packId,
        packName:         action.packName,
        packImage:        action.packImage,
        pulledCards:      action.cards,
        currentRevealIdx: 0,
      }

    case "SKIP_TO_SUMMARY":
      if (state.phase !== "revealing") return state

      return { ...state, phase: "summary" }

    case "CLOSE":
      return { ...INITIAL_STATE }

    default:
      return state
  }
}

// ── Hook ───────────────────────────────────────────────────────

export function usePackOpening() {
  const [ state, dispatch ] = useReducer(reducer, INITIAL_STATE)
  const breakTimer = useRef<NodeJS.Timeout | null>(null)

  // Auto-transition: breaking → revealing after 1.5s
  useEffect(() => {
    if (state.phase === "breaking") {
      breakTimer.current = setTimeout(() => {
        dispatch({ type: "BREAK_DONE" })
      }, 1500)
    }

    return () => {
      if (breakTimer.current) clearTimeout(breakTimer.current)
    }
  }, [ state.phase ])

  // Loading timeout — auto-error after 15s
  useEffect(() => {
    if (state.phase !== "loading") return

    const timeout = setTimeout(() => {
      dispatch({ type: "LOAD_ERROR", error: "Request timed out. Please try again." })
    }, 15_000)

    return () => clearTimeout(timeout)
  }, [ state.phase ])

  // Prevent body scroll while overlay is open
  useEffect(() => {
    if (state.phase !== "idle") {
      document.body.style.overflow = "hidden"
    }
    else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [ state.phase ])

  const openPack = useCallback(async (packId: string, packName: string, packImage: string, mode: PullMode = "multi") => {
    dispatch({ type: "START_LOADING", packId, packName, packImage })

    try {
      const { response, status } = await packPull(packId, mode)

      if (status >= 400 || !response?.payload?.cards) {
        console.error("[pack-opening] Pull failed:", { status, response })
        dispatch({ type: "LOAD_ERROR", error: `Failed to open pack (${status}). Please try again.` })

        return
      }

      const pulled = response.payload.cards
      // Fetch full card data in parallel
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

      dispatch({ type: "LOADED", cards: enriched })
    }
    catch (err) {
      console.error("[pack-opening] Exception:", err)
      dispatch({ type: "LOAD_ERROR", error: "Something went wrong. Please try again." })
    }
  }, [])
  const startRevealing = useCallback((
    packId: string,
    packName: string,
    packImage: string,
    cards: EnrichedPulledCard[],
  ) => {
    dispatch({ type: "START_REVEALING", packId, packName, packImage, cards })
  }, [])
  const tapPack = useCallback(() => dispatch({ type: "TAP_PACK" }), [])
  const tapReveal = useCallback(() => dispatch({ type: "TAP_REVEAL" }), [])
  const skipToSummary = useCallback(() => dispatch({ type: "SKIP_TO_SUMMARY" }), [])
  const close = useCallback(() => dispatch({ type: "CLOSE" }), [])

  return { state, openPack, startRevealing, tapPack, tapReveal, skipToSummary, close }
}
