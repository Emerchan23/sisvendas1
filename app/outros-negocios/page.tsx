"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CurrencyInput } from "@/components/ui/currency-input"
import { DateInput } from "@/components/ui/date-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, DollarSign, TrendingUp, Calendar, Users, History, CreditCard, Download, Percent, CheckCircle, Shield, Target, BarChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { AppHeader } from "@/components/app-header"
import { api, type Cliente, getClientes } from "@/lib/api-client"
import { loadOutrosNegocios, addPagamento, removePagamento, calcularJurosCompostosComPagamentos } from "@/lib/outros-negocios"
import { downloadPDF, makeOutroNegocioDocumentHTML } from "@/lib/print"
import ProtectedRoute from "@/components/ProtectedRoute"

type TipoOperacao = "emprestimo" | "venda"

type OutroNegocio = {
  id: string
  pessoa: string
  tipo: TipoOperacao
  descricao: string
  valor: number
  data: string
  jurosAtivo: boolean
  jurosMesPercent: number
  multaAtiva: boolean
  multaPercent: number
  pagamentos: PagamentoParcial[]
}

type PagamentoParcial = {
  id: string
  data: string
  valor: number
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9)
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
}

function todayISO() {
  return new Date().toISOString().split("T")[0]
}

function getUniquePessoas(items: OutroNegocio[]): string[] {
  const set = new Set(items.map((i) => i.pessoa).filter(Boolean))
  return Array.from(set).sort()
}

function computeTotals(items: OutroNegocio[]) {
  const today = todayISO()
  let totalEmprestimos = 0
  let totalVendas = 0
  let saldoPendente = 0
  let jurosPendentes = 0
  let totalPago = 0
  let totalQuitados = 0
  let totalPagamentos = 0
  let countPagamentos = 0

  items.forEach((item) => {
    if (item.tipo === "emprestimo") {
      totalEmprestimos += item.valor
    } else {
      totalVendas += item.valor
    }
    
    const calc = calcularJurosCompostosComPagamentos(item, today)
    saldoPendente += calc.saldoComJuros
    
    // Calcular pagamentos realizados
    const pagamentosItem = item.pagamentos?.reduce((sum, p) => sum + p.valor, 0) || 0
    totalPago += pagamentosItem
    
    // Contar pagamentos para média
    if (item.pagamentos && item.pagamentos.length > 0) {
      totalPagamentos += pagamentosItem
      countPagamentos += item.pagamentos.length
    }
    
    // Verificar se está quitado (saldo <= 0)
    if (calc.saldoComJuros <= 0) {
      totalQuitados++
    }
    
    // Calcular apenas os juros (saldo com juros - valor original + pagamentos feitos)
    const jurosAcumulados = calc.saldoComJuros - item.valor + pagamentosItem
    if (jurosAcumulados > 0) {
      jurosPendentes += jurosAcumulados
    }
  })

  const percentualQuitacao = items.length > 0 ? (totalQuitados / items.length) * 100 : 0
  const valorMedioPagamento = countPagamentos > 0 ? totalPagamentos / countPagamentos : 0

  return { 
    totalEmprestimos, 
    totalVendas, 
    saldoPendente, 
    jurosPendentes,
    totalPago,
    totalQuitados,
    percentualQuitacao,
    valorMedioPagamento
  }
}

type FormState = {
  id?: string
  pessoa: string
  tipo: TipoOperacao
  descricao: string
  valor: string
  data: string
  jurosAtivo: boolean
  jurosMesPercent: string
  multaAtiva: boolean
  multaPercent: string
}

type PaymentForm = {
  open: boolean
  itemId?: string
  data: string
  valor: string
}

type HistoryModal = {
  open: boolean
  item?: OutroNegocio
}

