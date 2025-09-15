"use client"

import { useEffect, useMemo, useState } from "react"
import { AppHeader } from "@/components/app-header"
import ProtectedRoute from "@/components/ProtectedRoute"
// Removed empresa imports - system simplified
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  criarAcerto,
  getAcertos,
  getParticipantes,
  pendenciasDeAcerto,
  saveParticipante,
  deleteParticipante,
  updateAcerto,
  cancelarAcerto,
  fecharAcerto,
  getDespesasPendentes,
  saveDespesaPendente,
  deleteDespesaPendente,
  markDespesasUsadas,
  getUltimosRecebimentos,
  saveUltimoRecebimento,
  deleteUltimoRecebimento,
  type Participante,
  type Acerto,
  type Despesa,
  type DespesaPendente,
  type UltimoRecebimento,
} from "@/lib/acertos"
import type { LinhaVenda } from "@/lib/planilha"
import { getLinhas } from "@/lib/planilha"
import { fmtCurrency } from "@/lib/format"
import { toast } from "@/hooks/use-toast"
import { Users, Plus, Receipt, Eye, Pencil, Trash2, Calculator, DollarSign, TrendingUp, Calendar, Building, Save, FileText, CheckCircle, Hash, History, CreditCard, Download, ShoppingCart, Check } from "lucide-react"
import jsPDF from 'jspdf'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import DespesasPendentesPanel from "@/components/acertos/despesas-pendentes-panel"
import DespesasEditor from "@/components/acertos/despesas-editor"

