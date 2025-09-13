'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, LogIn, Shield, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [lembrarMe, setLembrarMe] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  
  const { login, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    if (!email || !senha) {
      setErro('Por favor, preencha todos os campos')
      setCarregando(false)
      return
    }

    try {
      const resultado = await login(email, senha, lembrarMe)
      
      if (resultado.success) {
        router.push('/')
      } else {
        setErro(resultado.error || 'Erro no login')
      }
    } catch (error) {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-2xl mx-auto mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
          <p className="text-slate-600 font-medium">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-2xl mx-auto mb-6">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Sistema de Gestão
          </h1>
          <p className="text-slate-600 font-medium flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-500" />
            Faça login para acessar o sistema
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-8">
            <CardTitle className="flex items-center gap-3 text-2xl font-semibold">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm">
                <LogIn className="h-5 w-5 text-white" />
              </div>
              Login
            </CardTitle>
            <CardDescription className="text-blue-100 font-medium mt-2">
              Digite suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 bg-gradient-to-br from-white to-slate-50/50">
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <Alert variant="destructive">
                  <AlertDescription>{erro}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Label htmlFor="email" className="text-slate-700 font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  disabled={carregando}
                  className="border-2 border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-sm transition-all duration-300 focus:shadow-lg"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="senha" className="text-slate-700 font-semibold">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Sua senha"
                    required
                    disabled={carregando}
                    className="border-2 border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-sm transition-all duration-300 focus:shadow-lg pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    disabled={carregando}
                  >
                    {mostrarSenha ? (
                      <EyeOff className="h-4 w-4 text-slate-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-500" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="lembrar-me"
                  type="checkbox"
                  checked={lembrarMe}
                  onChange={(e) => setLembrarMe(e.target.checked)}
                  disabled={carregando}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="lembrar-me" className="text-sm text-slate-600 cursor-pointer">
                  Lembrar-me por 7 dias
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-0"
                disabled={carregando}
              >
                {carregando ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-3" />
                    Entrar
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Credenciais padrão:
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-slate-700">
                  <span className="font-semibold text-blue-600">Email:</span> admin@sistema.com
                </p>
                <p className="text-slate-700">
                  <span className="font-semibold text-blue-600">Senha:</span> admin123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}