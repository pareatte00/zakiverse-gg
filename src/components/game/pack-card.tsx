/* eslint-disable @next/next/no-img-element */
"use client"

import { GameButton } from "@/components/game/game-button"
import type { Rarity } from "@/components/game/game-card"
import type { PackPayload } from "@/lib/api/db/api.pack"
import { cn } from "@/lib/utils"
import { Info } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

const HOLO_BG = "linear-gradient(135deg, #c4b5fd40, #f9a8d440, #a5f3fc40, #ddd6fe40, #fbcfe840, #99f6e440, #c4b5fd40)"
const IRIDESCENT_BG = "linear-gradient(90deg, #c4b5fd, #f9a8d4, #a5f3fc, #ddd6fe, #fbcfe8, #99f6e4, #c4b5fd)"
const PACK_SPARKLES = [
  { top: "8%", right: "8%", size: "3cqw", bg: "#67e8f9", shadow: "0 0 2.8cqw 1cqw rgba(34,211,238,0.7)", delay: "0s" },
  { top: "35%", left: "5%", size: "2.3cqw", bg: "#f0abfc", shadow: "0 0 2.8cqw 1cqw rgba(232,121,249,0.7)", delay: "0.7s" },
  { top: "65%", right: "6%", size: "1.9cqw", bg: "#a5f3fc", shadow: "0 0 2.1cqw 1cqw rgba(34,211,238,0.6)", delay: "1.4s" },
  { top: "85%", left: "10%", size: "1.5cqw", bg: "#e9d5ff", shadow: "0 0 2.1cqw 1cqw rgba(232,121,249,0.6)", delay: "2.1s" },
]
const TEAR_PARTICLE_STYLE: Record<Rarity, { background: string, boxShadow: string }> = {
  common:    { background: "linear-gradient(90deg, #e2e8f0, #f1f5f9, #fff, #f1f5f9, #e2e8f0)", boxShadow: "0 0 1cqw 0.3cqw rgba(200,210,220,0.5)" },
  rare:      { background: "linear-gradient(90deg, #c4b5fd, #93c5fd, #60a5fa, #93c5fd, #c4b5fd)", boxShadow: "0 0 1cqw 0.4cqw rgba(96,165,250,0.7)" },
  epic:      { background: "linear-gradient(90deg, #ddd6fe, #c084fc, #a855f7, #c084fc, #ddd6fe)", boxShadow: "0 0 1.2cqw 0.4cqw rgba(168,85,247,0.65)" },
  legendary: { background: "linear-gradient(90deg, #fef3c7, #fbbf24, #f59e0b, #fbbf24, #fef3c7)", boxShadow: "0 0 1.2cqw 0.5cqw rgba(251,191,36,0.6)" },
  prismatic: { background: IRIDESCENT_BG, boxShadow: "0 0 1.5cqw 0.5cqw rgba(165,243,252,0.8)" },
}
const TEAR_PARTICLES = [
  { tx: "-12cqw", ty: "-16cqw", size: "2cqw", delay: "0s", x: "15%" },
  { tx: "15cqw", ty: "-22cqw", size: "1.5cqw", delay: "0.04s", x: "35%" },
  { tx: "-6cqw", ty: "-26cqw", size: "1.8cqw", delay: "0.08s", x: "55%" },
  { tx: "25cqw", ty: "-12cqw", size: "1.2cqw", delay: "0.02s", x: "75%" },
  { tx: "4cqw", ty: "-30cqw", size: "2cqw", delay: "0.1s", x: "25%" },
  { tx: "-18cqw", ty: "-18cqw", size: "1.3cqw", delay: "0.06s", x: "85%" },
  { tx: "10cqw", ty: "-20cqw", size: "1.6cqw", delay: "0.03s", x: "45%" },
  { tx: "-8cqw", ty: "-14cqw", size: "1.4cqw", delay: "0.07s", x: "65%" },
]
const HINT_PARTICLE_INDEX = 5
const KEYFRAMES = `
@keyframes pc-idle-shimmer {
  0%   { transform: translateX(-120%) rotate(12deg); }
  100% { transform: translateX(220%) rotate(12deg); }
}
@keyframes pc-rainbow {
  0%   { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}
@keyframes pc-iridescent {
  0%   { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes pc-sparkle {
  0%, 100% { margin-top: 0; opacity: 0.9; }
  50%      { margin-top: -5.4cqw; opacity: 0.2; }
}
@keyframes pc-glow-pulse {
  0%, 100% { opacity: 0.5; }
  50%      { opacity: 1; }
}
@keyframes pc-blow-away {
  0%   { transform: perspective(80cqw) rotateX(0) translateY(0) scale(1); opacity: 1; filter: brightness(1) blur(0px); }
  20%  { transform: perspective(80cqw) rotateX(-8deg) translateY(-5%) scale(1.05); filter: brightness(1.5) blur(0px); }
  60%  { transform: perspective(80cqw) rotateX(-25deg) translateY(-40%) scale(0.85); opacity: 0.5; filter: brightness(2) blur(1cqw); }
  100% { transform: perspective(80cqw) rotateX(-45deg) translateY(-150%) scale(0.4); opacity: 0; filter: brightness(3) blur(3cqw); }
}
@keyframes pc-tear-flash {
  0%   { opacity: 1; transform: scale(1); }
  50%  { opacity: 0.8; }
  100% { opacity: 0; transform: scale(1.2); }
}
@keyframes pc-particle {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}
`

