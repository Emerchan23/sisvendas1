"use client"

import { useEffect, useMemo, useState } from "react"

// Função auxiliar para gerar IDs compatível com navegadores
function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  // Fallback para navegadores que não suportam crypto.randomUUID
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

// Função para gerar número do orçamento no formato número/ano
async function generateOrcamentoNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()
  
  try {
    // Buscar orçamentos do ano atual para determinar o próximo número
    const response = await fetch('/api/orcamentos?incluir_itens=false')
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    const orcamentos = await response.json()
    
    // Filtrar orçamentos do ano atual e extrair números
    const orcamentosDoAno = orcamentos.filter((orc: any) => {
      const numero = orc.numero.toString()
      return numero.includes(`/${currentYear}`)
    })
    
    // Encontrar o maior número do ano
    let maiorNumero = 0
    orcamentosDoAno.forEach((orc: any) => {
      const numero = orc.numero.toString()
      const partes = numero.split('/')
      if (partes.length === 2) {
        const num = parseInt(partes[0])
        if (!isNaN(num) && num > maiorNumero) {
          maiorNumero = num
        }
      }
    })
    
    // Próximo número sequencial com formatação de zero à esquerda
    const proximoNumero = maiorNumero + 1
    const numeroFormatado = proximoNumero.toString().padStart(2, '0')
    return `${numeroFormatado}/${currentYear}`
    
  } catch (error) {
    console.error('Erro ao gerar número do orçamento:', error)
    // Fallback mais seguro: começar do 01 se houver erro
    return `01/${currentYear}`
  }
}

// Local storage keys for draft saving
const DRAFT_STORAGE_KEY = 'orcamento_draft'
const DRAFT_TIMESTAMP_KEY = 'orcamento_draft_timestamp'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ExternalLink, LockKeyhole, ChevronDown, ChevronRight, Save, Download, Maximize2, Minimize2 } from "lucide-react"
import { fmtCurrency } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ERP_CHANGED_EVENT, getClientes } from "@/lib/data-store"
import { saveOrcamento, getOrcamentos, type Orcamento, type OrcamentoCliente } from "@/lib/orcamentos"
import { api } from "@/lib/api-client"

// Local types for the form (different from backend types)
type FormOrcamentoItem = {
  descricao: string
  marca: string
  unidadeMedida: string
  quantidade: number
  valorUnitario: number
  linkRef: string
  custoRef?: number
}

type ClienteState = OrcamentoCliente

// Re-export types for compatibility
export type { OrcamentoCliente as ClienteState }
export type { OrcamentoItem } from "@/lib/api-client"

// Legacy function for compatibility - now uses backend
export async function getOrcamentosSync(): Promise<Orcamento[]> {
  return await getOrcamentos()
}

// Legacy function for compatibility - now uses backend
export async function deleteOrcamentoLocal(id: string): Promise<boolean> {
  const success = await import("@/lib/orcamentos").then(m => m.deleteOrcamento(id))
  if (success && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("erp-changed"))
  }
  return success
}

type OrcamentoFormProps = {
  orcamentoParaEdicao?: Orcamento | null
  onSalvoComSucesso?: () => void
}

