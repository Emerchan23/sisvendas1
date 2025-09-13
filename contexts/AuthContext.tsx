'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'

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
  login: (email: string, senha: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
  hasPermission: (permission: string) => boolean
  isAdmin: () => boolean
  sessionTimeLeft: number | null
  showExpirationWarning: boolean
  extendSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Configurações padrão de sessão (fallback)
const DEFAULT_SESSION_CONFIG = {
  CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutos
  WARNING_TIME: 5 * 60 * 1000, // 5 minutos antes da expiração
  NORMAL_EXPIRY: 2 * 60 * 60 * 1000, // 2 horas
  REMEMBER_ME_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 dias
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number | null>(null)
  const [showExpirationWarning, setShowExpirationWarning] = useState(false)
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null)
  const [sessionConfig, setSessionConfig] = useState(DEFAULT_SESSION_CONFIG)
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null)
  const warningShown = useRef(false)

  // Função para carregar configurações de autenticação
  const loadAuthConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/config/auth')
      if (response.ok) {
        const config = await response.json()
        setSessionConfig({
          CHECK_INTERVAL: config.sessionCheckInterval * 60 * 1000, // converter minutos para ms
          WARNING_TIME: config.warningTime * 60 * 1000, // converter minutos para ms
          NORMAL_EXPIRY: config.normalExpiryHours * 60 * 60 * 1000, // converter horas para ms
          REMEMBER_ME_EXPIRY: config.rememberMeExpiryDays * 24 * 60 * 60 * 1000, // converter dias para ms
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de autenticação:', error)
      // Manter configurações padrão em caso de erro
    }
  }, [])

  // Função para decodificar token e obter tempo de expiração
  const decodeToken = useCallback((token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return {
        exp: payload.exp * 1000, // Converter para milliseconds
        userId: payload.userId,
        email: payload.email,
        role: payload.role
      }
    } catch (error) {
      console.error('Erro ao decodificar token:', error)
      return null
    }
  }, [])

  // Função para calcular tempo restante da sessão
  const calculateTimeLeft = useCallback((expiry: number) => {
    return Math.max(0, expiry - Date.now())
  }, [])

  // Função para renovar token automaticamente
  const refreshToken = useCallback(async () => {
    if (!token) return false

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setToken(data.token)
        setUsuario(data.usuario)
        localStorage.setItem('auth_token', data.token)
        
        const decoded = decodeToken(data.token)
        if (decoded) {
          setTokenExpiry(decoded.exp)
          setShowExpirationWarning(false)
          warningShown.current = false
        }
        return true
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error)
    }
    return false
  }, [token, decodeToken])

  // Função para verificar expiração e renovar se necessário
  const checkTokenExpiration = useCallback(async () => {
    if (!tokenExpiry || !token) return

    const timeLeft = calculateTimeLeft(tokenExpiry)
    setSessionTimeLeft(timeLeft)

    // Se o token expirou, fazer logout
     if (timeLeft <= 0) {
       console.log('Token expirado, fazendo logout automático')
       await logout()
       return
     }

    // Se está próximo da expiração, mostrar aviso
    if (timeLeft <= sessionConfig.WARNING_TIME && !warningShown.current) {
      setShowExpirationWarning(true)
      warningShown.current = true
      console.log('Sessão expirará em breve, mostrando aviso')
    }

    // Se está muito próximo da expiração (1 minuto), tentar renovar automaticamente
    if (timeLeft <= 60000 && timeLeft > 0) {
      console.log('Tentando renovar token automaticamente')
      const renewed = await refreshToken()
      if (!renewed) {
         console.log('Falha na renovação automática, fazendo logout')
         await logout()
       }
    }
  }, [tokenExpiry, token, sessionConfig, calculateTimeLeft, refreshToken])

  // Função para estender sessão manualmente
  const extendSession = useCallback(async () => {
    const renewed = await refreshToken()
    if (renewed) {
      setShowExpirationWarning(false)
      warningShown.current = false
    }
  }, [refreshToken])

  // Iniciar verificação periódica da sessão
  const startSessionCheck = useCallback(() => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current)
    }
    
    sessionCheckInterval.current = setInterval(() => {
      checkTokenExpiration()
    }, sessionConfig.CHECK_INTERVAL)
  }, [sessionConfig, checkTokenExpiration])

  // Parar verificação da sessão
  const stopSessionCheck = useCallback(() => {
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current)
      sessionCheckInterval.current = null
    }
  }, [])

  // Carregar configurações de autenticação na inicialização
  useEffect(() => {
    loadAuthConfig()
  }, [loadAuthConfig])

  // Verificar se há token salvo no localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    if (savedToken) {
      setToken(savedToken)
      const decoded = decodeToken(savedToken)
      if (decoded && decoded.exp > Date.now()) {
        setTokenExpiry(decoded.exp)
        verificarToken(savedToken)
      } else {
        // Token expirado
        localStorage.removeItem('auth_token')
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [decodeToken])

  // Iniciar/parar verificação da sessão baseado no estado de autenticação
  useEffect(() => {
    if (usuario && token && tokenExpiry) {
      startSessionCheck()
      checkTokenExpiration() // Verificação inicial
    } else {
      stopSessionCheck()
      setSessionTimeLeft(null)
      setShowExpirationWarning(false)
    }

    return () => stopSessionCheck()
  }, [usuario, token, tokenExpiry, sessionConfig, startSessionCheck, stopSessionCheck, checkTokenExpiration])

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
  const login = async (email: string, senha: string, rememberMe: boolean = false): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha, rememberMe })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setToken(data.token)
        setUsuario(data.usuario)
        localStorage.setItem('auth_token', data.token)
        
        // Salvar preferência de "lembrar-me"
        if (rememberMe) {
          localStorage.setItem('remember_me', 'true')
        } else {
          localStorage.removeItem('remember_me')
        }
        
        // Decodificar token para obter expiração
        const decoded = decodeToken(data.token)
        if (decoded) {
          setTokenExpiry(decoded.exp)
        }
        
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
      // Limpar todos os estados
      setToken(null)
      setUsuario(null)
      setTokenExpiry(null)
      setSessionTimeLeft(null)
      setShowExpirationWarning(false)
      warningShown.current = false
      
      // Limpar localStorage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('remember_me')
      
      // Parar verificação da sessão
      stopSessionCheck()
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
    isAdmin,
    sessionTimeLeft,
    showExpirationWarning,
    extendSession
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