interface PackCardProps {
  highestRarity?:  Rarity | null
  isTearing?:      boolean
  onClick?:        () => void
  onInfo?:         () => void
  onTearComplete?: () => void
  pack:            PackPayload
  tiltEnabled?:    boolean
}

/* ── Barcode generator from UUID ── */
function UuidBarcode({ uuid }: { uuid: string }) {
  const hex = uuid.replace(/-/g, "")
  const bars: { w: string, gap: string }[] = []

  for (let i = 0; i < hex.length; i++) {
    const val = parseInt(hex[i], 16)

    bars.push({ w: val > 8 ? "1.2cqw" : "0.8cqw", gap: val % 3 === 0 ? "0.8cqw" : "0.4cqw" })
  }

  return (
    <div className={"flex items-end"} style={{ height: "5.4cqw", gap: 0 }}>
      {bars.map((b, i) => (
        <div
          className={"bg-white/40"}
          key={i}
          style={{ width: b.w, height: "5.4cqw", marginRight: b.gap }}
        />
      ))}
    </div>
  )
}

/* ── Brand monogram ── */
function BrandMonogram() {
  return (
    <div
      className={"flex items-center justify-center rounded-full border border-white/30"}
      style={{
        width:      "13cqw",
        height:     "13cqw",
        background: "radial-gradient(circle, rgba(40,40,50,0.9) 0%, rgba(20,20,30,0.95) 100%)",
        boxShadow:  "0 0.7cqw 2.1cqw rgba(0,0,0,0.5), inset 0 0.35cqw 0 rgba(255,255,255,0.1)",
      }}
    >
      <span
        className={"font-black leading-none text-white"}
        style={{
          fontSize:      "5.4cqw",
          letterSpacing: "-0.4cqw",
          textShadow:    "0 0 2.1cqw rgba(196,181,253,0.5)",
        }}
      >
        ZS
      </span>
    </div>
  )
}

/* ── Seal Content (shared between torn halves) ── */

