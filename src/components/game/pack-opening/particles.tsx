"use client"

import { useEffect, useMemo, useState } from "react"

const KEYFRAMES = `
@keyframes particle-burst {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--px), var(--py)) scale(0); opacity: 0; }
}
@keyframes particle-float-up {
  0%   { transform: translateY(0) scale(1); opacity: 0.8; }
  100% { transform: translateY(-80px) scale(0.4); opacity: 0; }
}
`

interface ParticleConfig {
  count:    number
  colors:   string[]
  size:     [number, number]     // min, max px
  duration: [number, number]     // min, max ms
  spread:   number               // max distance from origin px
  mode:     "burst" | "float"    // burst = outward explosion, float = drift upward
}

export const PARTICLE_PRESETS = {
  idle_sparkle:    { count: 8, colors: [ "#fef3c7", "#fffbeb", "#fff" ], size: [ 2, 4 ], duration: [ 2000, 3500 ], spread: 80, mode: "float" } as ParticleConfig,
  pack_break:      { count: 30, colors: [ "#fff", "#fef3c7", "#fde68a" ], size: [ 2, 5 ], duration: [ 400, 800 ], spread: 180, mode: "burst" } as ParticleConfig,
  blue_burst:      { count: 20, colors: [ "#3b82f6", "#60a5fa", "#93c5fd" ], size: [ 3, 6 ], duration: [ 500, 900 ], spread: 150, mode: "burst" } as ParticleConfig,
  purple_burst:    { count: 25, colors: [ "#a855f7", "#c084fc", "#7c3aed" ], size: [ 3, 7 ], duration: [ 500, 1000 ], spread: 160, mode: "burst" } as ParticleConfig,
  gold_explosion:  { count: 40, colors: [ "#f59e0b", "#fbbf24", "#fde68a", "#ef4444" ], size: [ 3, 8 ], duration: [ 600, 1200 ], spread: 200, mode: "burst" } as ParticleConfig,
  rainbow_cascade: { count: 50, colors: [ "#c4b5fd", "#f9a8d4", "#a5f3fc", "#ddd6fe", "#fbcfe8", "#99f6e4" ], size: [ 3, 8 ], duration: [ 800, 1500 ], spread: 220, mode: "burst" } as ParticleConfig,
} as const

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface ParticleData {
  id:       number
  x:        number
  y:        number
  size:     number
  color:    string
  duration: number
  delay:    number
  px:       number
  py:       number
}

interface ParticlesProps {
  config:     ParticleConfig
  active?:    boolean
  className?: string
}

export function Particles({ config, active = true, className }: ParticlesProps) {
  const [ generation, setGeneration ] = useState(0)

  // Regenerate for burst mode each time active flips to true
  useEffect(() => {
    if (active && config.mode === "burst") {
      setGeneration((g) => g + 1)
    }
  }, [ active, config.mode ])

  const particles = useMemo<ParticleData[]>(() => {
    return Array.from({ length: config.count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / config.count + rand(-0.3, 0.3)
      const distance = rand(config.spread * 0.3, config.spread)

      return {
        id:       i,
        x:        config.mode === "float" ? rand(-config.spread, config.spread) : 0,
        y:        config.mode === "float" ? rand(-20, 20) : 0,
        size:     rand(config.size[0], config.size[1]),
        color:    pick(config.colors),
        duration: rand(config.duration[0], config.duration[1]),
        delay:    config.mode === "float" ? rand(0, config.duration[1]) : rand(0, 150),
        px:       config.mode === "burst" ? Math.cos(angle) * distance : rand(-20, 20),
        py:       config.mode === "burst" ? Math.sin(angle) * distance : 0,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ config.count, config.mode, config.spread, generation ])

  if (!active) return null

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}>
      <style>{KEYFRAMES}</style>

      {particles.map((p) => (
        <span
          className={"absolute left-1/2 top-1/2 rounded-full"}
          key={`${generation}-${p.id}`}
          style={{
            width:           p.size,
            height:          p.size,
            backgroundColor: p.color,
            marginLeft:      p.x,
            marginTop:       p.y,
            willChange:      "transform, opacity",
            animation:       `${config.mode === "burst" ? "particle-burst" : "particle-float-up"} ${p.duration}ms ease-out ${p.delay}ms both`,
            "--px":          `${p.px}px`,
            "--py":          `${p.py}px`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
