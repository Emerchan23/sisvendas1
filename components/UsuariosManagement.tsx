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
import { Plus, Edit, Trash2, User, Shield, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

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
  { id: 'fornecedores', label: 'Fornecedores' },
  
  { id: 'vales', label: 'Vale' },
  { id: 'relatorios', label: 'Relatórios' },
  { id: 'outros-negocios', label: 'Outros Negócios' },
  { id: 'orcamentos', label: 'Orçamentos' },
  { id: 'configuracoes', label: 'Configurações' },
  { id: 'usuarios', label: 'Gerenciar Usuários' }
]

export function UsuariosManagement() {
  const { usuario: usuarioLogado, isAuthenticated, isAdmin } = useAuth()
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && isAdmin()) {
      carregarUsuarios()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, isAdmin])

  const carregarUsuarios = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/usuarios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // A API retorna { success: true, usuarios: [...] }
        const usuariosComPermissoes = Array.isArray(data.usuarios) 
          ? data.usuarios.map((usuario: any) => {
              let permissoes = []
              if (usuario.permissoes) {
                let permissoesObj
                // Verificar se já é um objeto ou se é uma string JSON
                if (typeof usuario.permissoes === 'string') {
                  try {
                    permissoesObj = JSON.parse(usuario.permissoes)
                  } catch (e) {
                    console.error('Erro ao fazer parse das permissões:', e)
                    permissoesObj = {}
                  }
                } else {
                  permissoesObj = usuario.permissoes
                }
                // Converter objeto para array (pegar apenas as chaves onde o valor é true)
                permissoes = Object.keys(permissoesObj).filter(key => permissoesObj[key] === true)
              }
              return {
                ...usuario,
                permissoes
              }
            })
          : []
        setUsuarios(usuariosComPermissoes)
      } else {
        toast.error('Erro ao carregar usuários')
        setUsuarios([])
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }

  const salvarUsuario = async () => {
    if (loading) return
    
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('auth_token')
      if (!token) {
        toast.error('Token não encontrado')
        return
      }
      
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
        await carregarUsuarios()
      } else {
        const error = await response.json()
        const errorMsg = error.error || error.message || 'Erro ao salvar usuário'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      const errorMsg = 'Erro ao salvar usuário'
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const excluirUsuario = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return

    try {
      const token = localStorage.getItem('auth_token')
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
    // Garantir que as permissões sejam um array
    let permissoes = []
    if (usuario.permissoes) {
      if (Array.isArray(usuario.permissoes)) {
        permissoes = usuario.permissoes
      } else {
        let permissoesObj
        if (typeof usuario.permissoes === 'string') {
          try {
            permissoesObj = JSON.parse(usuario.permissoes)
          } catch (e) {
            console.error('Erro ao fazer parse das permissões na edição:', e)
            permissoesObj = {}
          }
        } else {
          permissoesObj = usuario.permissoes
        }
        permissoes = Object.keys(permissoesObj).filter(key => permissoesObj[key] === true)
      }
    }
    
    setUsuarioEditando(usuario)
    setNovoUsuario({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      role: usuario.role,
      ativo: usuario.ativo,
      permissoes
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

  // Verificar se o usuário tem permissão
  if (!isAuthenticated || !isAdmin()) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
          <p className="text-muted-foreground text-center">
            Você precisa ser administrador para gerenciar usuários.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Carregando usuários...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Gerencie usuários do sistema e suas permissões
              </CardDescription>
            </div>
            <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
              <DialogTrigger asChild>
                <Button onClick={resetarFormulario}>
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
                      value={novoUsuario.nome}
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
                      value={novoUsuario.email}
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
                        value={novoUsuario.senha}
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
                      value={novoUsuario.role}
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
                  {error && (
                    <div className="text-sm text-red-600 mb-2">
                      {error}
                    </div>
                  )}
                  <Button type="submit" onClick={salvarUsuario} disabled={loading}>
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>{usuarioEditando ? 'Atualizar' : 'Criar'} Usuário</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Array.isArray(usuarios) && usuarios.map((usuario, index) => (
              <Card key={usuario.id || `usuario-${index}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      {usuario.role === 'admin' ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{usuario.nome}</CardTitle>
                      <CardDescription>{usuario.email}</CardDescription>
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
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <p>Criado em: {formatarData(usuario.created_at)}</p>
                      {usuario.ultimo_login && (
                        <p>Último login: {formatarData(usuario.ultimo_login)}</p>
                      )}
                      <p>Permissões: {(usuario.permissoes || []).length} módulos</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editarUsuario(usuario)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      {usuario.id !== usuarioLogado?.id && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => excluirUsuario(usuario.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!Array.isArray(usuarios) || usuarios.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12">
              <User className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
              <p className="text-muted-foreground text-center mb-4">
                Comece criando o primeiro usuário do sistema.
              </p>
              <Button onClick={() => setDialogAberto(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Usuário
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}