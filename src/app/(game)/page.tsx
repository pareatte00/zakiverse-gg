"use client"

import { GameCard } from "@/components/game/game-card"
import { PackCard } from "@/components/game/pack-card"
import type { PackPayload } from "@/lib/api/db/api.pack"

const DEMO_PACK: PackPayload = {
  id:             "demo-1",
  code:           "JJK-001",
  name:           "Jujutsu Kaisen",
  description:    null,
  image:          "https://images4.alphacoders.com/125/1258153.jpg",
  name_image:     null,
  cards_per_pull: 5,
  sort_order:     0,
  config:         { rarity_rates: { common: 60, rare: 25, epic: 10, legendary: 4, prismatic: 1 }},
  pool_id:        "demo-pool",
  rotation_order: null,
  total_cards:    50,
}
const DEMO_CARD = {
  name:            "Gojo Satoru",
  anime:           "Jujutsu Kaisen",
  image:           "https://www.pngall.com/wp-content/uploads/15/Jujutsu-Kaisen-PNG-Clipart.png",
  backgroundImage: "https://images2.alphacoders.com/114/1140467.jpg",
}
const RARITIES = [ "common", "rare", "epic", "legendary", "prismatic" ] as const

function noop() {}

export default function HomePage() {
  return (
    <div className={"space-y-10 p-4"}>
      <div>
        <h1 className={"text-xl font-bold text-stone-100"}>Design Preview</h1>
      </div>

      {/* Pack */}
      <section>
        <h2 className={"mb-4 text-xs font-semibold uppercase tracking-wider text-stone-500"}>Pack</h2>
        <PackCard pack={DEMO_PACK} onClick={noop} />
      </section>

      {/* Cards */}
      <section>
        <h2 className={"mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500"}>Cards</h2>

        <div className={"flex flex-wrap gap-3"}>
          {RARITIES.map((r) => (
            <GameCard
              anime={DEMO_CARD.anime}
              backgroundImage={DEMO_CARD.backgroundImage}
              image={DEMO_CARD.image}
              key={r}
              name={DEMO_CARD.name}
              rarity={r}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
