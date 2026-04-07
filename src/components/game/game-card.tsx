/* eslint-disable @next/next/no-img-element */
"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"

export type Rarity = "common" | "rare" | "epic" | "legendary" | "prismatic"

interface RarityConfig {
  border:         string
  borderColor:    string
  borderWidth:    string
  glow:           string
  label:          string
  labelColor:     string
  nameColor:      string
  nameStyle?:     React.CSSProperties
  pulseGlow:      string
  rainbowBorder?: string
  shimmer:        boolean
  sparkles:       boolean
}

const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common: {
    border:      "border-stone-600",
    borderColor: "border-stone-600",
    borderWidth: "2.5cqw",
    glow:        "",
    label:       "CORE",
    labelColor:  "text-stone-500",
    nameColor:   "text-stone-400",
    pulseGlow:   "",
    shimmer:     false,
    sparkles:    false,
  },
  rare: {
    border:      "border-blue-500",
    borderColor: "border-blue-500",
    borderWidth: "2.5cqw",
    glow:        "shadow-[0_0_12px_rgba(59,130,246,0.4),0_0_24px_rgba(59,130,246,0.15)]",
    label:       "FLUX",
    labelColor:  "text-blue-400",
    nameColor:   "text-blue-400",
    pulseGlow:   "",
    shimmer:     false,
    sparkles:    false,
  },
  epic: {
    border:        "border-transparent",
    borderColor:   "border-purple-500",
    borderWidth:   "2.5cqw",
    glow:          "shadow-[0_0_12px_rgba(168,85,247,0.3)]",
    label:         "AURA",
    labelColor:    "text-purple-400",
    nameColor:     "text-purple-400",
    pulseGlow:     "0 0 20px rgba(168,85,247,0.6), 0 0 40px rgba(168,85,247,0.25)",
    rainbowBorder: "linear-gradient(135deg, #a855f7, #7c3aed, #c084fc, #a855f7)",
    shimmer:       false,
    sparkles:      false,
  },
  legendary: {
    border:        "border-transparent",
    borderColor:   "border-amber-500",
    borderWidth:   "2.5cqw",
    glow:          "shadow-[0_0_12px_rgba(245,158,11,0.3)]",
    label:         "ZENITH",
    labelColor:    "text-amber-400",
    nameColor:     "text-amber-400",
    pulseGlow:     "0 0 24px rgba(245,158,11,0.6), 0 0 48px rgba(245,158,11,0.3), 0 0 72px rgba(245,158,11,0.1)",
    rainbowBorder: "linear-gradient(135deg, #ef4444, #f59e0b, #fde68a, #f59e0b, #ef4444)",
    shimmer:       true,
    sparkles:      false,
  },
  prismatic: {
    border:      "border-transparent",
    borderColor: "border-cyan-400",
    borderWidth: "2.5cqw",
    glow:        "shadow-[0_0_12px_rgba(34,211,238,0.3)]",
    label:       "ETHER",
    labelColor:  "text-cyan-300",
    nameColor:   "",
    nameStyle:   {
      background:           "linear-gradient(90deg, #c4b5fd, #f9a8d4, #a5f3fc, #ddd6fe, #c4b5fd)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor:  "transparent",
      animation:            "gc-rainbow 4s linear infinite",
    },
    pulseGlow:     "0 0 24px rgba(34,211,238,0.6), 0 0 48px rgba(232,121,249,0.35), 0 0 72px rgba(34,211,238,0.15)",
    rainbowBorder: "conic-gradient(from 0deg, #c4b5fd, #f9a8d4, #a5f3fc, #ddd6fe, #fbcfe8, #99f6e4, #c4b5fd)",
    shimmer:       true,
    sparkles:      true,
  },
}
const HOLO_BG = "linear-gradient(135deg, #c4b5fd40, #f9a8d440, #a5f3fc40, #ddd6fe40, #fbcfe840, #99f6e440, #c4b5fd40)"
const SPARKLES = [
  { top: "10%", right: "6%", size: 8, bg: "#67e8f9", shadow: "0 0 8px 3px rgba(34,211,238,0.7)", delay: "0s" },
  { top: "50%", left: "4%", size: 6, bg: "#f0abfc", shadow: "0 0 8px 3px rgba(232,121,249,0.7)", delay: "0.7s" },
  { top: "78%", right: "10%", size: 5, bg: "#a5f3fc", shadow: "0 0 6px 3px rgba(34,211,238,0.6)", delay: "1.4s" },
  { top: "30%", left: "8%", size: 4, bg: "#e9d5ff", shadow: "0 0 6px 3px rgba(232,121,249,0.6)", delay: "2.1s" },
]
const CARD_KEYFRAMES = `
@keyframes gc-glow-pulse {
  0%, 100% { opacity: 0.3; }
  50%      { opacity: 1; }
}
@keyframes gc-shimmer {
  0%   { left: -50%; }
  100% { left: 150%; }
}
@keyframes gc-sparkle {
  0%, 100% { margin-top: 0px; opacity: 0.9; }
  50%      { margin-top: -14px; opacity: 0.2; }
}
@keyframes gc-rainbow {
  0%   { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}
@keyframes gc-fade-in {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes gc-slide-text {
  0%, 20%  { transform: translateX(0); }
  40%, 80% { transform: translateX(var(--gc-slide, 0px)); }
  100%     { transform: translateX(0); }
}
`

