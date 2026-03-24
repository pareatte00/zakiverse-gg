"use client"

import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AnimeSearchTab } from "@/components/admin/cards/anime-search-tab"
import { CharacterSearchTab } from "@/components/admin/cards/character-search-tab"
import { GameButton } from "@/components/game/game-button"
import { Film, User } from "lucide-react"
import { useState } from "react"

type SearchTab = "character" | "anime"

export default function CardCreatePage() {
  const [ tab, setTab ] = useState<SearchTab>("character")

  return (
    <div className={"p-8"}>
      <AdminPageHeader description={"Search and select characters to create cards from."} title={"Create Cards"} />

      <div className={"mt-6 flex gap-2"}>
        <GameButton
          pressed={tab === "character"}
          variant={"ghost"}
          onClick={() => setTab("character")}
        >
          <User className={"h-4 w-4"} />
          By Character
        </GameButton>

        <GameButton
          pressed={tab === "anime"}
          variant={"ghost"}
          onClick={() => setTab("anime")}
        >
          <Film className={"h-4 w-4"} />
          By Anime
        </GameButton>
      </div>

      <div className={"mt-6"}>
        {tab === "character" ? <CharacterSearchTab /> : <AnimeSearchTab />}
      </div>
    </div>
  )
}
