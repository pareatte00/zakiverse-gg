"use client"

import { useEffect, useMemo, useState } from "react"

const KEYFRAMES = `
@keyframes confetti-fall {
  0%   { transform: translate(var(--cx), var(--cy)) rotate(0deg) scale(1); opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translate(var(--cx2), calc(var(--cy) + 400px)) rotate(var(--cr)) scale(0.3); opacity: 0; }
}
`
const CONFETTI_COLORS = [
  "#f59e0b",
  "#fbbf24",
  "#fde68a", // amber/gold
  "#ef4444", // red accent
  "#a855f7",
  "#c084fc", // purple
  "#3b82f6", // blue
  "#22d3ee", // cyan
  "#ffffff", // white
]

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface ConfettiPiece {
  id:       number
  x:        number
  y:        number
  x2:       number
  color:    string
  size:     number
  duration: number
  delay:    number
  rotation: number
  shape:    "square" | "rect" | "circle"
}

export function PullConfetti() {
  const [ visible, setVisible ] = useState(true)

  // Auto-hide after animation completes
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 3000)

    return () => clearTimeout(timer)
  }, [])

  const pieces = useMemo<ConfettiPiece[]>(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id:       i,
      x:        rand(-150, 150),
      y:        rand(-300, -100),
      x2:       rand(-200, 200),
      color:    pick(CONFETTI_COLORS),
      size:     rand(4, 10),
      duration: rand(1500, 2500),
      delay:    rand(0, 400),
      rotation: rand(360, 1080) * (Math.random() > 0.5 ? 1 : -1),
      shape:    pick([ "square", "rect", "circle" ] as const),
    }))
  }, [])

  if (!visible) return null

  return (
    <div className={"pointer-events-none absolute inset-0 z-30 overflow-hidden"}>
      <style>{KEYFRAMES}</style>

      {pieces.map((p) => (
        <span
          className={"absolute left-1/2 top-1/2"}
          key={p.id}
          style={{
            width:           p.shape === "rect" ? p.size * 1.5 : p.size,
            height:          p.shape === "rect" ? p.size * 0.6 : p.size,
            backgroundColor: p.color,
            borderRadius:    p.shape === "circle" ? "50%" : 2,
            "--cx":          `${p.x}px`,
            "--cy":          `${p.y}px`,
            "--cx2":         `${p.x2}px`,
            "--cr":          `${p.rotation}deg`,
            animation:       `confetti-fall ${p.duration}ms ease-out ${p.delay}ms both`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
