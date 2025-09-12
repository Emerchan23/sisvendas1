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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartType, setChartType] = useState<"bar" | "line">("bar")
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedSemester, setSelectedSemester] = useState<string | undefined>(undefined)


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
          
          setDashboardData({
            totals,
            series,
            summary,
            alerts,
            lastUpdate: new Date().toLocaleTimeString('pt-BR')
          })
          
          
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
      setDashboardData(prev => prev ? { ...prev, series } : null)
    } catch (err: any) {
      // Erro silencioso para não interromper a experiência do usuário
    }
  }

  useEffect(() => {
    loadUserAndData()
  }, [])

  // Recarregar dados do gráfico quando ano ou semestre mudarem
  useEffect(() => {
    if (dashboardData) {
      loadChartData()
    }
  }, [selectedYear, selectedSemester])



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

  if (!dashboardData) {
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

  const { totals, series, summary, alerts, lastUpdate } = dashboardData

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Sincronização do Dashboard</h1>
              <p className="text-sm text-gray-600">Eventos: 0 • Atualizado: {lastUpdate}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={loadUserAndData} variant="outline" size="sm">
                Atualizar
              </Button>
              <Button onClick={() => window.location.reload()} variant="default" size="sm">
                Forçar Reload
              </Button>
            </div>
          </div>

          {/* Métricas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <MetricCard 
              title="Total Recebido" 
              value={fmtCurrency(totals.totalRecebido)} 
            />
            <MetricCard 
              title="Total a Receber" 
              value={fmtCurrency(totals.totalAReceber)} 
            />
            <MetricCard 
              title="Lucro Total" 
              value={fmtCurrency(totals.lucroTotal)} 
            />
            <MetricCard 
              title="Lucro Líquido" 
              value={fmtCurrency(totals.lucroLiquido)} 
            />
            <MetricCard 
              title="Impostos Totais" 
              value={fmtCurrency(totals.impostosTotais)} 
            />
          </div>

          {/* Gráfico de Performance */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Gráficos de Performance</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant={chartType === "bar" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setChartType("bar")}
                  >
                    Barras
                  </Button>
                  <Button 
                    variant={chartType === "line" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setChartType("line")}
                  >
                    Linhas
                  </Button>
                </div>
              </div>
              
              {/* Controles de Ano e Semestre */}
              <div className="flex flex-wrap gap-2 mt-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Ano:</label>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-1 border rounded-md text-sm"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant={selectedSemester === undefined ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedSemester(undefined)}
                  >
                    Ano Todo
                  </Button>
                  <Button 
                    variant={selectedSemester === "1" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedSemester("1")}
                  >
                    1º Semestre
                  </Button>
                  <Button 
                    variant={selectedSemester === "2" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setSelectedSemester("2")}
                  >
                    2º Semestre
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <OverviewChart data={series} type={chartType} />
            </CardContent>
          </Card>

          {/* Seção inferior com alertas e resumo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alertas de Status */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas de Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alerts && alerts.length > 0 ? (
                    alerts.map((alert) => (
                      <div key={alert.id} className={`flex items-center justify-between p-2 rounded ${
                        alert.type === 'warning' ? 'bg-yellow-50' : 
                        alert.type === 'info' ? 'bg-blue-50' : 'bg-red-50'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${
                            alert.type === 'warning' ? 'bg-yellow-500' : 
                            alert.type === 'info' ? 'bg-blue-500' : 'bg-red-500'
                          }`}></span>
                          <span className="text-sm font-medium">{alert.title}</span>
                        </div>
                        <span className="text-sm text-gray-600 flex-1 mx-2">{alert.message}</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            if (alert.title.includes('Pagamentos Pendentes')) {
                              router.push('/vendas')
                            } else if (alert.title.includes('Orçamentos')) {
                              router.push('/orcamentos')
                            } else if (alert.title.includes('Clientes')) {
                              router.push('/clientes')
                            } else if (alert.title.includes('Produtos')) {
                              router.push('/produtos')
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
                    <div className="text-sm text-gray-500">Nenhum alerta no momento</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resumo */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Clientes</span>
                    <span className="text-sm font-medium">{summary?.totalClientes || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pedidos Concluídos</span>
                    <span className="text-sm font-medium">{summary?.totalPedidos || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Vendas Pendentes</span>
                    <span className="text-sm font-medium">{summary?.pedidosPendentes || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Orçamentos Aprovados</span>
                    <span className="text-sm font-medium">{summary?.orcamentosAprovados || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Orçamentos Pendentes</span>
                    <span className="text-sm font-medium">{summary?.orcamentosPendentes || 0}</span>
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
