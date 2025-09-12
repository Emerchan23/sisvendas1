'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Usuario {
  id: string
  nome: string
  email: string
  role: string
  ativo: boolean
  permissoes: Record<string, boolean>
  ultimo_login?: string
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  usuario: Usuario | null
  token: string | null
  login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
  hasPermission: (permission: string) => boolean
  isAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Verificar se há token salvo no localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    if (savedToken) {
      setToken(savedToken)
      verificarToken(savedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  // Função para verificar se o token ainda é válido
  const verificarToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsuario(data.usuario)
      } else {
        // Token inválido, remover
        localStorage.removeItem('auth_token')
        setToken(null)
        setUsuario(null)
      }
    } catch (error) {
      console.error('Erro ao verificar token:', error)
      localStorage.removeItem('auth_token')
      setToken(null)
      setUsuario(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Função de login
  const login = async (email: string, senha: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setToken(data.token)
        setUsuario(data.usuario)
        localStorage.setItem('auth_token', data.token)
        return { success: true }
      } else {
        return { success: false, error: data.error || 'Erro no login' }
      }
    } catch (error) {
      console.error('Erro no login:', error)
      return { success: false, error: 'Erro de conexão' }
    }
  }

  // Função de logout
  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Erro no logout:', error)
    } finally {
      setToken(null)
      setUsuario(null)
      localStorage.removeItem('auth_token')
    }
  }

  // Verificar se usuário tem uma permissão específica
  const hasPermission = (permission: string): boolean => {
    if (!usuario) return false
    if (usuario.role === 'admin') return true
    return usuario.permissoes[permission] === true
  }

  // Verificar se usuário é admin
  const isAdmin = (): boolean => {
    return usuario?.role === 'admin'
  }

  const value: AuthContextType = {
    usuario,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!usuario,
    hasPermission,
    isAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}