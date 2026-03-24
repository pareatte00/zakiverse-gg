"use client"

import { GameButton } from "@/components/game/game-button"
import { useUser } from "@/components/provider/UserProvider"
import { Cookie } from "@/lib/const/const.cookie"
import { Private, Public } from "@/lib/const/const.url"
import { deleteCookie } from "@/lib/hook/cookie"
import { LogOut, UserStar } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useUser()
  const isAdmin = user?.role === "admin"

  async function handleLogout() {
    await deleteCookie(Cookie.accessToken)
    router.replace(Public.Login)
  }

  return (
    <div className={"p-4"}>
      <p className={"text-sm text-stone-500"}>Player profile goes here</p>

      {isAdmin && (
        <GameButton asChild className={"mt-6 w-full"} variant={"default"}>
          <Link href={Private.Admin}>
            <UserStar className={"h-4 w-4"} />
            Admin Dashboard
          </Link>
        </GameButton>
      )}

      <GameButton className={"mt-3 w-full"} variant={"danger"} onClick={handleLogout}>
        <LogOut className={"h-4 w-4"} />
        Logout
      </GameButton>
    </div>
  )
}
