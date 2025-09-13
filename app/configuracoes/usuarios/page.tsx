"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { Plus, Edit, Trash2, User, Shield, Eye, EyeOff, Save } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import ProtectedRoute from "@/components/ProtectedRoute"

interface Usuario {
  id: number
  nome: string
  email: string
  role: 'admin' | 'user'
  ativo: boolean
  permissoes: string[]
  ultimo_login?: string
  created_at: string
}

interface NovoUsuario {
  nome: string
  email: string
  senha: string
  role: 'admin' | 'user'
  ativo: boolean
  permissoes: string[]
}

const PERMISSOES_DISPONIVEIS = [
  { id: 'vendas', label: 'Vendas' },
  { id: 'acertos', label: 'Acertos' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'produtos', label: 'Produtos' },
  { id: 'vales', label: 'Vale' },
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'outros-negocios', label: 'Outros Negócios' },
  { id: 'orcamentos', label: 'Orçamentos' },
  { id: 'configuracoes', label: 'Configurações' },
  { id: 'usuarios', label: 'Gerenciar Usuários' }
]

export default function UsuariosPage() {
  const { usuario: usuarioLogado } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [novoUsuario, setNovoUsuario] = useState<NovoUsuario>({
    nome: '',
    email: '',
    senha: '',
    role: 'user',
    ativo: true,
    permissoes: []
  })

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const carregarUsuarios = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUsuarios(data)
      } else {
        toast.error('Erro ao carregar usuários')
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const salvarUsuario = async () => {
    try {
      const token = localStorage.getItem('token')
      const url = usuarioEditando ? `/api/usuarios/${usuarioEditando.id}` : '/api/usuarios'
      const method = usuarioEditando ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(novoUsuario)
      })

      if (response.ok) {
        toast.success(usuarioEditando ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!')
        setDialogAberto(false)
        resetarFormulario()
        carregarUsuarios()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao salvar usuário')
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      toast.error('Erro ao salvar usuário')
    }
  }

  const excluirUsuario = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/usuarios/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        toast.success('Usuário excluído com sucesso!')
        carregarUsuarios()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Erro ao excluir usuário')
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      toast.error('Erro ao excluir usuário')
    }
  }

  const editarUsuario = (usuario: Usuario) => {
    setUsuarioEditando(usuario)
    setNovoUsuario({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      role: usuario.role,
      ativo: usuario.ativo,
      permissoes: usuario.permissoes
    })
    setDialogAberto(true)
  }

  const resetarFormulario = () => {
    setUsuarioEditando(null)
    setNovoUsuario({
      nome: '',
      email: '',
      senha: '',
      role: 'user',
      ativo: true,
      permissoes: []
    })
    setMostrarSenha(false)
  }

  const togglePermissao = (permissaoId: string) => {
    setNovoUsuario(prev => ({
      ...prev,
      permissoes: prev.permissoes.includes(permissaoId)
        ? prev.permissoes.filter(p => p !== permissaoId)
        : [...prev.permissoes, permissaoId]
    }))
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <ProtectedRoute adminOnly>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Carregando usuários...</div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Gerenciar Usuários
            </h1>
            <p className="text-slate-600 mt-2">
              Gerencie usuários do sistema e suas permissões
            </p>
          </div>
          <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
            <DialogTrigger asChild>
              <Button 
                onClick={resetarFormulario}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>
                  {usuarioEditando ? 'Editar Usuário' : 'Novo Usuário'}
                </DialogTitle>
                <DialogDescription>
                  {usuarioEditando 
                    ? 'Edite as informações do usuário abaixo.'
                    : 'Preencha as informações para criar um novo usuário.'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="nome" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="nome"
                    value={novoUsuario.nome || ''}
                    onChange={(e) => setNovoUsuario(prev => ({ ...prev, nome: e.target.value }))}
                    className="col-span-3"
                    placeholder="Nome completo"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={novoUsuario.email || ''}
                    onChange={(e) => setNovoUsuario(prev => ({ ...prev, email: e.target.value }))}
                    className="col-span-3"
                    placeholder="email@exemplo.com"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="senha" className="text-right">
                    {usuarioEditando ? 'Nova Senha' : 'Senha'}
                  </Label>
                  <div className="col-span-3 relative">
                    <Input
                      id="senha"
                      type={mostrarSenha ? "text" : "password"}
                      value={novoUsuario.senha || ''}
                      onChange={(e) => setNovoUsuario(prev => ({ ...prev, senha: e.target.value }))}
                      placeholder={usuarioEditando ? "Deixe em branco para manter a atual" : "Digite a senha"}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                    >
                      {mostrarSenha ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Função
                  </Label>
                  <Select
                    value={novoUsuario.role || 'user'}
                    onValueChange={(value: 'admin' | 'user') => 
                      setNovoUsuario(prev => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ativo" className="text-right">
                    Ativo
                  </Label>
                  <div className="col-span-3">
                    <Switch
                      id="ativo"
                      checked={novoUsuario.ativo}
                      onCheckedChange={(checked) => 
                        setNovoUsuario(prev => ({ ...prev, ativo: checked }))
                      }
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right mt-2">
                    Permissões
                  </Label>
                  <div className="col-span-3 space-y-2">
                    {PERMISSOES_DISPONIVEIS.map((permissao) => (
                      <div key={permissao.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={permissao.id}
                          checked={novoUsuario.permissoes.includes(permissao.id)}
                          onCheckedChange={() => togglePermissao(permissao.id)}
                        />
                        <Label htmlFor={permissao.id} className="text-sm font-normal">
                          {permissao.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  onClick={salvarUsuario}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {usuarioEditando ? 'Atualizar' : 'Criar'} Usuário
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {usuarios.map((usuario) => (
            <Card key={usuario.id} className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden hover:shadow-3xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-gradient-to-r from-slate-50 to-blue-50/50">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg">
                    {usuario.role === 'admin' ? (
                      <Shield className="h-6 w-6 text-white" />
                    ) : (
                      <User className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold text-slate-800">{usuario.nome}</CardTitle>
                    <CardDescription className="text-slate-600 font-medium">{usuario.email}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={usuario.ativo ? "default" : "secondary"}>
                    {usuario.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Badge variant={usuario.role === 'admin' ? "destructive" : "outline"}>
                    {usuario.role === 'admin' ? 'Admin' : 'Usuário'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="bg-gradient-to-br from-white to-slate-50/50 p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p>Criado em: {formatarData(usuario.created_at)}</p>
                    {usuario.ultimo_login && (
                      <p>Último login: {formatarData(usuario.ultimo_login)}</p>
                    )}
                    <p>Permissões: {usuario.permissoes.length} módulos</p>
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editarUsuario(usuario)}
                      className="border-2 border-blue-200 hover:border-blue-300 bg-white/80 hover:bg-blue-50 text-blue-700 font-medium px-4 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    {usuario.id !== usuarioLogado?.id && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => excluirUsuario(usuario.id)}
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium px-4 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {usuarios.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-16 bg-gradient-to-br from-white to-slate-50/50">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg mb-6">
                <User className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-800 mb-3">Nenhum usuário encontrado</h3>
              <p className="text-slate-600 text-center mb-6 max-w-md">
                Comece criando o primeiro usuário do sistema para gerenciar acessos e permissões.
              </p>
              <Button 
                onClick={() => setDialogAberto(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Usuário
              </Button>
            </CardContent>
          </Card>
        )}
        </main>
      </div>
    </ProtectedRoute>
  )
}