export function OrcamentoForm({ orcamentoParaEdicao, onSalvoComSucesso }: OrcamentoFormProps = {}) {
  const { toast } = useToast()
  const [isMaximized, setIsMaximized] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [unidadesMedida, setUnidadesMedida] = useState<{id: number, codigo: string, descricao: string, ativo: boolean}[]>([])
  const [modalidades, setModalidades] = useState<{id: number, codigo: string, nome: string, descricao: string, ativo: boolean, requer_numero_processo?: boolean}[]>([])
  const [clienteIdSel, setClienteIdSel] = useState<string>("")
  const [cliente, setCliente] = useState<ClienteState>({ nome: "" })
  const [observacoes, setObservacoes] = useState("")
  const [dataValidade, setDataValidade] = useState("")
  const [modalidade, setModalidade] = useState<string>("COMPRA_DIRETA")
  const [numeroPregao, setNumeroPregao] = useState("")
  const [numeroDispensa, setNumeroDispensa] = useState("")
  const [numeroProcesso, setNumeroProcesso] = useState("")
  const [itens, setItens] = useState<FormOrcamentoItem[]>([
    { descricao: "", marca: "", unidadeMedida: "un", quantidade: 1, valorUnitario: 0, linkRef: "", custoRef: undefined },
  ])
  const [hasDraft, setHasDraft] = useState(false)

  // Funções para gerenciar rascunho
  const saveDraft = () => {
    try {
      const draft = {
        cliente,
        clienteIdSel,
        observacoes,
        dataValidade,
        modalidade,
        numeroPregao,
        numeroDispensa,
        numeroProcesso,
        itens
      }
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
      localStorage.setItem(DRAFT_TIMESTAMP_KEY, new Date().toISOString())
      setHasDraft(true)
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error)
    }
  }

  const loadDraft = () => {
    try {
      const draftStr = localStorage.getItem(DRAFT_STORAGE_KEY)
      if (draftStr) {
        const draft = JSON.parse(draftStr)
        setCliente(draft.cliente || { nome: "" })
        setClienteIdSel(draft.clienteIdSel || "")
        setObservacoes(draft.observacoes || "")
        setDataValidade(draft.dataValidade || "")
        setModalidade(draft.modalidade || "COMPRA_DIRETA")
        setNumeroPregao(draft.numeroPregao || "")
        setNumeroDispensa(draft.numeroDispensa || "")
        setNumeroProcesso(draft.numeroProcesso || "")
        setItens(draft.itens || [{ descricao: "", marca: "", unidadeMedida: "un", quantidade: 1, valorUnitario: 0, linkRef: "", custoRef: undefined }])
        setHasDraft(true)
        toast({ title: "Rascunho carregado!", description: "Seus dados foram restaurados." })
      }
    } catch (error) {
      console.error('Erro ao carregar rascunho:', error)
    }
  }

  const clearDraft = () => {
    try {
      console.log('🧹 [FORM DEBUG] Limpando draft do localStorage...')
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      localStorage.removeItem(DRAFT_TIMESTAMP_KEY)
      setHasDraft(false)
      console.log('✅ [FORM DEBUG] Draft limpo com sucesso')
    } catch (error) {
      console.error('❌ [FORM DEBUG] Erro ao limpar rascunho:', error)
    }
  }

  // Função para carregar modalidades
  const carregarModalidades = async () => {
    try {
      const response = await fetch('/api/modalidades-compra')
      if (response.ok) {
        const modalidadesData = await response.json()
        setModalidades(modalidadesData.filter((m: any) => m.ativo))
      } else {
        console.error('Erro ao carregar modalidades')
        // Fallback para modalidades padrão
        setModalidades([
          { id: 1, codigo: 'COMPRA_DIRETA', nome: 'Compra Direta', descricao: 'Compra direta sem licitação', ativo: true },
          { id: 2, codigo: 'LICITADO', nome: 'Licitado', descricao: 'Processo licitatório', ativo: true },
          { id: 3, codigo: 'DISPENSA', nome: 'Dispensa de Licitação', descricao: 'Dispensa de licitação', ativo: true }
        ])
      }
    } catch (error) {
      console.error('Erro ao carregar modalidades:', error)
      // Fallback para modalidades padrão
      setModalidades([
        { id: 1, codigo: 'COMPRA_DIRETA', nome: 'Compra Direta', descricao: 'Compra direta sem licitação', ativo: true },
        { id: 2, codigo: 'LICITADO', nome: 'Licitado', descricao: 'Processo licitatório', ativo: true },
        { id: 3, codigo: 'DISPENSA', nome: 'Dispensa de Licitação', descricao: 'Dispensa de licitação', ativo: true }
      ])
    }
  }

  // Função para carregar unidades de medida
  const carregarUnidadesMedida = async () => {
    try {
      const response = await fetch('/api/unidades-medida')
      if (response.ok) {
        const unidades = await response.json()
        setUnidadesMedida(unidades.filter((u: any) => u.ativo))
      } else {
        console.error('Erro ao carregar unidades de medida')
        // Fallback para unidades padrão
        setUnidadesMedida([
          { id: 1, codigo: 'un', descricao: 'Unidade', ativo: true },
          { id: 2, codigo: 'cx', descricao: 'Caixa', ativo: true },
          { id: 3, codigo: 'pct', descricao: 'Pacote', ativo: true },
          { id: 4, codigo: 'kit', descricao: 'Kit', ativo: true },
          { id: 5, codigo: 'kg', descricao: 'Quilograma', ativo: true },
          { id: 6, codigo: 'm', descricao: 'Metro', ativo: true },
          { id: 7, codigo: 'm²', descricao: 'Metro quadrado', ativo: true },
          { id: 8, codigo: 'm³', descricao: 'Metro cúbico', ativo: true },
          { id: 9, codigo: 'l', descricao: 'Litro', ativo: true }
        ])
      }
    } catch (error) {
      console.error('Erro ao carregar unidades de medida:', error)
      // Fallback para unidades padrão
      setUnidadesMedida([
        { id: 1, codigo: 'un', descricao: 'Unidade', ativo: true },
        { id: 2, codigo: 'cx', descricao: 'Caixa', ativo: true },
        { id: 3, codigo: 'pct', descricao: 'Pacote', ativo: true },
        { id: 4, codigo: 'kit', descricao: 'Kit', ativo: true },
        { id: 5, codigo: 'kg', descricao: 'Quilograma', ativo: true },
        { id: 6, codigo: 'm', descricao: 'Metro', ativo: true },
        { id: 7, codigo: 'm²', descricao: 'Metro quadrado', ativo: true },
        { id: 8, codigo: 'm³', descricao: 'Metro cúbico', ativo: true },
        { id: 9, codigo: 'l', descricao: 'Litro', ativo: true }
      ])
    }
  }

  // Carrega clientes inicialmente e sincroniza quando houver alterações
  useEffect(() => {
    async function loadClientes() {
      try {
        const clientesData = await getClientes()
        setClientes(clientesData)
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
        setClientes([])
      }
    }
    loadClientes()
    carregarUnidadesMedida()
    carregarModalidades()
    
    const reload = async () => {
      try {
        const clientesData = await getClientes()
        setClientes(clientesData)
      } catch (error) {
        console.error('Erro ao recarregar clientes:', error)
        setClientes([])
      }
    }
    window.addEventListener(ERP_CHANGED_EVENT, reload as EventListener)
    window.addEventListener("storage", reload)
    return () => {
      window.removeEventListener(ERP_CHANGED_EVENT, reload as EventListener)
      window.removeEventListener("storage", reload)
    }
  }, [])

  // Verifica se existe rascunho salvo ao carregar o componente
  useEffect(() => {
    const draftStr = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (draftStr) {
      setHasDraft(true)
    }
  }, [])

  // Auto-salvamento do rascunho a cada mudança (com debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      // Só salva se houver algum conteúdo
      if (cliente.nome.trim() || observacoes.trim() || dataValidade.trim() || itens.some(item => item.descricao.trim())) {
        saveDraft()
      }
    }, 2000) // Salva após 2 segundos de inatividade

    return () => clearTimeout(timer)
  }, [cliente, observacoes, dataValidade, itens, clienteIdSel, numeroProcesso])

  // Seleção do cliente cadastrado preenche o formulário
  useEffect(() => {
    if (!clienteIdSel) return
    const c = clientes.find((x) => x.id === clienteIdSel)
    if (c) {
      setCliente({
        id: c.id,
        nome: c.nome || "",
        documento: c.documento || "",
        telefone: c.telefone || "",
        email: c.email || "",
        endereco: c.endereco || "",
      })
    }
  }, [clienteIdSel, clientes])

  // Carrega dados do orçamento para edição
  useEffect(() => {
    if (orcamentoParaEdicao) {
      console.log('🔍 [FORM DEBUG] Orçamento completo para edição:', orcamentoParaEdicao)
      console.log('🔍 [FORM DEBUG] ID do orçamento para edição:', orcamentoParaEdicao.id)
      console.log('🔍 [FORM DEBUG] Verificando se ID existe no localStorage...')
      
      // Verificar se há dados antigos no localStorage
      const localStorageKeys = Object.keys(localStorage)
      const orcamentoKeys = localStorageKeys.filter(key => key.includes('orcamento'))
      console.log('🔍 [FORM DEBUG] Chaves relacionadas a orçamento no localStorage:', orcamentoKeys)
      
      setCliente(orcamentoParaEdicao.cliente || { nome: "" })
      setObservacoes(orcamentoParaEdicao.observacoes || "")
      
      // Formatar data de validade para o input (YYYY-MM-DD)
      const dataValidadeFormatada = (orcamentoParaEdicao as any).data_validade 
        ? new Date((orcamentoParaEdicao as any).data_validade).toISOString().split('T')[0]
        : ""
      setDataValidade(dataValidadeFormatada)
      
      setModalidade((orcamentoParaEdicao as any).modalidade || "COMPRA_DIRETA")
      setNumeroPregao((orcamentoParaEdicao as any).numero_pregao || "")
      setNumeroDispensa((orcamentoParaEdicao as any).numero_dispensa || "")
      
      // Converte itens do backend para o formato do formulário
      const itensForm = orcamentoParaEdicao.itens.map(item => {
        // Busca a unidade de medida correspondente para obter apenas o código
        const unidadeEncontrada = unidadesMedida.find(u => u.codigo === (item as any).unidade_medida)
        return {
          descricao: item.descricao,
          marca: item.marca || "",
          unidadeMedida: unidadeEncontrada?.codigo || (item as any).unidade_medida || "un",
          quantidade: item.quantidade,
          valorUnitario: item.valor_unitario,
          observacoes: (item as any).observacoes || "",
          linkRef: item.link_ref || "",
          custoRef: item.custo_ref || undefined
        }
      })
      
      setItens(itensForm.length > 0 ? itensForm : [
        { descricao: "", marca: "", unidadeMedida: "un", quantidade: 1, valorUnitario: 0, linkRef: "", custoRef: undefined }
      ])
      
      // Limpa seleção de cliente cadastrado pois estamos editando
      setClienteIdSel("")
    }
  }, [orcamentoParaEdicao])

  const total = useMemo(
    () => itens.reduce((acc, it) => acc + (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0), 0),
    [itens],
  )

  const addItem = () =>
    setItens((arr) => [
      ...arr,
      { descricao: "", marca: "", unidadeMedida: "un", quantidade: 1, valorUnitario: 0, linkRef: "", custoRef: undefined },
    ])

  const removeItem = (idx: number) => setItens((arr) => arr.filter((_, i) => i !== idx))

  const updateItem = (idx: number, patch: Partial<FormOrcamentoItem>) =>
    setItens((arr) => arr.map((it, i) => (i === idx ? { ...it, ...patch } : it)))

  const canSave =
    cliente.nome.trim().length > 0 &&
    itens.length > 0 &&
    itens.every((it) => it.descricao.trim().length > 0 && it.quantidade > 0 && it.valorUnitario >= 0)

  const onSalvar = async () => {
    if (!canSave) return
    try {
      console.log('🚀 [MODALIDADE DEBUG] Iniciando salvamento...');
      console.log('🚀 [MODALIDADE DEBUG] Estado atual da modalidade:', modalidade);
      console.log('🚀 [MODALIDADE DEBUG] Tipo da modalidade:', typeof modalidade);
      console.log('🚀 [MODALIDADE DEBUG] Número pregão:', numeroPregao);
      console.log('🚀 [MODALIDADE DEBUG] Número processo:', numeroProcesso);
      
      // Convert FormOrcamentoItem format to match backend API expectations
      const backendItens = itens.map(item => ({
        id: generateId(),
        item_id: "", // Generic item identifier
        descricao: item.descricao,
        marca: item.marca || "",
        unidade_medida: item.unidadeMedida || "un",
        quantidade: item.quantidade,
        valor_unitario: item.valorUnitario, // API expects valor_unitario
        desconto: 0,
        observacoes: item.observacoes || "",
        link_ref: item.linkRef || null,
        custo_ref: item.custoRef || null
      }))
      
      console.log('🔍 [DEBUG] Itens convertidos para backend:', backendItens);
      
      // Generate numero if creating new orcamento
      const numero = orcamentoParaEdicao ? orcamentoParaEdicao.numero : await generateOrcamentoNumber()
      
      // Use cliente_id from selected client, or existing cliente.id, or generate new one
      let cliente_id = clienteIdSel || cliente.id
      if (!cliente_id) {
        // If no client selected and no existing ID, generate one for the manually entered client
        cliente_id = generateId()
      }
      
      // Garantir que data_validade sempre tenha um valor válido (30 dias a partir de hoje se não informado)
      const getValidDataValidade = () => {
        if (dataValidade && dataValidade.trim() !== '') {
          return dataValidade
        }
        // Se não informado, usar 30 dias a partir de hoje
        const dataDefault = new Date()
        dataDefault.setDate(dataDefault.getDate() + 30)
        return dataDefault.toISOString().split('T')[0]
      }
      
      const dadosParaSalvar = orcamentoParaEdicao ? {
        id: orcamentoParaEdicao.id,
        numero: orcamentoParaEdicao.numero,
        cliente_id: cliente_id,
        data_orcamento: orcamentoParaEdicao.data,
        data_validade: getValidDataValidade(),
        observacoes,
        modalidade,
        numero_pregao: modalidade === "LICITADO" && numeroPregao ? `${numeroPregao}/${new Date().getFullYear()}` : null,
        numero_dispensa: modalidade === "DISPENSA" && numeroDispensa ? `${numeroDispensa}/${new Date().getFullYear()}` : null,
        numero_processo: numeroProcesso || null,
        itens: backendItens
      } : { 
        numero: numero, // Enviar o número completo no formato "número/ano"
        cliente_id: cliente_id,
        data_orcamento: new Date().toISOString(),
        data_validade: getValidDataValidade(),
        observacoes,
        modalidade,
        numero_pregao: modalidade === "LICITADO" && numeroPregao ? `${numeroPregao}/${new Date().getFullYear()}` : null,
        numero_dispensa: modalidade === "DISPENSA" && numeroDispensa ? `${numeroDispensa}/${new Date().getFullYear()}` : null,
        numero_processo: numeroProcesso || null,
        itens: backendItens
      }
      
      console.log('📤 [MODALIDADE DEBUG] Dados completos sendo enviados:', JSON.stringify(dadosParaSalvar, null, 2));
      console.log('📤 [MODALIDADE DEBUG] Modalidade no payload:', dadosParaSalvar.modalidade);
      
      const result = await saveOrcamento(dadosParaSalvar)
      
      console.log('📥 [MODALIDADE DEBUG] Resposta completa da API:', JSON.stringify(result, null, 2));
      console.log('📥 [MODALIDADE DEBUG] Modalidade na resposta:', result?.modalidade);
      

      
      if (result) {
        if (!orcamentoParaEdicao) {
          // Só limpa o formulário se não estiver editando
          setCliente({ nome: "" })
          setClienteIdSel("")
          setObservacoes("")
          setDataValidade("")
          setItens([{ descricao: "", marca: "", unidadeMedida: "un", quantidade: 1, valorUnitario: 0, linkRef: "", custoRef: undefined }])
          clearDraft() // Limpa o rascunho após salvar com sucesso
        }
        
        const mensagem = orcamentoParaEdicao ? "Orçamento atualizado!" : "Orçamento salvo!"
        const descricao = orcamentoParaEdicao ? "As alterações foram salvas." : "Confira em 'Orçamentos Salvos'."
        toast({ title: mensagem, description: descricao })
        
        // Dispatch event to notify other components
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("erp-changed"))
        }
        
        // Chama callback se fornecido
        onSalvoComSucesso?.()
      } else {
        throw new Error("Falha ao salvar orçamento")
      }
    } catch (e) {
      console.error("Erro ao salvar orçamento:", e)
      toast({ title: "Erro ao salvar orçamento", description: "Tente novamente.", variant: "destructive" })
    }
  }

  return (
    <div className={cn(
      "grid gap-8 transition-all duration-300",
      isMaximized ? "fixed inset-0 z-50 bg-gradient-to-br from-slate-50 to-blue-50/30 p-6 overflow-auto" : ""
    )}>
      {/* Botão de expandir/minimizar */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMaximized(!isMaximized)}
          className="mb-2 bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-white hover:shadow-md transition-all duration-200"
        >
          {isMaximized ? (
            <>
              <Minimize2 className="h-4 w-4 mr-2" />
              Minimizar
            </>
          ) : (
            <>
              <Maximize2 className="h-4 w-4 mr-2" />
              Expandir
            </>
          )}
        </Button>
      </div>
      {/* Selecionar cliente cadastrado */}
      <Card className="bg-gradient-to-br from-white to-slate-50/50 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 p-6">
          <div className="md:col-span-2 space-y-3">
            <Label className="text-sm font-medium text-slate-700">Selecionar cliente cadastrado</Label>
            <Select value={clienteIdSel} onValueChange={setClienteIdSel}>
              <SelectTrigger className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200">
                <SelectValue placeholder="Escolha um cliente" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {clientes.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    Nenhum cliente cadastrado
                  </SelectItem>
                ) : (
                  clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} {c.documento ? `— ${c.documento}` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 bg-blue-50 p-2 rounded-md border-l-4 border-blue-400">
              A lista vem da aba Clientes. Ao cadastrar/editar lá, aparece aqui automaticamente.
            </p>
          </div>

          <div className="space-y-3">
            <Label htmlFor="cliente-nome" className="text-sm font-medium text-slate-700">Nome</Label>
            <Input
              id="cliente-nome"
              placeholder="Ex.: ACME Ltda / João da Silva"
              value={cliente.nome}
              onChange={(e) => setCliente((c) => ({ ...c, nome: e.target.value }))}
              required
              className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="cliente-doc" className="text-sm font-medium text-slate-700">Documento (CNPJ/CPF)</Label>
            <Input
              id="cliente-doc"
              placeholder="00.000.000/0000-00"
              value={cliente.documento || ""}
              onChange={(e) => setCliente((c) => ({ ...c, documento: e.target.value }))}
              className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="cliente-tel" className="text-sm font-medium text-slate-700">Telefone</Label>
            <Input
              id="cliente-tel"
              placeholder="(11) 99999-9999"
              value={cliente.telefone || ""}
              onChange={(e) => setCliente((c) => ({ ...c, telefone: e.target.value }))}
              className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="cliente-email" className="text-sm font-medium text-slate-700">E-mail</Label>
            <Input
              id="cliente-email"
              type="email"
              placeholder="contato@cliente.com"
              value={cliente.email || ""}
              onChange={(e) => setCliente((c) => ({ ...c, email: e.target.value }))}
              className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>
          <div className="md:col-span-2 space-y-3">
            <Label htmlFor="cliente-endereco" className="text-sm font-medium text-slate-700">Endereço</Label>
            <Input
              id="cliente-endereco"
              placeholder="Rua, número, bairro, cidade - UF"
              value={cliente.endereco || ""}
              onChange={(e) => setCliente((c) => ({ ...c, endereco: e.target.value }))}
              className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Itens do orçamento */}
      <Card className="bg-gradient-to-br from-white to-emerald-50/30 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            Itens do Orçamento
          </CardTitle>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={addItem}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30 transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar item
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-6">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead className="w-[50px] text-center">#</TableHead>
                <TableHead className="min-w-[450px]">Item/Serviço</TableHead>
                <TableHead className="w-[90px]">Marca</TableHead>
                <TableHead className="w-[100px] text-center">Unidade</TableHead>
                <TableHead className="w-[100px] text-center">Qtd.</TableHead>
                <TableHead className="w-[120px] text-right">Valor Unit.</TableHead>
                <TableHead className="w-[120px] text-right">Total</TableHead>
                <TableHead className="w-[70px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((it, idx) => {
                const subtotal = (Number(it.quantidade) || 0) * (Number(it.valorUnitario) || 0)
                return (
                  <ItemRow
                    key={idx}
                    index={idx}
                    item={it}
                    subtotal={subtotal}
                    onChange={updateItem}
                    onRemove={removeItem}
                    unidadesMedida={unidadesMedida}
                  />
                )
              })}
            </TableBody>
          </Table>

          <div className="mt-8 flex items-center justify-end">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-xl shadow-lg">
              <div className="text-sm opacity-90">Total do Orçamento</div>
              <div className="text-3xl font-bold tabular-nums">{fmtCurrency(total)}</div>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Somente “Link ref.” e “Custo ref.” são privados e não aparecem no documento do cliente.
          </p>
        </CardContent>
      </Card>

      {/* Observações e ações */}
      <Card className="bg-gradient-to-br from-white to-amber-50/30 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              Observações
            </CardTitle>
            {hasDraft && (
              <div className="flex items-center text-xs text-white/80 bg-white/20 px-3 py-1 rounded-full">
                <Save className="h-3 w-3 mr-1" />
                Rascunho salvo automaticamente
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-3">
            <Label htmlFor="observacoes" className="text-sm font-medium text-slate-700">Observações</Label>
            <Input
              id="observacoes"
              placeholder="Condições de pagamento, validade do orçamento, etc."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="h-11 bg-white border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="data-validade" className="text-sm font-medium text-slate-700">Data de Validade</Label>
            <Input
              id="data-validade"
              type="date"
              value={dataValidade}
              onChange={(e) => setDataValidade(e.target.value)}
              className="h-11 bg-white border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
            />
            <p className="text-xs text-slate-500 bg-amber-50 p-2 rounded-md border-l-4 border-amber-400">
              Se não informada, será aplicada a validade padrão configurada no sistema
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modalidade de Compra */}
      <Card className="bg-gradient-to-br from-white to-purple-50/30 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-t-lg">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            Modalidade de Compra
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2 p-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">Modalidade</Label>
            <Select value={modalidade} onValueChange={(value: string) => {
              console.log('🔄 [MODALIDADE DEBUG] Mudança de modalidade:', value);
              console.log('🔄 [MODALIDADE DEBUG] Modalidade anterior:', modalidade);
              setModalidade(value);
              console.log('🔄 [MODALIDADE DEBUG] Nova modalidade definida:', value);
            }}>
              <SelectTrigger className="h-11 bg-white border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {modalidades.map((mod) => (
                  <SelectItem key={mod.id} value={mod.codigo}>
                    {mod.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(() => {
            const modalidadeSelecionada = modalidades.find(mod => mod.codigo === modalidade)
            return modalidadeSelecionada && Boolean(modalidadeSelecionada.requer_numero_processo) && (
              <div className="space-y-3">
                <Label htmlFor="numero-processo" className="text-sm font-medium text-slate-700">
                  {modalidade === "LICITADO" ? "Número do Pregão (opcional)" : "Número do Processo (opcional)"}
                </Label>
                <Input
                  id="numero-processo"
                  placeholder={modalidade === "LICITADO" ? "Ex.: 87" : "Ex.: 82947"}
                  value={modalidade === "LICITADO" ? numeroPregao : modalidade === "DISPENSA" ? numeroDispensa : numeroProcesso}
                  onChange={(e) => {
                    if (modalidade === "LICITADO") {
                      setNumeroPregao(e.target.value)
                    } else if (modalidade === "DISPENSA") {
                      setNumeroDispensa(e.target.value)
                    } else {
                      setNumeroProcesso(e.target.value)
                    }
                  }}
                  className="h-11 bg-white border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                />
                <p className="text-xs text-slate-500 bg-purple-50 p-2 rounded-md border-l-4 border-purple-400">O ano será adicionado automaticamente</p>
              </div>
            )
          })()}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-4 p-6 bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-xl border border-slate-200">
        <Button 
          onClick={onSalvar} 
          disabled={!canSave}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 h-auto"
        >
          {orcamentoParaEdicao ? "Atualizar Orçamento" : "Salvar Orçamento"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            saveDraft()
            toast({ title: "Rascunho salvo!", description: "Seus dados foram salvos localmente." })
          }}
          className="bg-white hover:bg-slate-50 border-slate-300 hover:border-slate-400 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-3 h-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          Salvar Rascunho
        </Button>
        {hasDraft && (
          <Button
            type="button"
            variant="outline"
            onClick={loadDraft}
            className="bg-white hover:bg-emerald-50 border-emerald-300 hover:border-emerald-400 text-emerald-700 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-3 h-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Carregar Rascunho
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setCliente({ nome: "" })
            setClienteIdSel("")
            setObservacoes("")
            setDataValidade("")
            setModalidade("COMPRA_DIRETA")
            setNumeroPregao("")
            setNumeroDispensa("")
            setNumeroProcesso("")
            setItens([{ descricao: "", marca: "", unidadeMedida: "un", quantidade: 1, valorUnitario: 0, linkRef: "", custoRef: undefined }])
            clearDraft()
          }}
          className="bg-white hover:bg-red-50 border-red-300 hover:border-red-400 text-red-700 shadow-md hover:shadow-lg transition-all duration-200 px-6 py-3 h-auto"
        >
          Limpar
        </Button>
      </div>
    </div>
  )
}

