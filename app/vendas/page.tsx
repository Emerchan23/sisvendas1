"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AppHeader } from "@/components/app-header"
import ProtectedRoute from "@/components/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MetricCard } from "@/components/metric-card"
import { fmtCurrency } from "@/lib/format"
import {
  deleteLinha,
  getLinhas,
  importRowsFromObjects,
  saveLinha,
  templateCSV,
  type LinhaVenda,
  updateLinhaColor,
} from "@/lib/planilha"
import * as XLSX from "xlsx"
import { SlidersHorizontal, Upload, Plus, FileDown, BadgePercent, ListPlus, Palette, Maximize2, Minimize2, Users, Calendar, CreditCard, CheckCircle, Settings, Save, X, Edit, Trash2, FileText } from "lucide-react"
import { ManageRatesDialog } from "@/components/manage-rates-dialog"
import { getCapitalRates, getImpostoRates, type Rate } from "@/lib/rates"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ManageModalidadesDialog } from "@/components/manage-modalidades-dialog"
import { getModalidades, type Modalidade } from "@/lib/modalidades"
import { Switch } from "@/components/ui/switch"
// Removed empresa imports - system simplified
import { getClientes, type Cliente } from "@/lib/data-store"
import ClienteCombobox from "@/components/cliente-combobox"
import { VendaDialog } from "@/components/venda-dialog"

type Density = "compact" | "default"
type Prefs = {
  visible: Record<string, boolean>
  density: Density
}

// Estado padrão de colunas
const allColumns: Array<{ key: keyof LinhaVenda; label: string; essential?: boolean }> = [
  { key: "dataPedido", label: "Data Pedido", essential: true },
  { key: "numeroOF", label: "Nº OF", essential: true },
  { key: "numeroDispensa", label: "Nº Dispensa", essential: false },
  { key: "cliente", label: "Cliente", essential: true },
  { key: "produto", label: "Produto Orçado / Vendido", essential: true },
  { key: "modalidade", label: "Modalidade", essential: true },
  { key: "valorVenda", label: "Valor Venda", essential: true },
  { key: "taxaCapitalPerc", label: "Taxa Capital %" },
  { key: "taxaCapitalVl", label: "Taxa VL Capital" },
  { key: "taxaImpostoPerc", label: "Taxa % Imposto" },
  { key: "taxaImpostoVl", label: "Taxa VL Imposto" },
  { key: "custoMercadoria", label: "Custo da Mercadoria" },
  { key: "somaCustoFinal", label: "Soma Custo Final", essential: true },
  { key: "lucroValor", label: "Lucro (R$)", essential: true },
  { key: "lucroPerc", label: "Lucro (%)", essential: true },
  { key: "dataRecebimento", label: "Data Recebimento", essential: true },
  { key: "paymentStatus", label: "Pagamento", essential: true },
  { key: "settlementStatus", label: "Acerto", essential: false },
]

function VendasPlanilhaPage() {
  const searchParams = useSearchParams()

  return (
    <ProtectedRoute requiredPermission="vendas">
      <VendasContent />
    </ProtectedRoute>
  )
}

