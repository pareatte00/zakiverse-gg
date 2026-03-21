import { GameCard } from "@/components/game/game-card"

export default function HomePage() {
  return (
    <div className={"p-4"}>
      <h1 className={"text-xl font-bold text-stone-100"}>Home</h1>
      <p className={"mt-2 text-sm text-stone-500"}>Zakiverse</p>

      {/* Card preview — all rarities */}
      <div className={"mt-6"}>
        <h2 className={"mb-3 text-sm font-semibold text-stone-400"}>Card Preview</h2>

        <div className={"flex flex-wrap gap-3"}>
          <GameCard className={"w-[calc(50%-6px)]"} image={"https://cdn.myanimelist.net/images/characters/15/510471.jpg"} name={"Gojo Satoru"} rarity={"legendary"} />
          <GameCard className={"w-[calc(50%-6px)]"} image={"https://cdn.myanimelist.net/images/characters/6/467646.jpg"} name={"Itadori Yuuji"} rarity={"epic"} />
          <GameCard className={"w-[calc(50%-6px)]"} image={"https://cdn.myanimelist.net/images/characters/2/467647.jpg"} name={"Megumi Fushiguro"} rarity={"rare"} />
          <GameCard className={"w-[calc(50%-6px)]"} image={"https://cdn.myanimelist.net/images/characters/2/467648.jpg"} name={"Nobara Kugisaki"} rarity={"common"} />
        </div>
      </div>

      {/* Size comparison */}
      <div className={"mt-6"}>
        <h2 className={"mb-3 text-sm font-semibold text-stone-400"}>Size Scaling</h2>

        <div className={"flex items-end gap-3"}>
          <GameCard className={"w-16"} image={"https://cdn.myanimelist.net/images/characters/2/467647.jpg"} name={"Small"} rarity={"rare"} />
          <GameCard className={"w-28"} image={"https://cdn.myanimelist.net/images/characters/6/467646.jpg"} name={"Medium"} rarity={"epic"} />
          <GameCard className={"w-40"} image={"https://cdn.myanimelist.net/images/characters/15/510471.jpg"} name={"Large"} rarity={"legendary"} />
        </div>
      </div>
    </div>
  )
}
