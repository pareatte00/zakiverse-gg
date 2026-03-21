"use client"

import { GameButton } from "@/components/game/game-button"
import { Cookie } from "@/lib/const/const.cookie"
import { Public } from "@/lib/const/const.url"
import { deleteCookie } from "@/lib/hook/cookie"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()

  async function handleLogout() {
    await deleteCookie(Cookie.accessToken)
    router.replace(Public.Login)
  }

  return (
    <div className={"p-4"}>
      <p className={"text-sm text-stone-500"}>Player profile goes here</p>

      <GameButton className={"mt-6 w-full"} variant={"danger"} onClick={handleLogout}>
        <LogOut className={"h-4 w-4"} />
        Logout
      </GameButton>
    </div>
  )
}
