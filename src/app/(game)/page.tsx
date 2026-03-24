import { GameCard } from "@/components/game/game-card"

const ITADORI_IMAGE = "https://cdn.myanimelist.net/images/characters/6/467646.jpg"
const ITADORI_TRANSPARENT = "https://www.pngall.com/wp-content/uploads/15/Jujutsu-Kaisen-PNG-Clipart.png"
const JJK_BACKGROUND = "https://images2.alphacoders.com/114/1140467.jpg"

export default function HomePage() {
  return (
    <div className={"p-4"}>
      <h1 className={"text-xl font-bold text-stone-100"}>Home</h1>
      <p className={"mt-2 text-sm text-stone-500"}>Zakiverse</p>

      {/* All 5 rarities */}
      <div className={"mt-6"}>
        <h2 className={"mb-3 text-sm font-semibold text-stone-400"}>All Rarities</h2>

        <div className={"grid grid-cols-2 gap-6"}>
          <GameCard anime={"Jujutsu Kaisen"} className={"w-full"} image={ITADORI_IMAGE} name={"Itadori Yuuji"} rarity={"common"} />
          <GameCard anime={"Jujutsu Kaisen"} className={"w-full"} image={ITADORI_IMAGE} name={"Itadori Yuuji"} rarity={"rare"} />
          <GameCard anime={"Fullmetal Alchemist: Brotherhood"} className={"w-full"} image={ITADORI_IMAGE} name={"Edward Elric The Fullmetal Alchemist"} rarity={"epic"} />
          <GameCard anime={"Jujutsu Kaisen"} className={"w-full"} image={ITADORI_IMAGE} name={"Itadori Yuuji"} rarity={"legendary"} />
          <GameCard anime={"Jujutsu Kaisen"} backgroundImage={JJK_BACKGROUND} className={"w-full"} image={ITADORI_TRANSPARENT} name={"Itadori Yuuji"} rarity={"prismatic"} />
        </div>
      </div>
    </div>
  )
}
