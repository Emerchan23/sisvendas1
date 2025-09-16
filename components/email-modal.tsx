"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Mail, Send, Plus, X, Users, Search } from "lucide-react"
import { makeOrcamentoHTML, generatePDFBlob } from "@/lib/print"
import { getConfig } from "@/lib/config"
import { getClientes, type Cliente } from "@/lib/api-client"
// Removed empresa imports - system simplified

interface EmailModalProps {
  orcamento: any
  onEmailSent?: () => void
}

export function EmailModal({ orcamento, onEmailSent }: EmailModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState("orcamento")
  const [recipients, setRecipients] = useState<string[]>([""])
  const [clientesModalOpen, setClientesModalOpen] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clientesComEmail, setClientesComEmail] = useState<Cliente[]>([])
  const [searchCliente, setSearchCliente] = useState("")
  const [selectedClientes, setSelectedClientes] = useState<string[]>([])
  const [loadingClientes, setLoadingClientes] = useState(false)
  // Função para obter o nome da modalidade
  const getModalidadeNome = async (codigo: string) => {
    try {
      const response = await fetch('/api/modalidades-compra')
      if (response.ok) {
        const modalidades = await response.json()
        const modalidade = modalidades.find((m: any) => m.codigo === codigo)
        return modalidade?.nome || codigo
      }
    } catch (error) {
      console.error('Erro ao buscar modalidade:', error)
    }
    return codigo
  }

  // Função para construir o assunto do e-mail
  const buildEmailSubject = async () => {
    let subject = `Orçamento #${orcamento.numero}`
    
    // Adicionar modalidade se disponível
    if (orcamento.modalidade) {
      const modalidadeNome = await getModalidadeNome(orcamento.modalidade)
      subject += ` - ${modalidadeNome}`
    }
    
    // Adicionar número do processo se disponível
    const numeroProcesso = orcamento.numero_processo || orcamento.numero_pregao || orcamento.numero_dispensa
    if (numeroProcesso) {
      subject += ` - Processo ${numeroProcesso}`
    }
    
    // Adicionar nome do cliente
    if (orcamento.cliente?.nome) {
      subject += ` - ${orcamento.cliente.nome}`
    }
    
    return subject
  }

  const [formData, setFormData] = useState(() => {
    const config = getConfig()
    const defaultTemplate = config.emailTemplateOrcamento || `Prezado(a) {cliente},\n\nSegue em anexo o orçamento #{numero} solicitado.\n\nAtenciosamente,\nEquipe de Vendas`
    
    // Substituir variáveis no template
    const message = defaultTemplate
      .replace(/{cliente}/g, orcamento.cliente?.nome || 'Cliente')
      .replace(/{numero}/g, orcamento.numero)
      .replace(/{data}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/{total}/g, new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        orcamento.itens?.reduce((acc: number, it: any) => 
          acc + (Number(it.quantidade) || 0) * (Number(it.valor_unitario) || 0) - (Number(it.desconto) || 0), 0) || 0
      ))
    
    return {
      subject: `Orçamento #${orcamento.numero} - ${orcamento.cliente?.nome || 'Cliente'}`,
      message: message
    }
  })
  const { toast } = useToast()

  // Carregar clientes quando o modal de clientes for aberto
  useEffect(() => {
    if (clientesModalOpen && clientes.length === 0) {
      loadClientes()
    }
  }, [clientesModalOpen])

  // Atualizar assunto do e-mail quando o modal for aberto
  useEffect(() => {
    if (open) {
      buildEmailSubject().then(subject => {
        setFormData(prev => ({ ...prev, subject }))
      })
    }
  }, [open, orcamento.modalidade, orcamento.numero_processo, orcamento.numero_pregao, orcamento.numero_dispensa])

  // Filtrar clientes com email
  useEffect(() => {
    const clientesFiltrados = clientes
      .filter(cliente => cliente.email && cliente.email.trim() !== "")
      .filter(cliente => 
        searchCliente === "" || 
        cliente.nome.toLowerCase().includes(searchCliente.toLowerCase()) ||
        cliente.email?.toLowerCase().includes(searchCliente.toLowerCase())
      )
    setClientesComEmail(clientesFiltrados)
  }, [clientes, searchCliente])

  // Função para carregar clientes
  const loadClientes = async () => {
    setLoadingClientes(true)
    try {
      const clientesData = await getClientes()
      setClientes(clientesData)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar lista de clientes",
        variant: "destructive"
      })
    } finally {
      setLoadingClientes(false)
    }
  }

  // Função para alternar seleção de cliente
  const toggleClienteSelection = (clienteId: string) => {
    setSelectedClientes(prev => 
      prev.includes(clienteId)
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId]
    )
  }

  // Função para adicionar emails dos clientes selecionados
  const addSelectedClientesEmails = () => {
    const emailsToAdd = clientes
      .filter(cliente => selectedClientes.includes(cliente.id))
      .map(cliente => cliente.email!)
      .filter(email => email && email.trim() !== "")
    
    if (emailsToAdd.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhum cliente com email válido foi selecionado",
        variant: "destructive"
      })
      return
    }

    // Adicionar emails aos destinatários existentes
    setRecipients(prev => {
      const existingEmails = prev.filter(email => email.trim() !== "")
      const newEmails = emailsToAdd.filter(email => !existingEmails.includes(email))
      const allEmails = [...existingEmails, ...newEmails]
      
      // Se não há emails existentes, substituir o primeiro campo vazio
      if (existingEmails.length === 0 && prev.length === 1 && prev[0] === "") {
        return allEmails.length > 0 ? allEmails : [""]
      }
      
      return allEmails.length > 0 ? allEmails : [""]
    })

    // Limpar seleção e fechar modal
    setSelectedClientes([])
    setSearchCliente("")
    setClientesModalOpen(false)

    toast({
      title: "Sucesso",
      description: `${emailsToAdd.length} email(s) adicionado(s) aos destinatários`
    })
  }

  // Função para aplicar template selecionado
  const applyTemplate = (templateType: string) => {
    const config = getConfig()
    let template = ""
    
    switch (templateType) {
      case "orcamento":
        template = config.emailTemplateOrcamento || `Prezado(a) {cliente},\n\nSegue em anexo o orçamento #{numero} solicitado.\n\nAtenciosamente,\nEquipe de Vendas`
        break
      case "vale":
        template = config.emailTemplateVale || `Prezado(a) {cliente},\n\nSegue em anexo o vale solicitado.\n\nAtenciosamente,\nEquipe de Vendas`
        break
      case "relatorio":
        template = config.emailTemplateRelatorio || `Prezado(a),\n\nSegue em anexo o relatório solicitado.\n\nAtenciosamente,\nEquipe de Vendas`
        break
      default:
        template = `Prezado(a) {cliente},\n\nSegue em anexo o documento solicitado.\n\nAtenciosamente,\nEquipe de Vendas`
    }
    
    // Substituir variáveis no template
    const message = template
      .replace(/{cliente}/g, orcamento.cliente?.nome || 'Cliente')
      .replace(/{numero}/g, orcamento.numero)
      .replace(/{data}/g, new Date().toLocaleDateString('pt-BR'))
      .replace(/{total}/g, new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        orcamento.itens?.reduce((acc: number, it: any) => 
          acc + (Number(it.quantidade) || 0) * (Number(it.valor_unitario) || 0) - (Number(it.desconto) || 0), 0) || 0
      ))
    
    setFormData(prev => ({ ...prev, message }))
  }

  // Função para adicionar destinatário
  const addRecipient = () => {
    setRecipients(prev => [...prev, ""])
  }

  // Função para remover destinatário
  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(prev => prev.filter((_, i) => i !== index))
    }
  }

  // Função para atualizar destinatário
  const updateRecipient = (index: number, value: string) => {
    setRecipients(prev => prev.map((email, i) => i === index ? value : email))
  }

  const handleSendEmail = async () => {
    // Validar destinatários
    const validRecipients = recipients.filter(email => email.trim() !== "")
    
    if (validRecipients.length === 0) {
      toast({
        title: "Erro",
        description: "Por favor, informe pelo menos um e-mail de destinatário",
        variant: "destructive"
      })
      return
    }

    // Validar formato dos emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = validRecipients.filter(email => !emailRegex.test(email.trim()))
    
    if (invalidEmails.length > 0) {
      toast({
        title: "Erro",
        description: `E-mails inválidos: ${invalidEmails.join(", ")}`,
        variant: "destructive"
      })
      return
    }

    // Validar assunto
    if (!formData.subject.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o assunto do e-mail",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // System simplified - no empresa validation needed
      
      // Gerar HTML do orçamento
      const withTotal = { ...orcamento, total: orcamento.itens?.reduce((acc: number, it: any) => 
        acc + (Number(it.quantidade) || 0) * (Number(it.valor_unitario) || 0) - (Number(it.desconto) || 0), 0) || 0 }
      const orcamentoHTML = await makeOrcamentoHTML(withTotal)
      
      // Gerar PDF como blob para anexo
      console.log('📄 Gerando PDF do orçamento...')
      const pdfBlob = await generatePDFBlob(orcamentoHTML, `Orcamento_${orcamento.numero}`)
      
      // Converter blob para base64 para envio
      const pdfBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1]
          resolve(base64)
        }
        reader.readAsDataURL(pdfBlob)
      })
      
      // Criar HTML simples do e-mail (sem o orçamento incorporado)
      const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin: 0;">Orçamento #${orcamento.numero}</h2>
            <p style="color: #666; margin: 10px 0 0 0;">Cliente: ${orcamento.cliente?.nome || 'N/A'}</p>
          </div>
          
          <div style="background-color: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #333; line-height: 1.6; white-space: pre-line;">${formData.message}</p>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
            <h3 style="color: #1976d2; margin: 0 0 10px 0;">📎 Orçamento Anexado</h3>
            <p style="color: #666; margin: 0;">O orçamento completo está anexado a este e-mail em formato PDF.</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
            <p style="color: #666; font-size: 12px; margin: 0;">Este e-mail foi enviado automaticamente pelo sistema de orçamentos.</p>
          </div>
        </div>
      `
      
      // Preparar anexo PDF
      const attachments = [{
        filename: `Orcamento_${orcamento.numero}.pdf`,
        content: pdfBase64,
        encoding: 'base64',
        contentType: 'application/pdf'
      }]
      
      // Enviar e-mail via API com anexo PDF
      console.log('📧 Enviando e-mail com anexo PDF...')
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: validRecipients.join(", "),
          subject: formData.subject,
          html: emailHTML,
          attachments: attachments
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        // Tratar diferentes tipos de erro com base no status
        if (response.status === 400) {
          // Erro de configuração ou validação
          throw new Error(result.error || 'Erro de configuração')
        } else if (response.status === 500) {
          // Erro interno do servidor (SMTP, conectividade, etc.)
          throw new Error(result.error || 'Erro interno do servidor ao enviar e-mail')
        } else {
          throw new Error(result.error || 'Erro ao enviar e-mail')
        }
      }
      
      // Verificar se houve destinatários rejeitados
      const responseData = await response.json()
      let successMessage = "E-mail enviado com sucesso!"
      
      if (responseData.details?.rejected && responseData.details.rejected.length > 0) {
        successMessage += `\n\n⚠️ Alguns destinatários foram rejeitados: ${responseData.details.rejected.join(', ')}`
      }
      
      if (responseData.details?.accepted && responseData.details.accepted.length > 0) {
        successMessage += `\n\n✅ Enviado para: ${responseData.details.accepted.join(', ')}`
      }
      
      toast({
        title: "Sucesso",
        description: successMessage,
        duration: 6000
      })
      
      setOpen(false)
      onEmailSent?.()
      
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error)
      
      let errorMessage = "Erro ao enviar e-mail"
      
      if (error instanceof Error) {
        if (error.message.includes('Configurações SMTP incompletas')) {
          errorMessage = "⚠️ Configurações de e-mail não encontradas.\n\nPara enviar e-mails, configure:\n• Servidor SMTP (host)\n• Usuário e senha\n• E-mail remetente\n\nAcesse: Configurações → Empresa"
        } else if (error.message.includes('Empresa não encontrada')) {
          errorMessage = "❌ Empresa não configurada.\n\nConfigure uma empresa primeiro nas Configurações."
        } else if (error.message.includes('Erro de autenticação SMTP')) {
          errorMessage = "🔐 Falha na autenticação do e-mail.\n\nVerifique usuário e senha SMTP nas configurações da empresa."
        } else if (error.message.includes('Não foi possível conectar ao servidor SMTP')) {
          errorMessage = "🌐 Não foi possível conectar ao servidor de e-mail.\n\nVerifique:\n• Host SMTP\n• Porta (geralmente 587 ou 465)\n• Conexão com a internet"
        } else if (error.message.includes('Timeout na conexão SMTP')) {
          errorMessage = "⏱️ Timeout na conexão com o servidor de e-mail.\n\nVerifique sua conexão com a internet e as configurações SMTP."
        } else if (error.message.includes('Login inválido')) {
          errorMessage = "🚫 Login inválido.\n\nVerifique as credenciais SMTP (usuário e senha) nas configurações."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          title="Enviar por e-mail"
        >
          <Mail className="h-4 w-4" />
          <span className="sr-only">Enviar por e-mail</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Orçamento por E-mail</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para enviar o orçamento por e-mail para o cliente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="template-select">Template de E-mail</Label>
            <Select value={selectedTemplate} onValueChange={(value) => {
              setSelectedTemplate(value)
              applyTemplate(value)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orcamento">Template para Orçamentos</SelectItem>
                <SelectItem value="vale">Template para Vales</SelectItem>
                <SelectItem value="relatorio">Template para Relatórios</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Destinatários</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setClientesModalOpen(true)}
                  className="h-8 px-2"
                >
                  <Users className="h-3 w-3 mr-1" />
                  Buscar Clientes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRecipient}
                  className="h-8 px-2"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {recipients.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="cliente@email.com"
                    value={email}
                    onChange={(e) => updateRecipient(index, e.target.value)}
                    className="flex-1"
                  />
                  {recipients.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRecipient(index)}
                      className="h-10 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email-subject">Assunto</Label>
            <Input
              id="email-subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email-message">Mensagem</Label>
            <Textarea
              id="email-message"
              rows={4}
              placeholder="Digite sua mensagem..."
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSendEmail} disabled={loading}>
              {loading ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar E-mail
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Modal de Seleção de Clientes */}
      <Dialog open={clientesModalOpen} onOpenChange={setClientesModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Selecionar Clientes</DialogTitle>
            <DialogDescription>
              Selecione os clientes que possuem email cadastrado para adicionar aos destinatários.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Campo de busca */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchCliente}
                  onChange={(e) => setSearchCliente(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Lista de clientes */}
            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              {loadingClientes ? (
                <div className="p-4 text-center text-gray-500">
                  Carregando clientes...
                </div>
              ) : clientesComEmail.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchCliente ? "Nenhum cliente encontrado" : "Nenhum cliente com email cadastrado"}
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {clientesComEmail.map((cliente) => (
                    <div
                      key={cliente.id}
                      className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => toggleClienteSelection(cliente.id)}
                    >
                      <Checkbox
                        checked={selectedClientes.includes(cliente.id)}
                        onChange={() => toggleClienteSelection(cliente.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{cliente.nome}</p>
                        <p className="text-xs text-gray-500 truncate">{cliente.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Contador de selecionados */}
            {selectedClientes.length > 0 && (
              <div className="text-sm text-gray-600">
                {selectedClientes.length} cliente(s) selecionado(s)
              </div>
            )}
            
            {/* Botões de ação */}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setClientesModalOpen(false)
                  setSelectedClientes([])
                  setSearchCliente("")
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={addSelectedClientesEmails}
                disabled={selectedClientes.length === 0}
              >
                Adicionar {selectedClientes.length > 0 ? `(${selectedClientes.length})` : ""}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}