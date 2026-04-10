"use client"

import type { CharacterFull } from "@/lib/api/jikan/api.character"
import type { Picture } from "@/lib/api/jikan/api.types"
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

// --- Draft Types ---

export interface DraftItem {
  mal_id:    number
  name:      string
  image_url: string
  anime:     DraftItemAnime | null
}

export interface DraftItemAnime {
  mal_id: number
  title:  string
}

// --- Builder Types ---

export interface BuilderCardData {
  draft_item:    DraftItem
  character:     CharacterFull | null
  pictures:      Picture[]
  anime_options: BuilderAnimeOption[]

  // User selections
  selected_image:      string
  selected_background: string
  custom_images:       string[]
  display_name:        string
  rarity_id:           string
  selected_anime:      BuilderAnimeOption | null
  tag_id:              string
  tag_name:            string
  config:              Record<string, any>
  status:              "idle" | "creating" | "success" | "error"
  error_message:       string
}

export interface BuilderAnimeOption {
  mal_id: number
  title:  string
}

// --- Context ---

interface CardCreationContextValue {
  draft:           DraftItem[]
  addToDraft:      (item: DraftItem) => void
  removeFromDraft: (malId: number) => void
  clearDraft:      () => void
  isInDraft:       (malId: number) => boolean

  draftOpen:    boolean
  toggleDraft:  () => void
  setDraftOpen: (open: boolean) => void

  builderData:       BuilderCardData[]
  setBuilderData:    (data: BuilderCardData[]) => void
  updateBuilderCard: (malId: number, updates: Partial<BuilderCardData>) => void
}

const DRAFT_STORAGE_KEY = "zakiverse:draft"

function loadDraft(): DraftItem[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(DRAFT_STORAGE_KEY)

    return stored ? JSON.parse(stored) as DraftItem[] : []
  }
  catch {
    return []
  }
}

function saveDraft(draft: DraftItem[]) {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
  }
  catch { /* storage full or unavailable */ }
}

const CardCreationContext = createContext<CardCreationContextValue | null>(null)

export function CardCreationProvider({ children }: { children: ReactNode }) {
  const [ draft, setDraft ] = useState<DraftItem[]>(loadDraft)
  const [ draftOpen, setDraftOpen ] = useState(false)
  const [ builderData, setBuilderData ] = useState<BuilderCardData[]>([])

  useEffect(() => {
    saveDraft(draft)
  }, [ draft ])

  const toggleDraft = useCallback(() => {
    setDraftOpen((prev) => !prev)
  }, [])
  const addToDraft = useCallback((item: DraftItem) => {
    setDraft((prev) => {
      if (prev.some((c) => c.mal_id === item.mal_id)) return prev

      return [ ...prev, item ]
    })
  }, [])
  const removeFromDraft = useCallback((malId: number) => {
    setDraft((prev) => prev.filter((c) => c.mal_id !== malId))
  }, [])
  const clearDraft = useCallback(() => {
    setDraft([])
    setBuilderData([])
  }, [])
  const isInDraft = useCallback((malId: number) => {
    return draft.some((c) => c.mal_id === malId)
  }, [ draft ])
  const updateBuilderCard = useCallback((malId: number, updates: Partial<BuilderCardData>) => {
    setBuilderData((prev) => prev.map((item) =>
      item.draft_item.mal_id === malId ? { ...item, ...updates } : item))
  }, [])

  return (
    <CardCreationContext
      value={{
        draft,
        addToDraft,
        removeFromDraft,
        clearDraft,
        isInDraft,
        draftOpen,
        toggleDraft,
        setDraftOpen,
        builderData,
        setBuilderData,
        updateBuilderCard,
      }}
    >
      {children}
    </CardCreationContext>
  )
}

export function useCardCreation() {
  const ctx = useContext(CardCreationContext)

  if (!ctx) throw new Error("useCardCreation must be used within CardCreationProvider")

  return ctx
}