function ItemRow({
  index,
  item,
  subtotal,
  onChange,
  onRemove,
  unidadesMedida,
}: {
  index: number
  item: FormOrcamentoItem
  subtotal: number
  onChange: (idx: number, patch: Partial<FormOrcamentoItem>) => void
  onRemove: (idx: number) => void
  unidadesMedida: {id: number, codigo: string, descricao: string, ativo: boolean}[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <TableRow className={cn(open && "align-top")}>
      <TableCell className="align-top text-center font-medium text-blue-800">
        {index + 1}
      </TableCell>
      <TableCell className="align-top">
        <div className="space-y-3">
          <Input
            placeholder="Ex.: Velas aromáticas"
            value={item.descricao}
            onChange={(e) => onChange(index, { descricao: e.target.value })}
            className="h-11 bg-white border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
          />

          <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-3 shadow-sm">
            <button
              type="button"
              className="flex w-full items-center justify-between text-sm"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls={`privado-${index}`}
            >
              <span className="inline-flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Detalhes internos</span>
                <span className="text-xs text-muted-foreground">(não sai no documento)</span>
              </span>
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {open && (
              <div id={`privado-${index}`} className="mt-3 space-y-3">
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Link ref. (privado)</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://loja.com/item"
                          value={item.linkRef || ""}
                          onChange={(e) => onChange(index, { linkRef: e.target.value })}
                        />
                        {item.linkRef ? (
                          <a
                            href={item.linkRef.startsWith('http://') || item.linkRef.startsWith('https://') ? item.linkRef : `https://${item.linkRef}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-md border text-muted-foreground hover:bg-accent"
                            title="Abrir link de referência"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Custo ref. (privado)</Label>
                      <CurrencyInput
                        placeholder="0,00"
                        value={item.custoRef ?? ""}
                        onChange={(value) =>
                          onChange(index, { custoRef: value === "" ? undefined : Number(value.replace(',', '.')) })
                        }
                        allowNegative={false}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Informações calculadas */}
                {(item.custoRef !== undefined && item.custoRef !== null) && item.valorUnitario > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-medium">Custo sobre Valor Unitário</Label>
                        <div className="text-sm font-medium text-muted-foreground bg-slate-50 p-3 rounded border border-slate-200">
                          <span className="block break-words">
                            {item.valorUnitario > 0 ? ((item.custoRef / item.valorUnitario) * 100).toFixed(1) : '0'}% do valor de venda
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-medium">Margem de Lucro</Label>
                        <div className={`text-sm font-bold p-3 rounded border ${
                          item.valorUnitario > item.custoRef ? 'text-green-700 bg-green-50 border-green-200' : 
                          item.valorUnitario < item.custoRef ? 'text-red-700 bg-red-50 border-red-200' : 'text-gray-700 bg-gray-50 border-gray-200'
                        }`}>
                          <span className="block break-words">
                            {item.valorUnitario > 0 
                              ? `${(((item.valorUnitario - item.custoRef) / item.valorUnitario) * 100).toFixed(1)}%`
                              : '0%'
                            }
                            {item.valorUnitario < item.custoRef && ' (Prejuízo)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </TableCell>

      <TableCell className="align-top">
        <Input
          placeholder="Ex.: Marca X"
          value={item.marca || ""}
          onChange={(e) => onChange(index, { marca: e.target.value })}
          className="h-10 bg-white border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
        />
      </TableCell>

      <TableCell className="align-top text-center">
        <Select value={item.unidadeMedida} onValueChange={(value) => onChange(index, { unidadeMedida: value })}>
          <SelectTrigger className="h-10 bg-white border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {unidadesMedida.map((unidade) => (
              <SelectItem key={unidade.id} value={unidade.codigo}>
                {unidade.codigo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>

      <TableCell className="align-top text-center">
        <Input
          type="number"
          min={0}
          step="1"
          value={item.quantidade}
          onChange={(e) => onChange(index, { quantidade: Number(e.target.value) })}
          className="h-10 bg-white border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 text-center"
        />
      </TableCell>

      <TableCell className="align-top text-right">
        <CurrencyInput
          value={item.valorUnitario}
          onChange={(value) => onChange(index, { valorUnitario: Number(value.replace(',', '.')) })}
          placeholder="0,00"
          className="h-10 bg-white border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 text-right"
          allowNegative={false}
        />
      </TableCell>

      <TableCell className="align-top text-right font-semibold text-emerald-700 bg-emerald-50 rounded-md">{fmtCurrency(subtotal)}</TableCell>

      <TableCell className="align-top text-right">
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label="Remover item" 
          onClick={() => onRemove(index)} 
          disabled={false}
          className="hover:bg-red-100 hover:text-red-600 transition-all duration-200"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  )
}

export default OrcamentoForm
