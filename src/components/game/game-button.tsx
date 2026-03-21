import { cn } from "@/lib/utils"
import { Slot } from "@radix-ui/react-slot"
import { type ButtonHTMLAttributes, forwardRef } from "react"

type GameButtonVariant = "default" | "discord" | "danger"

const VARIANT_STYLES: Record<GameButtonVariant, { base: string, shadow: string, hoverShadow: string }> = {
  default: {
    base:        "bg-stone-700 text-stone-100",
    shadow:      "shadow-[0_4px_0_0_rgba(41,37,36,0.95)]",
    hoverShadow: "hover:shadow-[0_6px_0_0_rgba(41,37,36,0.95),0_8px_16px_rgba(0,0,0,0.2)]",
  },
  discord: {
    base:        "bg-[#5865F2] text-white",
    shadow:      "shadow-[0_4px_0_0_#4752C4]",
    hoverShadow: "hover:shadow-[0_6px_0_0_#4752C4,0_8px_16px_rgba(88,101,242,0.3)]",
  },
  danger: {
    base:        "bg-red-400/20 text-red-300",
    shadow:      "shadow-[0_4px_0_0_rgba(127,29,29,0.5)]",
    hoverShadow: "hover:shadow-[0_6px_0_0_rgba(127,29,29,0.5),0_8px_16px_rgba(248,113,113,0.15)]",
  },
}

interface GameButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GameButtonVariant
  asChild?: boolean
}

export const GameButton = forwardRef<HTMLButtonElement, GameButtonProps>(({ className, variant = "default", asChild = false, ...props }, ref) => {
  const styles = VARIANT_STYLES[variant]
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      className={cn(
        "flex items-center justify-center gap-2 rounded-2xl px-6 py-4 font-semibold",
        styles.base,
        styles.shadow,
        "transition-all duration-150",
        "hover:-translate-y-0.5",
        styles.hoverShadow,
        "active:translate-y-[2px] active:shadow-[0_1px_0_0_rgba(28,25,23,0.95)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})

GameButton.displayName = "GameButton"
