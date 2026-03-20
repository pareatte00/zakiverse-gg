"use client"

import { GameHeader } from "@/components/game/game-header"
import { GameNavbar } from "@/components/game/game-navbar"

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={"flex min-h-screen justify-center bg-stone-950"}>
      {/* Phone-sized container */}
      <div className={"relative flex w-full max-w-[480px] flex-col bg-stone-900 shadow-[0_0_80px_rgba(0,0,0,0.8)]"}>
        <GameHeader />

        {/* Content area — pad bottom for navbar */}
        <main className={"flex-1 overflow-y-auto pb-20"}>
          {children}
        </main>

        <GameNavbar />
      </div>
    </div>
  )
}