function SealContent() {
  return (
    <div
      className={"absolute inset-0 flex items-center justify-center"}
      style={{
        background: "linear-gradient(180deg, #e8e8ec 0%, #d0d0d8 20%, #b8b8c4 60%, #a0a0b0 70%, #8888a0 80%, #707088 85%, #585870 90%, #404058 95%, #303048 100%)",
      }}
    >
      {/* Embossed dot texture — masked out around hang hole */}
      <div
        className={"pointer-events-none absolute inset-0"}
        style={{
          backgroundImage:  "radial-gradient(circle, rgba(0,0,0,0.25) 0.4cqw, rgba(255,255,255,0.06) 0.4cqw, rgba(255,255,255,0.06) 0.7cqw, transparent 0.7cqw)",
          backgroundSize:   "1.7cqw 1.7cqw",
          backgroundRepeat: "repeat",
          mask:             "radial-gradient(circle 5cqw at 50% 50%, transparent 95%, black 100%)",
          WebkitMask:       "radial-gradient(circle 5cqw at 50% 50%, transparent 95%, black 100%)",
        }}
      />

      {/* Iridescent overlay — masked out around hang hole */}
      <div
        className={"pointer-events-none absolute inset-0"}
        style={{
          background:     IRIDESCENT_BG,
          backgroundSize: "200% 100%",
          animation:      "pc-iridescent 4s linear infinite",
          mixBlendMode:   "overlay",
          opacity:        0.5,
          mask:           "radial-gradient(circle 5cqw at 50% 50%, transparent 95%, black 100%)",
          WebkitMask:     "radial-gradient(circle 5cqw at 50% 50%, transparent 95%, black 100%)",
        }}
      />

      {/* Hang hole */}
      <div
        className={"rounded-full"}
        style={{
          width:      "7.7cqw",
          height:     "7.7cqw",
          background: "radial-gradient(circle, #1a1a1a 40%, #2a2a2a 60%, #3a3a3a 100%)",
          boxShadow:  "inset 0 0.35cqw 1cqw rgba(0,0,0,0.8), 0 0.35cqw 0 rgba(255,255,255,0.15)",
        }}
      />
    </div>
  )
}

/* ── Sealed Top Edge with Tear Support ── */

interface SealedTopEdgeProps {
  highestRarity?: Rarity | null
  isTearing:      boolean
  onTearComplete: () => void
}

