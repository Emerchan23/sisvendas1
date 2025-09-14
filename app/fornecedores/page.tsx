'use client'

import { useState, useEffect } from 'react'
import { AppHeader } from '@/components/app-header'
import ProtectedRoute from "@/components/ProtectedRoute"
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
import { Plus, Search, Edit, Trash2, ExternalLink, MessageCircle, Eye, EyeOff, Key, Copy, Users, Building2, Package, Phone, Globe, Tag, FileText, CheckCircle, XCircle, Filter, Save, X } from 'lucide-react'
import { api, type Fornecedor } from '@/lib/api-client'
import { ManageCategoriasDialog } from '@/components/manage-categorias-fornecedores-dialog'
import { PhoneInput } from '@/components/ui/masked-input'

interface Categoria {
  id: string
  nome: string
  cor: string
}

function FornecedoresContent() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <AppHeader />
      <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">Fornecedores</h1>
          <p className="text-slate-600 mt-2 text-lg">Gerencie seus fornecedores e suas informações de acesso</p>
        </div>
        
        <div className="flex gap-3">
          <ManageCategoriasDialog onCategoriaChange={loadCategorias} />
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => { resetForm(); setEditingFornecedor(null) }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border border-slate-200 shadow-2xl">
              <DialogHeader className="border-b border-slate-200 pb-6">
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                    <Building2 className="h-6 w-6 text-blue-400" />
                  </div>
                  {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-8 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="nome" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <div className="p-1 rounded bg-blue-500/20">
                        <Building2 className="h-3 w-3 text-blue-400" />
                      </div>
                      Nome do Fornecedor *
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Digite o nome do fornecedor"
                      required
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm transition-all duration-300 hover:border-slate-400"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="categoria" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <div className="p-1 rounded bg-purple-500/20">
                        <Tag className="h-3 w-3 text-purple-400" />
                      </div>
                      Categoria
                    </Label>
                    <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                      <SelectTrigger className="bg-white border-slate-300 text-slate-900 focus:border-purple-500 focus:ring-purple-500/20 shadow-sm transition-all duration-300 hover:border-slate-400">
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
                
                <div className="space-y-3 md:col-span-2">
                  <Label htmlFor="produtosServicos" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <div className="p-1 rounded bg-green-500/20">
                      <Package className="h-3 w-3 text-green-400" />
                    </div>
                    Produtos/Serviços Fornecidos
                  </Label>
                  <Textarea
                    id="produtosServicos"
                    value={formData.produtosServicos}
                    onChange={(e) => setFormData({ ...formData, produtosServicos: e.target.value })}
                    placeholder="Descreva detalhadamente os produtos ou serviços fornecidos por esta empresa"
                    rows={3}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-green-500 focus:ring-green-500/20 shadow-sm transition-all duration-300 resize-none hover:border-slate-400"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="telefone" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <div className="p-1 rounded bg-green-500/20">
                        <Phone className="h-3 w-3 text-green-400" />
                      </div>
                      Telefone/WhatsApp
                    </Label>
                    <PhoneInput
                      id="telefone"
                      value={formData.telefone}
                      onChange={(value) => setFormData({ ...formData, telefone: value })}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-green-500 focus:ring-green-500/20 shadow-sm transition-all duration-300 hover:border-slate-400"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="siteUrl" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <div className="p-1 rounded bg-blue-500/20">
                        <Globe className="h-3 w-3 text-blue-400" />
                      </div>
                      Site/URL
                    </Label>
                    <Input
                      id="siteUrl"
                      value={formData.siteUrl}
                      onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                      placeholder="www.exemplo.com.br ou https://www.exemplo.com.br"
                      type="text"
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm transition-all duration-300 hover:border-slate-400"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="usuarioLogin" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <div className="p-1 rounded bg-indigo-500/20">
                        <Users className="h-3 w-3 text-indigo-400" />
                      </div>
                      Usuário (Login)
                    </Label>
                    <Input
                      id="usuarioLogin"
                      value={formData.usuarioLogin}
                      onChange={(e) => setFormData({ ...formData, usuarioLogin: e.target.value })}
                      placeholder="Digite o usuário para acesso ao site"
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-sm transition-all duration-300 hover:border-slate-400"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="senhaLogin" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <div className="p-1 rounded bg-red-500/20">
                        <Key className="h-3 w-3 text-red-400" />
                      </div>
                      Senha (Login)
                    </Label>
                    <Input
                      id="senhaLogin"
                      type="password"
                      value={formData.senhaLogin}
                      onChange={(e) => setFormData({ ...formData, senhaLogin: e.target.value })}
                      placeholder="Digite a senha para acesso ao site"
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/20 shadow-sm transition-all duration-300 hover:border-slate-400"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="tagsBusca" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <div className="p-1 rounded bg-orange-500/20">
                      <Tag className="h-3 w-3 text-orange-400" />
                    </div>
                    Tags de Busca
                  </Label>
                  <Input
                    id="tagsBusca"
                    value={formData.tagsBusca}
                    onChange={(e) => setFormData({ ...formData, tagsBusca: e.target.value })}
                    placeholder="Ex: equipamentos, materiais, serviços (separadas por vírgula)"
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-orange-500 focus:ring-orange-500/20 shadow-sm transition-all duration-300 hover:border-slate-400"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="observacoes" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <div className="p-1 rounded bg-slate-500/20">
                      <FileText className="h-3 w-3 text-slate-400" />
                    </div>
                    Observações
                  </Label>
                  <Textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Informações adicionais, notas importantes, condições especiais, etc."
                    rows={3}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-slate-500 focus:ring-slate-500/20 shadow-sm transition-all duration-300 resize-none hover:border-slate-400"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="status" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <div className="p-1 rounded bg-green-500/20">
                      <CheckCircle className="h-3 w-3 text-green-400" />
                    </div>
                    Status
                  </Label>
                  <Select value={formData.status} onValueChange={(value: 'ativo' | 'inativo') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger className="bg-white border-slate-300 text-slate-900 focus:border-green-400 focus:ring-green-400/30 shadow-lg transition-all duration-300 hover:bg-slate-50">
                      <SelectValue placeholder="Selecione o status do fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    className="bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 transition-all duration-200"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-gradient-to-r from-green-500/80 to-emerald-500/80 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg hover:shadow-xl hover:shadow-green-500/25 backdrop-blur-sm border border-green-400/30 transition-all duration-300 transform hover:scale-105"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {editingFornecedor ? 'Atualizar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="bg-white backdrop-blur-xl border border-slate-200 shadow-lg hover:shadow-xl hover:border-slate-300 transition-all duration-500">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 backdrop-blur-sm border-b border-slate-200">
          <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Building2 className="h-5 w-5 text-purple-600" />
            Fornecedores Cadastrados ({filteredFornecedores.length})
          </CardTitle>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, categoria ou tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-purple-400 focus:ring-purple-400/50 shadow-sm transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-64">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-white border-slate-300 text-slate-800 focus:border-purple-400 focus:ring-purple-400/50 shadow-sm transition-all duration-200">
                  <Filter className="h-4 w-4 mr-2 text-purple-400" />
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
        
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 backdrop-blur-sm border-b border-slate-200">
                    <TableHead className="font-semibold text-slate-700 w-1/3 min-w-[200px]">Nome</TableHead>
                    <TableHead className="font-semibold text-slate-700">Categoria</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">WhatsApp</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-center">Site</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tags</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-20">Status</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFornecedores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <div className="bg-gradient-to-br from-slate-700/50 to-purple-700/50 p-4 rounded-full">
                            <Building2 className="h-12 w-12 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-300">Nenhum fornecedor encontrado</h3>
                            <p className="text-gray-400">Tente ajustar os filtros ou adicione um novo fornecedor</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFornecedores.map((fornecedor, index) => (
                      <TableRow key={fornecedor.id} className={`hover:bg-slate-50 transition-all duration-200 border-b border-slate-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <TableCell className="font-medium py-4 w-1/3 min-w-[200px]">
                          <div>
                            <div className="font-semibold text-slate-800">{fornecedor.nome}</div>
                            {fornecedor.produtosServicos && (
                              <div className="text-sm text-slate-600 truncate max-w-xs">
                                {fornecedor.produtosServicos}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {fornecedor.categoria && (
                            <Badge variant="secondary" className="text-white shadow-sm" 
                              style={{
                                backgroundColor: getCategoriaColor(fornecedor.categoria),
                                color: 'white'
                              }}
                            >
                              {fornecedor.categoria}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <div className="flex justify-center">
                            {fornecedor.telefone && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openWhatsApp(fornecedor.telefone!)}
                                className="px-3 py-2 h-auto rounded-full text-green-600 hover:text-green-700 hover:bg-green-50 transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md border border-green-200 hover:border-green-300"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
                                </svg>
                                <span className="text-xs font-medium">WhatsApp</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {fornecedor.siteUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openSite(fornecedor.siteUrl!)}
                              className="p-2 h-9 w-9 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="py-4">
                          {fornecedor.tagsBusca && (
                            <div className="flex flex-wrap gap-1">
                              {fornecedor.tagsBusca.split(',').slice(0, 2).map((tag, tagIndex) => (
                                <Badge 
                                  key={tagIndex} 
                                  variant="outline" 
                                  className="text-xs bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 transition-colors duration-200"
                                >
                                  {tag.trim()}
                                </Badge>
                              ))}
                              {fornecedor.tagsBusca.split(',').length > 2 && (
                                <Badge variant="outline" className="text-xs bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700">
                                  +{fornecedor.tagsBusca.split(',').length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="py-4 w-20">
                          <Badge 
                            variant={fornecedor.status === 'ativo' ? 'default' : 'secondary'}
                            className={`shadow-sm ${
                              fornecedor.status === 'ativo' 
                                ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                                : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                            }`}
                          >
                            {fornecedor.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="flex justify-end gap-1">
                            {(fornecedor.usuarioLogin || fornecedor.senhaLogin) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCredentials(fornecedor)}
                                className="p-2 h-9 w-9 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 transition-all duration-200 text-purple-300 hover:text-purple-200"
                              >
                                <Key className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(fornecedor)}
                              className="p-2 h-9 w-9 rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="p-2 h-9 w-9 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200">
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedCredentials} onOpenChange={() => setSelectedCredentials(null)}>
        <DialogContent className="max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-purple-50 to-blue-50 -m-6 p-6 mb-6 rounded-t-lg border-b border-purple-200">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-600" />
              Credenciais de Acesso
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="text-sm text-slate-600">
              Fornecedor: <span className="font-semibold text-purple-700">{selectedCredentials?.nome}</span>
            </div>
            
            {selectedCredentials?.usuarioLogin && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Usuário
                </Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={selectedCredentials.usuarioLogin} 
                    readOnly 
                    className="border-slate-300 bg-slate-50 focus:border-blue-500 focus:ring-blue-500 shadow-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCredentials.usuarioLogin!)
                      toast.success('Usuário copiado!')
                    }}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            {selectedCredentials?.senhaLogin && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Key className="h-4 w-4 text-purple-600" />
                  Senha
                </Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={selectedCredentials.senhaLogin} 
                    type="password" 
                    readOnly 
                    className="border-slate-300 bg-slate-50 focus:border-purple-500 focus:ring-purple-500 shadow-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedCredentials.senhaLogin!)
                      toast.success('Senha copiada!')
                    }}
                    className="border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 transition-all duration-200"
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

export default function FornecedoresPage() {
  return (
    <ProtectedRoute requiredPermission="fornecedores">
      <FornecedoresContent />
    </ProtectedRoute>
  )
}