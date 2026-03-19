"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { PageProvider } from "@/lib/contexts/page-context"
import { useState } from "react"

export interface SidebarLayoutInject {
  mode: string
}

export default function SidebarLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [ isOpen, setIsOpen ] = useState(false)

  return (
    <PageProvider>
      <div className={"min-h-screen flex h-screen overflow-hidden"}>
        <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />

        <main className={"relative flex-1 w-full bg-background transition-all duration-200 overflow-x-hidden flex flex-col"}>
          <Header isOpen={isOpen} setIsOpen={setIsOpen} />

          <div className={"flex-1 px-3 py-3 overflow-auto"}>
            <div className={"mx-auto w-full h-full"}>
              {children}
            </div>
          </div>
        </main>

        <Toaster position={"bottom-right"} />
      </div>
    </PageProvider>
  )
}
