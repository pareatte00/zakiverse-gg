"use client"

import { GameButton } from "@/components/game/game-button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { DiscordLogoIcon } from "@radix-ui/react-icons"
import { Shield } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?${new URLSearchParams({
  client_id:     process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
  redirect_uri:  process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI!,
  response_type: "code",
  scope:         "identify",
}).toString()}`

export default function LoginPage() {
  const [ adminLogin, setAdminLogin ] = useState(false)

  function handleLoginClick() {
    if (adminLogin) {
      localStorage.setItem("zakiverse_admin_login", "1")
    }
    else {
      localStorage.removeItem("zakiverse_admin_login")
    }
  }

  return (
    <div className={"flex min-h-screen flex-col items-center justify-center px-8"}>
      {/* Title */}
      <div className={"mb-16 text-center"}>
        <h1 className={"text-4xl font-bold tracking-wider text-stone-100"}>
          ZAKIVERSE
        </h1>

        <p className={"mt-2 text-sm tracking-widest text-stone-500"}>
          Collect. Battle. Trade.
        </p>
      </div>

      {/* Discord login button */}
      <GameButton asChild className={"w-full"} variant={"discord"}>
        <Link href={DISCORD_AUTH_URL} onClick={handleLoginClick}>
          <DiscordLogoIcon className={"h-5 w-5"} />
          Login with Discord
        </Link>
      </GameButton>

      {/* Admin login checkbox */}
      <Label
        className={"mt-6 flex cursor-pointer items-center gap-2 text-sm font-normal text-stone-500 transition-colors hover:text-stone-400"}
        htmlFor={"admin-login"}
      >
        <Checkbox
          checked={adminLogin}
          className={"border-stone-600 bg-stone-800 data-[state=checked]:bg-amber-500 data-[state=checked]:text-stone-900"}
          id={"admin-login"}
          onCheckedChange={(checked) => setAdminLogin(checked === true)}
        />

        <Shield className={"h-3.5 w-3.5"} />
        Sign in to Admin Dashboard
      </Label>

      {/* Footer */}
      <p className={"mt-12 text-xs text-stone-600"}>
        By logging in, you agree to our terms of service.
      </p>
    </div>
  )
}
