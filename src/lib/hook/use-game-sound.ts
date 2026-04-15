"use client"

import type { SoundId } from "@/lib/sound/sound-manager"
import { soundManager } from "@/lib/sound/sound-manager"
import { useCallback, useSyncExternalStore } from "react"

/* ── Muted state as tiny external store ── */

let mutedSnapshot = soundManager.isMuted()
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)

  return () => listeners.delete(cb)
}

function getSnapshot() {
  return mutedSnapshot
}

function notifyMutedChange(next: boolean) {
  mutedSnapshot = next
  listeners.forEach((cb) => cb())
}

/* ── Hook ── */

interface PlayOptions {
  volume?: number
  rate?:   number
}

export function useGameSound() {
  const muted = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const play = useCallback((id: SoundId, opts?: PlayOptions) => {
    soundManager.play(id, opts)
  }, [])
  const playFrom = useCallback((id: SoundId, offset: number, opts?: PlayOptions) => {
    soundManager.playFrom(id, offset, opts)
  }, [])
  const preload = useCallback((...ids: SoundId[]) => {
    soundManager.preload(...ids)
  }, [])
  const startScrub = useCallback((id: SoundId, opts?: { volume?: number }) => {
    return soundManager.startScrub(id, opts)
  }, [])
  const scrub = useCallback((handle: string, progress: number, opts?: { volume?: number }) => {
    soundManager.scrub(handle, progress, opts)
  }, [])
  const stopScrub = useCallback((handle: string) => {
    soundManager.stopScrub(handle)
  }, [])
  const toggleMute = useCallback(() => {
    const next = !soundManager.isMuted()

    soundManager.setMuted(next)
    notifyMutedChange(next)
  }, [])

  return { play, playFrom, preload, startScrub, scrub, stopScrub, muted, toggleMute } as const
}
