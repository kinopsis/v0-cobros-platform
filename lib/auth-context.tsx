"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import { Usuario, UserRole } from "./types"
import { mockUsuarios } from "./mock-data"

interface AuthContextType {
  user: Usuario | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  switchRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null)

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    // Simulación de autenticación
    const foundUser = mockUsuarios.find(u => u.email === email && u.activo)
    
    if (foundUser) {
      setUser(foundUser)
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setUser(null)
  }, [])

  // Para demo: permite cambiar de rol fácilmente
  const switchRole = useCallback((role: UserRole) => {
    const userOfRole = mockUsuarios.find(u => u.rol === role && u.activo)
    if (userOfRole) {
      setUser(userOfRole)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
