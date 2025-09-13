"use client"

import { useEffect, useState, useMemo } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trash2, Download, Edit, CheckCheck, X, FileText, Users, Calendar, DollarSign, Search, Filter } from "lucide-react"
import { fmtCurrency } from "@/lib/format"
import OrcamentoForm from "@/components/orcamento-form"
import { getOrcamentos, deleteOrcamento, aprovarOrcamento, desaprovarOrcamento, type Orcamento } from "@/lib/orcamentos"
import { AppHeader } from "@/components/app-header"
import { makeOrcamentoHTML, downloadPDF } from "@/lib/print"
// Removed empresa imports - system simplified
import { EmailModal } from "@/components/email-modal"

// Using backend types
type LocalOrcamento = Orcamento

function totalOrcamento(o: LocalOrcamento) {
  if (!o.itens || !Array.isArray(o.itens)) {
    return 0
  }
  return o.itens.reduce((acc, it) => acc + (Number(it.quantidade) || 0) * (Number(it.valor_unitario) || 0) - (Number(it.desconto) || 0), 0)
}

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<LocalOrcamento[]>([])
  const [orcamentoEditando, setOrcamentoEditando] = useState<LocalOrcamento | null>(null)
  const [tabAtiva, setTabAtiva] = useState("criar")
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear())
  const [filtroTexto, setFiltroTexto] = useState<string>("")
  const [orcamentoParaDeletar, setOrcamentoParaDeletar] = useState<LocalOrcamento | null>(null)

  const reload = async () => {
    try {
      const data = await getOrcamentos()
      setOrcamentos(data)
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error)
      setOrcamentos([])
    }
  }

  useEffect(() => {
    reload()
    const onChange = () => reload()
    window.addEventListener("erp-changed", onChange as EventListener)
    window.addEventListener("storage", onChange)
    return () => {
      window.removeEventListener("erp-changed", onChange as EventListener)
      window.removeEventListener("storage", onChange)
    }
  }, [])

  const orcamentosFiltrados = useMemo(() => {
    return orcamentos.filter(orcamento => {
      const anoOrcamento = new Date(orcamento.data).getFullYear()
      if (anoOrcamento !== anoSelecionado) return false
      
      if (!filtroTexto.trim()) return true
      
      const textoFiltro = filtroTexto.toLowerCase().trim()
      const numeroOrcamento = orcamento.numero?.toLowerCase() || ''
      const nomeCliente = orcamento.cliente?.nome?.toLowerCase() || ''
      const dataFormatada = new Date(orcamento.data).toLocaleDateString('pt-BR')
      const numeroDispensa = orcamento.numero_dispensa?.toLowerCase() || ''
      const numeroPregao = orcamento.numero_pregao?.toLowerCase() || ''
      
      return numeroOrcamento.includes(textoFiltro) ||
             nomeCliente.includes(textoFiltro) ||
             dataFormatada.includes(textoFiltro) ||
             numeroDispensa.includes(textoFiltro) ||
             numeroPregao.includes(textoFiltro)
    })
  }, [orcamentos, anoSelecionado, filtroTexto])

  const handleBaixarPDF = async (o: LocalOrcamento) => {
    // Passa o total calculado para o gerador de HTML
    const withTotal = { ...o, total: totalOrcamento(o) }
    const html = await makeOrcamentoHTML(withTotal as any)
    await downloadPDF(html, `Orcamento_${o.numero}`)
  }

  const handleEditar = (o: LocalOrcamento) => {
    setOrcamentoEditando(o)
    setTabAtiva("criar")
  }

  const handleCancelarEdicao = () => {
    setOrcamentoEditando(null)
  }

  const handleSalvoComSucesso = () => {
    setOrcamentoEditando(null)
    setTabAtiva("salvos")
    reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <AppHeader title="Orçamentos" />
      <main className="container mx-auto max-w-6xl space-y-6 p-6">

        <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
          <TabsList className="bg-white/80 backdrop-blur-sm border-2 border-white/20 shadow-lg">
            <TabsTrigger value="criar" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
              <FileText className="h-4 w-4 mr-2" />
              {orcamentoEditando ? "Editar Orçamento" : "Criar Orçamento"}
            </TabsTrigger>
            <TabsTrigger value="salvos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
              <Users className="h-4 w-4 mr-2" />
              Orçamentos Salvos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="criar" className="mt-6">
            {orcamentoEditando && (
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                      <Edit className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 text-lg">Editando Orçamento #{orcamentoEditando.numero}</h3>
                      <p className="text-sm text-blue-700 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Cliente: {orcamentoEditando.cliente?.nome}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleCancelarEdicao}
                    className="bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar Edição
                  </Button>
                </div>
              </div>
            )}
            <OrcamentoForm 
              orcamentoParaEdicao={orcamentoEditando}
              onSalvoComSucesso={handleSalvoComSucesso}
            />
          </TabsContent>

          <TabsContent value="salvos" className="mt-6">
            <Card className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 -m-6 mb-6 rounded-t-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-semibold">
                    <FileText className="h-6 w-6" />
                    Orçamentos Salvos
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="filtro-busca" className="text-sm whitespace-nowrap text-blue-100 flex items-center gap-1">
                        <Search className="h-4 w-4" />
                        Buscar:
                      </Label>
                      <Input
                        id="filtro-busca"
                        placeholder="Nº orçamento, cliente, data, dispensa..."
                        value={filtroTexto}
                        onChange={(e) => setFiltroTexto(e.target.value)}
                        className="w-64 bg-white/90 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 transition-all duration-200"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="ano-orcamentos" className="text-sm whitespace-nowrap text-blue-100 flex items-center gap-1">
                        <Filter className="h-4 w-4" />
                        Ano:
                      </Label>
                      <Select value={String(anoSelecionado)} onValueChange={(value) => setAnoSelecionado(Number(value))}>
                        <SelectTrigger className="w-24 bg-white/90 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 transition-all duration-200" id="ano-orcamentos">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => {
                            const ano = new Date().getFullYear() - 5 + i
                            return (
                              <SelectItem key={ano} value={String(ano)}>
                                {ano}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 transition-all duration-200">
                        <TableHead className="font-semibold text-gray-700 py-4">#</TableHead>
                        <TableHead className="font-semibold text-gray-700 py-4">Cliente</TableHead>
                        <TableHead className="font-semibold text-gray-700 py-4">Data</TableHead>
                        <TableHead className="font-semibold text-gray-700 py-4">Status</TableHead>
                        <TableHead className="font-semibold text-gray-700 py-4">Modalidade/Número</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700 py-4">Total</TableHead>
                        <TableHead className="w-32 font-semibold text-gray-700 py-4">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {orcamentosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          Nenhum orçamento salvo para o ano {anoSelecionado}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      orcamentosFiltrados.map((o, index) => (
                        <TableRow key={o.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100`}>
                          <TableCell className="py-4 font-medium text-gray-900">{o.numero}</TableCell>
                          <TableCell className="py-4 text-gray-700">{o.cliente?.nome}</TableCell>
                          <TableCell className="py-4 text-gray-600 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            {new Date(o.data).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
                              o.status === 'aprovado' 
                                ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border border-green-300' 
                                : 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300'
                            }`}>
                              {o.status === 'aprovado' ? (
                                <><CheckCheck className="h-3 w-3" /> Aprovado</>
                              ) : (
                                <><Calendar className="h-3 w-3" /> Pendente</>
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {o.modalidade === 'LICITADO' ? (
                                <div>
                                  <span className="font-medium text-blue-700">PREGÃO ELETRÔNICO</span>
                                  {o.numero_pregao && (
                                    <div className="text-xs text-muted-foreground">
                                      Pregão Eletrônico: {o.numero_pregao}
                                    </div>
                                  )}
                                </div>
                              ) : o.modalidade === 'DISPENSA' ? (
                                <div>
                                  <span className="font-medium text-green-700">DISPENSA</span>
                                  {o.numero_dispensa && (
                                    <div className="text-xs text-muted-foreground">
                                      Dispensa: {o.numero_dispensa}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">-</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-4 font-semibold text-green-600 flex items-center justify-end gap-2">
                            <DollarSign className="h-4 w-4" />
                            {fmtCurrency(totalOrcamento(o))}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex justify-end gap-2">
                              {o.status === 'aprovado' ? (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  title="Desaprovar orçamento"
                                  onClick={async () => {
                                    try {
                                      const success = await desaprovarOrcamento(o.id)
                                      if (success) {
                                        await reload()
                                      }
                                    } catch (error) {
                                      console.error('Erro ao desaprovar orçamento:', error)
                                    }
                                  }}
                                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-500 shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  title="Aprovar orçamento"
                                  onClick={async () => {
                                    try {
                                      const success = await aprovarOrcamento(o.id)
                                      if (success) {
                                        await reload()
                                      }
                                    } catch (error) {
                                      console.error("Erro ao aprovar orçamento:", error)
                                    }
                                  }}
                                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-green-500 shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                <CheckCheck className="h-4 w-4" />
                                <span className="sr-only">Aprovar</span>
                              </Button>
                              )}
                              <Button
                                variant="outline"
                                size="icon"
                                title="Editar orçamento"
                                onClick={() => handleEditar(o)}
                                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-blue-500 shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              <EmailModal 
                                orcamento={o}
                                onEmailSent={() => {
                                  // Opcional: fazer algo após envio do e-mail
                                }}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                title="Baixar PDF do orçamento"
                                onClick={() => handleBaixarPDF(o)}
                                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white border-indigo-500 shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Baixar PDF</span>
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                title="Excluir orçamento"
                                onClick={() => setOrcamentoParaDeletar(o)}
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-red-500 shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Excluir</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!orcamentoParaDeletar} onOpenChange={() => setOrcamentoParaDeletar(null)}>
          <DialogContent className="bg-gradient-to-br from-white to-red-50 border-2 border-red-200 shadow-2xl">
            <DialogHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 -m-6 mb-6 rounded-t-xl">
              <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
                <Trash2 className="h-6 w-6" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription className="text-red-100 mt-2">
                Tem certeza que deseja excluir o orçamento {orcamentoParaDeletar?.numero}?
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="bg-gradient-to-r from-gray-50 to-white p-6 -m-6 mt-6 rounded-b-xl shadow-inner flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setOrcamentoParaDeletar(null)}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border-gray-500 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={async () => {
                  if (orcamentoParaDeletar) {
                    try {
                      const success = await deleteOrcamento(orcamentoParaDeletar.id)
                      if (success) {
                        await reload()
                        setOrcamentoParaDeletar(null)
                      }
                    } catch (error: any) {
                      console.error("Erro ao deletar orçamento:", error)
                      if (error?.status === 400) {
                        try {
                          const response = await fetch(`/api/orcamentos/${orcamentoParaDeletar.id}/dependencies`)
                          const dependencies = await response.json()
                          
                          let detailsMessage = `Não é possível excluir o orçamento "${orcamentoParaDeletar.numero}" porque ele está sendo usado em:\n\n`
                          if (dependencies.vendas_relacionadas?.count > 0) detailsMessage += `• ${dependencies.vendas_relacionadas.count} venda(s)\n`
                          if (dependencies.acertos_relacionados?.count > 0) detailsMessage += `• ${dependencies.acertos_relacionados.count} acerto(s)\n`
                          detailsMessage += "\nExclua primeiro esses registros para poder deletar o orçamento."
                          
                          alert(detailsMessage)
                        } catch {
                          alert("Não é possível excluir este orçamento pois ele possui registros associados. Exclua primeiro os registros relacionados.")
                        }
                      } else {
                        alert("Erro ao excluir orçamento")
                      }
                    }
                  }
                }}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-red-600 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
