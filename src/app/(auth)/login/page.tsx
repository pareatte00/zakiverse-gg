import { GameButton } from "@/components/game/game-button"
import { DiscordLogoIcon } from "@radix-ui/react-icons"
import Link from "next/link"

const DISCORD_AUTH_URL = `https://discord.com/oauth2/authorize?${new URLSearchParams({
  client_id:     process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!,
  redirect_uri:  process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI!,
  response_type: "code",
  scope:         "identify",
}).toString()}`

export default function LoginPage() {
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
        <Link href={DISCORD_AUTH_URL}>
          <DiscordLogoIcon className={"h-5 w-5"} />
          Login with Discord
        </Link>
      </GameButton>

      {/* Footer */}
      <p className={"mt-12 text-xs text-stone-600"}>
        By logging in, you agree to our terms of service.
      </p>
    </div>
  )
}