// Função auxiliar para gerar IDs compatível com navegadores
function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  // Fallback para navegadores que não suportam crypto.randomUUID
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function AcertosContent() {
  // Participantes
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [nomePart, setNomePart] = useState("")
  const [defaultPercent, setDefaultPercent] = useState("")

  // Pendências de linhas
  const [pendentes, setPendentes] = useState<LinhaVenda[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  // Despesas do acerto (cesta)
  const [despesas, setDespesas] = useState<Despesa[]>([])

  // Despesas pendentes salvas
  const [despesasPendentes, setDespesasPendentes] = useState<DespesaPendente[]>([])
  const [usadasNesteAcerto, setUsadasNesteAcerto] = useState<string[]>([])

  // Último recebimento (acerto atual)
  const [bancoNome, setBancoNome] = useState("")
  const [bancoValor, setBancoValor] = useState("")
  const [bancoData, setBancoData] = useState("") // dd/mm/yyyy
  const [bancoInstituicao, setBancoInstituicao] = useState("")
  const [bancoLocked, setBancoLocked] = useState(false)

  // Últimos recebimentos salvos no banco
  const [ultimosRecebimentos, setUltimosRecebimentos] = useState<UltimoRecebimento[]>([])
  const [currentRecebimentoId, setCurrentRecebimentoId] = useState<string | null>(null)

  // Distribuição
  const [observacoes, setObservacoes] = useState("")
  const [titulo, setTitulo] = useState("")
  const [dist, setDist] = useState<Record<string, number>>({})

  // Histórico
  const [acertos, setAcertos] = useState<Acerto[]>([])
  
  // Linhas de venda (para exibir detalhes nos acertos)
  const [linhas, setLinhas] = useState<LinhaVenda[]>([])

  // Modal de edição do "último recebimento" no histórico
  const [editRecOpen, setEditRecOpen] = useState(false)
  const [editAcertoId, setEditAcertoId] = useState<string>("")
  const [editBancoNome, setEditBancoNome] = useState("")
  const [editBancoValor, setEditBancoValor] = useState("")
  const [editBancoData, setEditBancoData] = useState("")
  const [editBancoInstituicao, setEditBancoInstituicao] = useState("")

  // Modal de visualização de acerto
  const [viewAcertoOpen, setViewAcertoOpen] = useState(false)
  const [selectedAcerto, setSelectedAcerto] = useState<Acerto | null>(null)
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear())

  useEffect(() => {
    refreshAll()
    const onAny = () => {
      refreshAll().catch(error => {
        console.error('Erro ao atualizar dados:', error)
      })
    }
    if (typeof window !== "undefined") {
      window.addEventListener("ERP_CHANGED_EVENT" as keyof WindowEventMap, onAny)
      window.addEventListener("storage", onAny)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("ERP_CHANGED_EVENT" as keyof WindowEventMap, onAny)
        window.removeEventListener("storage", onAny)
      }
    }
  }, [])

  async function refreshAll() {
    console.log('🔄 DEBUG: Iniciando refreshAll()');
    try {
      console.log('📞 DEBUG: Chamando APIs...');
      const [participantesData, acertosData, despesasPendentesData, pendentesData, ultimosRecebimentosData, linhasData] = await Promise.all([
        getParticipantes(),
        getAcertos(),
        getDespesasPendentes(),
        pendenciasDeAcerto(),
        getUltimosRecebimentos(),
        getLinhas()
      ])
      console.log('✅ DEBUG: APIs responderam');
      
      console.log('🔄 DEBUG: Dados carregados:')
      console.log('👥 Participantes:', participantesData.length)
      console.log('💰 Acertos existentes:', acertosData.length)
      console.log('💸 Despesas pendentes:', despesasPendentesData.length)
      console.log('📋 Pendentes de acerto:', pendentesData.length)
      pendentesData.forEach(linha => {
        console.log(`  - ${linha.cliente} (${linha.id}) - Status: ${linha.paymentStatus}/${linha.settlementStatus} - Data: ${linha.dataPedido}`)
      })
      
      setParticipantes(participantesData)
      setAcertos(acertosData)
      setDespesasPendentes(despesasPendentesData.filter((d) => d.status === "pendente"))
      setPendentes(pendentesData)
      setUltimosRecebimentos(ultimosRecebimentosData)
      setLinhas(linhasData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setParticipantes([])
      setAcertos([])
      setDespesasPendentes([])
      setPendentes([])
      setUltimosRecebimentos([])
      setLinhas([])
    }
  }

  const pendentesFiltrados = useMemo(() => {
    console.log('🔍 DEBUG: Filtrando pendentes...')
    console.log('📊 Total pendentes:', pendentes.length)
    console.log('📅 Ano selecionado:', anoSelecionado)
    
    const filtrados = pendentes.filter(linha => {
      if (!linha.dataPedido) {
        console.log('❌ Linha sem dataPedido:', linha.id, linha.cliente)
        return false
      }
      const anoLinha = new Date(linha.dataPedido).getFullYear()
      const incluir = anoLinha === anoSelecionado
      console.log(`📋 ${linha.cliente} (${linha.dataPedido}) - Ano: ${anoLinha} - Incluir: ${incluir}`)
      return incluir
    })
    
    console.log('✅ Pendentes filtrados:', filtrados.length)
    filtrados.forEach(linha => {
      console.log(`  - ${linha.cliente} (${linha.id}) - ${linha.dataPedido}`)
    })
    
    return filtrados
  }, [pendentes, anoSelecionado])

  const selectedIds = useMemo(() => Object.keys(selected).filter((k) => selected[k]), [selected])

  const totalLucroSel = useMemo(
    () => pendentesFiltrados.filter((l) => selectedIds.includes(l.id)).reduce((a, l) => a + (l.lucroValor || 0), 0),
    [pendentesFiltrados, selectedIds],
  )
  const totalRateio = useMemo(
    () => despesas.filter((d) => d.tipo === "rateio").reduce((a, d) => a + (d.valor || 0), 0),
    [despesas],
  )
  const baseDistribuivel = useMemo(() => Math.max(totalLucroSel - totalRateio, 0), [totalLucroSel, totalRateio])

  const indivPorPart = useMemo(() => {
    const map: Record<string, number> = {}
    for (const d of despesas) {
      if (d.tipo === "individual" && d.participanteId) {
        map[d.participanteId] = (map[d.participanteId] || 0) + (d.valor || 0)
      }
    }
    return map
  }, [despesas])

  function distribuirIgual() {
    if (participantes.length === 0) return;
    const base = +(100 / participantes.length).toFixed(4)
    const d: Record<string, number> = {}
    participantes.forEach((p, idx) => {
      d[p.id] = idx === participantes.length - 1 ? +(100 - base * (participantes.length - 1)).toFixed(4) : base
    })
    setDist(d)
  }

  // Callbacks para os componentes de despesas
  function onAddDespesa(payload: Omit<Despesa, "id">) {
    const nova: Despesa = { id: generateId(), ...payload }
    setDespesas((d) => [nova, ...d])
  }
  function onRemoveDespesa(id: string) {
    setDespesas((d) => d.filter((x) => x.id !== id))
  }
  async function onSavePendente(payload: Omit<Despesa, "id">) {
    try {
      await saveDespesaPendente(payload)
      const despesasPendentesData = await getDespesasPendentes()
      setDespesasPendentes(despesasPendentesData.filter((d) => d.status === "pendente"))
      toast({ title: "Despesa salva para acerto futuro." })
    } catch (error) {
      console.error('Erro ao salvar despesa pendente:', error)
      toast({ 
        title: "Erro", 
        description: "Erro ao salvar despesa" 
      })
    }
  }

  function onUsePendentes(ids: string[]) {
    if (!ids.length) return;
    const pend = despesasPendentes.filter((d) => ids.includes(d.id))
    const toAdd: Despesa[] = pend.map((p) => ({
      id: generateId(),
      descricao: p.descricao,
      valor: p.valor,
      tipo: p.tipo,
      participanteId: p.participanteId,
    }))
    setDespesas((d) => [...toAdd, ...d])
    setUsadasNesteAcerto((prev) => [...prev, ...ids])
    toast({ title: `Adicionadas ${toAdd.length} despesa(s) ao acerto.` })
  }
  async function onDeletePendentes(ids: string[]) {
    try {
      await Promise.all(ids.map(id => deleteDespesaPendente(id)))
      const despesasPendentesData = await getDespesasPendentes()
      setDespesasPendentes(despesasPendentesData.filter((d) => d.status === "pendente"))
      toast({ title: "Despesas pendentes excluídas." })
    } catch (error) {
      console.error('Erro ao deletar despesas pendentes:', error)
      toast({ 
        title: "Erro", 
        description: "Erro ao deletar despesas" 
      })
    }
  }

  async function salvarAcerto() {
    if (selectedIds.length === 0) {
      toast({ title: "Selecione ao menos uma venda recebida pendente de acerto." })
      return;
    }
    if (participantes.length === 0) {
      toast({ title: "Cadastre ao menos um participante." })
      return;
    }
    if (!titulo.trim()) {
      toast({ 
        title: "Erro de Validação", 
        description: "O título do acerto é obrigatório."
      })
      return;
    }
    const soma = participantes.reduce((a, p) => a + (dist[p.id] ?? p.defaultPercent ?? 0), 0)
    if (Math.abs(soma - 100) > 0.01) {
      toast({ title: "A soma dos percentuais deve ser 100%." })
      return;
    }
    
    try {
      const distribuicoes = participantes.map((p) => ({
        participanteId: p.id,
        percentual: dist[p.id] ?? p.defaultPercent ?? 0,
      }))

      const nome = bancoNome.trim()
      const valNum = Number(bancoValor || "0")
      const banco = bancoInstituicao.trim()
      // Converter data brasileira dd/mm/yyyy para ISO
      let dataISO = undefined
      if (bancoData && bancoData.length === 10) {
        const [dia, mes, ano] = bancoData.split('/')
        if (dia && mes && ano && dia.length === 2 && mes.length === 2 && ano.length === 4) {
          const date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
          if (!isNaN(date.getTime())) {
            dataISO = date.toISOString()
          }
        }
      }
      const anyField = !!(nome || banco || dataISO || (isFinite(valNum) && valNum > 0))
      const ultimoRecebimentoBanco = anyField
        ? {
            nome: nome || undefined,
            valor: isFinite(valNum) ? +valNum.toFixed(2) : undefined,
            banco: banco || undefined,
            data: dataISO,
          }
        : undefined

      const { acertoId } = await criarAcerto({
        titulo: titulo.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
        linhaIds: selectedIds,
        distribuicoes,
        despesas,
        ultimoRecebimentoBanco,
      })

      if (usadasNesteAcerto.length) {
        await markDespesasUsadas(usadasNesteAcerto, acertoId)
      }

      // reset UI
      setSelected({})
      setTitulo("")
      setObservacoes("")
      setDespesas([])
      setUsadasNesteAcerto([])
      setBancoNome("")
      setBancoValor("")
      setBancoData("")
      setBancoInstituicao("")
      setBancoLocked(false)
      await refreshAll()
      toast({ title: `Acerto criado (${acertoId}) com sucesso!` })
    } catch (error) {
      console.error('Erro ao criar acerto:', error)
      
      // Extrair mensagem específica do erro da API
      let errorMessage = "Erro desconhecido ao criar acerto"
      
      if (error instanceof Error) {
        // Se o erro contém informações da API
        if (error.message.includes('HTTP 400')) {
          try {
            // Extrair a mensagem JSON do erro
            const match = error.message.match(/\{"error":"([^"]+)"\}/)
            if (match && match[1]) {
              errorMessage = match[1]
            } else {
              errorMessage = "Erro de validação na criação do acerto"
            }
          } catch {
            errorMessage = "Erro de validação na criação do acerto"
          }
        } else {
          errorMessage = error.message
        }
      }
      
      toast({ 
        title: "Erro ao criar acerto", 
        description: errorMessage
      })
    }
  }

  // Participantes CRUD
  async function addParticipante() {
    if (!nomePart.trim()) return;
    const dp = Number(defaultPercent || "0")
    const sane = isFinite(dp) ? dp : 0
    
    try {
      await saveParticipante({ nome: nomePart.trim(), defaultPercent: sane, ativo: true })
      setNomePart("")
      setDefaultPercent("")
      const updatedParticipantes = await getParticipantes()
      setParticipantes(updatedParticipantes)
      toast({ title: "Participante adicionado com sucesso!" })
    } catch (error) {
      console.error('Erro ao adicionar participante:', error)
      toast({ title: "Erro ao adicionar participante", variant: "destructive" })
    }
  }

  // Salvar último recebimento no banco
  async function salvarUltimoRecebimento() {
    if (!bancoNome.trim() && !bancoValor.trim() && !bancoData && !bancoInstituicao.trim()) {
      toast({ title: "Preencha pelo menos um campo para salvar." })
      return;
    }

    try {
      const recebimento = {
        id: currentRecebimentoId || undefined,
        nome: bancoNome.trim() || undefined,
        valor: bancoValor ? Number(bancoValor) : undefined,
        data_transacao: (() => {
          if (!bancoData || bancoData.length !== 10) return undefined
          const [dia, mes, ano] = bancoData.split('/')
          if (dia && mes && ano && dia.length === 2 && mes.length === 2 && ano.length === 4) {
            const date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
            return !isNaN(date.getTime()) ? date.toISOString() : undefined
          }
          return undefined
        })(),
        banco: bancoInstituicao.trim() || undefined
      }

      const id = await saveUltimoRecebimento(recebimento)
      setCurrentRecebimentoId(id)
      setBancoLocked(true)
      await refreshAll()
      toast({ title: "Último recebimento salvo no banco de dados!" })
    } catch (error) {
      console.error('Erro ao salvar último recebimento:', error)
      toast({ title: "Erro ao salvar último recebimento", variant: "destructive" })
    }
  }

  // Deletar último recebimento do banco
  async function deletarUltimoRecebimento() {
    if (!currentRecebimentoId) {
      toast({ title: "Nenhum recebimento selecionado para deletar." })
      return;
    }

    try {
      await deleteUltimoRecebimento(currentRecebimentoId)
      // Limpar formulário
      setBancoNome("")
      setBancoValor("")
      setBancoData("")
      setBancoInstituicao("")
      setBancoLocked(false)
      setCurrentRecebimentoId(null)
      await refreshAll()
      toast({ title: "Último recebimento deletado do banco de dados!" })
    } catch (error) {
      console.error('Erro ao deletar último recebimento:', error)
      toast({ title: "Erro ao deletar último recebimento", variant: "destructive" })
    }
  }

  // Editar "último recebimento" no histórico
  function openEditReceb(a: Acerto) {
    setEditAcertoId(a.id)
    setEditBancoNome(a.ultimoRecebimentoBanco?.nome || "")
    setEditBancoValor(a.ultimoRecebimentoBanco?.valor != null ? String(a.ultimoRecebimentoBanco.valor) : "")
    // Converter data ISO para formato brasileiro dd/mm/yyyy
    if (a.ultimoRecebimentoBanco?.data) {
      const date = new Date(a.ultimoRecebimentoBanco.data)
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      setEditBancoData(`${day}/${month}/${year}`)
    } else {
      setEditBancoData("")
    }
    setEditBancoInstituicao(a.ultimoRecebimentoBanco?.banco || "")
    setEditRecOpen(true)
  }

  async function saveEditReceb() {
    if (!editAcertoId) return;
    const nome = editBancoNome.trim()
    const val = Number(editBancoValor || "0")
    const banco = editBancoInstituicao.trim()
    // Converter data brasileira dd/mm/yyyy para ISO
    let dataISO = undefined
    if (editBancoData && editBancoData.length === 10) {
      const [dia, mes, ano] = editBancoData.split('/')
      if (dia && mes && ano && dia.length === 2 && mes.length === 2 && ano.length === 4) {
        const date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
        if (!isNaN(date.getTime())) {
          dataISO = date.toISOString()
        }
      }
    }
    const anyField = !!(nome || banco || dataISO || (isFinite(val) && val > 0))
    const payload = anyField
      ? {
          nome: nome || undefined,
          valor: isFinite(val) ? +val.toFixed(2) : undefined,
          banco: banco || undefined,
          data: dataISO,
        }
      : undefined
    
    try {
      await updateAcerto(editAcertoId, { ultimoRecebimentoBanco: payload })
      setEditRecOpen(false)
      setEditAcertoId("")
      await refreshAll()
      toast({ title: "Último recebimento atualizado." })
    } catch (error) {
      console.error('Erro ao atualizar acerto:', error)
      toast({ title: "Erro ao atualizar último recebimento", variant: "destructive" })
    }
  }

  async function cancelarAcertoHandler(acerto: Acerto) {
    if (!confirm(`Tem certeza que deseja cancelar o acerto "${acerto.titulo || 'Sem título'}"?\n\nEsta ação irá:\n- Deletar o acerto permanentemente\n- Retornar ${acerto.linhaIds.length} venda(s) para status "Pendente"\n- Liberar despesas pendentes usadas neste acerto`)) {
      return;
    }
    
    try {
      const result = await cancelarAcerto(acerto.id)
      await refreshAll()
      toast({ 
        title: "Acerto cancelado com sucesso!", 
        description: `${result.vendasRetornadas} venda(s) retornaram para status pendente.`
      })
    } catch (error) {
      console.error('Erro ao cancelar acerto:', error)
      
      // Extrair mensagem específica do erro da API
      let errorMessage = "Tente novamente"
      
      if (error instanceof Error) {
        if (error.message.includes('HTTP 400')) {
          try {
            const match = error.message.match(/\{"error":"([^"]+)"\}/)
            if (match && match[1]) {
              errorMessage = match[1]
            } else {
              errorMessage = "Erro de validação ao cancelar acerto"
            }
          } catch {
            errorMessage = "Erro de validação ao cancelar acerto"
          }
        } else {
          errorMessage = error.message
        }
      }
      
      toast({ 
        title: "Erro ao cancelar acerto", 
        description: errorMessage,
        variant: "destructive" 
      })
    }
  }

  async function finalizarAcertoHandler(acerto: Acerto) {
    if (!confirm(`Tem certeza que deseja finalizar o acerto "${acerto.titulo || 'Sem título'}"?\n\nEsta ação irá:\n- Fechar o acerto permanentemente\n- Marcar ${acerto.linhaIds.length} venda(s) como "Acertado"`)) {
      return;
    }
    
    try {
      await fecharAcerto(acerto.id)
      await refreshAll()
      toast({ 
        title: "Acerto finalizado com sucesso!", 
        description: `O acerto foi fechado e as vendas foram marcadas como acertadas.`
      })
    } catch (error) {
      console.error('Erro ao finalizar acerto:', error)
      
      // Extrair mensagem específica do erro da API
      let errorMessage = "Tente novamente"
      
      if (error instanceof Error) {
        if (error.message.includes('HTTP 400')) {
          try {
            const match = error.message.match(/\{"error":"([^"]+)"\}/)
            if (match && match[1]) {
              errorMessage = match[1]
            } else {
              errorMessage = "Erro de validação ao finalizar acerto"
            }
          } catch {
            errorMessage = "Erro de validação ao finalizar acerto"
          }
        } else {
          errorMessage = error.message
        }
      }
      
      toast({ 
        title: "Erro ao finalizar acerto", 
        description: errorMessage,
        variant: "destructive" 
      })
    }
  }

  function openViewAcerto(acerto: Acerto) {
    setSelectedAcerto(acerto)
    setViewAcertoOpen(true)
  }

  function downloadAcertoDocument(acerto: Acerto) {
    try {
      const doc = new jsPDF()
      const dataFormatada = new Date(acerto.data).toLocaleDateString('pt-BR')
      const agora = new Date().toLocaleDateString('pt-BR')
      
      // Configurações de fonte e cores
      doc.setFont('helvetica')
      
      // Cabeçalho
      doc.setFillColor(59, 130, 246) // Azul
      doc.rect(0, 0, 210, 30, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(20)
      doc.text('DOCUMENTO DE ACERTO', 105, 20, { align: 'center' })
      
      // Reset cor do texto
      doc.setTextColor(0, 0, 0)
      
      // Informações gerais
      let yPos = 45
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('INFORMAÇÕES GERAIS', 20, yPos)
      
      yPos += 10
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Título: ${acerto.titulo || 'Sem título'}`, 20, yPos)
      yPos += 8
      doc.text(`Data do Acerto: ${dataFormatada}`, 20, yPos)
      yPos += 8
      doc.text(`Número de Vendas: ${acerto.linhaIds.length}`, 20, yPos)
      yPos += 8
      doc.text(`Valor Total: ${fmtCurrency(acerto.totalLiquidoDistribuivel)}`, 20, yPos)
      
      if (acerto.observacoes) {
        yPos += 8
        doc.text(`Observações: ${acerto.observacoes}`, 20, yPos)
      }
      
      // Vendas Incluídas no Acerto
      if (acerto.linhaIds && acerto.linhaIds.length > 0) {
        yPos += 15
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('VENDAS INCLUÍDAS NO ACERTO', 20, yPos)
        
        yPos += 10
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        
        // Buscar dados das vendas
        const vendasDoAcerto = linhas.filter(linha => acerto.linhaIds.includes(linha.id))
        
        if (vendasDoAcerto.length > 0) {
          vendasDoAcerto.forEach((venda, index) => {
            // Verificar se precisa de nova página
            if (yPos > 250) {
              doc.addPage()
              yPos = 20
            }
            
            doc.setFont('helvetica', 'bold')
            doc.text(`Venda ${index + 1}:`, 20, yPos)
            yPos += 6
            
            doc.setFont('helvetica', 'normal')
            doc.text(`Cliente: ${venda.cliente || 'N/A'}`, 25, yPos)
            yPos += 5
            doc.text(`Pedido: ${venda.numeroPedido || 'N/A'}`, 25, yPos)
            yPos += 5
            doc.text(`Data: ${venda.dataPedido ? new Date(venda.dataPedido).toLocaleDateString('pt-BR') : 'N/A'}`, 25, yPos)
            yPos += 5
            doc.text(`Item: ${venda.item || 'N/A'}`, 25, yPos)
            yPos += 5
            doc.text(`Valor: ${fmtCurrency(venda.valorVenda || 0)}`, 25, yPos)
            yPos += 5
            doc.text(`Lucro: ${fmtCurrency(venda.lucroValor || 0)}`, 25, yPos)
            yPos += 8
          })
          
          // Total das vendas
          const totalVendas = vendasDoAcerto.reduce((sum, venda) => sum + (venda.valorVenda || 0), 0)
          const totalLucroVendas = vendasDoAcerto.reduce((sum, venda) => sum + (venda.lucroValor || 0), 0)
          
          yPos += 5
          doc.setFont('helvetica', 'bold')
          doc.text(`Total em Vendas: ${fmtCurrency(totalVendas)}`, 20, yPos)
          yPos += 6
          doc.text(`Total Lucro das Vendas: ${fmtCurrency(totalLucroVendas)}`, 20, yPos)
        } else {
          doc.text('Nenhuma venda encontrada para este acerto.', 20, yPos)
        }
      }
      
      // Último Recebimento
      if (acerto.ultimoRecebimentoBanco) {
        yPos += 15
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('ÚLTIMO RECEBIMENTO', 20, yPos)
        
        yPos += 10
        doc.setFontSize(12)
        doc.setFont('helvetica', 'normal')
        
        if (acerto.ultimoRecebimentoBanco.nome) {
          doc.text(`Nome: ${acerto.ultimoRecebimentoBanco.nome}`, 20, yPos)
          yPos += 8
        }
        if (acerto.ultimoRecebimentoBanco.valor) {
          doc.text(`Valor: ${fmtCurrency(acerto.ultimoRecebimentoBanco.valor)}`, 20, yPos)
          yPos += 8
        }
        if (acerto.ultimoRecebimentoBanco.data) {
          doc.text(`Data: ${new Date(acerto.ultimoRecebimentoBanco.data).toLocaleDateString('pt-BR')}`, 20, yPos)
          yPos += 8
        }
        if (acerto.ultimoRecebimentoBanco.banco) {
          doc.text(`Banco: ${acerto.ultimoRecebimentoBanco.banco}`, 20, yPos)
          yPos += 8
        }
      }
      
      // Distribuições
      yPos += 15
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('DISTRIBUIÇÕES', 20, yPos)
      
      yPos += 10
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      
      acerto.distribuicoes.forEach((dist) => {
        const participante = participantes.find(p => p.id === dist.participanteId)
        const nome = participante?.nome || 'Participante não encontrado'
        doc.text(`${nome}: ${dist.percentual}% - ${fmtCurrency(dist.valor)}`, 20, yPos)
        yPos += 8
      })
      
      // Totais
      yPos += 10
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('TOTAIS FINANCEIROS', 20, yPos)
      
      yPos += 10
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Lucro Total: ${fmtCurrency(acerto.totalLucro)}`, 20, yPos)
      yPos += 8
      doc.text(`Despesas Rateio: ${fmtCurrency(acerto.totalDespesasRateio)}`, 20, yPos)
      yPos += 8
      doc.setFont('helvetica', 'bold')
      doc.text(`Líquido Distribuível: ${fmtCurrency(acerto.totalLiquidoDistribuivel)}`, 20, yPos)
      
      // Rodapé
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(128, 128, 128)
      doc.text(`Documento gerado em: ${agora}`, 20, 280)
      doc.text('Sistema de Gestão de Vendas', 105, 280, { align: 'center' })
      
      // Salvar PDF
      const nomeArquivo = `acerto-${acerto.titulo?.replace(/[^a-zA-Z0-9]/g, '-') || 'documento'}-${dataFormatada.replace(/\//g, '-')}.pdf`
      doc.save(nomeArquivo)
      
      toast({ title: "PDF baixado com sucesso!" })
    } catch (error) {
      console.error('Erro ao gerar PDF:', error)
      toast({ title: "Erro ao gerar PDF", variant: "destructive" })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <AppHeader />
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Moderno */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Calculator className="h-10 w-10" />
                Acertos
              </h1>
              <p className="text-blue-100 text-lg">Gerencie os acertos de vendas e distribuições com facilidade</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-200" />
                <Label className="text-white font-medium">Ano:</Label>
                <Select value={String(anoSelecionado)} onValueChange={(v) => setAnoSelecionado(Number(v))}>
                  <SelectTrigger className="w-32 bg-white/20 border-white/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const ano = new Date().getFullYear() - i
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
        </div>

        {/* Participantes */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Users className="h-6 w-6" />
              Participantes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Nome do participante"
                value={nomePart}
                onChange={(e) => setNomePart(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addParticipante()}
                className="shadow-sm"
              />
              <Input
                type="number"
                placeholder="% padrão"
                value={defaultPercent}
                onChange={(e) => setDefaultPercent(e.target.value)}
                className="w-32 shadow-sm"
              />
              <Button onClick={addParticipante} className="bg-emerald-500 hover:bg-emerald-600 shadow-md">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {participantes.map((p, idx) => {
                const colors = [
                  'from-blue-500 to-blue-600',
                  'from-purple-500 to-purple-600', 
                  'from-pink-500 to-pink-600',
                  'from-orange-500 to-orange-600',
                  'from-green-500 to-green-600',
                  'from-red-500 to-red-600'
                ]
                const colorClass = colors[idx % colors.length]
                return (
                  <div key={p.id} className={`bg-gradient-to-br ${colorClass} p-6 rounded-xl text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-bold text-lg">{p.nome}</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">{p.defaultPercent}%</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/20 hover:bg-white/30 border-0"
                        onClick={async () => {
                          try {
                            await deleteParticipante(p.id)
                            const updatedParticipantes = await getParticipantes()
                            setParticipantes(updatedParticipantes)
                            toast({ title: "Participante removido." })
                          } catch (error) {
                            console.error('Erro ao remover participante:', error)
                            toast({ title: "Erro ao remover participante", variant: "destructive" })
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Último Recebimento */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <DollarSign className="h-6 w-6" />
              Último Recebimento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label className="text-green-700 font-medium">Nome/Descrição</Label>
                  <Input
                    value={bancoNome}
                    onChange={(e) => setBancoNome(e.target.value)}
                    placeholder="Ex: PIX Cliente X"
                    disabled={bancoLocked}
                    className="shadow-sm border-green-200 focus:border-green-400 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-green-700 font-medium">Valor</Label>
                  <CurrencyInput
                    value={bancoValor ? Number(bancoValor) : 0}
                    onValueChange={(val) => setBancoValor(String(val))}
                    placeholder="R$ 0,00"
                    disabled={bancoLocked}
                    className="shadow-sm border-green-200 focus:border-green-400 mt-1"
                    allowNegative={false}
                  />
                </div>
                <div>
                  <Label className="text-green-700 font-medium">Data</Label>
                  <Input
                    type="text"
                    value={bancoData}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '') // Remove tudo que não é dígito
                      if (value.length >= 2) {
                        value = value.substring(0, 2) + '/' + value.substring(2)
                      }
                      if (value.length >= 5) {
                        value = value.substring(0, 5) + '/' + value.substring(5, 9)
                      }
                      setBancoData(value)
                    }}
                    placeholder="dd/mm/yyyy"
                    maxLength={10}
                    disabled={bancoLocked}
                    className="shadow-sm border-green-200 focus:border-green-400 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-green-700 font-medium">Banco/Instituição</Label>
                  <Input
                    value={bancoInstituicao}
                    onChange={(e) => setBancoInstituicao(e.target.value)}
                    placeholder="Ex: Nubank"
                    disabled={bancoLocked}
                    className="shadow-sm border-green-200 focus:border-green-400 mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={salvarUltimoRecebimento} disabled={bancoLocked} className="bg-green-500 hover:bg-green-600 shadow-md">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar no Banco
                </Button>
                {bancoLocked && (
                  <Button variant="outline" onClick={deletarUltimoRecebimento} className="border-red-300 text-red-600 hover:bg-red-50 shadow-sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar do Banco
                  </Button>
                )}
              </div>
            </div>
            
            {/* Lista de últimos recebimentos salvos */}
            {ultimosRecebimentos.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Últimos Recebimentos Salvos:</h4>
                <div className="space-y-2">
                  {ultimosRecebimentos.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="text-sm">
                        <span className="font-medium">{rec.nome || 'Sem nome'}</span>
                        {rec.valor && <span className="ml-2 text-green-600">{fmtCurrency(rec.valor)}</span>}
                        {rec.data_transacao && <span className="ml-2 text-gray-500">{new Date(rec.data_transacao).toLocaleDateString('pt-BR')}</span>}
                        {rec.banco && <span className="ml-2 text-blue-600">({rec.banco})</span>}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setBancoNome(rec.nome || '')
                          setBancoValor(rec.valor ? String(rec.valor) : '')
                          // Converter data ISO para formato brasileiro dd/mm/yyyy
                          if (rec.data_transacao) {
                            const date = new Date(rec.data_transacao)
                            const day = String(date.getDate()).padStart(2, '0')
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const year = date.getFullYear()
                            setBancoData(`${day}/${month}/${year}`)
                          } else {
                            setBancoData('')
                          }
                          setBancoInstituicao(rec.banco || '')
                          setCurrentRecebimentoId(rec.id)
                          setBancoLocked(true)
                        }}
                      >
                        Usar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vendas Pendentes */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Receipt className="h-6 w-6" />
              Vendas Recebidas Pendentes de Acerto ({anoSelecionado})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={pendentesFiltrados.length > 0 && selectedIds.length === pendentesFiltrados.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            const newSel: Record<string, boolean> = {}
                            pendentesFiltrados.forEach((l) => {
                              newSel[l.id] = true
                            })
                            setSelected(newSel)
                          } else {
                            setSelected({})
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">Data</TableHead>
                    <TableHead className="font-semibold text-gray-700">Nº Dispensa</TableHead>
                    <TableHead className="font-semibold text-gray-700">Nº OF</TableHead>
                    <TableHead className="font-semibold text-gray-700">Cliente</TableHead>
                    <TableHead className="font-semibold text-gray-700">Item</TableHead>
                    <TableHead className="font-semibold text-gray-700">Lucro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendentesFiltrados.map((linha, idx) => {
                    const isSelected = !!selected[linha.id]
                    return (
                      <TableRow 
                        key={linha.id} 
                        className={`
                          ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} 
                          ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''} 
                          hover:bg-blue-50/50 transition-colors duration-200
                        `}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              setSelected((prev) => ({ ...prev, [linha.id]: !!checked }))
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{new Date(linha.dataPedido).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="font-medium text-blue-600">{linha.numeroDispensa || '-'}</TableCell>
                        <TableCell className="font-medium text-purple-600">{linha.numeroOF || '-'}</TableCell>
                        <TableCell className="font-medium">{linha.cliente}</TableCell>
                        <TableCell className="max-w-xs truncate">{linha.item}</TableCell>
                        <TableCell className={`font-bold ${isSelected ? 'text-green-700' : 'text-green-600'}`}>
                          {fmtCurrency(linha.lucroValor || 0)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-700">
                <strong>Selecionadas:</strong> {selectedIds.length} vendas | 
                <strong>Lucro Total:</strong> {fmtCurrency(totalLucroSel)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Despesas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DespesasPendentesPanel
            pendentes={despesasPendentes.filter((d) => !usadasNesteAcerto.includes(d.id))}
            participantes={participantes}
            onUse={onUsePendentes}
            onDelete={onDeletePendentes}
          />
          <DespesasEditor
              despesas={despesas}
              participantes={participantes}
              onAdd={onAddDespesa}
              onRemove={onRemoveDespesa}
              onSavePendente={onSavePendente}
            />
        </div>

        {/* Distribuição */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Calculator className="h-6 w-6" />
              Distribuição
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-purple-700 font-medium">Título do Acerto *</Label>
                    <Input
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Ex: Acerto Janeiro 2024"
                      className="shadow-sm border-purple-200 focus:border-purple-400 mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-purple-700 font-medium">Observações</Label>
                    <Textarea
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      placeholder="Observações sobre este acerto..."
                      rows={2}
                      className="shadow-sm border-purple-200 focus:border-purple-400 mt-1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-md border-0 bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="text-sm text-blue-700 font-medium">Lucro Selecionado</div>
                    <div className="text-2xl font-bold text-blue-600 mt-1">{fmtCurrency(totalLucroSel)}</div>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-0 bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-l-red-500">
                  <CardContent className="p-4">
                    <div className="text-sm text-red-700 font-medium">Despesas Rateio</div>
                    <div className="text-2xl font-bold text-red-600 mt-1">{fmtCurrency(totalRateio)}</div>
                  </CardContent>
                </Card>
                <Card className="shadow-md border-0 bg-gradient-to-br from-green-50 to-green-100 border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="text-sm text-green-700 font-medium">Base Distribuível</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">{fmtCurrency(baseDistribuivel)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={distribuirIgual}>
                  Distribuir Igual
                </Button>
              </div>

              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200">
                <Label className="text-lg font-semibold text-indigo-700 mb-4 block">Alocação dos Participantes</Label>
                <div className="space-y-3">
                  {participantes.map((p) => {
                    const perc = dist[p.id] ?? p.defaultPercent ?? 0
                    const valor = (baseDistribuivel * perc) / 100
                    const despIndiv = indivPorPart[p.id] || 0
                    const liquido = valor - despIndiv
                    return (
                      <div key={p.id} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-indigo-100 hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">{p.nome}</div>
                          <div className="text-sm text-indigo-600 font-medium">
                            {perc}% = {fmtCurrency(valor)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={perc}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0
                              setDist((prev) => ({ ...prev, [p.id]: val }))
                            }}
                            className="w-20 shadow-sm border-indigo-200 focus:border-indigo-400 text-center"
                            min="0"
                            max="100"
                          />
                          <span className="text-sm font-medium text-indigo-600">%</span>
                        </div>
                        {despIndiv > 0 && (
                          <div className="w-24 text-right text-sm text-red-600">
                            -{fmtCurrency(despIndiv)}
                          </div>
                        )}
                        <div className="w-24 text-right font-bold text-green-600">
                          {fmtCurrency(liquido)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="text-right text-sm text-gray-600">
                Soma: {participantes.reduce((a, p) => a + (dist[p.id] ?? p.defaultPercent ?? 0), 0).toFixed(2)}%
              </div>

              <Button 
                 onClick={salvarAcerto} 
                 className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg text-lg py-6" 
                 size="lg"
               >
                 <Plus className="h-5 w-5 mr-2" />
                 Criar Acerto
               </Button>
             </div>
           </CardContent>
         </Card>

         {/* Histórico de Acertos */}
         <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
           <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
             <CardTitle className="flex items-center gap-3 text-xl">
               <History className="h-6 w-6" />
               Histórico de Acertos
             </CardTitle>
           </CardHeader>
           <CardContent className="p-6">
             <div className="bg-white rounded-xl shadow-sm border border-orange-100">
               <Table>
                 <TableHeader>
                   <TableRow className="bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-200">
                     <TableHead className="font-semibold text-orange-700">Data</TableHead>
                     <TableHead className="font-semibold text-orange-700">Título</TableHead>
                     <TableHead className="font-semibold text-orange-700">Vendas</TableHead>
                     <TableHead className="font-semibold text-orange-700">Valor Total</TableHead>
                     <TableHead className="font-semibold text-orange-700">Status</TableHead>
                     <TableHead className="font-semibold text-orange-700">Ações</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                  {acertos.map((acerto, index) => (
                    <TableRow key={acerto.id} className={`hover:bg-orange-50 transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}>
                      <TableCell className="font-medium text-gray-700">{new Date(acerto.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="font-semibold text-gray-800">{acerto.titulo || 'Sem título'}</TableCell>
                      <TableCell className="text-blue-600 font-medium">{acerto.linhaIds.length}</TableCell>
                      <TableCell className="font-bold text-green-600">{fmtCurrency(acerto.totalLiquidoDistribuivel)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          acerto.status === 'fechado' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {acerto.status === 'fechado' ? 'Fechado' : 'Aberto'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openViewAcerto(acerto)} className="border-blue-300 text-blue-600 hover:bg-blue-50 shadow-sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => downloadAcertoDocument(acerto)} className="border-green-300 text-green-600 hover:bg-green-50 shadow-sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openEditReceb(acerto)} className="border-orange-300 text-orange-600 hover:bg-orange-50 shadow-sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {acerto.status === 'aberto' && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => finalizarAcertoHandler(acerto)}
                              className="text-green-600 hover:text-green-700 border-green-300 hover:bg-green-50 shadow-sm"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => cancelarAcertoHandler(acerto)}
                            className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50 shadow-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Edição do Último Recebimento */}
      <Dialog open={editRecOpen} onOpenChange={setEditRecOpen}>
        <DialogContent className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 -m-6 mb-6 rounded-t-lg">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <DollarSign className="h-6 w-6" />
              Editar Último Recebimento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-2">
            <div>
              <Label className="text-green-700 font-medium">Nome/Descrição</Label>
              <Input
                value={editBancoNome}
                onChange={(e) => setEditBancoNome(e.target.value)}
                placeholder="Ex: PIX Cliente X"
                className="shadow-sm border-green-200 focus:border-green-400 mt-1"
              />
            </div>
            <div>
              <Label className="text-green-700 font-medium">Valor</Label>
              <CurrencyInput
                value={editBancoValor ? Number(editBancoValor) : 0}
                onValueChange={(val) => setEditBancoValor(String(val))}
                placeholder="R$ 0,00"
                className="shadow-sm border-green-200 focus:border-green-400 mt-1"
                allowNegative={false}
              />
            </div>
            <div>
              <Label className="text-green-700 font-medium">Data</Label>
              <Input
                type="text"
                value={editBancoData}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '')
                  if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2)
                  if (value.length >= 5) value = value.slice(0, 5) + '/' + value.slice(5, 9)
                  setEditBancoData(value)
                }}
                placeholder="dd/mm/yyyy"
                maxLength={10}
                className="shadow-sm border-green-200 focus:border-green-400 mt-1"
              />
            </div>
            <div>
              <Label className="text-green-700 font-medium">Banco/Instituição</Label>
              <Input
                value={editBancoInstituicao}
                onChange={(e) => setEditBancoInstituicao(e.target.value)}
                placeholder="Ex: Nubank"
                className="shadow-sm border-green-200 focus:border-green-400 mt-1"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setEditRecOpen(false)} className="border-gray-300 hover:bg-gray-50">
                Cancelar
              </Button>
              <Button onClick={saveEditReceb} className="bg-green-500 hover:bg-green-600 shadow-md">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização do Acerto */}
      <Dialog open={viewAcertoOpen} onOpenChange={setViewAcertoOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-2xl">
          <DialogHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 -m-6 mb-6 rounded-t-lg">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <Eye className="h-6 w-6" />
              Detalhes do Acerto
            </DialogTitle>
          </DialogHeader>
          {selectedAcerto && (
            <div className="space-y-6 p-2">
              {/* Informações Gerais */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-700 mb-4">Informações Gerais</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-blue-600">Título</Label>
                    <p className="text-lg font-semibold text-gray-800">{selectedAcerto.titulo || 'Sem título'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-blue-600">Data de Criação</Label>
                <p className="text-lg font-semibold text-gray-800">
                  {selectedAcerto.createdAt && !isNaN(new Date(selectedAcerto.createdAt).getTime()) 
                    ? new Date(selectedAcerto.createdAt).toLocaleDateString('pt-BR')
                    : 'Data não disponível'
                  }
                </p>
                  </div>
                </div>
              </div>

              {selectedAcerto.observacoes && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200">
                  <Label className="text-sm font-medium text-blue-600">Observações</Label>
                  <p className="text-sm bg-blue-50 p-4 rounded-lg mt-2 border border-blue-100">{selectedAcerto.observacoes}</p>
                </div>
              )}

              {/* Último Recebimento */}
              {selectedAcerto.ultimoRecebimentoBanco && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200">
                  <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Último Recebimento
                  </h3>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAcerto.ultimoRecebimentoBanco.nome && (
                        <div>
                          <Label className="text-sm font-medium text-green-600">Nome</Label>
                          <p className="text-lg font-semibold text-gray-800">{selectedAcerto.ultimoRecebimentoBanco.nome}</p>
                        </div>
                      )}
                      {selectedAcerto.ultimoRecebimentoBanco.valor && (
                        <div>
                          <Label className="text-sm font-medium text-green-600">Valor</Label>
                          <p className="text-lg font-bold text-green-700">{fmtCurrency(selectedAcerto.ultimoRecebimentoBanco.valor)}</p>
                        </div>
                      )}
                      {selectedAcerto.ultimoRecebimentoBanco.data && (
                        <div>
                          <Label className="text-sm font-medium text-green-600">Data</Label>
                          <p className="text-lg font-semibold text-gray-800">{new Date(selectedAcerto.ultimoRecebimentoBanco.data).toLocaleDateString('pt-BR')}</p>
                        </div>
                      )}
                      {selectedAcerto.ultimoRecebimentoBanco.banco && (
                        <div>
                          <Label className="text-sm font-medium text-green-600">Banco</Label>
                          <p className="text-lg font-semibold text-gray-800">{selectedAcerto.ultimoRecebimentoBanco.banco}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Vendas Incluídas */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Vendas Incluídas no Acerto
                </h3>
                <div className="space-y-3">
                  {selectedAcerto.linhaIds.map((linhaId) => {
                    const linha = linhas.find(l => l.id === linhaId)
                    if (!linha) return null
                    return (
                      <div key={linhaId} className="flex justify-between items-center p-4 bg-blue-50 rounded-lg border border-blue-100 hover:shadow-sm transition-shadow">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{linha.cliente}</p>
                          <div className="text-sm text-blue-600 space-y-1">
                            <p>OF: {linha.numeroOF} | Data: {new Date(linha.dataPedido).toLocaleDateString('pt-BR')}</p>
                            <p>Item: {linha.item}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{fmtCurrency(linha.valorVenda)}</div>
                          <div className="text-sm text-gray-600">Lucro: {fmtCurrency(linha.lucroValor || 0)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-blue-700">Total de Vendas:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {fmtCurrency(selectedAcerto.linhaIds.reduce((total, linhaId) => {
                        const linha = linhas.find(l => l.id === linhaId)
                        return total + (linha?.valorVenda || 0)
                      }, 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Distribuições */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-700 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Distribuições
                </h3>
                <div className="space-y-3">
                  {selectedAcerto.distribuicoes.map((dist, idx) => {
                    const participante = participantes.find(p => p.id === dist.participanteId)
                    return (
                      <div key={idx} className="flex justify-between items-center p-4 bg-purple-50 rounded-lg border border-purple-100 hover:shadow-sm transition-shadow">
                        <div>
                          <p className="font-semibold text-gray-800">{participante?.nome || 'Participante não encontrado'}</p>
                          <p className="text-sm text-purple-600">{dist.percentual}% da distribuição</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">{fmtCurrency(dist.valor)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Despesas */}
              {selectedAcerto.despesas.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-red-200">
                  <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Despesas
                  </h3>
                  <div className="space-y-3">
                    {selectedAcerto.despesas.map((desp, idx) => {
                      const participante = desp.participanteId ? participantes.find(p => p.id === desp.participanteId) : null
                      return (
                        <div key={idx} className="flex justify-between items-center p-4 bg-red-50 rounded-lg border border-red-100 hover:shadow-sm transition-shadow">
                          <div>
                            <p className="font-semibold text-gray-800">{desp.descricao}</p>
                            {participante && <p className="text-sm text-red-600">Responsável: {participante.nome}</p>}
                          </div>
                          <div className="text-lg font-bold text-red-600">
                            {fmtCurrency(desp.valor)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Resumo Financeiro */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumo Financeiro
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200 flex flex-col items-center justify-center min-h-[100px]">
                    <div className="text-2xl font-bold text-green-600 text-center">{fmtCurrency(selectedAcerto.totalLiquidoDistribuivel)}</div>
                    <div className="text-sm font-medium text-green-700 mt-2 text-center">Valor Total</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 p-6 rounded-lg border border-red-200 flex flex-col items-center justify-center min-h-[100px]">
                    <div className="text-2xl font-bold text-red-600 text-center">
                      {fmtCurrency(selectedAcerto.despesas.reduce((a, d) => a + d.valor, 0))}
                    </div>
                    <div className="text-sm font-medium text-red-700 mt-2 text-center">Total Despesas</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200 flex flex-col items-center justify-center min-h-[100px]">
                    <div className="text-2xl font-bold text-blue-600 text-center">
                      {fmtCurrency(selectedAcerto.distribuicoes.reduce((a, d) => a + d.valor, 0))}
                    </div>
                    <div className="text-sm font-medium text-blue-700 mt-2 text-center">Total Distribuído</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AcertosPage() {
  return (
    <ProtectedRoute requiredPermission="acertos">
      <AcertosContent />
    </ProtectedRoute>
  )
}