function SlidingText({ children, className, containerClassName, hovered, style }: {
  children:            React.ReactNode
  className?:          string
  containerClassName?: string
  hovered?:            boolean
  style?:              React.CSSProperties
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [ slideDistance, setSlideDistance ] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    const text = textRef.current
    if (!container || !text) return

    function check() {
      const diff = text!.scrollWidth - container!.clientWidth

      setSlideDistance(diff > 0 ? diff : 0)
    }

    check()
    const observer = new ResizeObserver(check)

    observer.observe(container)

    return () => observer.disconnect()
  }, [ children ])

  const shouldSlide = hovered && slideDistance > 0

  return (
    <span className={cn("overflow-hidden", containerClassName)} ref={containerRef}>
      <span
        className={cn("inline-block whitespace-nowrap", className)}
        ref={textRef}
        style={{
          ...style,
          "--gc-slide": slideDistance > 0 ? `-${slideDistance + 4}px` : undefined,
          animation:    shouldSlide ? "gc-slide-text 10s linear infinite" : undefined,
          transform:    !shouldSlide ? "translateX(0)" : undefined,
          transition:   !shouldSlide ? "transform 0.3s ease" : undefined,
        } as React.CSSProperties}
      >
        {children}
      </span>
    </span>
  )
}

interface GameCardProps {
  actions?:         React.ReactNode
  anime?:           string
  backgroundImage?: string
  className?:       string
  image?:           string
  name:             string
  noModal?:         boolean
  rarity?:          Rarity
  static?:          boolean
}

