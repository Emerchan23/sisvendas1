"use client"

import { useEffect, useMemo, useState } from "react"
import { AppHeader } from "@/components/app-header"
import { type Produto, ensureInit, getProdutos, deleteProduto } from "@/lib/data-store"
// Removed empresa imports - system simplified
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import ProductForm from "@/components/product-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ExternalLink, Pencil, Search, Trash2, Package, Plus, ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

function brl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0)
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Produto | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  async function refresh() {
    try {
      const produtos = await getProdutos()
      setProdutos(produtos)
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
    }
  }
  useEffect(() => {
    ensureInit()
    refresh()
  }, [])

  const columns = useMemo(
    () => ["Produto", "Marca", "Categoria", "Preço", "Custo", "Estoque", "Custo ref.", "Link ref.", "Ações"],
    [],
  )

  // Filtrar produtos baseado no termo de busca
  const produtosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return produtos
    
    const termo = searchTerm.toLowerCase().trim()
    return produtos.filter(produto => 
      produto.nome.toLowerCase().includes(termo) ||
      produto.id.toLowerCase().includes(termo) ||
      (produto.marca && produto.marca.toLowerCase().includes(termo)) ||
      (produto.descricao && produto.descricao.toLowerCase().includes(termo))
    )
  }, [produtos, searchTerm])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800">Produtos</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => setEditing(null)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-gradient-to-br from-white to-slate-50 border-0 shadow-2xl">
              <DialogHeader className="border-b border-slate-200 pb-4">
                <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  {editing ? 'Editar produto' : 'Novo produto'}
                </DialogTitle>
              </DialogHeader>
              <ProductForm
                initial={editing}
                onSaved={() => {
                  setOpen(false)
                  refresh()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-white border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-slate-600" />
                Seu catálogo ({produtosFiltrados.length})
              </CardTitle>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, código ou marca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-200 shadow-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-auto p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 border-b border-slate-200">
                  {columns.map((c) => (
                    <TableHead key={c} className="font-semibold text-slate-700 py-4">{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtosFiltrados.map((p, index) => (
                  <TableRow key={p.id} className={`hover:bg-slate-50 transition-all duration-200 border-b border-slate-100 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <TableCell className="whitespace-nowrap py-4 px-6">
                      <div className="font-semibold text-slate-800">{p.nome}</div>
                      {p.descricao && <div className="text-xs text-slate-600 mt-1">{p.descricao}</div>}
                      {p.modalidadeVenda && (
                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className={`text-xs px-2 py-1 rounded-full border ${
                              p.modalidadeVenda === "Unidade"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : p.modalidadeVenda === "Peso"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : p.modalidadeVenda === "Metro"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-slate-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {p.modalidadeVenda}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-slate-600">{p.marca || "-"}</TableCell>
                    <TableCell className="py-4 px-6 text-slate-600">{p.categoria || "-"}</TableCell>
                    <TableCell className="py-4 px-6 font-semibold text-green-600">{brl(p.precoVenda)}</TableCell>
                    <TableCell className="py-4 px-6 font-medium text-slate-600">{brl(p.custo)}</TableCell>
                    <TableCell className="py-4 px-6 font-medium text-slate-600">{p.estoque ?? 0}</TableCell>
                    <TableCell className="py-4 px-6">
                       <div className={`font-medium ${p.custoRef && p.custo && p.custo > (p.custoRef || 0) ? "text-amber-600" : "text-slate-600"}`}>
                         {p.custoRef ? brl(p.custoRef) : "-"}
                       </div>
                     </TableCell>
                     <TableCell className="py-4 px-6">
                       {p.linkRef ? (
                         <a
                           href={p.linkRef.startsWith('http://') || p.linkRef.startsWith('https://') ? p.linkRef : `https://${p.linkRef}`}
                           target="_blank"
                           rel="noreferrer"
                           className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors duration-200"
                           title="Abrir link de referência (privado)"
                         >
                           Abrir <ExternalLink className="h-3.5 w-3.5" />
                         </a>
                       ) : (
                         <span className="text-slate-400">-</span>
                       )}
                     </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => {
                             setEditing(p)
                             setOpen(true)
                           }}
                           className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-200"
                           title="Editar"
                         >
                           <Pencil className="h-4 w-4" />
                         </Button>
                         <Button
                           variant="ghost"
                           size="sm"
                           className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors duration-200"
                           onClick={async () => {
                          if (!confirm("Excluir este produto?")) return
                          try {
                            await deleteProduto(p.id)
                            await refresh()
                            toast({ title: "Produto excluído" })
                          } catch (error: any) {
                            console.error('Erro ao excluir produto:', error)
                            if (error?.status === 400) {
                              try {
                                const response = await fetch(`/api/produtos/${p.id}/dependencies`)
                                const dependencies = await response.json()
                                
                                let detailsMessage = `Não é possível excluir o produto "${p.nome}" porque ele está sendo usado em:\n\n`
                                if (dependencies.orcamento_itens?.count > 0) detailsMessage += `• ${dependencies.orcamento_itens.count} item(ns) de orçamento\n`
                                if (dependencies.linhas_venda?.count > 0) detailsMessage += `• ${dependencies.linhas_venda.count} linha(s) de venda\n`
                                if (dependencies.vendas?.count > 0) detailsMessage += `• ${dependencies.vendas.count} venda(s)\n`
                                detailsMessage += "\nExclua primeiro esses registros para poder deletar o produto."
                                
                                alert(detailsMessage)
                              } catch {
                                toast({
                                  title: "Não é possível excluir",
                                  description: "Este produto possui registros associados. Exclua primeiro os registros relacionados.",
                                  variant: "destructive",
                                })
                              }
                            } else {
                              toast({ title: "Erro ao excluir produto", variant: "destructive" })
                            }
                          }
                        }}
                         title="Excluir"
                       >
                         <Trash2 className="h-3.5 w-3.5" />
                       </Button>
                       </div>
                     </TableCell>
                  </TableRow>
                ))}
                {produtos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3 bg-slate-50 rounded-lg p-8 mx-4 my-4 border border-slate-200">
                        <Package className="h-12 w-12 text-slate-400" />
                        <p className="text-slate-700 font-medium">Nenhum produto cadastrado</p>
                        <p className="text-sm text-slate-500">Comece adicionando seu primeiro produto</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {produtos.length > 0 && produtosFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3 bg-slate-50 rounded-lg p-8 mx-4 my-4 border border-slate-200">
                        <Search className="h-12 w-12 text-slate-400" />
                        <p className="text-slate-700 font-medium">Nenhum produto encontrado</p>
                        <p className="text-sm text-slate-500">Tente ajustar os termos de busca para "{searchTerm}"</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 flex items-start gap-2">
                <Package className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-slate-800">Observação:</strong> "Link ref." e "Custo ref." são campos privados para seu controle e não aparecem em orçamentos, vendas ou relatórios enviados a clientes.
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