function SealedTopEdge({ highestRarity, isTearing, onTearComplete }: SealedTopEdgeProps) {
  const [ tearProgress, setTearProgress ] = useState(0)
  const [ tearing, setTearing ] = useState(false)
  const [ blowAway, setBlowAway ] = useState(false)
  const tearRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isTearing || blowAway) return

    const rect = tearRef.current?.getBoundingClientRect()
    if (!rect) return

    const relX = (e.clientX - rect.left) / rect.width
    if (relX > 0.35) return

    startXRef.current = e.clientX
    setTearing(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [ isTearing, blowAway ])
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!tearing || !tearRef.current) return

    const rect = tearRef.current.getBoundingClientRect()
    const delta = e.clientX - startXRef.current
    const progress = Math.max(0, Math.min(1, delta / rect.width))
    setTearProgress(progress)
  }, [ tearing ])
  const handlePointerUp = useCallback(() => {
    if (!tearing) return

    if (tearProgress >= 0.85) {
      setBlowAway(true)
      setTimeout(() => onTearComplete(), 600)
    }
    else {
      setTearProgress(0)
    }

    setTearing(false)
  }, [ tearing, tearProgress, onTearComplete ])
  const showTear = tearProgress > 0.02
  const beamX = tearProgress * 100

  return (
    <div
      className={"relative z-10 rounded-t-[3cqw]"}
      ref={tearRef}
      style={{ height: "18.5cqw" }}
      onPointerCancel={isTearing ? handlePointerUp : undefined}
      onPointerDown={isTearing ? handlePointerDown : undefined}
      onPointerMove={isTearing ? handlePointerMove : undefined}
      onPointerUp={isTearing ? handlePointerUp : undefined}
    >
      {/* Iridescent light behind seal — visible where seal is torn away */}
      {(showTear || blowAway) && (
        <div
          className={"pointer-events-none absolute inset-0 rounded-t-[3cqw]"}
          style={{
            background:     IRIDESCENT_BG,
            backgroundSize: "200% 100%",
            animation:      "pc-iridescent 3s linear infinite",
            opacity:        blowAway ? 1 : Math.min(0.8, tearProgress * 2),
          }}
        />
      )}

      {/* Seal — clipped to show only un-torn right portion */}
      <div
        className={"absolute inset-0 overflow-hidden rounded-t-[3cqw]"}
        style={{
          clipPath:        isTearing || tearProgress > 0 ? `inset(0 0 0 ${tearProgress * 100}%)` : undefined,
          animation:       blowAway ? "pc-blow-away 0.8s ease-in forwards" : undefined,
          transformOrigin: blowAway ? "bottom center" : undefined,
          transition:      !blowAway && !tearing ? "clip-path 0.3s ease-out" : undefined,
        }}
      >
        <SealContent />
      </div>

      {/* Tear hint — above the card */}
      {isTearing && tearProgress === 0 && !blowAway && (
        <div
          className={"pointer-events-none absolute inset-x-0 z-20 flex justify-center"}
          style={{ top: "-8cqw", animation: "pc-glow-pulse 2s ease-in-out infinite" }}
        >
          <span
            className={"font-bold uppercase tracking-wider text-white/60 drop-shadow-lg"}
            style={{ fontSize: "3.5cqw" }}
          >
            Tear to open →
          </span>
        </div>
      )}

      {/* Iridescent line at seal–artwork boundary */}
      {!blowAway && (
        <div
          className={"pointer-events-none absolute inset-x-0 z-20"}
          style={{ bottom: "-5cqw", height: "10cqw" }}
        >
          {/* Core iridescent line */}
          <div
            className={"absolute inset-x-0"}
            style={{
              top:            "50%",
              height:         "1.2cqw",
              transform:      "translateY(-50%)",
              background:     IRIDESCENT_BG,
              backgroundSize: "200% 100%",
              animation:      "pc-iridescent 2s linear infinite",
              opacity:        showTear ? Math.min(1, tearProgress * 2.5) : 0.5,
            }}
          />

          {/* Wider soft glow */}
          <div
            className={"absolute"}
            style={{
              inset:      0,
              background: `linear-gradient(180deg,
                transparent 0%,
                rgba(196,181,253,0.2) 25%,
                rgba(249,168,212,0.4) 40%,
                rgba(255,255,255,0.7) 50%,
                rgba(165,243,252,0.4) 60%,
                rgba(153,246,228,0.2) 75%,
                transparent 100%)`,
              opacity: showTear ? Math.min(1, tearProgress * 2) : 0.3,
              filter:  "blur(1.2cqw)",
            }}
          />

          {/* Bright spot following finger */}
          {showTear && (
            <div
              className={"absolute"}
              style={{
                top:        "50%",
                left:       `${beamX}%`,
                width:      "20cqw",
                height:     "100%",
                transform:  "translate(-50%, -50%)",
                background: "radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(165,243,252,0.5) 40%, transparent 70%)",
                filter:     "blur(0.5cqw)",
              }}
            />
          )}
        </div>
      )}

      {/* Flash + particles on tear complete */}
      {blowAway && (
        <>
          <div
            className={"pointer-events-none absolute inset-0 z-30 rounded-t-[3cqw]"}
            style={{
              background: "radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(165,243,252,0.4) 50%, transparent 80%)",
              animation:  "pc-tear-flash 0.6s ease-out forwards",
            }}
          />

          {TEAR_PARTICLES.map((p, i) => {
            const isHint = i === HINT_PARTICLE_INDEX
            const rarity = highestRarity ?? "common"
            const isPrismaticHint = isHint && rarity === "prismatic"
            const style = isHint
              ? TEAR_PARTICLE_STYLE[rarity]
              : { background: IRIDESCENT_BG, boxShadow: "0 0 1cqw 0.3cqw rgba(165,243,252,0.6)" }

            return (
              <div
                className={"pointer-events-none absolute z-30 rounded-full"}
                key={i}
                style={{
                  "--tx":            isPrismaticHint ? "0cqw" : p.tx,
                  "--ty":            isPrismaticHint ? "-40cqw" : p.ty,
                  left:              isPrismaticHint ? "50%" : p.x,
                  bottom:            0,
                  width:             isPrismaticHint ? "3cqw" : p.size,
                  height:            isPrismaticHint ? "3cqw" : p.size,
                  background:        style.background,
                  backgroundSize:    "200% 100%",
                  boxShadow:         style.boxShadow,
                  animation:         `pc-particle ${isPrismaticHint ? "0.7s" : "0.5s"} ${p.delay} ease-out forwards`,
                  animationFillMode: "both",
                } as React.CSSProperties}
              />
            )
          })}
        </>
      )}
    </div>
  )
}

