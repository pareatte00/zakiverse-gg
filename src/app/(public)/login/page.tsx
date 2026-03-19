"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { temporaryLogin } from "@/lib/api/db/api.week_period"
import { Route } from "@/lib/const/const.url"
import { setCookie } from "@/lib/hook/cookie"
import { HttpStatusCode } from "axios"
import { CheckCircle, Eye, EyeOff, Key, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [ tempKey, setTempKey ] = useState("")
  const [ isLoading, setIsLoading ] = useState(false)
  const [ showKey, setShowKey ] = useState(false)
  const [ error, setError ] = useState("")
  const [ isSuccess, setIsSuccess ] = useState(false)
  const [ countdown, setCountdown ] = useState(3)

  // Handle countdown after successful login
  useEffect(() => {
    if (isSuccess && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)

      return () => clearTimeout(timer)
    }
    else if (isSuccess && countdown === 0) {
      router.push(Route.Private.Overview)
    }
  }, [ isSuccess, countdown, router ])

  const handleLogin = async () => {
    if (!tempKey.trim()) {
      setError(t("login.enterKey"))

      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await temporaryLogin(tempKey.trim())

      if (response.status === HttpStatusCode.Ok) {
        // Save temporary key (uses default expiration from setCookie function)
        await setCookie(MainConst.Cookie.temporaryKey, tempKey.trim())

        // Show success state with countdown
        setIsSuccess(true)
        setIsLoading(false)
      }
      else {
        setError(t("login.invalidKey"))
        toast.error(t("login.authenticationFailed"))
      }
    }
    catch {
      setError(t("login.invalidKey"))
      toast.error(t("login.authenticationFailed"))
    }
    finally {
      setIsLoading(false)
    }
  }
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      void handleLogin()
    }
  }

  // Success state with countdown
  if (isSuccess) {
    return (
      <div className={"min-h-screen flex items-center justify-center bg-gray-50"}>
        <Card className={"w-full max-w-md"}>
          <CardHeader className={"text-center"}>
            <div className={"flex justify-center mb-4"}>
              <div className={"p-3 bg-green-100 rounded-full"}>
                <CheckCircle className={"h-8 w-8 text-green-600"} />
              </div>
            </div>

            <CardTitle className={"text-2xl text-green-800"}>{t("login.loginSuccessful")}</CardTitle>

            <CardDescription className={"text-green-600"}>
              {t("login.redirectingCountdown", { count: countdown.toString() })}
            </CardDescription>
          </CardHeader>

          <CardContent className={"text-center"}>
            <div className={"flex items-center justify-center space-x-2"}>
              <div className={"animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"}></div>
              <span className={"text-sm text-muted-foreground"}>{t("login.pleaseWait")}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Normal login state
  return (
    <div className={"min-h-screen flex items-center justify-center bg-gray-50"}>
      <Card className={"w-full max-w-md"}>
        <CardHeader className={"text-center"}>
          <div className={"flex justify-center mb-4"}>
            <div className={"p-3 bg-blue-100 rounded-full"}>
              <Key className={"h-8 w-8 text-blue-600"} />
            </div>
          </div>

          <CardTitle className={"text-2xl"}>{t("login.title")}</CardTitle>

          <CardDescription>
            {t("login.subtitle")}
          </CardDescription>
        </CardHeader>

        <CardContent className={"space-y-6"}>
          <div className={"space-y-2"}>
            <Label htmlFor={"temp-key"}>{t("login.temporaryKey")}</Label>

            <div className={"relative"}>
              <Input
                className={error ? "border-red-500" : ""}
                disabled={isLoading}
                id={"temp-key"}
                placeholder={t("login.temporaryKeyPlaceholder")}
                type={showKey ? "text" : "password"}
                value={tempKey}
                onChange={(e) => {
                  setTempKey(e.target.value)
                  setError("")
                }}
                onKeyDown={handleKeyPress}
              />

              <Button
                className={"absolute right-2 top-2 h-6 w-6 p-0"}
                disabled={isLoading}
                size={"sm"}
                type={"button"}
                variant={"ghost"}
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className={"h-3 w-3"} /> : <Eye className={"h-3 w-3"} />}
              </Button>
            </div>

            {error && (
              <p className={"text-sm text-red-600"}>{error}</p>
            )}
          </div>

          <Button
            className={"w-full"}
            disabled={!tempKey.trim() || isLoading}
            onClick={handleLogin}
          >
            {isLoading
              ? (
                <>
                  <div className={"animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"}></div>
                  {t("login.authenticating")}
                </>
              )
              : (
                <>
                  <LogIn className={"h-4 w-4 mr-2"} />
                  {t("login.login")}
                </>
              )}
          </Button>

          <div className={"text-center text-sm text-muted-foreground"}>
            <p>{t("login.needAccess")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
