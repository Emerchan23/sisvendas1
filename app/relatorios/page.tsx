"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AppHeader } from "@/components/app-header"
import { fmtCurrency } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getLinhas } from "@/lib/planilha"
import { getAcertos, getParticipantes } from "@/lib/acertos"
import { makeReportHTML, openPrintWindow, downloadPDF } from "@/lib/print"
import { ERP_CHANGED_EVENT } from "@/lib/data-store"
import { getConfig } from "@/lib/config"
import { RefreshCw, Printer, Download, BarChart3, TrendingUp, DollarSign, Users, Calendar, FileText, Filter } from "lucide-react"

type DistRow = { participanteId: string; nome: string; total: number; totalBruto: number; totalDespesasIndiv: number; qtdAcertos: number }
type FaturamentoAno = { ano: number; total: number }

// Normaliza percentuais: aceita 10 (10%) ou 0.1 (10%)
function percToFactor(p: unknown): number {
  const n = Number(p)
  if (!Number.isFinite(n) || n <= 0) return 0
  return n > 1 ? n / 100 : n
}

function capitalFromRow(l: any, cfg: { taxaCapitalPadrao?: number }): number {
  const vv = Number(getValorVenda(l) || 0)
  const val = Number(l?.taxaCapitalVl)
  if (Number.isFinite(val) && val > 0) return val
  const rowPerc = percToFactor(l?.taxaCapitalPerc)
  if (rowPerc > 0) return +(vv * rowPerc).toFixed(2)
  const cfgPerc = percToFactor(cfg?.taxaCapitalPadrao ?? 0)
  if (cfgPerc > 0) return +(vv * cfgPerc).toFixed(2)
  return 0
}

function impostoFromRow(l: any, cfg: { taxaImpostoPadrao?: number }): number {
  const vv = Number(getValorVenda(l) || 0)
  const val = Number(l?.taxaImpostoVl)
  if (Number.isFinite(val) && val > 0) return val
  const rowPerc = percToFactor(l?.taxaImpostoPerc)
  if (rowPerc > 0) return +(vv * rowPerc).toFixed(2)
  const cfgPerc = percToFactor(cfg?.taxaImpostoPadrao ?? 0)
  if (cfgPerc > 0) return +(vv * cfgPerc).toFixed(2)
  return 0
}

function inRange(iso?: string, ini?: Date, fim?: Date) {
  if (!iso || !ini || !fim) return false
  const d = new Date(iso)
  const di = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate())
  const df = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate(), 23, 59, 59, 999)
  return d >= di && d <= df
}

function getValorVenda(l: any): number {
  const candidates = ["valorVenda", "valor_venda", "valorVendaVl", "valor", "total", "valor_total"]
  for (const key of candidates) {
    const n = Number(l?.[key])
    if (!Number.isNaN(n) && n !== 0) return n
  }
  const n = Number(l?.valorVenda)
  return Number.isNaN(n) ? 0 : n
}