export function PackCard({ highestRarity, isTearing = false, onClick, onInfo, onTearComplete, pack, tiltEnabled = true }: PackCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const holoRef = useRef<HTMLDivElement>(null)
  const streakRef = useRef<HTMLDivElement>(null)
  const [ hovered, setHovered ] = useState(false)
  const touchActiveRef = useRef(false)
  const touchTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  function applyTilt(clientX: number, clientY: number) {
    if (!tiltEnabled) return

    const card = cardRef.current
    if (!card) return

    if (!hovered) setHovered(true)

    const rect = card.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const maxAngle = 10
    const rotY = Math.max(-maxAngle, Math.min(maxAngle, ((x - centerX) / centerX) * maxAngle))
    const rotX = Math.max(-maxAngle, Math.min(maxAngle, ((centerY - y) / centerY) * maxAngle))

    card.style.transform = `perspective(312cqw) rotateX(${rotX}deg) rotateY(${rotY}deg)`
    card.style.transition = "transform 0.1s ease"

    // Holo color shift — follows cursor (same as prismatic card)
    if (holoRef.current) {
      const hue = ((x / rect.width) + (y / rect.height)) * 180

      holoRef.current.style.filter = `hue-rotate(${hue}deg)`
      holoRef.current.style.opacity = "1"
    }

    // Light streak follows cursor X
    if (streakRef.current) {
      const pct = (x / rect.width) * 160 - 30

      streakRef.current.style.left = `${pct}%`
      streakRef.current.style.opacity = "1"
    }
  }

  function resetTilt() {
    setHovered(false)
    const card = cardRef.current
    if (!card) return

    card.style.transform = "perspective(312cqw) rotateX(0deg) rotateY(0deg)"
    card.style.transition = "transform 0.4s ease-out"

    if (holoRef.current) {
      holoRef.current.style.opacity = "0"
      holoRef.current.style.transition = "opacity 0.3s ease-out"
    }

    if (streakRef.current) {
      streakRef.current.style.opacity = "0"
      streakRef.current.style.transition = "opacity 0.3s ease-out"
    }
  }

  function handleTouchStart() {
    if (!tiltEnabled) return

    touchTimerRef.current = setTimeout(() => {
      touchActiveRef.current = true
    }, 100)
  }

  function handleTouchEnd() {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current)

    touchActiveRef.current = false
    resetTilt()
  }

  function handleTouchMove(e: TouchEvent) {
    if (!tiltEnabled || !touchActiveRef.current) return

    e.preventDefault()
    const touch = e.touches[0]
    if (touch) applyTilt(touch.clientX, touch.clientY)
  }

  useEffect(() => {
    if (!tiltEnabled) resetTilt()
  }, [ tiltEnabled ]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    card.addEventListener("touchmove", handleTouchMove, { passive: false })

    return () => card.removeEventListener("touchmove", handleTouchMove)
  })

  return (
    <div className={cn("relative mx-auto w-full select-none", onClick && "cursor-pointer")} style={{ containerType: "inline-size" }} onClick={onClick}>
      <style>{KEYFRAMES}</style>

      <div
        className={"relative"}
        ref={cardRef}
        style={{
          transformStyle: "preserve-3d",
          boxShadow:      "0 2.8cqw 13.9cqw rgba(0,0,0,0.4), 0 0 20.8cqw rgba(255,255,255,0.03)",
        }}
        onMouseLeave={resetTilt}
        onMouseMove={(e) => applyTilt(e.clientX, e.clientY)}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
      >
        {/* ── Front face ── */}
        <div className={"relative"}>

          {/* Sealed top edge with hang hole + tear support */}
          <SealedTopEdge highestRarity={highestRarity} isTearing={isTearing} onTearComplete={onTearComplete ?? (() => {})} />

          {/* Main wrapper area */}
          <div className={"relative overflow-hidden"} style={{ height: "169cqw" }}>
            {/* Pack image */}
            <img
              alt={pack.name}
              className={"pointer-events-none absolute inset-0 h-full w-full object-cover"}
              draggable={false}
              src={pack.image}
            />

            {/* Wrapper edge shadows */}
            <div
              className={"pointer-events-none absolute inset-0"}
              style={{
                boxShadow: "inset 2.3cqw 0 4.6cqw rgba(0,0,0,0.3), inset -2.3cqw 0 4.6cqw rgba(0,0,0,0.3)",
              }}
            />

            {/* ── Overlay labels (like real booster pack) ── */}

            {/* Top-left: Pack ID */}
            <div
              className={"absolute z-10 rounded font-bold uppercase tracking-wider"}
              style={{
                top:            "3cqw",
                left:           "3cqw",
                padding:        "0.8cqw 2.3cqw",
                fontSize:       "4.5cqw",
                background:     "linear-gradient(135deg, rgba(0,0,0,0.7), rgba(20,10,30,0.7))",
                backdropFilter: "blur(1.4cqw)",
                border:         "0.35cqw solid rgba(196,181,253,0.2)",
                textShadow:     "0 0.35cqw 0.7cqw rgba(0,0,0,0.6)",
              }}
            >
              <span
                style={{
                  background:           "linear-gradient(90deg, #c4b5fd, #f9a8d4, #a5f3fc, #ddd6fe, #c4b5fd)",
                  backgroundSize:       "200% 100%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor:  "transparent",
                  animation:            "pc-iridescent 4s linear infinite",
                  display:              "inline-block",
                  transformOrigin:      "center",
                }}
              >
                {pack.code}
              </span>
            </div>

            {/* Top-right: Info button */}
            {onInfo && (
              <GameButton
                className={"absolute z-10 !min-w-0 !p-0"}
                style={{
                  top:    "3cqw",
                  right:  "3cqw",
                  width:  "12.3cqw",
                  height: "12.3cqw",
                }}
                variant={"default"}
                onClick={(e) => {
                  e.stopPropagation()
                  onInfo()
                }}
              >
                <Info style={{ width: "6.2cqw", height: "6.2cqw" }} />
              </GameButton>
            )}

            {/* Dark gradient at top */}
            <div
              className={"absolute inset-x-0 top-0"}
              style={{
                height:     "30.8cqw",
                background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 40%, transparent 100%)",
              }}
            />

            {/* Dark gradient at bottom */}
            <div
              className={"absolute inset-x-0 bottom-0"}
              style={{
                height:     "49.2cqw",
                background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)",
              }}
            />

            {/* Pack name */}
            <div className={"absolute inset-x-0"} style={{ bottom: "21.5cqw", padding: "0 6.2cqw" }}>
              <h3
                className={"text-center font-extrabold uppercase tracking-wider text-white"}
                style={{
                  fontSize:   "6.2cqw",
                  textShadow: "0 0.7cqw 3.5cqw rgba(0,0,0,0.9), 0 0 10.4cqw rgba(0,0,0,0.6)",
                }}
              >
                {pack.name}
              </h3>
            </div>

            {/* Bottom row: card count (left) + brand (right) */}
            <div
              className={"absolute inset-x-0 z-10 flex items-end justify-between"}
              style={{ bottom: "10cqw", padding: "0 4.6cqw" }}
            >
              {/* Total cards (left) + card count (right) */}
              <div className={"flex items-baseline"} style={{ gap: "3cqw" }}>
                <span
                  className={"font-black leading-none"}
                  style={{
                    fontSize:         "9.2cqw",
                    color:            "#000",
                    WebkitTextStroke: "1cqw #fff",
                    textShadow:       "0 0.35cqw 1.4cqw rgba(0,0,0,0.6)",
                    paintOrder:       "stroke fill",
                  }}
                >
                  {`${pack.total_cards}T`}
                </span>

                <span
                  className={"font-black leading-none"}
                  style={{
                    fontSize:         "9.2cqw",
                    color:            "#000",
                    WebkitTextStroke: "1cqw #fff",
                    textShadow:       "0 0.35cqw 1.4cqw rgba(0,0,0,0.6)",
                    paintOrder:       "stroke fill",
                  }}
                >
                  {`${pack.cards_per_pull}C`}
                </span>
              </div>

              {/* Brand monogram */}
              <BrandMonogram />
            </div>

            {/* Barcode + fine print row */}
            <div
              className={"absolute inset-x-0 z-10 flex items-end justify-between"}
              style={{ bottom: "1.5cqw", padding: "0 4.6cqw 1.5cqw" }}
            >
              <UuidBarcode uuid={pack.id} />

              <span
                className={"font-medium uppercase tracking-wider text-white/30"}
                style={{
                  fontSize:   "3cqw",
                  textShadow: "0 0.35cqw 0.7cqw rgba(0,0,0,0.8)",
                }}
              >
                © ZAKIPEACHF 2026
              </span>
            </div>
          </div>

          {/* Sealed bottom edge */}
          <div
            className={"relative z-10 overflow-hidden rounded-b-[3cqw]"}
            style={{
              height:     "4.6cqw",
              background: "linear-gradient(0deg, #e8e8ec 0%, #d0d0d8 10%, #b8b8c4 25%, #8888a0 50%, #585870 75%, #303048 100%)",
            }}
          >
            {/* Embossed dot texture */}
            <div
              className={"pointer-events-none absolute inset-0"}
              style={{
                backgroundImage:  "radial-gradient(circle, rgba(0,0,0,0.25) 0.4cqw, rgba(255,255,255,0.06) 0.4cqw, rgba(255,255,255,0.06) 0.7cqw, transparent 0.7cqw)",
                backgroundSize:   "1.7cqw 1.7cqw",
                backgroundRepeat: "repeat",
              }}
            />

            {/* Iridescent overlay */}
            <div
              className={"pointer-events-none absolute inset-0"}
              style={{
                background:     IRIDESCENT_BG,
                backgroundSize: "200% 100%",
                animation:      "pc-iridescent 4s linear infinite",
                mixBlendMode:   "overlay",
                opacity:        0.5,
              }}
            />
          </div>

          {/* ── Shimmer / holo effects — clipped to pack shape ── */}
          <div className={"pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[3cqw]"}>
            {/* Prismatic holo — cursor-following, hover only */}
            <div
              className={"absolute inset-0"}
              ref={holoRef}
              style={{
                background:   HOLO_BG,
                mixBlendMode: "color-dodge",
                opacity:      0,
                transition:   "opacity 0.2s ease, filter 0.15s ease",
              }}
            />

            {/* Light streak — follows cursor X */}
            <div
              className={"absolute inset-y-0"}
              ref={streakRef}
              style={{
                width:      "23cqw",
                left:       "50%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                filter:     "blur(2.8cqw)",
                opacity:    0,
                transition: "opacity 0.3s ease",
              }}
            />

            {/* Idle holo shimmer sweep */}
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-300",
                hovered ? "opacity-0" : "opacity-100",
              )}
            >
              <div
                className={"absolute inset-0"}
                style={{
                  background:   HOLO_BG,
                  mixBlendMode: "color-dodge",
                  mask:         "linear-gradient(80deg, transparent 40%, black 48%, black 52%, transparent 60%)",
                  WebkitMask:   "linear-gradient(80deg, transparent 40%, black 48%, black 52%, transparent 60%)",
                  animation:    "pc-idle-shimmer 3.5s ease-in-out infinite",
                }}
              />
            </div>

            {/* Sparkle particles — visible on hover only */}
            {PACK_SPARKLES.map((s, i) => (
              <span
                className={cn(
                  "absolute rounded-full transition-opacity duration-300",
                  hovered ? "opacity-100" : "opacity-0",
                )}
                key={i}
                style={{
                  top:             s.top,
                  left:            "left" in s ? s.left : undefined,
                  right:           "right" in s ? s.right : undefined,
                  height:          s.size,
                  width:           s.size,
                  backgroundColor: s.bg,
                  boxShadow:       s.shadow,
                  animation:       `pc-sparkle 2s ease-in-out infinite ${s.delay}`,
                }}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Drop shadow */}
      <div
        className={"mx-auto mt-3 rounded-full opacity-30 blur-lg"}
        style={{
          height:     "6cqw",
          width:      "80%",
          background: "radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)",
        }}
      />
    </div>
  )
}
