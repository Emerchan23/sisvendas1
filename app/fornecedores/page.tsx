'use client'

import { useState, useEffect } from 'react'
import { AppHeader } from '@/components/app-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Plus, Search, Edit, Trash2, ExternalLink, MessageCircle, Eye, EyeOff, Key, Copy } from 'lucide-react'
import { api, type Fornecedor } from '@/lib/api-client'
import { ManageCategoriasDialog } from '@/components/manage-categorias-fornecedores-dialog'

interface Categoria {
  id: string
  nome: string
  cor: string
}

export default function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null)
  const [selectedCredentials, setSelectedCredentials] = useState<Fornecedor | null>(null)

  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    produtosServicos: '',
    telefone: '',
    siteUrl: '',
    usuarioLogin: '',
    senhaLogin: '',
    tagsBusca: '',
    observacoes: '',
    status: 'ativo' as 'ativo' | 'inativo'
  })

  const coresTags = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'
  ]

  const getTagColor = (index: number) => {
    return coresTags[index % coresTags.length]
  }

  useEffect(() => {
    loadFornecedores()
    loadCategorias()
  }, [])

  const loadCategorias = async () => {
    try {
      const response = await fetch('/api/categorias-fornecedores')
      if (response.ok) {
        const data = await response.json()
        setCategorias(data)
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const loadFornecedores = async () => {
    try {
      setLoading(true)
      const data = await api.fornecedores.list()
      setFornecedores(data)
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
      toast.error('Erro ao carregar fornecedores')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      if (editingFornecedor) {
        await api.fornecedores.update(editingFornecedor.id, formData)
        toast.success('Fornecedor atualizado com sucesso!')
      } else {
        await api.fornecedores.create(formData)
        toast.success('Fornecedor cadastrado com sucesso!')
      }
      
      setIsDialogOpen(false)
      setEditingFornecedor(null)
      resetForm()
      loadFornecedores()
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error)
      toast.error('Erro ao salvar fornecedor')
    }
  }

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor)
    setFormData({
      nome: fornecedor.nome,
      categoria: fornecedor.categoria || '',
      produtosServicos: fornecedor.produtosServicos || '',
      telefone: fornecedor.telefone || '',
      siteUrl: fornecedor.siteUrl || '',
      usuarioLogin: fornecedor.usuarioLogin || '',
      senhaLogin: fornecedor.senhaLogin || '',
      tagsBusca: fornecedor.tagsBusca || '',
      observacoes: fornecedor.observacoes || '',
      status: fornecedor.status as 'ativo' | 'inativo'
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await api.fornecedores.delete(id)
      toast.success('Fornecedor excluído com sucesso!')
      loadFornecedores()
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error)
      toast.error('Erro ao excluir fornecedor')
    }
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      categoria: '',
      produtosServicos: '',
      telefone: '',
      siteUrl: '',
      usuarioLogin: '',
      senhaLogin: '',
      tagsBusca: '',
      observacoes: '',
      status: 'ativo'
    })
  }

  const openWhatsApp = (telefone: string) => {
    if (!telefone) {
      toast.error('Telefone não cadastrado')
      return
    }
    const cleanPhone = telefone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${cleanPhone}`
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  const openSite = (siteUrl: string) => {
    if (!siteUrl) {
      toast.error('Site não cadastrado')
      return
    }
    let url = siteUrl
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const filteredFornecedores = fornecedores.filter(fornecedor => {
    const matchesSearch = 
      fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fornecedor.categoria && fornecedor.categoria.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (fornecedor.tagsBusca && fornecedor.tagsBusca.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = !categoryFilter || categoryFilter === 'all' || fornecedor.categoria === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const getCategoriaColor = (nomeCategoria: string) => {
    const categoria = categorias.find(cat => cat.nome === nomeCategoria)
    return categoria?.cor || '#6B7280'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground">Gerencie seus fornecedores e suas informações de acesso</p>
        </div>
        
        <div className="flex gap-2">
          <ManageCategoriasDialog onCategoriaChange={loadCategorias} />
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingFornecedor(null) }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Fornecedor *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Nome do fornecedor"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria.id} value={categoria.nome}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: categoria.cor }}
                              />
                              {categoria.nome}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="produtosServicos">Produtos/Serviços Fornecidos</Label>
                  <Textarea
                    id="produtosServicos"
                    value={formData.produtosServicos}
                    onChange={(e) => setFormData({ ...formData, produtosServicos: e.target.value })}
                    placeholder="Descreva os produtos ou serviços fornecidos"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone/WhatsApp</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="siteUrl">Site/URL</Label>
                    <Input
                      id="siteUrl"
                      value={formData.siteUrl}
                      onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                      placeholder="https://exemplo.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usuarioLogin">Usuário (Login)</Label>
                    <Input
                      id="usuarioLogin"
                      value={formData.usuarioLogin}
                      onChange={(e) => setFormData({ ...formData, usuarioLogin: e.target.value })}
                      placeholder="usuário para login no site"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="senhaLogin">Senha (Login)</Label>
                    <Input
                      id="senhaLogin"
                      type="password"
                      value={formData.senhaLogin}
                      onChange={(e) => setFormData({ ...formData, senhaLogin: e.target.value })}
                      placeholder="senha para login no site"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tagsBusca">Tags de Busca</Label>
                  <Input
                    id="tagsBusca"
                    value={formData.tagsBusca}
                    onChange={(e) => setFormData({ ...formData, tagsBusca: e.target.value })}
                    placeholder="palavras-chave separadas por vírgula"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações adicionais"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'ativo' | 'inativo') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingFornecedor ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, categoria ou tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-64">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.nome}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: categoria.cor }}
                        />
                        {categoria.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFornecedores.map((fornecedor) => (
                    <TableRow key={fornecedor.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{fornecedor.nome}</div>
                          {fornecedor.produtosServicos && (
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {fornecedor.produtosServicos}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {fornecedor.categoria && (
                          <Badge variant="secondary" className="text-white" 
                            style={{
                              backgroundColor: getCategoriaColor(fornecedor.categoria),
                              color: 'white'
                            }}
                          >
                            {fornecedor.categoria}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {fornecedor.telefone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openWhatsApp(fornecedor.telefone!)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        {fornecedor.siteUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openSite(fornecedor.siteUrl!)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        {fornecedor.tagsBusca && (
                          <div className="flex flex-wrap gap-1">
                            {fornecedor.tagsBusca.split(',').slice(0, 2).map((tag, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs text-white"
                                style={{
                                  backgroundColor: getTagColor(index),
                                  borderColor: getTagColor(index),
                                  color: 'white'
                                }}
                              >
                                {tag.trim()}
                              </Badge>
                            ))}
                            {fornecedor.tagsBusca.split(',').length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{fornecedor.tagsBusca.split(',').length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={fornecedor.status === 'ativo' ? 'default' : 'secondary'}>
                          {fornecedor.status === 'ativo' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {(fornecedor.usuarioLogin || fornecedor.senhaLogin) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCredentials(fornecedor)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(fornecedor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o fornecedor "{fornecedor.nome}"? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(fornecedor.id)}>
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedCredentials} onOpenChange={() => setSelectedCredentials(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Credenciais de Acesso
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Fornecedor: <span className="font-medium text-foreground">{selectedCredentials?.nome}</span>
            </div>
            
            {selectedCredentials?.usuarioLogin && (
              <div className="space-y-2">
                <Label>Usuário</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={selectedCredentials.usuarioLogin} 
                    readOnly 
                    className="bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCredentials.usuarioLogin!)
                      toast.success('Usuário copiado!')
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {selectedCredentials?.senhaLogin && (
              <div className="space-y-2">
                <Label>Senha</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={selectedCredentials.senhaLogin} 
                    type="password" 
                    readOnly 
                    className="bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCredentials.senhaLogin!)
                      toast.success('Senha copiada!')
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}