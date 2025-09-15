"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getDashboardTotals, getDashboardSeries, getDashboardSummary, getDashboardAlerts } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { AppHeader } from "@/components/app-header"
import { MetricCard } from "@/components/metric-card"
import { OverviewChart } from "@/components/charts/overview-chart"
import { fmtCurrency } from "@/lib/format"
import ProtectedRoute from "@/components/ProtectedRoute"
import { useAuth } from "@/contexts/AuthContext"

type DashboardData = {
  totals: {
    totalRecebido: number
    totalAReceber: number
    lucroTotal: number
    lucroLiquido: number
    impostosTotais: number
    jurosPendentes: number
    totalVendas: number
    pendentes: number
  }
  series: { name: string; vendas: number; lucros: number; impostos: number; despesas: number; lucroLiquido: number }[]
  summary: {
    totalClientes: number
    totalProdutos: number
    totalPedidos: number
    pedidosPendentes: number
    orcamentosAprovados: number
    orcamentosPendentes: number
  }
  alerts: { id: string; type: string; title: string; message: string; timestamp: string }[]
  lastUpdate: string
}

export default function HomePage() {
  const router = useRouter()
  const { usuario } = useAuth()
  // Estados individuais para cada seção do dashboard
  const [totals, setTotals] = useState<DashboardData['totals'] | null>(null)
  const [series, setSeries] = useState<DashboardData['series']>([])
  const [summary, setSummary] = useState<DashboardData['summary'] | null>(null)
  const [alerts, setAlerts] = useState<DashboardData['alerts']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState<"bar" | "line">("bar")
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedSemester, setSelectedSemester] = useState<string | undefined>(undefined)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)


  const loadUserAndData = async () => {
    try {
      setLoading(true)
      setError(null)
      
  
        
        try {
          const [totals, series, summary, alerts] = await Promise.all([
            getDashboardTotals(),
            getDashboardSeries(selectedYear, selectedSemester),
            getDashboardSummary(),
            getDashboardAlerts()
          ])
          
          setTotals(totals)
          setSeries(series)
          setSummary(summary)
          setAlerts(alerts)
          
          
        } catch (err: any) {
          setError(`Erro ao carregar dados do dashboard: ${err.message}`)
        }
    } catch (err: any) {
      setError(`Erro: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Função para recarregar apenas os dados do gráfico
  const loadChartData = async () => {
    try {
      const series = await getDashboardSeries(selectedYear, selectedSemester)
      setSeries(series)
    } catch (err: any) {
      // Erro silencioso para não interromper a experiência do usuário
    }
  }

  // Função para atualização automática dos dados
  const refreshDashboardData = async (silent = true) => {
    try {
      if (!silent) setLoading(true)
      
      const [totals, series, summary, alerts] = await Promise.all([
        getDashboardTotals(),
        getDashboardSeries(selectedYear, selectedSemester),
        getDashboardSummary(),
        getDashboardAlerts()
      ])
      
      setTotals(totals)
      setSeries(series)
      setSummary(summary)
      setAlerts(alerts)
      setLastUpdate(new Date())
      setError(null)
    } catch (error) {
      console.error("Erro ao atualizar dados do dashboard:", error)
      if (!silent) {
        setError("Erro ao carregar dados do dashboard")
      }
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    loadUserAndData()
  }, [])

  // Recarregar dados do gráfico quando ano ou semestre mudarem
  useEffect(() => {
    if (totals && totals.totalRecebido !== undefined) {
      loadChartData()
    }
  }, [totals, selectedYear, selectedSemester])

  // Atualização automática em tempo real
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshDashboardData(true) // silent refresh
    }, 30000) // Atualiza a cada 30 segundos

    return () => clearInterval(interval)
  }, [autoRefresh, selectedYear, selectedSemester])



  // Mostrar loading enquanto carrega os dados
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Carregando dados...</p>
          </div>
        </main>
      </div>
    )
  }

  // Mostrar erro se houver
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-red-600">Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={loadUserAndData} className="w-full">
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!totals || !summary || !alerts) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Carregando dashboard...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <AppHeader />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
                  Dashboard Executivo
                </h1>
                <p className="text-gray-600 font-medium">
                  Visão geral do seu negócio
                  {lastUpdate && (
                    <span> • Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
                  )}
                </p>
              </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/60 rounded-lg border border-white/30">
                <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {autoRefresh ? 'Atualização Automática' : 'Manual'}
                </span>
                {lastUpdate && (
                  <span className="text-xs text-gray-500">
                    {lastUpdate.toLocaleTimeString('pt-BR')}
                  </span>
                )}
              </div>
              <Button 
                onClick={() => setAutoRefresh(!autoRefresh)}
                variant="outline"
                size="sm"
                className={`border-2 font-semibold px-4 py-2 rounded-xl shadow-md transition-all duration-300 ${
                  autoRefresh 
                    ? 'border-green-500/30 text-green-600 hover:bg-green-50' 
                    : 'border-gray-500/30 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {autoRefresh ? '🔄 Ativo' : '⏸️ Pausado'}
              </Button>
              <Button 
                onClick={() => refreshDashboardData(false)}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {loading ? "Carregando..." : "Atualizar Agora"}
              </Button>
            </div>
          </div>

          {/* Métricas principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            <MetricCard 
              title="Total Recebido" 
              value={fmtCurrency(totals.totalRecebido)}
              icon="dollar"
              gradient="green"
              hint="Valores já recebidos"
            />
            <MetricCard 
              title="Total a Receber" 
              value={fmtCurrency(totals.totalAReceber)}
              icon="trending"
              gradient="blue"
              hint="Pendências de recebimento"
            />
            <MetricCard 
              title="Lucro Total" 
              value={fmtCurrency(totals.lucroTotal)}
              icon="piggy"
              gradient="purple"
              hint="Lucro bruto do período"
            />
            <MetricCard 
              title="Lucro Líquido" 
              value={fmtCurrency(totals.lucroLiquido)}
              icon="calculator"
              gradient="indigo"
              hint="Após impostos e despesas"
            />
            <MetricCard 
              title="Impostos Totais" 
              value={fmtCurrency(totals.impostosTotais)}
              icon="receipt"
              gradient="orange"
              hint="Total de impostos pagos"
            />


          </div>

          {/* Gráfico de Performance */}
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm overflow-hidden relative">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/10 to-pink-400/10 rounded-full blur-2xl"></div>
            
            <CardHeader className="pb-6 relative z-10">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Análise de Performance
                    </CardTitle>
                  </div>
                  <p className="text-slate-600 ml-4 font-medium">Acompanhe o desempenho financeiro do seu negócio</p>
                </div>
                
                {/* Chart Type Toggle */}
                <div className="flex gap-1 p-1 bg-white/60 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartType("bar")}
                    className={`relative px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      chartType === "bar" 
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105" 
                        : "text-slate-600 hover:bg-white/80 hover:text-slate-800"
                    }`}
                  >
                    {chartType === "bar" && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg blur-sm opacity-50"></div>
                    )}
                    <span className="relative flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                      </svg>
                      Barras
                    </span>
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setChartType("line")}
                    className={`relative px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                      chartType === "line" 
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105" 
                        : "text-slate-600 hover:bg-white/80 hover:text-slate-800"
                    }`}
                  >
                    {chartType === "line" && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg blur-sm opacity-50"></div>
                    )}
                    <span className="relative flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4" />
                      </svg>
                      Linhas
                    </span>
                  </Button>
                </div>
              </div>
              
              {/* Enhanced Controls */}
              <div className="mt-8 p-4 sm:p-6 bg-gradient-to-r from-slate-50/80 via-blue-50/50 to-indigo-50/80 backdrop-blur-sm rounded-2xl border border-white/30 shadow-inner">
                <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
                      <label className="text-sm font-bold text-slate-700">Período:</label>
                    </div>
                    <select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="px-4 py-2.5 border-0 rounded-xl text-sm font-semibold bg-white/90 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all duration-300 hover:shadow-xl cursor-pointer"
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: undefined, label: "Ano Todo", icon: "📅" },
                      { key: "1", label: "1º Semestre", icon: "🌱" },
                      { key: "2", label: "2º Semestre", icon: "🍂" }
                    ].map(({ key, label, icon }) => (
                      <Button 
                        key={label}
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSemester(key)}
                        className={`relative px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 ${
                          selectedSemester === key 
                            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105" 
                            : "bg-white/60 text-slate-600 hover:bg-white/90 hover:shadow-md hover:text-slate-800"
                        }`}
                      >
                        {selectedSemester === key && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl blur-sm opacity-50"></div>
                        )}
                        <span className="relative flex items-center gap-2">
                          <span>{icon}</span>
                          {label}
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="relative z-10 px-6 pb-6">
              <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 shadow-inner border border-white/30">
                <OverviewChart data={series} type={chartType} />
              </div>
            </CardContent>
          </Card>

          {/* Seção inferior com alertas e resumo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alertas de Status */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full animate-pulse"></div>
                  Alertas de Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts && alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div key={alert.id} className={`flex items-center justify-between p-4 rounded-xl shadow-md border-l-4 transition-all duration-200 hover:shadow-lg ${
                        alert.type === 'warning' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-l-yellow-500' : 
                        alert.type === 'info' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-blue-500' : 'bg-gradient-to-r from-red-50 to-pink-50 border-l-red-500'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full shadow-md ${
                            alert.type === 'warning' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 
                            alert.type === 'info' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' : 'bg-gradient-to-r from-red-400 to-pink-500'
                          }`}></div>
                          <div>
                            <span className="text-sm font-semibold text-gray-800">{alert.title}</span>
                            <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200"
                          onClick={() => {
                            if (alert.title.includes('Pagamentos Pendentes')) {
                              router.push('/vendas')
                            } else if (alert.title.includes('Orçamentos')) {
                              router.push('/orcamentos')
                            } else if (alert.title.includes('Clientes')) {
                              router.push('/clientes')

                            } else {
                              router.push('/vendas')
                            }
                          }}
                        >
                          Ver
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">✓</span>
                      </div>
                      <p className="text-gray-600 font-medium">Tudo funcionando perfeitamente!</p>
                      <p className="text-sm text-gray-500">Nenhum alerta no momento</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resumo */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                  Resumo Executivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-l-blue-500">
                    <span className="text-sm font-medium text-gray-700">Clientes Ativos</span>
                    <span className="text-lg font-bold text-blue-600">{summary?.totalClientes || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500">
                    <span className="text-sm font-medium text-gray-700">Pedidos Concluídos</span>
                    <span className="text-lg font-bold text-green-600">{summary?.totalPedidos || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-l-orange-500">
                    <span className="text-sm font-medium text-gray-700">Vendas Pendentes</span>
                    <span className="text-lg font-bold text-orange-600">{summary?.pedidosPendentes || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-l-purple-500">
                    <span className="text-sm font-medium text-gray-700">Orçamentos Aprovados</span>
                    <span className="text-lg font-bold text-purple-600">{summary?.orcamentosAprovados || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 border-l-4 border-l-gray-500">
                    <span className="text-sm font-medium text-gray-700">Orçamentos Pendentes</span>
                    <span className="text-lg font-bold text-gray-600">{summary?.orcamentosPendentes || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