export function GameCard({ name, anime, image, backgroundImage, rarity = "common", className, actions, noModal = false, static: isStatic = false }: GameCardProps) {
  const config = RARITY_CONFIG[rarity]
  const cardRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLImageElement>(null)
  const fgRef = useRef<HTMLImageElement>(null)
  const shimmerRef = useRef<HTMLDivElement>(null)
  const [ expanded, setExpanded ] = useState(false)
  const [ hovered, setHovered ] = useState(false)
  const touchActiveRef = useRef(false)
  const touchTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  function handleExpand() {
    const card = cardRef.current

    if (card) {
      card.style.transform = ""
      card.style.transition = ""
    }

    setExpanded(true)
  }

  function handleTouchStart() {
    touchTimerRef.current = setTimeout(() => {
      touchActiveRef.current = true
    }, 100)
  }

  function handleTouchEnd() {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current)

    touchActiveRef.current = false
    resetTilt()
  }

  function applyTilt(clientX: number, clientY: number) {
    const card = cardRef.current
    if (!card) return

    if (!hovered) setHovered(true)

    const rect = card.getBoundingClientRect()
    const x = clientX - rect.left
    const y = clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const maxAngle = 15
    const rotateY = Math.max(-maxAngle, Math.min(maxAngle, ((x - centerX) / centerX) * maxAngle))
    const rotateX = Math.max(-maxAngle, Math.min(maxAngle, ((centerY - y) / centerY) * maxAngle))

    card.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    card.style.transition = "transform 0.1s ease"

    if (bgRef.current) {
      const bx = ((x - centerX) / centerX) * -4
      const by = ((y - centerY) / centerY) * -4
      bgRef.current.style.transform = `scale(1.15) translate(${bx}px, ${by}px)`
    }

    if (fgRef.current) {
      const fx = ((x - centerX) / centerX) * 8
      const fy = ((y - centerY) / centerY) * 8
      fgRef.current.style.transform = `scale(1.1) translate(${fx}px, ${fy}px)`
    }

    if (shimmerRef.current) {
      const hue = ((x / rect.width) + (y / rect.height)) * 180
      shimmerRef.current.style.filter = `hue-rotate(${hue}deg)`
      shimmerRef.current.style.opacity = "1"
    }
  }

  function resetTilt() {
    setHovered(false)

    const card = cardRef.current
    if (!card) return

    card.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg)"
    card.style.transition = "transform 0.3s ease-out"

    if (bgRef.current) {
      bgRef.current.style.transform = "scale(1.15) translate(0px, 0px)"
      bgRef.current.style.transition = "transform 0.3s ease-out"
    }

    if (fgRef.current) {
      fgRef.current.style.transform = "scale(1.1) translate(0px, 0px)"
      fgRef.current.style.transition = "transform 0.3s ease-out"
    }

    if (shimmerRef.current) {
      shimmerRef.current.style.opacity = "0"
      shimmerRef.current.style.transition = "opacity 0.3s ease-out"
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    applyTilt(e.clientX, e.clientY)
  }

  function handleTouchMove(e: TouchEvent) {
    if (!touchActiveRef.current) return

    e.preventDefault()
    const touch = e.touches[0]
    if (touch) applyTilt(touch.clientX, touch.clientY)
  }

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    card.addEventListener("touchmove", handleTouchMove, { passive: false })

    return () => card.removeEventListener("touchmove", handleTouchMove)
  })

  return (
    <>
      <style>{CARD_KEYFRAMES}</style>
      {/* Grid placeholder when expanded */}
      {expanded && <div className={cn("aspect-[2/3] w-40", className)} />}

      {/* Dark backdrop */}
      {expanded && (
        <div
          className={"fixed inset-0 z-40 bg-black/70"}
          style={{ animation: "gc-fade-in 0.2s ease" }}
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Centering wrapper when expanded, transparent to layout when not */}
      <div className={cn(expanded ? "fixed inset-0 z-50 flex items-center justify-center pointer-events-none" : cn("contents", className))}>
        <div
          className={cn(
            "aspect-[2/3] pointer-events-auto",
            expanded
              ? "w-64"
              : cn("w-full", !isStatic && !noModal && "cursor-pointer"),
          )}
          ref={cardRef}
          style={{
            containerType:  "inline-size",
            transformStyle: "preserve-3d",
            animation:      expanded ? "gc-fade-in 0.2s ease" : undefined,
          }}
          onClick={!isStatic && !noModal && !expanded ? handleExpand : undefined}
          onMouseLeave={!isStatic ? resetTilt : undefined}
          onMouseMove={!isStatic ? handleMouseMove : undefined}
          onTouchEnd={!isStatic ? handleTouchEnd : undefined}
          onTouchStart={!isStatic ? handleTouchStart : undefined}
        >
          {/* Pulsing glow layer */}
          {config.pulseGlow && (
            <div
              className={"absolute inset-0 rounded-[8cqw]"}
              style={{
                boxShadow: config.pulseGlow,
                animation: "gc-glow-pulse 2s ease-in-out infinite",
              }}
            />
          )}

          {/* Rainbow border layer */}
          {config.rainbowBorder && (
            <div
              className={"absolute inset-0 rounded-[8cqw]"}
              style={{
                background: config.rainbowBorder,
                animation:  rarity === "prismatic" ? "gc-rainbow 4s linear infinite" : undefined,
              }}
            />
          )}

          {/* Card body */}
          <div
            className={cn(
              "relative h-full select-none overflow-hidden rounded-[8cqw]",
              "bg-stone-900",
              config.border,
              config.glow,
            )}
            style={{
              borderWidth:    config.borderWidth,
              backgroundClip: config.rainbowBorder ? "padding-box" : undefined,
            }}
          >
            {/* Dupe level badge */}

            {/* Art area */}
            <div className={"relative h-full overflow-hidden bg-stone-800"}>
              {backgroundImage && image
                ? (
                  <>
                    <img
                      alt={""}
                      className={"pointer-events-none absolute inset-0 h-full w-full object-cover"}
                      draggable={false}
                      ref={bgRef}
                      src={backgroundImage}
                      style={{ transform: "scale(1.15)", transition: "transform 0.1s ease" }}
                    />

                    <img
                      alt={name}
                      className={"pointer-events-none absolute inset-0 h-full w-full object-contain"}
                      draggable={false}
                      ref={fgRef}
                      src={image}
                      style={{ transform: "scale(1.1)", transition: "transform 0.1s ease" }}
                    />
                  </>
                )
                : image
                  ? (
                    <img
                      alt={name}
                      className={"pointer-events-none h-full w-full scale-105 object-cover"}
                      draggable={false}
                      src={image}
                    />
                  )
                  : (
                    <div className={"flex h-full items-center justify-center text-stone-700"}>
                      <svg
                        className={"h-1/3 w-1/3 opacity-30"}
                        fill={"none"}
                        stroke={"currentColor"}
                        strokeWidth={1}
                        viewBox={"0 0 24 24"}
                      >
                        <path
                          d={"M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0"}
                          strokeLinecap={"round"}
                          strokeLinejoin={"round"}
                        />
                      </svg>
                    </div>
                  )}
            </div>

            {/* Info overlay */}
            <div
              className={"relative pointer-events-none absolute inset-x-0 bottom-[50cqw]!"}
              style={{
                height:     "35%",
                background: "linear-gradient(to top, rgba(12,10,9,0.95) 0%, rgba(12,10,9,0.75) 45%, transparent 100%)",
              }}
            >
              <SlidingText
                className={cn("font-semibold leading-none", config.nameColor)}
                containerClassName={"absolute left-[5cqw] right-[5cqw] bottom-[13cqw]"}
                hovered={hovered}
                style={{
                  fontSize: "8cqw",
                  ...config.nameStyle,
                }}
              >
                {name}
              </SlidingText>

              {anime && (
                <SlidingText
                  className={"text-stone-500 italic leading-none"}
                  containerClassName={"absolute left-[5cqw] right-[5cqw] bottom-[5cqw]"}
                  hovered={hovered}
                  style={{ fontSize: "6cqw" }}
                >
                  {anime}
                </SlidingText>
              )}
            </div>

            {/* Holo color shift — follows cursor */}
            {config.shimmer && (
              <div
                className={"pointer-events-none absolute inset-0 rounded-[5cqw]"}
                ref={shimmerRef}
                style={{
                  background:   HOLO_BG,
                  mixBlendMode: "color-dodge",
                  opacity:      0,
                  transition:   "opacity 0.2s ease, filter 0.15s ease",
                }}
              />
            )}

            {/* Sparkle particles */}
            {config.sparkles && SPARKLES.map((s, i) => (
              <span
                className={"pointer-events-none absolute rounded-full"}
                key={i}
                style={{
                  top:             s.top,
                  left:            "left" in s ? s.left : undefined,
                  right:           "right" in s ? s.right : undefined,
                  height:          s.size,
                  width:           s.size,
                  backgroundColor: s.bg,
                  boxShadow:       s.shadow,
                  animation:       `gc-sparkle 2s ease-in-out infinite ${s.delay}`,
                }}
              />
            ))}

            {/* Actions overlay */}
            {actions && (
              <div className={"pointer-events-none absolute inset-0 z-20 opacity-0 transition-opacity [*:hover>&]:pointer-events-auto [*:hover>&]:opacity-100"}>
                <div className={"absolute right-[4cqw] top-[4cqw] flex flex-col gap-[2cqw]"}>
                  {actions}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
