import { SYNTHS } from "./synths"

export type SoundId = keyof typeof SYNTHS

interface PlayOptions {
  volume?: number // 0-1, default 1
  rate?:   number // playback rate multiplier, default 1
}

class SoundManager {
  private ctx:    AudioContext | null = null
  private master: GainNode | null = null
  private muted:  boolean
  private volume: number

  constructor() {
    this.muted = typeof localStorage !== "undefined" && localStorage.getItem("sound-muted") === "true"
    this.volume = 1
  }

  /** Create AudioContext — must be called during a user gesture */
  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx

    try {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = this.muted ? 0 : this.volume
      this.master.connect(this.ctx.destination)
    }
    catch {
      // Web Audio API not available
      return null
    }

    return this.ctx
  }

  play(id: SoundId, opts?: PlayOptions) {
    if (this.muted) return

    const ctx = this.ensureContext()
    if (!ctx || !this.master) return

    // Resume if suspended (e.g. after tab switch)
    if (ctx.state === "suspended") {
      void ctx.resume()
    }

    const synth = SYNTHS[id]
    if (!synth) return

    // Create a per-sound gain node for volume control
    const gain = ctx.createGain()

    gain.gain.value = opts?.volume ?? 1
    gain.connect(this.master)

    try {
      synth(ctx, gain, opts?.rate)
    }
    catch {
      // Synthesis error — silently skip
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted

    if (this.master) {
      this.master.gain.value = muted ? 0 : this.volume
    }

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("sound-muted", String(muted))
    }
  }

  isMuted() {
    return this.muted
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v))

    if (this.master && !this.muted) {
      this.master.gain.value = this.volume
    }
  }
}

/** Module-level singleton — shared across all hook instances */
export const soundManager = new SoundManager()
