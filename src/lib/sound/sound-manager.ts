import { AUDIO_SOUNDS, SYNTHS } from "./synths"

export type SoundId = keyof typeof SYNTHS | keyof typeof AUDIO_SOUNDS

interface PlayOptions {
  volume?: number // 0-1, default 1
  rate?:   number // playback rate multiplier, default 1
}

interface ScrubState {
  buffer: AudioBuffer
  gain:   GainNode
  source: AudioBufferSourceNode | null
  volume: number
}

class SoundManager {
  private ctx:    AudioContext | null = null
  private master: GainNode | null = null
  private muted:  boolean
  private volume: number
  private buffers = new Map<string, AudioBuffer>()
  private loading = new Map<string, Promise<AudioBuffer | null>>()
  private scrubs = new Map<string, ScrubState>()

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
      return null
    }

    return this.ctx
  }

  /** Fetch + decode an audio file, cached for reuse */
  private loadBuffer(url: string): Promise<AudioBuffer | null> {
    const cached = this.buffers.get(url)
    if (cached) return Promise.resolve(cached)

    const existing = this.loading.get(url)
    if (existing) return existing

    const ctx = this.ensureContext()
    if (!ctx) return Promise.resolve(null)

    const promise = fetch(url)
      .then((r) => r.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((decoded) => {
        this.buffers.set(url, decoded)
        this.loading.delete(url)

        return decoded
      })
      .catch(() => {
        this.loading.delete(url)

        return null
      })

    this.loading.set(url, promise)

    return promise
  }

  /** Play an AudioBuffer one-shot */
  private playBuffer(buffer: AudioBuffer, opts?: PlayOptions) {
    const ctx = this.ctx
    if (!ctx || !this.master) return

    const source = ctx.createBufferSource()

    source.buffer = buffer
    source.playbackRate.value = opts?.rate ?? 1

    const gain = ctx.createGain()

    gain.gain.value = opts?.volume ?? 1
    source.connect(gain).connect(this.master)
    source.start()
  }

  /** Play an audio file starting from a time offset (seconds from end if negative) */
  playFrom(id: SoundId, offset: number, opts?: PlayOptions) {
    if (this.muted) return

    const ctx = this.ensureContext()
    if (!ctx || !this.master) return

    if (ctx.state === "suspended") void ctx.resume()

    const audioUrl = AUDIO_SOUNDS[id as keyof typeof AUDIO_SOUNDS]
    if (!audioUrl) return

    const buffer = this.buffers.get(audioUrl)
    if (!buffer) return

    const start = offset < 0 ? Math.max(0, buffer.duration + offset) : offset
    const source = ctx.createBufferSource()

    source.buffer = buffer
    source.playbackRate.value = opts?.rate ?? 1

    const gain = ctx.createGain()

    gain.gain.value = opts?.volume ?? 1
    source.connect(gain).connect(this.master)
    source.start(0, start)
  }

  /** Preload audio files so they play instantly later */
  preload(...ids: SoundId[]) {
    this.ensureContext()

    for (const id of ids) {
      const url = AUDIO_SOUNDS[id as keyof typeof AUDIO_SOUNDS]
      if (url) void this.loadBuffer(url)
    }
  }

  /* ── Scrub API: audio position follows a 0-1 progress value ── */

  /** Prepare a scrub session — returns a handle */
  startScrub(id: SoundId, opts?: { volume?: number }): string | null {
    if (this.muted) return null

    const ctx = this.ensureContext()
    if (!ctx || !this.master) return null

    if (ctx.state === "suspended") void ctx.resume()

    const audioUrl = AUDIO_SOUNDS[id as keyof typeof AUDIO_SOUNDS]
    if (!audioUrl) return null

    const buffer = this.buffers.get(audioUrl)
    if (!buffer) return null

    // Persistent gain node for the whole scrub session
    const gain = ctx.createGain()

    gain.gain.value = opts?.volume ?? 0.5
    gain.connect(this.master)

    const handle = `scrub-${Date.now()}`

    this.scrubs.set(handle, { buffer, gain, source: null, volume: opts?.volume ?? 0.5 })

    return handle
  }

  /** Seek to a position: progress 0-1 → plays a short chunk from that offset */
  scrub(handle: string, progress: number, opts?: { volume?: number }) {
    const state = this.scrubs.get(handle)
    if (!state || !this.ctx) return

    const t = this.ctx.currentTime

    // Update volume if provided
    if (opts?.volume !== undefined) {
      state.volume = opts.volume
      state.gain.gain.setTargetAtTime(opts.volume, t, 0.02)
    }

    // Stop previous chunk with a quick crossfade
    if (state.source) {
      try {
        state.source.stop(t + 0.015)
      }
      catch { /* already stopped */ }

      state.source = null
    }

    // Play a ~120ms chunk starting at the scrub position
    const offset = Math.max(0, Math.min(progress, 1)) * state.buffer.duration
    const chunkDuration = 0.12
    const source = this.ctx.createBufferSource()

    source.buffer = state.buffer
    source.connect(state.gain)
    source.start(t, offset, chunkDuration)

    state.source = source

    source.onended = () => {
      if (state.source === source) state.source = null
    }
  }

  /** End scrub session — fade out and clean up */
  stopScrub(handle: string) {
    const state = this.scrubs.get(handle)
    if (!state || !this.ctx) return

    const t = this.ctx.currentTime

    state.gain.gain.setTargetAtTime(0, t, 0.03)

    if (state.source) {
      try {
        state.source.stop(t + 0.1)
      }
      catch { /* already stopped */ }
    }

    // Disconnect gain after fade
    setTimeout(() => state.gain.disconnect(), 150)
    this.scrubs.delete(handle)
  }

  play(id: SoundId, opts?: PlayOptions) {
    if (this.muted) return

    const ctx = this.ensureContext()
    if (!ctx || !this.master) return

    if (ctx.state === "suspended") {
      void ctx.resume()
    }

    // Check audio files first
    const audioUrl = AUDIO_SOUNDS[id as keyof typeof AUDIO_SOUNDS]

    if (audioUrl) {
      const cached = this.buffers.get(audioUrl)

      if (cached) {
        this.playBuffer(cached, opts)
      }
      else {
        void this.loadBuffer(audioUrl).then((buf) => {
          if (buf) this.playBuffer(buf, opts)
        })
      }

      return
    }

    // Fall back to synth
    const synth = SYNTHS[id as keyof typeof SYNTHS]
    if (!synth) return

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