export default function RelatoriosPage() {
  // Período padrão: ano atual
  const [inicio, setInicio] = useState<string>(() =>
    new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10),
  )
  const [fim, setFim] = useState<string>(() => new Date(new Date().getFullYear(), 11, 31).toISOString().slice(0, 10))

  const reportRef = useRef<HTMLDivElement>(null)

  const [linhas, setLinhas] = useState<any[]>([])
  const [acertos, setAcertos] = useState<any[]>([])
  const [participantes, setParticipantes] = useState<any[]>([])
  const [config, setConfig] = useState(() => getConfig())

  async function reload() {
    try {
      const [linhasData, acertosData, participantesData] = await Promise.all([
        getLinhas(),
        getAcertos(),
        getParticipantes()
      ])
      setLinhas(linhasData)
      setAcertos(acertosData)
      setParticipantes(participantesData)
      setConfig(getConfig())
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      setLinhas([])
      setAcertos([])
      setParticipantes([])
    }
  }

  useEffect(() => {
    reload()
    const onAnyChange = () => reload()
    window.addEventListener(ERP_CHANGED_EVENT, onAnyChange as EventListener)
    window.addEventListener("storage", onAnyChange)
    return () => {
      window.removeEventListener(ERP_CHANGED_EVENT, onAnyChange as EventListener)
      window.removeEventListener("storage", onAnyChange)
    }
  }, [])

  const di = useMemo(() => new Date(inicio), [inicio])
  const df = useMemo(() => new Date(fim), [fim])

  // Filtra por período
  const linhasPeriodo = useMemo(() => linhas.filter((l) => inRange(l.dataPedido, di, df)), [linhas, di, df])
  const acertosPeriodo = useMemo(() => acertos.filter((a) => inRange(a.data, di, df)), [acertos, di, df])

  // Totais
  const totalTaxaCapital = useMemo(
    () => linhasPeriodo.reduce((a, l) => a + capitalFromRow(l, { taxaCapitalPadrao: config.taxaCapitalPadrao }), 0),
    [linhasPeriodo, config],
  )

  const totalImpostos = useMemo(
    () => linhasPeriodo.reduce((a, l) => a + impostoFromRow(l, { taxaImpostoPadrao: config.taxaImpostoPadrao }), 0),
    [linhasPeriodo, config],
  )
  const totalLucroBruto = useMemo(
    () => linhasPeriodo.reduce((a, l) => a + (Number(l.lucroValor) || 0), 0),
    [linhasPeriodo],
  )
  const totalDespesasAcertos = useMemo(
    () => {
      return acertosPeriodo.reduce(
        (a, x) => a + (Number(x.totalDespesasRateio) || 0) + (Number(x.totalDespesasIndividuais) || 0),
        0,
      )
    },
    [acertosPeriodo],
  )
  
  // Lucro líquido = Lucro bruto - Despesas dos acertos
  const totalLucroLiquido = useMemo(
    () => totalLucroBruto - totalDespesasAcertos,
    [totalLucroBruto, totalDespesasAcertos],
  )
  
  const faturamentoPeriodo = useMemo(() => linhasPeriodo.reduce((a, l) => a + getValorVenda(l), 0), [linhasPeriodo])

  // Faturamento por ano (filtrado pelo período selecionado)
  const faturamentoPorAno: FaturamentoAno[] = useMemo(() => {
    const map = new Map<number, number>()
    for (const l of linhasPeriodo) {
      if (!l?.dataPedido) continue
      const d = new Date(l.dataPedido)
      const ano = d.getFullYear()
      map.set(ano, (map.get(ano) || 0) + getValorVenda(l))
    }
    return Array.from(map.entries())
      .map(([ano, total]) => ({ ano, total }))
      .sort((a, b) => b.ano - a.ano)
  }, [linhasPeriodo])

  // Distribuição por participante (acertos do período)
  const distribPorParticipante: DistRow[] = useMemo(() => {
    const map = new Map<string, { totalLiquido: number; totalBruto: number; totalDespesasIndiv: number; qtd: number }>()
    for (const a of acertosPeriodo) {
      const distribs: any[] = a.distribuicoes || []
      for (const d of distribs) {
        const cur = map.get(d.participanteId) || { totalLiquido: 0, totalBruto: 0, totalDespesasIndiv: 0, qtd: 0 }
        map.set(d.participanteId, { 
          totalLiquido: cur.totalLiquido + (Number(d.valor) || 0),
          totalBruto: cur.totalBruto + (Number(d.valorBruto) || 0),
          totalDespesasIndiv: cur.totalDespesasIndiv + (Number(d.descontoIndividual) || 0),
          qtd: cur.qtd + 1 
        })
      }
    }
    const byIdName = new Map(participantes.map((p: any) => [p.id, p.nome] as const))
    return Array.from(map.entries())
      .map(([participanteId, info]) => ({
        participanteId,
        nome: byIdName.get(participanteId) || `Participante ${participanteId.slice(0, 6)}`,
        total: +info.totalLiquido.toFixed(2),
        totalBruto: +info.totalBruto.toFixed(2),
        totalDespesasIndiv: +info.totalDespesasIndiv.toFixed(2),
        qtdAcertos: info.qtd,
      }))
      .sort((a, b) => b.total - a.total)
  }, [acertosPeriodo, participantes])

  // Cliente com mais vendas (por valor)
  const clientesMaisVendas = useMemo(() => {
    const map = new Map<string, { total: number; qtdVendas: number }>()
    for (const l of linhasPeriodo) {
      const cliente = l.cliente || 'Cliente não informado'
      const valor = getValorVenda(l)
      const cur = map.get(cliente) || { total: 0, qtdVendas: 0 }
      map.set(cliente, { total: cur.total + valor, qtdVendas: cur.qtdVendas + 1 })
    }
    return Array.from(map.entries())
      .map(([cliente, info]) => ({
        cliente,
        totalVendas: +info.total.toFixed(2),
        qtdVendas: info.qtdVendas,
      }))
      .sort((a, b) => b.totalVendas - a.totalVendas)
      .slice(0, 10) // Top 10
  }, [linhasPeriodo])

  // Cliente com mais lucro
  const clientesMaisLucro = useMemo(() => {
    const map = new Map<string, { lucro: number; qtdVendas: number }>()
    for (const l of linhasPeriodo) {
      const cliente = l.cliente || 'Cliente não informado'
      const lucro = Number(l.lucroValor) || 0
      const cur = map.get(cliente) || { lucro: 0, qtdVendas: 0 }
      map.set(cliente, { lucro: cur.lucro + lucro, qtdVendas: cur.qtdVendas + 1 })
    }
    return Array.from(map.entries())
      .map(([cliente, info]) => ({
        cliente,
        totalLucro: +info.lucro.toFixed(2),
        qtdVendas: info.qtdVendas,
      }))
      .sort((a, b) => b.totalLucro - a.totalLucro)
      .slice(0, 10) // Top 10
  }, [linhasPeriodo])

  // Lucro por modalidade (Direta vs Licitação)
  const lucroPorModalidade = useMemo(() => {
    const modalidades = new Map<string, { lucro: number; vendas: number; qtdVendas: number }>()
    for (const l of linhasPeriodo) {
      const modalidade = l.modalidade || 'Não informado'
      const lucro = Number(l.lucroValor) || 0
      const venda = getValorVenda(l)
      const cur = modalidades.get(modalidade) || { lucro: 0, vendas: 0, qtdVendas: 0 }
      modalidades.set(modalidade, {
        lucro: cur.lucro + lucro,
        vendas: cur.vendas + venda,
        qtdVendas: cur.qtdVendas + 1
      })
    }
    return Array.from(modalidades.entries())
      .map(([modalidade, info]) => ({
        modalidade,
        totalLucro: +info.lucro.toFixed(2),
        totalVendas: +info.vendas.toFixed(2),
        qtdVendas: info.qtdVendas,
        margemLucro: info.vendas > 0 ? +((info.lucro / info.vendas) * 100).toFixed(2) : 0
      }))
      .sort((a, b) => b.totalLucro - a.totalLucro)
  }, [linhasPeriodo])

  // Exportações CSV
  function exportResumoCSV() {
    const rows = [
      ["Periodo", `${inicio} a ${fim}`],
      ["Faturamento do período", faturamentoPeriodo],
      ["Gasto com taxa de capital", totalTaxaCapital],
      ["Impostos pagos", totalImpostos],
      ["Lucro bruto (linhas)", totalLucroBruto],
      ["Despesas (acertos)", totalDespesasAcertos],
      ["Lucro líquido", totalLucroLiquido],
    ]
    const csv = rows.map((r) => r.join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "resumo-relatorio.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportDistribuicaoCSV() {
    const header = ["Participante", "Lucro bruto", "Despesas individuais", "Lucro líquido", "Qtd. acertos"]
    const rows = [header, ...distribPorParticipante.map((r) => [r.nome, r.totalBruto, r.totalDespesasIndiv, r.total, r.qtdAcertos])]
    const csv = rows.map((r) => r.join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "distribuicao-por-participante.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportFaturamentoAnualCSV() {
    const header = ["Ano", "Faturamento"]
    const rows = [header, ...faturamentoPorAno.map((r) => [r.ano, r.total])]
    const csv = rows.map((r) => r.join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "faturamento-anual.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportClientesMaisVendasCSV() {
    const header = ["Cliente", "Total Vendas", "Qtd. Vendas"]
    const rows = [header, ...clientesMaisVendas.map((r) => [r.cliente, r.totalVendas, r.qtdVendas])]
    const csv = rows.map((r) => r.join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "clientes-mais-vendas.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportClientesMaisLucroCSV() {
    const header = ["Cliente", "Total Lucro", "Qtd. Vendas"]
    const rows = [header, ...clientesMaisLucro.map((r) => [r.cliente, r.totalLucro, r.qtdVendas])]
    const csv = rows.map((r) => r.join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "clientes-mais-lucro.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportLucroPorModalidadeCSV() {
    const header = ["Modalidade", "Total Lucro", "Total Vendas", "Qtd. Vendas", "Margem Lucro (%)"]
    const rows = [header, ...lucroPorModalidade.map((r) => [r.modalidade, r.totalLucro, r.totalVendas, r.qtdVendas, r.margemLucro])]
    const csv = rows.map((r) => r.join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "lucro-por-modalidade.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  // Impressão (HTML renderizado no navegador)
  async function imprimirRelatorio() {
    const resumo = [
      { label: "Faturamento do período", amount: faturamentoPeriodo, highlight: "green" as const },
      { label: "Gasto com taxa de capital", amount: totalTaxaCapital, highlight: "red" as const },
      { label: "Impostos pagos", amount: totalImpostos, highlight: "red" as const },
      { label: "Lucro bruto (linhas)", amount: totalLucroBruto, highlight: "green" as const },
      { label: "Despesas (acertos)", amount: totalDespesasAcertos, highlight: "red" as const },
      { label: "Lucro líquido", amount: totalLucroLiquido, highlight: totalLucroLiquido >= 0 ? "green" as const : "red" as const },
    ]
    const periodLabel = `${new Date(inicio).toLocaleDateString()} a ${new Date(fim).toLocaleDateString()}`
    const html = await makeReportHTML({
      periodLabel,
      resumo,
      faturamentoAnual: faturamentoPorAno,
      distribuicao: distribPorParticipante.map((d) => ({ nome: d.nome, total: d.total, totalBruto: d.totalBruto, totalDespesasIndiv: d.totalDespesasIndiv, qtdAcertos: d.qtdAcertos })),
    })
    openPrintWindow(html, "Relatório")
  }

  // Download PDF do relatório
  async function baixarRelatorioPDF() {
    const resumo = [
      { label: "Faturamento do período", amount: faturamentoPeriodo, highlight: "green" as const },
      { label: "Gasto com taxa de capital", amount: totalTaxaCapital, highlight: "red" as const },
      { label: "Impostos pagos", amount: totalImpostos, highlight: "red" as const },
      { label: "Lucro bruto (linhas)", amount: totalLucroBruto, highlight: "green" as const },
      { label: "Despesas (acertos)", amount: totalDespesasAcertos, highlight: "red" as const },
      { label: "Lucro líquido", amount: totalLucroLiquido, highlight: totalLucroLiquido >= 0 ? "green" as const : "red" as const },
    ]
    const periodLabel = `${new Date(inicio).toLocaleDateString()} a ${new Date(fim).toLocaleDateString()}`
    const html = await makeReportHTML({
      periodLabel,
      resumo,
      faturamentoAnual: faturamentoPorAno,
      distribuicao: distribPorParticipante.map((d) => ({ nome: d.nome, total: d.total, totalBruto: d.totalBruto, totalDespesasIndiv: d.totalDespesasIndiv, qtdAcertos: d.qtdAcertos })),
    })
    await downloadPDF(html, `Relatório_${periodLabel.replace(/\//g, '-')}`)
  }

  // Filtro rápido por ano
  function setAno(ano: number) {
    const ini = new Date(ano, 0, 1)
    const end = new Date(ano, 11, 31)
    setInicio(ini.toISOString().slice(0, 10))
    setFim(end.toISOString().slice(0, 10))
  }
  const anoAtual = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <AppHeader title="Relatórios" />
      <main className="mx-auto w-full max-w-7xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <BarChart3 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Relatórios</h1>
              <p className="text-gray-600 mt-1">Análise completa de vendas e lucros</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reload} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button onClick={imprimirRelatorio} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={baixarRelatorioPDF} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </Button>
          </div>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg border-b">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4 p-6">
            <div className="grid gap-2">
              <Label htmlFor="inicio" className="flex items-center gap-2 text-gray-700 font-medium">
                <Calendar className="h-4 w-4" />
                Início
              </Label>
              <Input id="inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fim" className="flex items-center gap-2 text-gray-700 font-medium">
                <Calendar className="h-4 w-4" />
                Fim
              </Label>
              <Input id="fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" />
            </div>
            <div className="md:col-span-2 flex items-end gap-2 flex-wrap">
              <Button onClick={exportResumoCSV} className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all duration-200">
                <Download className="mr-2 h-4 w-4" />
                Exportar resumo (CSV)
              </Button>
              <Button variant="outline" onClick={exportDistribuicaoCSV} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
                <FileText className="mr-2 h-4 w-4" />
                Exportar distribuição (CSV)
              </Button>
              <Button variant="outline" onClick={exportFaturamentoAnualCSV} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
                <TrendingUp className="mr-2 h-4 w-4" />
                Exportar faturamento anual (CSV)
              </Button>
              <Button variant="outline" onClick={exportClientesMaisVendasCSV} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
                <Users className="mr-2 h-4 w-4" />
                Exportar clientes + vendas (CSV)
              </Button>
              <Button variant="outline" onClick={exportClientesMaisLucroCSV} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
                <DollarSign className="mr-2 h-4 w-4" />
                Exportar clientes + lucro (CSV)
              </Button>
              <Button variant="outline" onClick={exportLucroPorModalidadeCSV} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
                <BarChart3 className="mr-2 h-4 w-4" />
                Exportar lucro modalidades (CSV)
              </Button>
            </div>
            <div className="md:col-span-4 flex gap-2 flex-wrap items-center">
              <span className="text-sm text-gray-600 font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Anos rápidos:
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setAno(anoAtual)} className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
                  {anoAtual}
                </Button>
                <Button variant="ghost" onClick={() => setAno(anoAtual - 1)} className="hover:bg-blue-50 hover:text-blue-700 transition-all duration-200">
                  {anoAtual - 1}
                </Button>
                <Button variant="ghost" onClick={() => setAno(anoAtual - 2)} className="hover:bg-blue-50 hover:text-blue-700 transition-all duration-200">
                  {anoAtual - 2}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div ref={reportRef} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-green-800 text-sm font-medium">
                  <TrendingUp className="h-4 w-4" />
                  Faturamento do período
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-green-700">{fmtCurrency(faturamentoPeriodo)}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-orange-800 text-sm font-medium">
                  <DollarSign className="h-4 w-4" />
                  Gasto com taxa de capital
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-orange-700">{fmtCurrency(totalTaxaCapital)}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-50 to-pink-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-red-800 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  Impostos pagos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-red-700">{fmtCurrency(totalImpostos)}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-emerald-800 text-sm font-medium">
                  <BarChart3 className="h-4 w-4" />
                  Lucro bruto (linhas)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-emerald-700">
                  {fmtCurrency(totalLucroBruto)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-100 border-0 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-purple-800 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  Despesas (acertos)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-purple-700">
                  {fmtCurrency(totalDespesasAcertos)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-100 rounded-t-lg border-b">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <TrendingUp className="h-5 w-5" />
                Faturamento por ano
              </CardTitle>
              <Button variant="outline" onClick={exportFaturamentoAnualCSV} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent className="overflow-auto p-0">
              <div className="bg-gradient-to-r from-blue-500/5 to-indigo-500/5 p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200">
                      <TableHead className="font-semibold text-gray-700">Ano</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Faturamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faturamentoPorAno.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-gray-500 py-8">
                          <div className="flex flex-col items-center gap-2">
                            <TrendingUp className="h-8 w-8 text-gray-400" />
                            <span>Sem dados de faturamento.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      faturamentoPorAno.map((r, index) => (
                        <TableRow key={r.ano} className={`${index % 2 === 0 ? 'bg-white/50' : 'bg-blue-50/30'} hover:bg-blue-100/50 transition-all duration-200`}>
                          <TableCell className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">{r.ano}</span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-700">{fmtCurrency(r.total)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-purple-50 to-pink-100 rounded-t-lg border-b">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Users className="h-5 w-5" />
                Distribuição por participante
              </CardTitle>
              <Button variant="outline" onClick={exportDistribuicaoCSV} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent className="overflow-auto p-0">
              <div className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200">
                      <TableHead className="font-semibold text-gray-700">Participante</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Lucro bruto</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Despesas indiv.</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Lucro líquido</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Qtd. acertos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distribPorParticipante.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-gray-400" />
                            <span>Nenhuma distribuição no período.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      distribPorParticipante.map((r, index) => (
                        <TableRow key={r.participanteId} className={`${index % 2 === 0 ? 'bg-white/50' : 'bg-purple-50/30'} hover:bg-purple-100/50 transition-all duration-200`}>
                          <TableCell className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-purple-600" />
                            <span className="font-medium">{r.nome}</span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-700">{fmtCurrency(r.totalBruto)}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600">{fmtCurrency(r.totalDespesasIndiv)}</TableCell>
                          <TableCell className="text-right font-semibold" style={{ color: r.total >= 0 ? '#059669' : '#dc2626' }}>
                            {fmtCurrency(r.total)}
                          </TableCell>
                          <TableCell className="text-right">{r.qtdAcertos}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-green-50 to-emerald-100 rounded-t-lg border-b">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Users className="h-5 w-5" />
                Clientes com mais vendas (Top 10)
              </CardTitle>
              <Button variant="outline" onClick={exportClientesMaisVendasCSV} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent className="overflow-auto p-0">
              <div className="bg-gradient-to-r from-green-500/5 to-emerald-500/5 p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200">
                      <TableHead className="font-semibold text-gray-700">Cliente</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Total Vendas</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Qtd. Vendas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesMaisVendas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-gray-400" />
                            <span>Sem dados de vendas por cliente.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientesMaisVendas.map((r, index) => (
                        <TableRow key={r.cliente} className={`${index % 2 === 0 ? 'bg-white/50' : 'bg-green-50/30'} hover:bg-green-100/50 transition-all duration-200`}>
                          <TableCell className="flex items-center gap-2">
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              #{index + 1}
                            </span>
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="font-medium">{r.cliente}</span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-700">{fmtCurrency(r.totalVendas)}</TableCell>
                          <TableCell className="text-right">{r.qtdVendas}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-100 rounded-t-lg border-b">
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <DollarSign className="h-5 w-5" />
                Clientes com mais lucro (Top 10)
              </CardTitle>
              <Button variant="outline" onClick={exportClientesMaisLucroCSV} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent className="overflow-auto p-0">
              <div className="bg-gradient-to-r from-emerald-500/5 to-teal-500/5 p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200">
                      <TableHead className="font-semibold text-gray-700">Cliente</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Total Lucro</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Qtd. Vendas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesMaisLucro.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                          <div className="flex flex-col items-center gap-2">
                            <DollarSign className="h-8 w-8 text-gray-400" />
                            <span>Sem dados de lucro por cliente.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      clientesMaisLucro.map((r, index) => (
                        <TableRow key={r.cliente} className={`${index % 2 === 0 ? 'bg-white/50' : 'bg-emerald-50/30'} hover:bg-emerald-100/50 transition-all duration-200`}>
                          <TableCell className="flex items-center gap-2">
                            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-medium">
                              #{index + 1}
                            </span>
                            <Users className="h-4 w-4 text-emerald-600" />
                            <span className="font-medium">{r.cliente}</span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-emerald-700">{fmtCurrency(r.totalLucro)}</TableCell>
                          <TableCell className="text-right">{r.qtdVendas}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-100 rounded-t-lg border-b">
              <CardTitle className="flex items-center gap-2 text-indigo-800">
                <BarChart3 className="h-5 w-5" />
                Lucro por modalidade
              </CardTitle>
              <Button variant="outline" onClick={exportLucroPorModalidadeCSV} className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200">
                <Download className="mr-2 h-4 w-4" />
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent className="overflow-auto p-0">
              <div className="bg-gradient-to-r from-indigo-500/5 to-blue-500/5 p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200">
                      <TableHead className="font-semibold text-gray-700">Modalidade</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Total Lucro</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Total Vendas</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Qtd. Vendas</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Margem (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lucroPorModalidade.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                          <div className="flex flex-col items-center gap-2">
                            <BarChart3 className="h-8 w-8 text-gray-400" />
                            <span>Sem dados de lucro por modalidade.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      lucroPorModalidade.map((r, index) => (
                        <TableRow key={r.modalidade} className={`${index % 2 === 0 ? 'bg-white/50' : 'bg-indigo-50/30'} hover:bg-indigo-100/50 transition-all duration-200`}>
                          <TableCell className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-indigo-600" />
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              r.modalidade.toLowerCase().includes('direta') 
                                ? 'bg-blue-100 text-blue-800'
                                : r.modalidade.toLowerCase().includes('licitação') || r.modalidade.toLowerCase().includes('licitacao')
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {r.modalidade}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-green-700">{fmtCurrency(r.totalLucro)}</TableCell>
                          <TableCell className="text-right">{fmtCurrency(r.totalVendas)}</TableCell>
                          <TableCell className="text-right">{r.qtdVendas}</TableCell>
                          <TableCell className="text-right">
                            <span className={`font-medium ${
                              r.margemLucro >= 20 ? 'text-green-600' :
                              r.margemLucro >= 10 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {r.margemLucro}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-t-lg border-b">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <FileText className="h-5 w-5" />
                Resumo numérico
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto p-0">
              <div className="bg-gradient-to-r from-slate-500/5 to-gray-500/5 p-4">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200">
                      <TableHead className="font-semibold text-gray-700">Métrica</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-white/50 hover:bg-slate-100/50 transition-all duration-200">
                      <TableCell className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-600" />
                        <span className="font-medium">Total de linhas no período</span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-700">{linhasPeriodo.length}</TableCell>
                    </TableRow>
                    <TableRow className="bg-slate-50/30 hover:bg-slate-100/50 transition-all duration-200">
                      <TableCell className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-slate-600" />
                        <span className="font-medium">Total de acertos no período</span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-700">{acertosPeriodo.length}</TableCell>
                    </TableRow>
                    <TableRow className="bg-white/50 hover:bg-slate-100/50 transition-all duration-200">
                      <TableCell className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-slate-600" />
                        <span className="font-medium">Participantes únicos</span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-700">{participantes.length}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
