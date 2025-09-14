'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AlertTriangle, Clock, RefreshCw } from 'lucide-react'

export function SessionExpirationWarning() {
  const { showExpirationWarning, sessionTimeLeft, extendSession, logout } = useAuth()

  if (!showExpirationWarning || !sessionTimeLeft) {
    return null
  }

  const minutes = Math.floor(sessionTimeLeft / 60000)
  const seconds = Math.floor((sessionTimeLeft % 60000) / 1000)

  const handleExtendSession = async () => {
    try {
      await extendSession()
    } catch (error) {
      console.error('Erro ao estender sessão:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Erro no logout:', error)
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Sessão Expirando
            </h3>
            <div className="mt-1 text-sm text-yellow-700">
              <p className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>
                  Sua sessão expirará em {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
              </p>
            </div>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleExtendSession}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Estender Sessão
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Sair Agora
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}