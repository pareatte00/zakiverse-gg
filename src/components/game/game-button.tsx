import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"
import { type ButtonHTMLAttributes, forwardRef } from "react"

type GameButtonVariant = "default" | "ghost" | "amber" | "discord" | "danger"

const VARIANT_STYLES: Record<GameButtonVariant, { layout: string, base: string, shadow: string, hoverShadow: string }> = {
  default: {
    layout:      "rounded-lg px-6 py-4 font-semibold",
    base:        "bg-stone-700 text-stone-100",
    shadow:      "shadow-[0_4px_0_0_rgba(87,83,78,0.9)]",
    hoverShadow: "hover:shadow-[0_4px_0_0_rgba(87,83,78,0.9),0_8px_16px_rgba(0,0,0,0.2)]",
  },
  ghost: {
    layout:      "rounded-lg px-3 py-2 text-sm font-normal",
    base:        "border border-zinc-700/50 bg-zinc-800/60 text-zinc-400",
    shadow:      "shadow-[0_4px_0_0_rgba(63,63,70,0.7)]",
    hoverShadow: "hover:text-zinc-200 hover:shadow-[0_4px_0_0_rgba(63,63,70,0.7),0_8px_16px_rgba(0,0,0,0.15)]",
  },
  amber: {
    layout:      "rounded-lg px-3 py-2.5 text-sm font-semibold",
    base:        "bg-amber-500/10 text-amber-400",
    shadow:      "shadow-[0_4px_0_0_rgba(120,53,15,0.4)]",
    hoverShadow: "hover:bg-amber-500/15 hover:text-amber-300 hover:shadow-[0_4px_0_0_rgba(120,53,15,0.4),0_8px_16px_rgba(245,158,11,0.1)]",
  },
  discord: {
    layout:      "rounded-2xl px-6 py-4 font-semibold",
    base:        "bg-[#5865F2] text-white",
    shadow:      "shadow-[0_4px_0_0_#4752C4]",
    hoverShadow: "hover:shadow-[0_4px_0_0_#4752C4,0_8px_16px_rgba(88,101,242,0.3)]",
  },
  danger: {
    layout:      "rounded-2xl px-6 py-4 font-semibold",
    base:        "bg-red-400/20 text-red-300",
    shadow:      "shadow-[0_4px_0_0_rgba(127,29,29,0.5)]",
    hoverShadow: "hover:shadow-[0_4px_0_0_rgba(127,29,29,0.5),0_8px_16px_rgba(248,113,113,0.15)]",
  },
}

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GameButtonVariant
  asChild?: boolean
  pressed?: boolean
}

export const GameButton = forwardRef<HTMLButtonElement, GameButtonProps>(({ className, variant = "default", asChild = false, pressed = false, ...props }, ref) => {
  const styles = VARIANT_STYLES[variant]
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(
        "flex items-center justify-center gap-2",
        styles.layout,
        styles.base,
        "transition-all duration-50",
        "disabled:pointer-events-none disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none",
        pressed
          ? "translate-y-[4px] shadow-none"
          : cn(
            styles.shadow,
            styles.hoverShadow,
            "active:translate-y-[4px] active:shadow-none",
          ),
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})

GameButton.displayName = "GameButton"

interface GameButtonGroupOption<T extends string> {
  value:              T
  label:              string
  selectedClassName?: string
}

interface GameButtonGroupProps<T extends string> {
  options:    GameButtonGroupOption<T>[]
  value:      T
  onChange:   (value: T) => void
  variant?:   GameButtonVariant
  className?: string
}

export function GameButtonGroup<T extends string>({ options, value, onChange, variant = "ghost", className }: GameButtonGroupProps<T>) {
  return (
    <div className={cn("flex flex-wrap", className)}>
      {options.map((opt, i) => {
        const isSelected = value === opt.value

        return (
          <GameButton
            className={cn(
              i === 0
                ? "rounded-r-none"
                : i === options.length - 1
                  ? "-ml-px rounded-l-none"
                  : "-ml-px rounded-none",
              isSelected && opt.selectedClassName,
            )}
            key={opt.value}
            pressed={isSelected}
            variant={variant}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </GameButton>
        )
      })}
    </div>
  )
}
