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
import { ExternalLink, Pencil, Search, Trash2 } from "lucide-react"
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
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}>Adicionar produto</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Editar produto</DialogTitle>
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

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Seu catálogo</CardTitle>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código ou marca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((c) => (
                    <TableHead key={c}>{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtosFiltrados.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-medium">{p.nome}</div>
                      {p.descricao && <div className="text-xs text-muted-foreground">{p.descricao}</div>}
                      {p.modalidadeVenda && (
                        <div className="mt-1">
                          <Badge variant="secondary">{p.modalidadeVenda}</Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{p.marca || "-"}</TableCell>
                    <TableCell>{p.categoria || "-"}</TableCell>
                    <TableCell>{brl(p.precoVenda)}</TableCell>
                    <TableCell>{brl(p.custo)}</TableCell>
                    <TableCell>{p.estoque ?? 0}</TableCell>
                    <TableCell>
                      <div className={p.custoRef && p.custo && p.custo > (p.custoRef || 0) ? "text-amber-600" : ""}>
                        {p.custoRef ? brl(p.custoRef) : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.linkRef ? (
                        <a
                          href={p.linkRef.startsWith('http://') || p.linkRef.startsWith('https://') ? p.linkRef : `https://${p.linkRef}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
                          title="Abrir link de referência (privado)"
                        >
                          Abrir <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setEditing(p)
                          setOpen(true)
                        }}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
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
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {produtos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                      Nenhum produto cadastrado.
                    </TableCell>
                  </TableRow>
                )}
                {produtos.length > 0 && produtosFiltrados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                      Nenhum produto encontrado para "{searchTerm}".
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="mt-3 text-xs text-muted-foreground">
              Observação: “Link ref.” e “Custo ref.” são campos privados para seu controle e não aparecem em orçamentos,
              vendas ou relatórios enviados a clientes.
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
