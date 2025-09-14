"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Settings, Palette } from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Categoria {
  id: string
  nome: string
  cor: string
}

interface ManageCategoriasDialogProps {
  onCategoriaChange?: () => void
}

const coresPredefinidas = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6B7280', // Gray
]

export function ManageCategoriasDialog({ onCategoriaChange }: ManageCategoriasDialogProps) {
  const [open, setOpen] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [novaCategoria, setNovaCategoria] = useState({ nome: '', cor: coresPredefinidas[0] })
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; categoria?: Categoria }>({
    open: false
  })

  const fetchCategorias = async () => {
    try {
      const response = await fetch('/api/categorias-fornecedores')
      if (response.ok) {
        const data = await response.json()
        setCategorias(data)
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      toast.error('Erro ao carregar categorias')
    }
  }

  useEffect(() => {
    if (open) {
      fetchCategorias()
    }
  }, [open])

  const handleCreateCategoria = async () => {
    if (!novaCategoria.nome.trim()) {
      toast.error('Nome da categoria é obrigatório')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/categorias-fornecedores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(novaCategoria),
      })

      if (response.ok) {
        toast.success('Categoria criada com sucesso!')
        setNovaCategoria({ nome: '', cor: coresPredefinidas[0] })
        fetchCategorias()
        onCategoriaChange?.()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar categoria')
      }
    } catch (error) {
      console.error('Erro ao criar categoria:', error)
      toast.error('Erro ao criar categoria')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCategoria = async (categoria: Categoria) => {
    try {
      console.log('Attempting to delete category with ID:', categoria.id)
      const response = await fetch(`/api/categorias-fornecedores?id=${categoria.id}`, {
        method: 'DELETE',
      })

      console.log('Delete response status:', response.status)
      const responseData = await response.json()
      console.log('Delete response data:', responseData)

      if (response.ok) {
        console.log('Delete successful, updating state')
        toast.success('Categoria excluída com sucesso!')
        fetchCategorias()
        onCategoriaChange?.()
      } else {
        console.error('Delete failed:', responseData)
        toast.error(`Erro ao excluir categoria: ${responseData.error || 'Erro desconhecido'}`)
      }
    } catch (error) {
      console.error('Erro ao excluir categoria:', error)
      toast.error('Erro ao excluir categoria')
    }
    setDeleteDialog({ open: false })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Gerenciar Categorias
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias de Fornecedores</DialogTitle>
            <DialogDescription>
              Adicione, edite ou remova categorias para organizar seus fornecedores.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Criar Nova Categoria */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Nova Categoria</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Categoria</Label>
                  <Input
                    id="nome"
                    placeholder="Ex: Matéria Prima"
                    value={novaCategoria.nome}
                    onChange={(e) => setNovaCategoria(prev => ({ ...prev, nome: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor da Categoria</Label>
                  <div className="flex flex-wrap gap-2">
                    {coresPredefinidas.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          novaCategoria.cor === cor ? 'border-gray-900 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: cor }}
                        onClick={() => setNovaCategoria(prev => ({ ...prev, cor }))}
                      />
                    ))}
                  </div>
                  {novaCategoria.nome && (
                    <div className="mt-2">
                      <Badge style={{ backgroundColor: novaCategoria.cor, color: 'white' }}>
                        {novaCategoria.nome}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              <Button 
                onClick={handleCreateCategoria} 
                disabled={loading || !novaCategoria.nome.trim()}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Criando...' : 'Criar Categoria'}
              </Button>
            </div>

            {/* Lista de Categorias Existentes */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Categorias Existentes</h3>
              {categorias.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma categoria encontrada</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categorias.map((categoria) => (
                    <div
                      key={categoria.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: categoria.cor }}
                        />
                        <Badge style={{ backgroundColor: categoria.cor, color: 'white' }}>
                          {categoria.nome}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, categoria })}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria "{deleteDialog.categoria?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.categoria && handleDeleteCategoria(deleteDialog.categoria)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}