function OutrosNegociosContent() {
  const [items, setItems] = useState<OutroNegocio[]>([])
  const [pessoaFilter, setPessoaFilter] = useState<string>("all")
  const [somentePendentes, setSomentePendentes] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])

  const [openItem, setOpenItem] = useState(false)
  const [form, setForm] = useState<FormState>({
    pessoa: "",
    tipo: "emprestimo",
    descricao: "",
    valor: "",
    data: todayISO(),
    jurosAtivo: false,
    jurosMesPercent: "",
    multaAtiva: false,
    multaPercent: "",
  })

  const [payForm, setPayForm] = useState<PaymentForm>({ open: false, data: todayISO(), valor: "" })
  const [history, setHistory] = useState<HistoryModal>({ open: false })

  useEffect(() => {
    async function loadData() {
      try {
        const data = await loadOutrosNegocios()
        setItems(data)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      }
    }
    loadData()
    loadClientes()
  }, [])

  const loadClientes = async () => {
    try {
      const clientesData = await getClientes()
      setClientes(clientesData)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast.error('Erro ao carregar lista de clientes')
    }
  }

  const pessoas = useMemo(() => getUniquePessoas(items), [items])

  const filtered = useMemo(() => {
    let r = [...items]
    if (pessoaFilter !== "all") r = r.filter((i) => i.pessoa === pessoaFilter)
    if (somentePendentes) {
      const today = todayISO()
      r = r.filter((i) => calcularJurosCompostosComPagamentos(i, today).saldoComJuros > 0)
    }
    r.sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : 0))
    return r
  }, [items, pessoaFilter, somentePendentes])

  const totals = useMemo(() => computeTotals(items), [items])

  const isEditing = !!form.id

  function resetForm() {
    setForm({
      pessoa: "",
      tipo: "emprestimo",
      descricao: "",
      valor: "",
      data: todayISO(),
      jurosAtivo: false,
      jurosMesPercent: "",
      multaAtiva: false,
      multaPercent: "",
    })
  }

  function openCreate() {
    resetForm()
    setOpenItem(true)
  }

  function openEdit(item: OutroNegocio) {
    setForm({
      id: item.id,
      pessoa: item.pessoa || "",
      tipo: item.tipo,
      descricao: item.descricao || "",
      valor: String(item.valor ?? ""),
      data: item.data || todayISO(),
      jurosAtivo: item.jurosAtivo || false,
      jurosMesPercent: String(item.jurosMesPercent ?? ""),
      multaAtiva: item.multaAtiva || false,
      multaPercent: String(item.multaPercent ?? ""),
    })
    setOpenItem(true)
  }

  async function handleSaveItem() {
    const payload: OutroNegocio = {
      id: form.id ?? generateId(),
      pessoa: (form.pessoa || "").trim(),
      tipo: form.tipo,
      descricao: (form.descricao || "").trim(),
      valor: Number(form.valor || 0),
      data: form.data,
      jurosAtivo: form.jurosAtivo,
      jurosMesPercent: form.jurosAtivo ? Number(form.jurosMesPercent || 0) : 0,
      multaAtiva: form.multaAtiva,
      multaPercent: form.multaAtiva ? Number(form.multaPercent || 0) : 0,
      pagamentos: isEditing ? (items.find((x) => x.id === form.id)?.pagamentos ?? []) : [],
    }

    if (!payload.pessoa || !payload.valor || !payload.data) {
      alert("Preencha Pessoa, Valor e Data.")
      return
    }

    // Validar se um cliente foi selecionado
    if (!payload.pessoa || payload.pessoa.trim() === '') {
      alert('Por favor, selecione um cliente válido')
      return
    }

    // Verificar se o cliente existe na lista
    const clienteExiste = clientes.find(cliente => cliente.id === payload.pessoa)
    if (!clienteExiste) {
      alert('Cliente selecionado não é válido. Por favor, selecione um cliente da lista.')
      return
    }

    try {
      let next: OutroNegocio[]
      // Converter data do formato ISO (YYYY-MM-DD) para DD/MM/AAAA
      const convertDateToAPI = (isoDate: string) => {
        const [year, month, day] = isoDate.split('-')
        return `${day}/${month}/${year}`
      }
      
      const apiPayload = {
        tipo: payload.tipo,
        descricao: payload.descricao,
        valor: payload.valor,
        data_transacao: convertDateToAPI(payload.data),
        cliente_id: payload.pessoa, // payload.pessoa já contém o ID do cliente selecionado
        juros_ativo: payload.jurosAtivo ? 1 : 0,
        juros_mes_percent: payload.jurosAtivo ? Number(payload.jurosMesPercent || 0) : 0,
        multa_ativa: payload.multaAtiva ? 1 : 0,
        multa_percent: payload.multaAtiva ? Number(payload.multaPercent || 0) : 0
      }
      
      console.log('Frontend - Payload sendo enviado:', JSON.stringify(apiPayload, null, 2))
      console.log('Frontend - URL da API:', `${window.location.protocol}//${window.location.host}/api/outros-negocios`)
      console.log('Frontend - Método:', isEditing ? 'PUT' : 'POST')
      
      if (isEditing) {
        console.log('Frontend - Iniciando UPDATE...')
        const updateResult = await api.outrosNegocios.update(payload.id, apiPayload)
        console.log('Frontend - Resultado UPDATE:', updateResult)
        next = await loadOutrosNegocios()
      } else {
        console.log('Frontend - Iniciando CREATE...')
        const createResult = await api.outrosNegocios.create(apiPayload)
        console.log('Frontend - Resultado CREATE:', createResult)
        next = await loadOutrosNegocios()
      }
      setItems(next)
      setOpenItem(false)
    } catch (error: any) {
      console.error("Erro ao salvar:", error)
      
      // Tratamento de erro mais amigável
      if (error.message?.includes('Cliente não encontrado')) {
        alert('Cliente selecionado não foi encontrado. Por favor, selecione um cliente válido da lista.')
      } else {
        alert("Erro ao salvar. Tente novamente.")
      }
    }
  }

  async function excluir(item: OutroNegocio) {
    if (!confirm("Excluir este lançamento?")) return
    
    try {
      await api.outrosNegocios.delete(item.id)
      const updatedItems = await loadOutrosNegocios()
      setItems(updatedItems)
    } catch (error: any) {
      console.error("Erro ao excluir:", error)
      if (error?.status === 400) {
        try {
          const response = await fetch(`/api/outros-negocios/${item.id}/dependencies`)
          const dependencies = await response.json()
          
          let detailsMessage = `Não é possível excluir este outro negócio porque ele está sendo usado em:\n\n`
          if (dependencies.acertos_relacionados?.count > 0) detailsMessage += `• ${dependencies.acertos_relacionados.count} acerto(s)\n`
          detailsMessage += "\nExclua primeiro esses registros para poder deletar o outro negócio."
          
          alert(detailsMessage)
        } catch {
          alert("Não é possível excluir este outro negócio pois ele possui registros associados. Exclua primeiro os registros relacionados.")
        }
      } else {
        alert("Erro ao excluir. Tente novamente.")
      }
    }
  }

  function abrirPagamento(item: OutroNegocio, valorSugerido?: number) {
    setPayForm({
      open: true,
      itemId: item.id,
      data: todayISO(),
      valor: valorSugerido ? String(valorSugerido) : "",
    })
  }

  async function salvarPagamento() {
    if (!payForm.itemId) return
    const valor = Number(payForm.valor || 0)
    if (!valor || valor <= 0) {
      alert("Informe um valor de pagamento válido.")
      return
    }
    const pg: PagamentoParcial = {
      id: generateId(),
      data: payForm.data || todayISO(),
      valor,
    }
    try {
      const next = await addPagamento(payForm.itemId, pg)
      setItems(next)
      setPayForm({ open: false, data: todayISO(), valor: "" })
    } catch (error) {
      console.error("Erro ao salvar pagamento:", error)
      alert("Erro ao salvar pagamento. Tente novamente.")
    }
  }

  async function removerPagamento(itemId: string, pagamentoId: string) {
    try {
      const next = await removePagamento(itemId, pagamentoId)
      setItems(next)
    } catch (error) {
      console.error("Erro ao remover pagamento:", error)
      alert("Erro ao remover pagamento. Tente novamente.")
    }
  }

  async function baixarDocumentoPDF(item: OutroNegocio) {
    try {
      const today = todayISO()
      const saldoAtual = calcularJurosCompostosComPagamentos(item, today)
      
      // Gerar HTML único para outros negócios
      const htmlContent = makeOutroNegocioDocumentHTML({
        negocio: {
          id: item.id,
          pessoa: item.pessoa,
          tipo: item.tipo,
          descricao: item.descricao,
          valor: item.valor,
          data: item.data,
          jurosAtivo: item.jurosAtivo,
          jurosMesPercent: item.jurosMesPercent,
          pagamentos: item.pagamentos || []
        },
        saldoAtual: {
          saldoComJuros: saldoAtual.saldoComJuros,
          jurosAcumulados: saldoAtual.jurosAcumulados,
          saldoPrincipalRestante: saldoAtual.saldoPrincipalRestante
        }
      })

      // Criar um documento HTML completo com estilos únicos
      const fullHTML = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Documento - ${item.tipo === 'emprestimo' ? 'Empréstimo' : 'Venda'} - ${item.pessoa}</title>
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
            .payments-section {
              margin-top: 30px;
            }
            .payments-section h2 {
              color: #4f46e5;
              margin-bottom: 20px;
              font-size: 1.5rem;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 10px;
            }
            .payment-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 15px;
              background: #f1f5f9;
              margin-bottom: 10px;
              border-radius: 10px;
              border-left: 4px solid #10b981;
            }
            .status-badge {
              display: inline-block;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 0.8rem;
              letter-spacing: 0.5px;
            }
            .status-emprestimo {
              background: #fef2f2;
              color: #dc2626;
            }
            .status-venda {
              background: #f0f9ff;
              color: #0284c7;
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
              <h1>Documento de ${item.tipo === 'emprestimo' ? 'Empréstimo' : 'Venda'}</h1>
              <p>Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
            
            <div class="content">
              <div class="info-grid">
                <div class="info-card">
                  <h3>👤 Pessoa</h3>
                  <p>${item.pessoa}</p>
                </div>
                <div class="info-card">
                  <h3>📋 Tipo</h3>
                  <p><span class="status-badge status-${item.tipo}">${item.tipo === 'emprestimo' ? 'Empréstimo' : 'Venda'}</span></p>
                </div>
                <div class="info-card">
                  <h3>💰 Valor Original</h3>
                  <p>${formatBRL(item.valor)}</p>
                </div>
                <div class="info-card">
                  <h3>📅 Data</h3>
                  <p>${new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                </div>
                <div class="info-card">
                  <h3>💳 Saldo Atual</h3>
                  <p style="color: ${saldoAtual.saldoComJuros > 0 ? '#dc2626' : '#16a34a'}">${formatBRL(saldoAtual.saldoComJuros)}</p>
                </div>
                <div class="info-card">
                  <h3>📈 Juros</h3>
                  <p>${item.jurosAtivo ? `${item.jurosMesPercent}% ao mês` : 'Sem juros'}</p>
                </div>
              </div>
              
              <div class="info-card" style="margin-bottom: 20px;">
                <h3>📝 Descrição</h3>
                <p>${item.descricao}</p>
              </div>
              
              ${item.pagamentos && item.pagamentos.length > 0 ? `
                <div class="payments-section">
                  <h2>💳 Histórico de Pagamentos</h2>
                  ${item.pagamentos.map(p => `
                    <div class="payment-item">
                      <span>📅 ${new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      <span style="font-weight: 600; color: #16a34a;">${formatBRL(p.valor)}</span>
                    </div>
                  `).join('')}
                  <div style="margin-top: 15px; padding: 15px; background: #ecfdf5; border-radius: 10px; border-left: 4px solid #16a34a;">
                    <strong>💰 Total Pago: ${formatBRL(item.pagamentos.reduce((sum, p) => sum + p.valor, 0))}</strong>
                  </div>
                </div>
              ` : '<div class="payments-section"><h2>💳 Histórico de Pagamentos</h2><p style="color: #64748b; font-style: italic;">Nenhum pagamento registrado</p></div>'}
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
                  link.download = 'documento-${item.tipo}-${item.pessoa.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.png';
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
      <AppHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold mb-2">Outros Negócios</h1>
            <p className="text-blue-100">Gerencie empréstimos, vendas e outros negócios</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Empréstimos</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{formatBRL(totals.totalEmprestimos)}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-white to-green-50 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Total Vendas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{formatBRL(totals.totalVendas)}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-white to-orange-50 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Saldo Pendente</CardTitle>
              <Calendar className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">{formatBRL(totals.saldoPendente)}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-white to-red-50 border-red-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Juros Pendentes</CardTitle>
              <Percent className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900">{formatBRL(totals.jurosPendentes)}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Total Pessoas</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{pessoas.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Resumo de Pagamentos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-white to-green-50 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Total Pago</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{formatBRL(totals.totalPago)}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Negócios Quitados</CardTitle>
                <Shield className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{totals.totalQuitados}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-white to-indigo-50 border-indigo-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-indigo-700">Taxa de Quitação</CardTitle>
                <Target className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-900">{totals.percentualQuitacao.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-white to-teal-50 border-teal-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-teal-700">Valor Médio</CardTitle>
                <BarChart className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-900">{formatBRL(totals.valorMedioPagamento)}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mb-6 bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-800">Filtros e Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1">
                <Label htmlFor="pessoa-filter">Filtrar por Pessoa</Label>
                <Select value={pessoaFilter} onValueChange={setPessoaFilter}>
                  <SelectTrigger id="pessoa-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as pessoas</SelectItem>
                    {pessoas.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="pendentes" checked={somentePendentes} onCheckedChange={setSomentePendentes} />
                <Label htmlFor="pendentes">Somente pendentes</Label>
              </div>
              <Button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                <Plus className="h-4 w-4" />
                Novo Negócio
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-800">Negócios ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Pessoa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor Original</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Saldo Atual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => {
                    const today = todayISO()
                    const calc = calcularJurosCompostosComPagamentos(item, today)
                    const isPago = calc.saldoComJuros <= 0
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium w-[180px]">{item.pessoa}</TableCell>
                        <TableCell>
                          <Badge variant={item.tipo === "emprestimo" ? "destructive" : "default"}>
                            {item.tipo === "emprestimo" ? "Empréstimo" : "Venda"}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.descricao}</TableCell>
                        <TableCell>{formatBRL(item.valor)}</TableCell>
                        <TableCell>
                          {(() => {
                            // Função para formatar data DD/MM/AAAA corretamente
                            const formatarData = (dataStr: string) => {
                              if (!dataStr) return 'Data inválida';
                              
                              // Se já está no formato DD/MM/AAAA, retorna como está
                              if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
                                return dataStr;
                              }
                              
                              // Se está no formato ISO (YYYY-MM-DD), converte
                              if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
                                const [year, month, day] = dataStr.split('-');
                                return `${day}/${month}/${year}`;
                              }
                              
                              // Tentar criar Date e formatar
                              try {
                                const date = new Date(dataStr);
                                if (isNaN(date.getTime())) {
                                  return dataStr; // Retorna o valor original se não conseguir converter
                                }
                                return date.toLocaleDateString('pt-BR');
                              } catch {
                                return dataStr; // Retorna o valor original em caso de erro
                              }
                            };
                            
                            return formatarData(item.data);
                          })()} 
                        </TableCell>
                        <TableCell className={cn(calc.saldoComJuros > 0 ? "text-red-600" : "text-green-600")}>
                          {formatBRL(calc.saldoComJuros)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isPago ? "default" : "secondary"}>
                            {isPago ? "Pago" : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setHistory({ open: true, item })}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                            {!isPago && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => abrirPagamento(item, calc.saldoComJuros)}
                              >
                                <CreditCard className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => baixarDocumentoPDF(item)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => excluir(item)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={openItem} onOpenChange={setOpenItem}>
          <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-white to-slate-50 border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-800">{isEditing ? "Editar Negócio" : "Novo Negócio"}</DialogTitle>
              <DialogDescription className="text-slate-600">
                {isEditing ? "Edite as informações do negócio" : "Adicione um novo empréstimo ou venda"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pessoa" className="text-right">
                  Cliente
                </Label>
                <Select
                  value={form.pessoa}
                  onValueChange={(value) => setForm({ ...form, pessoa: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome} - {cliente.cpf_cnpj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tipo" className="text-right">
                  Tipo
                </Label>
                <Select value={form.tipo} onValueChange={(v: TipoOperacao) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emprestimo">Empréstimo</SelectItem>
                    <SelectItem value="venda">Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="descricao" className="text-right">
                  Descrição
                </Label>
                <Input
                  id="descricao"
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  className="col-span-3"
                  placeholder="Descrição do negócio"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="valor" className="text-right">
                  Valor
                </Label>
                <CurrencyInput
                  id="valor"
                  value={form.valor}
                  onChange={(value) => setForm({ ...form, valor: value })}
                  className="col-span-3"
                  placeholder="R$ 0,00"
                  allowNegative={false}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="data" className="text-right">
                  Data
                </Label>
                <DateInput
                  value={form.data}
                  onChange={(value) => setForm({ ...form, data: value })}
                  className="col-span-3"
                  placeholder="dd/mm/aaaa"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="juros" className="text-right">
                  Juros
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    id="juros"
                    checked={form.jurosAtivo}
                    onCheckedChange={(checked) => setForm({ ...form, jurosAtivo: checked })}
                  />
                  <Label htmlFor="juros">Ativar juros</Label>
                </div>
              </div>
              {form.jurosAtivo && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="juros-percent" className="text-right">
                    Juros (% mês)
                  </Label>
                  <Input
                    id="juros-percent"
                    type="number"
                    step="0.01"
                    value={form.jurosMesPercent}
                    onChange={(e) => setForm({ ...form, jurosMesPercent: e.target.value })}
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="multa" className="text-right">
                  Multa
                </Label>
                <div className="col-span-3 flex items-center space-x-2">
                  <Switch
                    id="multa"
                    checked={form.multaAtiva}
                    onCheckedChange={(checked) => setForm({ ...form, multaAtiva: checked })}
                  />
                  <Label htmlFor="multa">Ativar multa</Label>
                </div>
              </div>
              {form.multaAtiva && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="multa-percent" className="text-right">
                    Multa (%)
                  </Label>
                  <Input
                    id="multa-percent"
                    type="number"
                    step="0.01"
                    value={form.multaPercent}
                    onChange={(e) => setForm({ ...form, multaPercent: e.target.value })}
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenItem(false)} className="border-slate-300 hover:bg-slate-50">
                Cancelar
              </Button>
              <Button onClick={handleSaveItem} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg">
                {isEditing ? "Salvar" : "Criar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={payForm.open} onOpenChange={(open) => setPayForm({ ...payForm, open })}>
          <DialogContent className="bg-gradient-to-br from-white to-slate-50 border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-800">Registrar Pagamento</DialogTitle>
              <DialogDescription className="text-slate-600">
                Registre um pagamento parcial ou total para este negócio
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pay-data" className="text-right">
                  Data
                </Label>
                <DateInput
                  value={payForm.data}
                  onChange={(value) => setPayForm({ ...payForm, data: value })}
                  className="col-span-3"
                  placeholder="dd/mm/aaaa"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="pay-valor" className="text-right">
                  Valor
                </Label>
                <CurrencyInput
                  id="pay-valor"
                  value={payForm.valor}
                  onChange={(value) => setPayForm({ ...payForm, valor: value })}
                  className="col-span-3"
                  placeholder="R$ 0,00"
                  allowNegative={false}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPayForm({ ...payForm, open: false })} className="border-slate-300 hover:bg-slate-50">
                Cancelar
              </Button>
              <Button onClick={salvarPagamento} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg">
                Salvar Pagamento
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={history.open} onOpenChange={(open) => setHistory({ ...history, open })}>
          <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-white to-slate-50 border-slate-200">
            <DialogHeader>
              <DialogTitle className="text-slate-800">Histórico de Pagamentos</DialogTitle>
              <DialogDescription className="text-slate-600">
                {history.item && `Pagamentos de ${history.item.pessoa} - ${history.item.descricao}`}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {history.item && (
                <div>
                  {history.item.pagamentos && history.item.pagamentos.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="font-medium">Pagamentos realizados:</h4>
                      {history.item.pagamentos.map((pag) => (
                        <div key={pag.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">{formatBRL(pag.valor)}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              {new Date(pag.data + "T00:00:00").toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerPagamento(history.item!.id, pag.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Nenhum pagamento registrado ainda.</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setHistory({ ...history, open: false })} className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg">
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default function OutrosNegociosPage() {
  return (
    <ProtectedRoute requiredPermission="outros-negocios">
      <OutrosNegociosContent />
    </ProtectedRoute>
  )
}