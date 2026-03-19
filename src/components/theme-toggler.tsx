"use client"

import { Button } from "@/components/ui/button"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggler() {
  const { theme, setTheme } = useTheme()
  const [ mounted, setMounted ] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        disabled
        className={"cursor-pointer shrink-0 h-10 w-10 p-0 rounded-2xl"}
        size={"icon"}
        variant={"ghost"}
      >
        <Sun className={"h-4 w-4"} />
      </Button>
    )
  }

  return (
    <Button
      className={"cursor-pointer shrink-0 h-10 w-10 p-0 rounded-2xl"}
      size={"icon"}
      variant={"ghost"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark"
        ? (
          <Sun className={"h-4 w-4"} />
        )
        : (
          <Moon className={"h-4 w-4"} />
        )}

      <span className={"sr-only"}>Toggle Theme</span>
    </Button>
  )
}
