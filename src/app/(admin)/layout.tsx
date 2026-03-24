"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { DraftSidebar } from "@/components/admin/cards/draft-sidebar"
import { UserProvider } from "@/components/provider/UserProvider"
import { CardCreationProvider } from "@/lib/context/card-creation-context"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <CardCreationProvider>
        <div className={"flex h-screen bg-zinc-950"}>
          <AdminSidebar />

          <main className={"flex-1 overflow-y-auto"}>
            {children}
          </main>

          <DraftSidebar />
        </div>
      </CardCreationProvider>
    </UserProvider>
  )
}
