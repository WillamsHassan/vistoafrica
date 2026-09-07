import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import type { ReactNode } from 'react'

type AdminUser = {
  id: string
  email: string
  fullName: string
  role: string
}

type AdminAuthContextValue = {
  user: AdminUser | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'vistoafrica-admin-token'
const USER_KEY = 'vistoafrica-admin-user'

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem(STORAGE_KEY))
  const [user, setUser] = useState<AdminUser | null>(() => {
    const savedUser = localStorage.getItem(USER_KEY)
    return savedUser ? (JSON.parse(savedUser) as AdminUser) : null
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/admin/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Unauthorized')
        }

        const data = (await response.json()) as { data: AdminUser }
        setUser(data.data)
        localStorage.setItem(USER_KEY, JSON.stringify(data.data))
      } catch {
        setUser(null)
        setToken(null)
        localStorage.removeItem(STORAGE_KEY)
        localStorage.removeItem(USER_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchCurrentUser()
  }, [token])

  const login = async (email: string, password: string) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = (await response.json()) as {
      success?: boolean
      message?: string
      data?: { token: string; admin: AdminUser }
    }

    if (!response.ok || !data.success || !data.data) {
      throw new Error(data.message ?? 'Identifiants invalides.')
    }

    const nextToken = data.data.token
    const nextUser = data.data.admin

    setToken(nextToken)
    setUser(nextUser)
    localStorage.setItem(STORAGE_KEY, nextToken)
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(USER_KEY)
  }

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      user,
      token,
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)

  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }

  return context
}
