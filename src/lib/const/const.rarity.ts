import type { Rarity } from "@/components/game/game-card"

export const RARITIES: Rarity[] = [ "common", "rare", "epic", "legendary", "prismatic" ]

export const RARITY_COLORS: Record<Rarity, { bg: string, text: string, shadow: string, hoverShadow: string, label: string }> = {
  common:    { bg: "bg-stone-500/10", text: "text-stone-400", shadow: "shadow-[0_3px_0_0_rgba(87,83,78,0.6)]", hoverShadow: "hover:shadow-[0_3px_0_0_rgba(87,83,78,0.6),0_6px_12px_rgba(0,0,0,0.15)]", label: "Common" },
  rare:      { bg: "bg-blue-500/10", text: "text-blue-400", shadow: "shadow-[0_3px_0_0_rgba(29,78,216,0.6)]", hoverShadow: "hover:shadow-[0_3px_0_0_rgba(29,78,216,0.6),0_6px_12px_rgba(59,130,246,0.15)]", label: "Rare" },
  epic:      { bg: "bg-purple-500/10", text: "text-purple-400", shadow: "shadow-[0_3px_0_0_rgba(107,33,168,0.6)]", hoverShadow: "hover:shadow-[0_3px_0_0_rgba(107,33,168,0.6),0_6px_12px_rgba(168,85,247,0.15)]", label: "Epic" },
  legendary: { bg: "bg-amber-500/10", text: "text-amber-400", shadow: "shadow-[0_3px_0_0_rgba(120,53,15,0.6)]", hoverShadow: "hover:shadow-[0_3px_0_0_rgba(120,53,15,0.6),0_6px_12px_rgba(245,158,11,0.15)]", label: "Legendary" },
  prismatic: { bg: "bg-cyan-500/10", text: "text-cyan-300", shadow: "shadow-[0_3px_0_0_rgba(14,116,144,0.6)]", hoverShadow: "hover:shadow-[0_3px_0_0_rgba(14,116,144,0.6),0_6px_12px_rgba(34,211,238,0.15)]", label: "Prismatic" },
}
