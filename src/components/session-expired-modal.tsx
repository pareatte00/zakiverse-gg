"use client"

import { GameButton } from "@/components/game/game-button"
import { DiscordLogoIcon } from "@radix-ui/react-icons"
import { ShieldAlert } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?${new URLSearchParams({
  client_id:     process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
  redirect_uri:  process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI!,
  response_type: "code",
  scope:         "identify email",
}).toString()}`

export function SessionExpiredModal() {
  const [ open, setOpen ] = useState(false)

  useEffect(() => {
    function handleExpired() {
      setOpen(true)
    }

    window.addEventListener("zakiverse:session-expired", handleExpired)

    return () => window.removeEventListener("zakiverse:session-expired", handleExpired)
  }, [])

  if (!open) return null

  return (
    <div className={"fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"}>
      <div className={"mx-4 w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl"}>
        <ShieldAlert className={"mx-auto h-10 w-10 text-amber-400"} />
        <h2 className={"mt-4 text-lg font-bold text-zinc-100"}>Session Expired</h2>

        <p className={"mt-2 text-sm text-zinc-400"}>
          Your session has expired. Please log in again to continue.
        </p>

        <GameButton asChild className={"mt-6 w-full"} variant={"discord"}>
          <Link href={DISCORD_AUTH_URL}>
            <DiscordLogoIcon className={"h-5 w-5"} />
            Login with Discord
          </Link>
        </GameButton>
      </div>
    </div>
  )
}