function VendasContent() {
  const searchParams = useSearchParams()
  
  // Estados principais
  const [linhas, setLinhas] = useState<LinhaVenda[]>([])
  const [filtro, setFiltro] = useState("")
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear())
  const [prefs, setPrefs] = useState<Prefs>(() => {
    const visible = Object.fromEntries(allColumns.map((c) => [c.key, !!c.essential])) as Record<string, boolean>
    return { visible, density: "compact" }
  })
  
  // Estados de modais
  const [editing, setEditing] = useState<LinhaVenda | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [openRates, setOpenRates] = useState(false)
  const [openModalidades, setOpenModalidades] = useState(false)
  
  // Estados de dados
  const [capitalRates, setCapitalRates] = useState<Rate[]>([])
  const [impostoRates, setImpostoRates] = useState<Rate[]>([])
  const [modalidades, setModalidades] = useState<Modalidade[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  
  // Refs e outros estados
  const fileRef = useRef<HTMLInputElement>(null)
  const [onlyPendAcerto, setOnlyPendAcerto] = useState(false)

  // Aplicar filtro da URL se presente
  useEffect(() => {
    const numeroOF = searchParams.get('numeroOF')
    if (numeroOF) {
      setFiltro(numeroOF)
    }
  }, [searchParams])

  // Função para carregar dados iniciais
  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([
          refreshLinhas(),
          refreshRates(),
          refreshModalidades(),
          refreshClientes()
        ])
      } catch (error) {
        console.error('Erro ao inicializar dados:', error)
      }
    }
    
    initializeData()
    
    // Listener para mudanças de dados
    const handleDataChange = () => {
      refreshLinhas().catch(console.error)
    }
    
    if (typeof window !== "undefined") {
      window.addEventListener("data-changed", handleDataChange)
    }
    
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("data-changed", handleDataChange)
      }
    }
  }, [])

  // Funções de refresh
  const refreshLinhas = async () => {
    try {
      const data = await getLinhas()
      setLinhas(data)
    } catch (error) {
      console.error('Erro ao carregar linhas:', error)
      setLinhas([])
    }
  }

  const refreshRates = async () => {
    try {
      const [capital, imposto] = await Promise.all([
        getCapitalRates(),
        getImpostoRates()
      ])
      setCapitalRates(capital)
      setImpostoRates(imposto)
    } catch (error) {
      console.error('Error refreshing rates:', error)
    }
  }

  const refreshModalidades = async () => {
    try {
      const data = await getModalidades()
      setModalidades(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar modalidades:', error)
      setModalidades([])
    }
  }

  const refreshClientes = async () => {
    try {
      const data = await getClientes()
      setClientes(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      setClientes([])
    }
  }

  // Removed empresa change handlers - system simplified

  // Filtrar linhas
  const linhasFiltradas = useMemo(() => {
    let filtered = linhas
    
    // Filtro por ano
    filtered = filtered.filter(linha => {
      if (!linha.dataPedido) return true
      const dataLinha = new Date(linha.dataPedido)
      return dataLinha.getFullYear() === anoSelecionado
    })
    
    if (filtro) {
      const termo = filtro.toLowerCase()
      filtered = filtered.filter(linha => 
        linha.cliente?.toLowerCase().includes(termo) ||
        linha.produto?.toLowerCase().includes(termo) ||
        linha.numeroOF?.toLowerCase().includes(termo) ||
        linha.numeroDispensa?.toLowerCase().includes(termo)
      )
    }
    
    if (onlyPendAcerto) {
      filtered = filtered.filter(linha => linha.settlementStatus === "Pendente")
    }
    
    return filtered
  }, [linhas, filtro, onlyPendAcerto, anoSelecionado])

  // Cálculos de métricas
  const metrics = useMemo(() => {
    const totalVendas = linhasFiltradas.reduce((sum, linha) => sum + (linha.valorVenda || 0), 0)
    const totalLucro = linhasFiltradas.reduce((sum, linha) => sum + (linha.lucroValor || 0), 0)
    const totalCusto = linhasFiltradas.reduce((sum, linha) => sum + (linha.somaCustoFinal || 0), 0)
    const margemMedia = totalVendas > 0 ? (totalLucro / totalVendas) * 100 : 0
    
    return {
      totalVendas,
      totalLucro,
      totalCusto,
      margemMedia,
      totalLinhas: linhasFiltradas.length
    }
  }, [linhasFiltradas])

  // Handlers de ações
  const handleNovaLinha = () => {
    setEditing(null)
    setOpenDialog(true)
  }

  const handleEditarLinha = (linha: LinhaVenda) => {
    setEditing(linha)
    setOpenDialog(true)
  }

  const handleExcluirLinha = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta linha?')) {
      try {
        await deleteLinha(id)
        await refreshLinhas()
      } catch (error: any) {
        console.error('Erro ao excluir linha:', error)
        if (error?.status === 400) {
          try {
            const response = await fetch(`/api/vendas/${id}/dependencies`)
            const dependencies = await response.json()
            
            let detailsMessage = `Não é possível excluir esta linha de venda porque ela está sendo usada em:\n\n`
            if (dependencies.acertos_relacionados?.count > 0) detailsMessage += `• ${dependencies.acertos_relacionados.count} acerto(s)\n`
            if (dependencies.pagamentos_relacionados?.count > 0) detailsMessage += `• ${dependencies.pagamentos_relacionados.count} pagamento(s)\n`
            detailsMessage += "\nExclua primeiro esses registros para poder deletar a linha de venda."
            
            alert(detailsMessage)
          } catch {
            alert("Não é possível excluir esta linha de venda pois ela possui registros associados. Exclua primeiro os registros relacionados.")
          }
        } else {
          alert('Erro ao excluir linha')
        }
      }
    }
  }

  const handleSalvarLinha = async (linha: Partial<LinhaVenda>) => {
    try {
      await saveLinha(linha as Omit<LinhaVenda, "id" | "createdAt"> & { id?: string })
      setOpenDialog(false)
      setEditing(null)
      await refreshLinhas()
    } catch (error) {
      console.error('Erro ao salvar linha:', error)
      alert('Erro ao salvar linha')
    }
  }

  // Handlers de importação/exportação
  const handleImportarArquivo = () => {
    fileRef.current?.click()
  }

  const handleArquivoSelecionado = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return;

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      await importRowsFromObjects(jsonData as Record<string, any>[])
      await refreshLinhas()
      
      // Limpar input
      if (fileRef.current) {
        fileRef.current.value = ''
      }
    } catch (error) {
      console.error('Erro ao importar arquivo:', error)
      alert('Erro ao importar arquivo')
    }
  }

  const handleExportarTemplate = () => {
    try {
      const csvContent = templateCSV()
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', 'template-vendas.csv')
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Erro ao exportar template:', error)
      alert('Erro ao exportar template')
    }
  }

  const handleAlterarCor = async (linha: LinhaVenda, cor: string) => {
    try {
      await updateLinhaColor(linha.id!, cor)
      await refreshLinhas()
    } catch (error) {
      console.error('Erro ao alterar cor:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-green-50/20">
      <AppHeader />
      
      <div className="container mx-auto px-4 py-6">
        {/* Header com métricas */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                Vendas
              </h1>
              <p className="text-slate-600 text-lg">Gerencie suas vendas e acompanhe o desempenho</p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleNovaLinha} 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-2.5"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Venda
              </Button>
              
              <Button 
                onClick={handleImportarArquivo} 
                variant="outline" 
                className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              
              <Button 
                onClick={handleExportarTemplate} 
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Template
              </Button>
              
              <Button 
                onClick={() => setOpenRates(true)} 
                variant="outline"
                className="border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <BadgePercent className="h-4 w-4 mr-2" />
                Taxas
              </Button>
              
              <Button 
                onClick={() => setOpenModalidades(true)} 
                variant="outline"
                className="border-teal-200 text-teal-600 hover:bg-teal-50 hover:border-teal-300 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <ListPlus className="h-4 w-4 mr-2" />
                Modalidades
              </Button>
            </div>
          </div>
          
          {/* Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <MetricCard
              title="Total Vendas"
              value={fmtCurrency(metrics.totalVendas)}
              icon="dollar"
              gradient="blue"
              hint="Valor total das vendas"
            />
            <MetricCard
              title="Total Lucro"
              value={fmtCurrency(metrics.totalLucro)}
              icon="trending"
              gradient="green"
              hint="Lucro obtido nas vendas"
            />
            <MetricCard
              title="Total Custo"
              value={fmtCurrency(metrics.totalCusto)}
              icon="piggy"
              gradient="purple"
              hint="Custo total das mercadorias"
            />
            <MetricCard
              title="Margem Média"
              value={`${metrics.margemMedia.toFixed(1)}%`}
              icon="calculator"
              gradient="orange"
              hint="Margem de lucro média"
            />
            <MetricCard
              title="Total Linhas"
              value={metrics.totalLinhas.toString()}
              icon="receipt"
              gradient="teal"
              hint="Número de vendas registradas"
            />
          </div>
        </div>
        
        {/* Filtros e controles */}
        <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500/10 via-green-500/10 to-purple-500/10 p-1">
            <CardContent className="bg-white rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                <div className="flex-1">
                  <Input
                    placeholder="🔍 Filtrar por cliente, produto, nº OF ou nº dispensa..."
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="max-w-md h-12 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-300 text-slate-700 placeholder:text-slate-400"
                  />
                </div>
                
                <div className="flex flex-wrap gap-4 items-center">
                  <Select value={anoSelecionado.toString()} onValueChange={(value) => setAnoSelecionado(parseInt(value))}>
                    <SelectTrigger className="w-36 h-12 rounded-xl border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <SelectItem key={year} value={year.toString()} className="rounded-lg">{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 rounded-xl border border-green-100">
                    <Switch
                      id="only-pend-acerto"
                      checked={onlyPendAcerto}
                      onCheckedChange={setOnlyPendAcerto}
                      className="data-[state=checked]:bg-green-500"
                    />
                    <Label htmlFor="only-pend-acerto" className="text-sm font-medium text-green-700 cursor-pointer">
                      Apenas pendentes de acerto
                    </Label>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-12 px-4 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all duration-300"
                      >
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Colunas
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl border-slate-200">
                      <DropdownMenuLabel className="text-slate-700">Colunas Visíveis</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {allColumns.map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column.key}
                          checked={prefs.visible[column.key]}
                          onCheckedChange={(checked) => {
                            setPrefs(prev => ({
                              ...prev,
                              visible: { ...prev.visible, [column.key]: checked }
                            }))
                          }}
                          className="rounded-lg"
                        >
                          {column.label}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
        
        {/* Tabela */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0 rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-slate-500/5 via-blue-500/5 to-green-500/5 p-1">
            <CardContent className="bg-white rounded-2xl p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50/50 border-b border-slate-200/50">
                      {allColumns.filter(col => prefs.visible[col.key]).map((column) => (
                        <TableHead key={column.key} className={`${prefs.density === "compact" ? "py-3" : "py-4"} font-semibold text-slate-700 first:pl-6`}>
                          {column.label}
                        </TableHead>
                      ))}
                      <TableHead className={`${prefs.density === "compact" ? "py-3" : "py-4"} font-semibold text-slate-700 last:pr-6`}>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linhasFiltradas.map((linha, index) => (
                      <TableRow 
                        key={linha.id} 
                        className={`
                          ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} 
                          hover:bg-blue-50/50 transition-all duration-200 border-b border-slate-100/50
                        `}
                        style={{ backgroundColor: linha.cor ? `${linha.cor}80` : undefined }}
                      >
                        {allColumns.filter(col => prefs.visible[col.key]).map((column) => (
                          <TableCell key={column.key} className={`${prefs.density === "compact" ? "py-3" : "py-4"} text-slate-700 first:pl-6`}>
                            {column.key === "dataPedido" || column.key === "dataRecebimento" ? (
                              linha[column.key] ? (
                                <span className="text-slate-600 font-medium">
                                  {new Date(linha[column.key]!).toLocaleDateString('pt-BR')}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )
                            ) : column.key === "valorVenda" || column.key === "taxaCapitalVl" || column.key === "taxaImpostoVl" || column.key === "custoMercadoria" || column.key === "somaCustoFinal" || column.key === "lucroValor" ? (
                              <span className="font-semibold text-slate-800">
                                {fmtCurrency(linha[column.key] || 0)}
                              </span>
                            ) : column.key === "taxaCapitalPerc" || column.key === "taxaImpostoPerc" || column.key === "lucroPerc" ? (
                              <span className="font-medium text-blue-600">
                                {`${(linha[column.key] || 0).toFixed(2)}%`}
                              </span>
                            ) : column.key === "paymentStatus" ? (
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                                linha.paymentStatus === "Pago" ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200" :
                                linha.paymentStatus === "Parcial" ? "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200" :
                                "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200"
                              }`}>
                                {linha.paymentStatus || "Pendente"}
                              </span>
                            ) : column.key === "settlementStatus" ? (
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                                linha.settlementStatus === "Acertado" ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200" :
                                "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200"
                              }`}>
                                {linha.settlementStatus || "Pendente"}
                              </span>
                            ) : (
                              <span className="text-slate-700">
                                {linha[column.key] || "-"}
                              </span>
                            )}
                          </TableCell>
                        ))}
                        <TableCell className={`${prefs.density === "compact" ? "py-3" : "py-4"} last:pr-6`}>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditarLinha(linha)}
                              className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600 rounded-lg transition-all duration-200"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExcluirLinha(linha.id!)}
                              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 rounded-lg transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-600 rounded-lg transition-all duration-200"
                                >
                                  <Palette className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="rounded-xl border-slate-200">
                                <DropdownMenuLabel className="text-slate-700">Cor da Linha</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="grid grid-cols-4 gap-2 p-3">
                                  {[
                                    { name: "Padrão", value: "" },
                                    { name: "Vermelho", value: "#fee2e2" },
                                    { name: "Verde", value: "#dcfce7" },
                                    { name: "Azul", value: "#dbeafe" },
                                    { name: "Amarelo", value: "#fef3c7" },
                                    { name: "Rosa", value: "#fce7f3" },
                                    { name: "Roxo", value: "#e9d5ff" },
                                    { name: "Laranja", value: "#fed7aa" },
                                  ].map((cor) => (
                                    <button
                                      key={cor.name}
                                      className="w-7 h-7 rounded-lg border-2 border-slate-200 hover:scale-110 hover:border-slate-300 transition-all duration-200 shadow-sm"
                                      style={{ backgroundColor: cor.value || "white" }}
                                      onClick={() => handleAlterarCor(linha, cor.value)}
                                      title={cor.name}
                                    />
                                  ))}
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {linhasFiltradas.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-slate-400 text-lg font-medium mb-2">📊 Nenhuma venda encontrada</div>
                  <p className="text-slate-500 text-sm">Tente ajustar os filtros ou adicionar uma nova venda</p>
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      </div>
      
      {/* Input oculto para upload */}
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleArquivoSelecionado}
        style={{ display: "none" }}
      />
      
      {/* Diálogos */}
      <VendaDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        linha={editing}
        onSave={handleSalvarLinha}
        capitalRates={capitalRates}
        impostoRates={impostoRates}
        modalidades={modalidades}
        clientes={clientes}
      />
      
      <ManageRatesDialog
        open={openRates}
        onOpenChange={setOpenRates}
        onSaved={refreshRates}
      />
      
      <ManageModalidadesDialog
        open={openModalidades}
        onOpenChange={setOpenModalidades}
        onModalidadesUpdated={refreshModalidades}
      />
    </div>
  )
}

export default VendasPlanilhaPage
