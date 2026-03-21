/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils"

type Rarity = "common" | "rare" | "epic" | "legendary"

const RARITY_CONFIG: Record<Rarity, { border: string, glow: string, dots: number }> = {
  common:    { border: "border-stone-600", glow: "", dots: 1 },
  rare:      { border: "border-blue-500", glow: "shadow-[0_0_8cqw_rgba(59,130,246,0.3)]", dots: 2 },
  epic:      { border: "border-purple-500", glow: "shadow-[0_0_8cqw_rgba(168,85,247,0.35)]", dots: 3 },
  legendary: { border: "border-amber-500", glow: "shadow-[0_0_10cqw_rgba(245,158,11,0.4),0_0_20cqw_rgba(245,158,11,0.15)]", dots: 4 },
}
const RARITY_DOT_COLOR: Record<Rarity, string> = {
  common:    "bg-stone-500",
  rare:      "bg-blue-400",
  epic:      "bg-purple-400",
  legendary: "bg-amber-400",
}

interface GameCardProps {
  name:       string
  image?:     string
  rarity?:    Rarity
  className?: string
}

export function GameCard({ name, image, rarity = "common", className }: GameCardProps) {
  const config = RARITY_CONFIG[rarity]
  const dotColor = RARITY_DOT_COLOR[rarity]

  return (
    <div
      className={cn("aspect-[2/3] w-40", className)}
      style={{ containerType: "inline-size" }}
    >
      <div
        className={cn(
          "flex h-full flex-col rounded-[8cqw] p-[3cqw]",
          "bg-stone-900",
          config.border,
          config.glow,
        )}
        style={{ borderWidth: "1.5cqw" }}
      >
        {/* Art area */}
        <div className={"relative flex-1 overflow-hidden rounded-[6cqw] bg-stone-800"}>
          {image
            ? (
              <img
                alt={name}
                className={"h-full w-full object-cover"}
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

        {/* Info strip */}
        <div
          className={"flex items-center justify-between"}
          style={{ padding: "3cqw 2cqw 0" }}
        >
          <span
            className={"truncate font-medium leading-none text-stone-300"}
            style={{ fontSize: "6cqw" }}
          >
            {name}
          </span>

          <div className={"flex shrink-0"} style={{ gap: "1.5cqw" }}>
            {Array.from({ length: config.dots }, (_, i) => (
              <span
                className={cn("rounded-full", dotColor)}
                key={i}
                style={{ height: "3cqw", width: "3cqw" }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
