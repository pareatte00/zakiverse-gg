"use client"

import { authDiscord } from "@/lib/api/db/api.auth"
import { Cookie } from "@/lib/const/const.cookie"
import { Private, Public } from "@/lib/const/const.url"
import { setCookie } from "@/lib/hook/cookie"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"

function CallbackHandler() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [ error, setError ] = useState("")
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return

    processed.current = true

    const code = searchParams.get("code")

    if (!code) {
      setError("No authorization code received from Discord.")

      return
    }

    authDiscord({ code })
      .then(async ({ response, status }) => {
        if (status >= 400 || !response?.payload?.access_token) {
          setError(response?.error?.message ?? "Authentication failed. Please try again.")

          return
        }

        await setCookie(Cookie.accessToken, response.payload.access_token)
        router.replace(Private.Home)
      })
      .catch(() => {
        setError("Something went wrong. Please try again.")
      })
  }, [ searchParams, router ])

  if (error) {
    return (
      <div className={"flex min-h-screen flex-col items-center justify-center px-8 text-center"}>
        <p className={"text-sm text-red-400"}>{error}</p>

        <a
          className={"mt-4 text-sm text-stone-400 underline underline-offset-4 transition-colors hover:text-stone-200"}
          href={Public.Login}
        >
          Back to login
        </a>
      </div>
    )
  }

  return (
    <div className={"flex min-h-screen items-center justify-center"}>
      <div className={"flex flex-col items-center gap-3"}>
        <div className={"h-6 w-6 animate-spin rounded-full border-2 border-stone-600 border-t-stone-300"} />
        <p className={"text-sm text-stone-500"}>Logging in...</p>
      </div>
    </div>
  )
}

export default function CallbackPage() {
  const fallback = (
    <div className={"flex min-h-screen items-center justify-center"}>
      <div className={"h-6 w-6 animate-spin rounded-full border-2 border-stone-600 border-t-stone-300"} />
    </div>
  )

  return (
    <Suspense fallback={fallback}>
      <CallbackHandler />
    </Suspense>
  )
}
