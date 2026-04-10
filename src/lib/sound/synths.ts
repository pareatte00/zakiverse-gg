/**
 * Synthesized sound effects using Web Audio API.
 * Each function creates oscillators/noise, schedules them, and they auto-cleanup.
 * No external audio files needed.
 */

type SynthFn = (ctx: AudioContext, dest: AudioNode, rate?: number) => void

/* ── Helpers ── */

function noise(ctx: AudioContext, duration: number): AudioBufferSourceNode {
  const length = Math.ceil(ctx.sampleRate * duration)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const source = ctx.createBufferSource()

  source.buffer = buffer
  source.start(ctx.currentTime)
  source.stop(ctx.currentTime + duration)

  return source
}

function tone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  delay: number = 0,
  volume: number = 0.3,
): { osc: OscillatorNode, gain: GainNode } {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const t = ctx.currentTime + delay

  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)

  osc.connect(gain).connect(dest)
  osc.start(t)
  osc.stop(t + duration)

  return { osc, gain }
}

/* ── Sound Definitions ── */

const packSelect: SynthFn = (ctx, dest) => {
  tone(ctx, dest, 800, 0.04, "sine", 0, 0.2)
  tone(ctx, dest, 1200, 0.03, "sine", 0.005, 0.1)
}
const pullSelect: SynthFn = (ctx, dest) => {
  tone(ctx, dest, 600, 0.06, "sine", 0, 0.25)
  tone(ctx, dest, 900, 0.06, "sine", 0.04, 0.25)
}
const packTear: SynthFn = (ctx, dest) => {
  const duration = 0.4
  const src = noise(ctx, duration)
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  const t = ctx.currentTime

  filter.type = "bandpass"
  filter.frequency.setValueAtTime(200, t)
  filter.frequency.exponentialRampToValueAtTime(3000, t + duration * 0.6)
  filter.frequency.exponentialRampToValueAtTime(800, t + duration)
  filter.Q.setValueAtTime(2, t)
  gain.gain.setValueAtTime(0.15, t)
  gain.gain.linearRampToValueAtTime(0.3, t + duration * 0.3)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  src.connect(filter).connect(gain).connect(dest)
}
const packSlide: SynthFn = (ctx, dest) => {
  const duration = 0.25
  const src = noise(ctx, duration)
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  const t = ctx.currentTime

  filter.type = "lowpass"
  filter.frequency.setValueAtTime(4000, t)
  filter.frequency.exponentialRampToValueAtTime(200, t + duration)
  gain.gain.setValueAtTime(0.2, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  src.connect(filter).connect(gain).connect(dest)
}
const cardAppear: SynthFn = (ctx, dest) => {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = "sine"
  osc.frequency.setValueAtTime(180, t)
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.08)
  gain.gain.setValueAtTime(0.2, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  osc.connect(gain).connect(dest)
  osc.start(t)
  osc.stop(t + 0.08)
  tone(ctx, dest, 600, 0.03, "triangle", 0, 0.08)
}
const revealCommon: SynthFn = (ctx, dest) => {
  tone(ctx, dest, 523, 0.15, "triangle", 0, 0.2)
}
const revealRare: SynthFn = (ctx, dest) => {
  tone(ctx, dest, 523, 0.15, "triangle", 0, 0.2)
  tone(ctx, dest, 659, 0.2, "triangle", 0.08, 0.25)
  tone(ctx, dest, 1318, 0.15, "sine", 0.1, 0.06)
}
const revealEpic: SynthFn = (ctx, dest) => {
  tone(ctx, dest, 523, 0.12, "triangle", 0, 0.2)
  tone(ctx, dest, 659, 0.12, "triangle", 0.08, 0.22)
  tone(ctx, dest, 784, 0.25, "triangle", 0.16, 0.28)
  tone(ctx, dest, 1568, 0.2, "sine", 0.16, 0.08)
  tone(ctx, dest, 1046, 0.2, "sine", 0.18, 0.06)
}
const revealLegendary: SynthFn = (ctx, dest) => {
  const notes = [ 523, 659, 784, 1046 ]
  const gap = 0.09

  for (let i = 0; i < notes.length; i++) {
    const dur = 0.15 + i * 0.08
    const vol = 0.18 + i * 0.04

    tone(ctx, dest, notes[i], dur, "triangle", i * gap, vol)
    tone(ctx, dest, notes[i] * 2, dur * 0.6, "sine", i * gap + 0.02, 0.04)
  }

  tone(ctx, dest, 262, 0.6, "sine", 0, 0.08)
  tone(ctx, dest, 330, 0.5, "sine", 0.05, 0.06)
}
const revealPrismatic: SynthFn = (ctx, dest) => {
  const t = ctx.currentTime
  const freqs = [ 523, 659, 784, 1046, 1318 ]
  const detunes = [ -8, -4, 0, 4, 8 ]

  for (let i = 0; i < freqs.length; i++) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const delay = i * 0.06

    osc.type = "sine"
    osc.frequency.setValueAtTime(freqs[i], t + delay)
    osc.detune.setValueAtTime(detunes[i], t + delay)
    osc.frequency.linearRampToValueAtTime(freqs[i] * 1.02, t + delay + 0.5)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.12, t + delay + 0.05)
    gain.gain.setValueAtTime(0.12, t + delay + 0.3)
    gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.7)
    osc.connect(gain).connect(dest)
    osc.start(t + delay)
    osc.stop(t + delay + 0.7)
  }

  const noiseDur = 0.5
  const src = noise(ctx, noiseDur)
  const hp = ctx.createBiquadFilter()
  const noiseGain = ctx.createGain()

  hp.type = "highpass"
  hp.frequency.setValueAtTime(6000, t)
  noiseGain.gain.setValueAtTime(0, t)
  noiseGain.gain.linearRampToValueAtTime(0.06, t + 0.1)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + noiseDur)
  src.connect(hp).connect(noiseGain).connect(dest)
}
const cardSwipe: SynthFn = (ctx, dest) => {
  const duration = 0.12
  const src = noise(ctx, duration)
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  const t = ctx.currentTime

  filter.type = "highpass"
  filter.frequency.setValueAtTime(1000, t)
  filter.frequency.exponentialRampToValueAtTime(4000, t + duration)
  gain.gain.setValueAtTime(0.15, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  src.connect(filter).connect(gain).connect(dest)
}
const cardSkip: SynthFn = (ctx, dest) => {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = "sine"
  osc.frequency.setValueAtTime(400, t)
  osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08)
  gain.gain.setValueAtTime(0.12, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  osc.connect(gain).connect(dest)
  osc.start(t)
  osc.stop(t + 0.08)
}
const summaryFanfare: SynthFn = (ctx, dest) => {
  const notes = [ 523, 659, 784, 1046 ]
  const gap = 0.1

  for (let i = 0; i < notes.length; i++) {
    const dur = 0.3 - i * 0.03
    const vol = 0.15 + i * 0.03

    tone(ctx, dest, notes[i], dur, "triangle", i * gap, vol)
    tone(ctx, dest, notes[i] * 0.5, dur * 0.8, "sine", i * gap, 0.06)
  }

  tone(ctx, dest, 1046, 0.4, "sine", notes.length * gap, 0.1)
  tone(ctx, dest, 784, 0.35, "sine", notes.length * gap, 0.06)
}
const summaryDismiss: SynthFn = (ctx, dest) => {
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = "sine"
  osc.frequency.setValueAtTime(600, t)
  osc.frequency.exponentialRampToValueAtTime(300, t + 0.1)
  gain.gain.setValueAtTime(0.15, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1)
  osc.connect(gain).connect(dest)
  osc.start(t)
  osc.stop(t + 0.1)
}

/* ── Export Registry ── */

export const SYNTHS = {
  "pack-select":      packSelect,
  "pull-select":      pullSelect,
  "pack-tear":        packTear,
  "pack-slide":       packSlide,
  "card-appear":      cardAppear,
  "reveal-common":    revealCommon,
  "reveal-rare":      revealRare,
  "reveal-epic":      revealEpic,
  "reveal-legendary": revealLegendary,
  "reveal-prismatic": revealPrismatic,
  "card-swipe":       cardSwipe,
  "card-skip":        cardSkip,
  "summary-fanfare":  summaryFanfare,
  "summary-dismiss":  summaryDismiss,
} as const
