"use client"

import { accountGetMe, type AccountMePayload } from "@/lib/api/db/api.account"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface UserContextValue {
  user:    AccountMePayload | null
  loading: boolean
}

const UserContext = createContext<UserContextValue>({ user: null, loading: true })

export function UserProvider({ children }: { children: ReactNode }) {
  const [ user, setUser ] = useState<AccountMePayload | null>(null)
  const [ loading, setLoading ] = useState(true)

  useEffect(() => {
    void accountGetMe().then(({ response, status }) => {
      if (status < 400 && response?.payload) {
        setUser(response.payload)
      }
    }).finally(() => setLoading(false))
  }, [])

  return (
    <UserContext value={{ user, loading }}>
      {children}
    </UserContext>
  )
}

export function useUser() {
  return useContext(UserContext)
}
