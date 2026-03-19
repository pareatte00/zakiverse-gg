"use client"

import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggler } from "@/components/theme-toggler"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MainConst } from "@/lib/const/const.extensions"
import { Route } from "@/lib/const/main/const.url"
import { usePageContext } from "@/lib/contexts/page-context"
import { deleteCookie } from "@/lib/hook/cookie"
import { useTranslation } from "@/lib/hook/use-translation"
import { LogOut, Menu, User, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { PageHeader } from "./page-header"

interface HeaderProps {
  isOpen:    boolean
  setIsOpen: (open: boolean) => void
}

export function Header({ isOpen, setIsOpen }: HeaderProps) {
  const [ showLogoutModal, setShowLogoutModal ] = useState(false)
  const t = useTranslation()
  const router = useRouter()
  const { pageTitle, pageSubtitle, backHref } = usePageContext()
  const handleLogout = async () => {
    try {
      // Clear the temporary key cookie
      await deleteCookie(MainConst.Cookie.temporaryKey)

      // Show success message
      toast.success(t("login.logoutSuccess"))

      // Redirect to login page
      router.push(Route.Public.Login)
    }
    catch {
      // Still redirect even if cookie deletion fails
      router.push(Route.Public.Login)
    }
  }
  const confirmLogout = () => {
    setShowLogoutModal(true)
  }

  return (
    <header className={`absolute bg-transparent! relative top-1 z-10 w-full px-3 py-3`}>
      <div className={"flex h-16 items-center justify-between px-4 bg-muted/10 rounded-2xl border-border/50 from-background/80 via-background/90 to-background/80 backdrop-blur-2xl shadow-sm dark:shadow-[0_6px_20px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.08)] transform-gpu transition-all duration-300"}>
        {/* Left side - Mobile menu toggle and Page Title */}
        <div className={"flex items-center gap-4"}>
          <Button
            className={"h-10 w-10 p-0 rounded-2xl cursor-pointer md:hidden"}
            size={"icon"}
            variant={"ghost"}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className={"h-4 w-4"} /> : <Menu className={"h-4 w-4"} />}
          </Button>

          {/* Page Title in Header */}
          {pageTitle && <PageHeader backHref={backHref || undefined} subtitle={pageSubtitle || undefined} title={pageTitle} />}
        </div>

        {/* Center - Spacer */}
        <div className={"flex-1"} />

        {/* Right side - Actions */}
        <div className={"flex items-center space-x-2"}>
          <LanguageSwitcher />
          <ThemeToggler />

          {/* <Link href={"/settings"}>
            <Button
              className={"shrink-0"}
              size={"icon"}
              variant={"ghost"}
            >
              <Settings className={"h-4 w-4"} />
            </Button>
          </Link> */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className={"cursor-pointer shrink-0 h-10 w-10 p-0 rounded-2xl ring-0 hover:bg-accent/50 transition-all duration-200"}
                size={"icon"}
                variant={"ghost"}
              >
                <User className={"h-4 w-4"} />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align={"end"} className={"w-48"}>
              {/* <DropdownMenuItem asChild>
                <Link className={"flex items-center"} href={"/profile"}>
                  <User className={"h-4 w-4 mr-2"} />
                  {t("common.profile")}
                </Link>
              </DropdownMenuItem> */}

              <DropdownMenuItem
                className={"cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"}
                onClick={confirmLogout}
              >
                <LogOut className={"h-4 w-4 mr-2"} />
                {t("login.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("login.logout")}</DialogTitle>

            <DialogDescription>
              {t("login.logoutConfirm")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant={"outline"} onClick={() => setShowLogoutModal(false)}>
              {t("common.cancel")}
            </Button>

            <Button variant={"destructive"} onClick={handleLogout}>
              {t("login.logout")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
