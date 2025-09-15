"use client"

import { useEffect, useMemo, useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Minus, FileText, Download, CreditCard, Users, DollarSign, Calendar, Edit, Save, X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { CurrencyInput } from "@/components/currency-input"
import { ensureInit, getClientes, type Cliente } from "@/lib/data-store"
import {
  addCredito,
  abaterCredito,
  getSaldoCliente,
  getSaldosPorCliente,
  getSaldosPorClientePorAno,
  getMovimentosDoCliente,
  getMovimentosDoClientePorAno,
  deleteMovimento,
  deleteMovimentosDoCliente,
  type ValeMovimento,
} from "@/lib/vales"
import { makeValeDocumentHTML, makeExtratoValeHTML } from "@/lib/print"
import { getConfig } from "@/lib/config"
import ProtectedRoute from "@/components/ProtectedRoute"

function brl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0)
}

function ValesContent() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteCredito, setClienteCredito] = useState<string>("")
  const [valorCredito, setValorCredito] = useState<number>(0)
  const [descCredito, setDescCredito] = useState<string>("")

  const [clienteDebito, setClienteDebito] = useState<string>("")
  const [valorDebito, setValorDebito] = useState<string>("")
  const [descDebito, setDescDebito] = useState<string>("")

  const [mostrarTodos, setMostrarTodos] = useState(false)
  const [extratoCliente, setExtratoCliente] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear())
  const [modoEdicao, setModoEdicao] = useState(false)
  const [saldosEditaveis, setSaldosEditaveis] = useState<{[key: string]: string}>({})

  useEffect(() => {
    async function reload() {
      try {
        await ensureInit()
        const clientesData = await getClientes()
        setClientes(clientesData)
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
        setClientes([])
      }
    }
    reload()
    const onChange = async () => {
      try {
        const clientesData = await getClientes()
        setClientes(clientesData)
        setRefreshTick((t) => t + 1)
      } catch (error) {
        console.error('Erro ao recarregar clientes:', error)
        setClientes([])
      }
    }
    if (typeof window !== "undefined") {
      window.addEventListener("erp:changed" as any, onChange)
      return () => window.removeEventListener("erp:changed" as any, onChange)
    }
  }, [])

  const [saldos, setSaldos] = useState<Array<{ id: string; nome: string; documento: string; saldo: number }>>([])
  const [saldoClienteDebito, setSaldoClienteDebito] = useState(0)

  useEffect(() => {
    async function loadSaldos() {
      try {
        // Usar getSaldosPorCliente() para mostrar todos os saldos sem filtro de ano
        const saldosPorCliente = await getSaldosPorCliente()
        const clientesComSaldo = clientes
          .map((c) => ({ ...c, saldo: saldosPorCliente[c.id] ?? 0 }))
          .filter((c) => (mostrarTodos ? true : c.saldo > 0))
          .sort((a, b) => b.saldo - a.saldo || a.nome.localeCompare(b.nome))
        setSaldos(clientesComSaldo)
      } catch (error) {
        console.error('Erro ao carregar saldos:', error)
        setSaldos([])
      }
    }
    if (clientes.length > 0) {
      loadSaldos()
    }
  }, [clientes, mostrarTodos, refreshTick])

  useEffect(() => {
    async function loadSaldoDebito() {
      if (clienteDebito) {
        try {
          const saldo = await getSaldoCliente(clienteDebito)
          setSaldoClienteDebito(saldo)
        } catch (error) {
          console.error('Erro ao carregar saldo do cliente:', error)
          setSaldoClienteDebito(0)
        }
      } else {
        setSaldoClienteDebito(0)
      }
    }
    loadSaldoDebito()
  }, [clienteDebito, refreshTick])

  async function onAddCredito() {
    try {
      if (!clienteCredito) return toast.error("Selecione um cliente.")
    if (!valorCredito || valorCredito <= 0) return toast.error("Informe um valor válido.")
      await addCredito(clienteCredito, valorCredito, descCredito)
      setValorCredito(0)
      setDescCredito("")
      toast.success("Crédito adicionado com sucesso.")
      setRefreshTick((t) => t + 1)
    } catch (e: any) {
      toast.error(e?.message || "Erro ao adicionar crédito.")
    }
  }

  async function onAbaterCredito() {
    try {
      if (!clienteDebito) return toast.error("Selecione um cliente.")
      const v = Number(String(valorDebito).replace(",", "."))
      if (!v || v <= 0) return toast.error("Informe um valor válido.")
      
      // Verificar se há saldo suficiente
      const saldoAtual = await getSaldoCliente(clienteDebito)
      if (v > saldoAtual) {
        return toast.error("Valor maior que o saldo disponível.")
      }
      
      await abaterCredito(clienteDebito, v, descDebito)
      setValorDebito("")
      setDescDebito("")
      toast.success("Valor abatido do crédito.")
      setRefreshTick((t) => t + 1)
    } catch (e: any) {
      toast.error(e?.message || "Erro ao abater crédito.")
    }
  }

  async function onDeleteMovimentosDoCliente(clienteId: string, clienteNome: string) {
    try {
      if (!confirm(`Tem certeza que deseja deletar todos os movimentos de ${clienteNome}? Esta ação não pode ser desfeita.`)) {
        return
      }
      
      await deleteMovimentosDoCliente(clienteId)
      toast.success("Todos os movimentos do cliente foram deletados com sucesso.")
      setRefreshTick((t) => t + 1)
    } catch (e: any) {
      toast.error(e?.message || "Erro ao deletar movimentos do cliente.")
    }
  }

  function iniciarEdicaoSaldos() {
    const saldosIniciais: {[key: string]: string} = {}
    saldos.forEach(cliente => {
      saldosIniciais[cliente.id] = cliente.saldo.toString()
    })
    setSaldosEditaveis(saldosIniciais)
    setModoEdicao(true)
  }

  function cancelarEdicaoSaldos() {
    setSaldosEditaveis({})
    setModoEdicao(false)
  }

  async function salvarSaldos() {
    try {
      for (const [clienteId, novoSaldo] of Object.entries(saldosEditaveis)) {
        const valor = Number(novoSaldo.replace(',', '.'))
        if (isNaN(valor)) {
          toast.error(`Valor inválido para o cliente. Use apenas números.`)
          return
        }
        
        const cliente = saldos.find(c => c.id === clienteId)
        if (cliente && cliente.saldo !== valor) {
          const diferenca = valor - cliente.saldo
          if (diferenca > 0) {
            await addCredito(clienteId, diferenca, "Ajuste manual de saldo")
          } else if (diferenca < 0) {
            await abaterCredito(clienteId, Math.abs(diferenca), "Ajuste manual de saldo")
          }
        }
      }
      
      toast.success("Saldos atualizados com sucesso!")
      setModoEdicao(false)
      setSaldosEditaveis({})
      setRefreshTick((t) => t + 1)
    } catch (e: any) {
      toast.error(e?.message || "Erro ao salvar saldos.")
    }
  }

  function atualizarSaldoEditavel(clienteId: string, valor: string) {
    setSaldosEditaveis(prev => ({
      ...prev,
      [clienteId]: valor
    }))
  }



  // Função para baixar documento de vale como PDF
  async function baixarDocumentoVale(cliente: Cliente) {
    try {
      const movimentos = await getMovimentosDoCliente(cliente.id)
      const saldo = await getSaldoCliente(cliente.id)
      const config = getConfig()
      
      const htmlContent = makeValeDocumentHTML({
        cliente: {
          nome: cliente.nome,
          cnpj: cliente.documento,
          cpf: cliente.documento
        },
        saldo,
        movimentos,
        config
      })
      
      // Criar um documento HTML completo com estilos
      const fullHTML = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Documento de Vale - ${cliente.nome}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              padding: 20px;
              color: #333;
            }
            .print-actions {
              position: fixed;
              top: 20px;
              right: 20px;
              display: flex;
              gap: 10px;
              z-index: 1000;
            }
            .btn {
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
            }
            .btn-primary {
              background: #4f46e5;
              color: white;
            }
            .btn-primary:hover {
              background: #4338ca;
              transform: translateY(-2px);
            }
            .btn-secondary {
              background: #6b7280;
              color: white;
            }
            .btn-secondary:hover {
              background: #4b5563;
              transform: translateY(-2px);
            }
            @media print {
              .print-actions { display: none; }
              body { background: white; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="print-actions">
            <button class="btn btn-primary" onclick="window.print()">🖨️ Imprimir</button>
            <button class="btn btn-secondary" onclick="downloadAsImage()">📷 Baixar Imagem</button>
            <button class="btn btn-secondary" onclick="window.close()">❌ Fechar</button>
          </div>
          
          ${htmlContent}
          
          <script>
            function downloadAsImage() {
              // Usar html2canvas se disponível, senão mostrar instrução
              if (typeof html2canvas !== 'undefined') {
                html2canvas(document.body).then(canvas => {
                  const link = document.createElement('a');
                  link.download = 'vale-${cliente.nome.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.png';
                  link.href = canvas.toDataURL();
                  link.click();
                });
              } else {
                alert('Para baixar como imagem, use a função de impressão do navegador e selecione "Salvar como PDF" ou "Imprimir para arquivo".');
              }
            }
          </script>
        </body>
        </html>
      `
      
      // Abrir documento em nova janela para impressão/download
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(fullHTML)
        newWindow.document.close()
      } else {
        alert('Por favor, permita pop-ups para visualizar o documento.')
      }
    } catch (error) {
      console.error('Erro ao baixar documento de vale:', error)
      toast.error("Erro ao baixar documento de vale")
    }
  }



  // Função para baixar extrato de despesas como documento
  async function baixarExtratoDespesas(cliente: Cliente) {
    try {
      const movimentos = await getMovimentosDoCliente(cliente.id)
      const config = getConfig()
      
      // Calcular totais
      const totalCreditos = movimentos.filter(m => m.tipo === 'credito').reduce((sum, m) => sum + m.valor, 0)
      const totalDebitos = movimentos.filter(m => m.tipo === 'debito').reduce((sum, m) => sum + m.valor, 0)
      const saldoAtual = totalCreditos - totalDebitos
      
      // Criar um documento HTML completo com estilos únicos
      const fullHTML = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Documento de Vale - ${cliente.nome}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              padding: 20px;
              color: #333;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              font-size: 2.5rem;
              margin-bottom: 10px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .header p {
              font-size: 1.1rem;
              opacity: 0.9;
            }
            .content {
              padding: 40px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              margin-bottom: 30px;
            }
            .info-card {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              padding: 20px;
              border-radius: 15px;
              border-left: 5px solid #4f46e5;
            }
            .info-card h3 {
              color: #4f46e5;
              margin-bottom: 10px;
              font-size: 1.1rem;
            }
            .info-card p {
              font-size: 1.2rem;
              font-weight: 600;
              color: #1e293b;
            }
            .movements-section {
              margin-top: 30px;
            }
            .movements-section h2 {
              color: #4f46e5;
              margin-bottom: 20px;
              font-size: 1.5rem;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 10px;
            }
            .movement-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 15px;
              background: #f1f5f9;
              margin-bottom: 10px;
              border-radius: 10px;
            }
            .movement-item.credito {
              border-left: 4px solid #10b981;
            }
            .movement-item.debito {
              border-left: 4px solid #ef4444;
            }
            .movement-value.credito {
              color: #10b981;
              font-weight: 600;
            }
            .movement-value.debito {
              color: #ef4444;
              font-weight: 600;
            }
            .footer {
              background: #f8fafc;
              padding: 20px;
              text-align: center;
              color: #64748b;
              border-top: 1px solid #e2e8f0;
            }
            .print-actions {
              position: fixed;
              top: 20px;
              right: 20px;
              display: flex;
              gap: 10px;
              z-index: 1000;
            }
            .btn {
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
            }
            .btn-primary {
              background: #4f46e5;
              color: white;
            }
            .btn-primary:hover {
              background: #4338ca;
              transform: translateY(-2px);
            }
            .btn-secondary {
              background: #6b7280;
              color: white;
            }
            .btn-secondary:hover {
              background: #4b5563;
              transform: translateY(-2px);
            }
            @media print {
              .print-actions { display: none; }
              body { background: white; padding: 0; }
              .container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-actions">
            <button class="btn btn-primary" onclick="window.print()">🖨️ Imprimir</button>
            <button class="btn btn-secondary" onclick="downloadAsImage()">📷 Baixar Imagem</button>
            <button class="btn btn-secondary" onclick="window.close()">❌ Fechar</button>
          </div>
          
          <div class="container">
            <div class="header">
              <h1>Documento de Vale</h1>
              <p>Cliente: ${cliente.nome} • ${cliente.documento ? `CNPJ: ${cliente.documento}` : ''}</p>
              <p>Emitido em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
            
            <div class="content">
              <div class="info-grid">
                <div class="info-card">
                  <h3>💰 Total de Créditos</h3>
                  <p style="color: #10b981">${brl(totalCreditos)}</p>
                </div>
                <div class="info-card">
                  <h3>💳 Total de Débitos</h3>
                  <p style="color: #ef4444">${brl(totalDebitos)}</p>
                </div>
                <div class="info-card">
                  <h3>📊 Saldo Atual</h3>
                  <p style="color: ${saldoAtual >= 0 ? '#10b981' : '#ef4444'}">${brl(saldoAtual)}</p>
                </div>
              </div>
              
              ${movimentos.length > 0 ? `
                <div class="movements-section">
                  <h2>📋 Histórico de Movimentações</h2>
                  ${movimentos
                    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                    .map(mov => `
                    <div class="movement-item ${mov.tipo}">
                      <div>
                        <span>📅 ${new Date(mov.data).toLocaleDateString('pt-BR')}</span>
                        <span style="margin-left: 15px; font-weight: 500;">${mov.tipo === 'credito' ? '💰 Crédito' : '💳 Débito'}</span>
                        ${mov.descricao ? `<br><small style="color: #64748b; margin-left: 20px;">${mov.descricao}</small>` : ''}
                      </div>
                      <span class="movement-value ${mov.tipo}">${brl(mov.valor)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : '<div class="movements-section"><h2>📋 Histórico de Movimentações</h2><p style="color: #64748b; font-style: italic;">Nenhuma movimentação registrada</p></div>'}
            </div>
            
            <div class="footer">
              <p>📄 Documento gerado automaticamente pelo Sistema de Gestão</p>
              <p>🕒 ${new Date().toLocaleString('pt-BR')}</p>
            </div>
          </div>
          
          <script>
            function downloadAsImage() {
              // Usar html2canvas se disponível, senão mostrar instrução
              if (typeof html2canvas !== 'undefined') {
                html2canvas(document.querySelector('.container')).then(canvas => {
                  const link = document.createElement('a');
                  link.download = 'vale-${cliente.nome.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.png';
                  link.href = canvas.toDataURL();
                  link.click();
                });
              } else {
                alert('Para baixar como imagem, use a função de impressão do navegador e selecione "Salvar como PDF" ou "Imprimir para arquivo".');
              }
            }
          </script>
        </body>
        </html>
      `

      // Abrir em nova aba
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(fullHTML)
        newWindow.document.close()
      } else {
        alert('Por favor, permita pop-ups para visualizar o documento.')
      }
      
    } catch (error) {
      console.error('Erro ao gerar documento:', error)
      alert('Erro ao gerar documento. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <AppHeader title="Vales" />
      <main className="container mx-auto px-4 py-8 space-y-8">
        <Card className="bg-gradient-to-r from-white to-blue-50 border-0 shadow-xl shadow-blue-100/50">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <CreditCard className="h-6 w-6" />
              Vale (crédito por cliente)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="add" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-blue-100 to-indigo-100 p-1 rounded-lg">
                <TabsTrigger value="add" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all duration-200">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar crédito
                </TabsTrigger>
                <TabsTrigger value="use" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-rose-500 data-[state=active]:text-white transition-all duration-200">
                  <Minus className="h-4 w-4 mr-2" />
                  Abater crédito
                </TabsTrigger>
              </TabsList>

              <TabsContent value="add" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Users className="h-4 w-4 text-blue-600" />
                      Cliente
                    </Label>
                    <Select value={clienteCredito} onValueChange={setClienteCredito}>
                      <SelectTrigger className="bg-white border-2 border-blue-200 focus:border-blue-500 transition-colors">
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="truncate">{c.nome} {c.documento ? `• ${c.documento}` : ""}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Valor do crédito (R$)
                    </Label>
                    <CurrencyInput
                      value={valorCredito}
                      onChange={setValorCredito}
                      placeholder="0,00"
                      className="bg-white border-2 border-green-200 focus:border-green-500 transition-colors"
                      allowNegative={false}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="h-4 w-4 text-purple-600" />
                      Descrição (opcional)
                    </Label>
                    <Input
                      placeholder="Ex.: Adiantamento, devolução, acordo..."
                      value={descCredito}
                      onChange={(e) => setDescCredito(e.target.value)}
                      className="bg-white border-2 border-purple-200 focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
                <Button 
                  onClick={onAddCredito}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg px-6 py-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar crédito
                </Button>
              </TabsContent>

              <TabsContent value="use" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Users className="h-4 w-4 text-blue-600" />
                      Cliente
                    </Label>
                    <Select value={clienteDebito} onValueChange={setClienteDebito}>
                      <SelectTrigger className="bg-white border-2 border-blue-200 focus:border-blue-500 transition-colors">
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="truncate">{c.nome} {c.documento ? `• ${c.documento}` : ""}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {clienteDebito && (
                      <div className="text-sm text-muted-foreground">
                        Saldo atual: <span className="font-medium text-emerald-700">{brl(saldoClienteDebito)}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <DollarSign className="h-4 w-4 text-red-600" />
                      Valor para abater (R$)
                    </Label>
                    <Input
                      inputMode="decimal"
                      placeholder="0,00"
                      value={valorDebito}
                      onChange={(e) => setValorDebito(e.target.value)}
                      className="bg-white border-2 border-red-200 focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <FileText className="h-4 w-4 text-purple-600" />
                      Descrição (opcional)
                    </Label>
                    <Input
                      placeholder="Ex.: Abatimento em mercadoria"
                      value={descDebito}
                      onChange={(e) => setDescDebito(e.target.value)}
                      className="bg-white border-2 border-purple-200 focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>
                <Button 
                  onClick={onAbaterCredito}
                  disabled={!clienteDebito || saldoClienteDebito <= 0}
                  className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg px-6 py-2"
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Abater do crédito
                </Button>
                
                {/* Histórico de movimentações do cliente selecionado */}
                {clienteDebito && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Histórico de movimentações ({anoSelecionado})</h3>
                    <HistoricoMovimentacoes clienteId={clienteDebito} onChanged={() => setRefreshTick((t) => t + 1)} ano={anoSelecionado} />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-white to-purple-50 border-0 shadow-xl shadow-purple-100/50">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <CardTitle className="flex items-center gap-3 text-xl">
                <Users className="h-6 w-6" />
                Saldos dos Clientes
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="ano-select" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Ano:
                  </Label>
                  <Select value={anoSelecionado.toString()} onValueChange={(value) => setAnoSelecionado(Number(value))}>
                    <SelectTrigger className="w-24 bg-white/20 border-white/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => {
                        const ano = new Date().getFullYear() - i
                        return (
                          <SelectItem key={ano} value={ano.toString()}>
                            {ano}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input 
                    type="checkbox" 
                    checked={mostrarTodos} 
                    onChange={(e) => setMostrarTodos(e.target.checked)}
                    className="rounded border-white/30 bg-white/20" 
                  />
                  Mostrar todos (inclusive saldo R$ 0,00)
                </label>
                <div className="flex items-center gap-2">
                  {!modoEdicao ? (
                    <Button
                      onClick={iniciarEdicaoSaldos}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 text-sm px-4 py-2"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Saldos
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={salvarSaldos}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 text-sm px-4 py-2"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                      <Button
                        onClick={cancelarEdicaoSaldos}
                        className="bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 text-sm px-4 py-2"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto p-6">
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 shadow-inner">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-purple-100 to-indigo-100 hover:from-purple-200 hover:to-indigo-200">
                    <TableHead className="font-semibold text-purple-800">Cliente</TableHead>
                    <TableHead className="font-semibold text-purple-800">CNPJ/CPF</TableHead>
                    <TableHead className="text-right font-semibold text-purple-800">Saldo</TableHead>
                    <TableHead className="text-right font-semibold text-purple-800">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saldos.map((c, index) => (
                    <TableRow 
                      key={c.id} 
                      className={`hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <TableCell className="font-medium max-w-[200px] truncate text-gray-900" title={c.nome}>{c.nome}</TableCell>
                      <TableCell className="text-sm text-gray-600">{c.documento || "-"}</TableCell>
                      <TableCell className="text-right">
                        {modoEdicao ? (
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={saldosEditaveis[c.id] || c.saldo.toString()}
                            onChange={(e) => atualizarSaldoEditavel(c.id, e.target.value)}
                            className="w-24 text-right bg-white border-2 border-orange-200 focus:border-orange-500 transition-colors font-semibold"
                            placeholder="0,00"
                          />
                        ) : (
                          <span className={`font-semibold ${
                            c.saldo > 0 ? 'text-green-600' : c.saldo < 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>{brl(c.saldo)}</span>
                        )}
                      </TableCell>
                       <TableCell className="text-right">
                         <div className="flex gap-2 flex-wrap">
                           <Dialog>
                             <DialogTrigger asChild>
                               <Button 
                                 size="sm" 
                                 className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 text-xs px-3 py-1"
                               >
                                 <FileText className="h-3 w-3 mr-1" />
                                 Extrato
                               </Button>
                             </DialogTrigger>
                             <ExtratoDialog
                               clienteId={c.id}
                               clienteNome={c.nome}
                               onChanged={() => setRefreshTick((t) => t + 1)}
                               ano={anoSelecionado}
                             />
                           </Dialog>

                           <Button
                             size="sm"
                             onClick={() => baixarExtratoDespesas({...c, createdAt: new Date().toISOString()})}
                             title="Baixar extrato de despesas (PDF)"
                             className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 text-xs px-3 py-1"
                           >
                             <Download className="h-3 w-3 mr-1" />
                             Vale
                           </Button>
                           <Button
                             size="sm"
                             onClick={() => onDeleteMovimentosDoCliente(c.id, c.nome)}
                             title="Deletar todos os movimentos do cliente"
                             className="bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 text-xs px-3 py-1"
                           >
                             <Trash2 className="h-3 w-3" />
                           </Button>
                         </div>
                       </TableCell>
                  </TableRow>
                ))}
                   {saldos.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={4} className="text-center py-12">
                         <div className="flex flex-col items-center gap-3">
                           <Users className="h-12 w-12 text-gray-400" />
                           <p className="text-gray-500 font-medium">Nenhum registro encontrado para {anoSelecionado}</p>
                           <p className="text-sm text-gray-400">Tente ajustar os filtros ou adicionar novos registros</p>
                         </div>
                       </TableCell>
                     </TableRow>
                   )}
                 </TableBody>
               </Table>
             </div>
           </CardContent>
        </Card>
      </main>
    </div>
  )
}

function HistoricoMovimentacoes({
  clienteId,
  onChanged,
  ano,
}: { clienteId: string; onChanged: () => void; ano?: number }) {
  const [movs, setMovs] = useState<ValeMovimento[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function loadMovimentos() {
      setLoading(true)
      try {
        const movimentos = ano 
          ? await getMovimentosDoClientePorAno(clienteId, ano)
          : await getMovimentosDoCliente(clienteId)
        setMovs(movimentos)
      } catch (error) {
        console.error('Erro ao carregar movimentos:', error)
        setMovs([])
      } finally {
        setLoading(false)
      }
    }
    if (clienteId) {
      loadMovimentos()
    }
  }, [clienteId, ano])

  async function handleDelete(id: string) {
    try {
      await deleteMovimento(id)
      const movimentos = await getMovimentosDoCliente(clienteId)
      setMovs(movimentos)
      onChanged()
    } catch (error) {
      console.error('Erro ao deletar movimento:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Carregando movimentações...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-gray-100 to-blue-100 border-b border-gray-200">
              <TableHead className="font-semibold text-gray-700 py-4">Data</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Tipo</TableHead>
              <TableHead className="font-semibold text-gray-700 py-4">Descrição</TableHead>
              <TableHead className="text-right font-semibold text-gray-700 py-4">Valor</TableHead>
              <TableHead className="text-right font-semibold text-gray-700 py-4">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movs.map((m, index) => (
              <TableRow key={m.id} className={`hover:bg-blue-50/50 transition-colors ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
              }`}>
                <TableCell className="py-4 font-medium text-gray-700">{new Date(m.data).toLocaleDateString("pt-BR")}</TableCell>
                <TableCell className="py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    m.tipo === "credito" 
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200' 
                      : 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200'
                  }`}>
                    {m.tipo === "credito" ? "Crédito" : "Débito"}
                  </span>
                </TableCell>
                <TableCell className="py-4 text-gray-600">{m.descricao || "-"}</TableCell>
                <TableCell
                  className={[
                    "text-right font-semibold py-4",
                    m.tipo === "credito" ? "text-green-600" : "text-red-600",
                  ].join(" ")}
                >
                  {brl(m.valor)}
                </TableCell>
                <TableCell className="text-right py-4">
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md transition-all duration-200 hover:shadow-lg"
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {movs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="h-12 w-12 text-gray-400" />
                    <p className="text-gray-500 font-medium">Nenhuma movimentação encontrada</p>
                    <p className="text-sm text-gray-400">As movimentações aparecerão aqui quando forem criadas</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function ExtratoDialog({
  clienteId,
  clienteNome,
  onChanged,
  ano,
}: { clienteId: string; clienteNome: string; onChanged: () => void; ano: number }) {
  return (
    <DialogContent className="max-w-4xl bg-gradient-to-br from-white to-blue-50 border-0 shadow-2xl">
      <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg -m-6 mb-6 p-6">
        <DialogTitle className="flex items-center gap-3 text-xl">
          <FileText className="h-6 w-6" />
          Extrato de vales — {clienteNome} ({ano})
        </DialogTitle>
      </DialogHeader>
      <div className="px-2">
        <HistoricoMovimentacoes clienteId={clienteId} onChanged={onChanged} ano={ano} />
      </div>
    </DialogContent>
  )
}

export default function ValesPage() {
  return (
    <ProtectedRoute requiredPermission="vales">
      <ValesContent />
    </ProtectedRoute>
  )
}
