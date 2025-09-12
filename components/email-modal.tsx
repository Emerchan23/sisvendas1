"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Mail, Send } from "lucide-react"
import { makeOrcamentoHTML, generatePDFBlob } from "@/lib/print"
import { getConfig } from "@/lib/config"
// Removed empresa imports - system simplified

interface EmailModalProps {
  orcamento: any
  onEmailSent?: () => void
}

export function EmailModal({ orcamento, onEmailSent }: EmailModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
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
      to: "",
      subject: `Orçamento #${orcamento.numero} - ${orcamento.cliente?.nome || 'Cliente'}`,
      message: message
    }
  })
  const { toast } = useToast()

  const handleSendEmail = async () => {
    // Validar email do destinatário
    if (!formData.to.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, informe o e-mail do destinatário",
        variant: "destructive"
      })
      return
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.to.trim())) {
      toast({
        title: "Erro",
        description: "Por favor, informe um e-mail válido",
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
          to: formData.to,
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
      
      toast({
        title: "Sucesso",
        description: "E-mail enviado com sucesso!"
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
            <Label htmlFor="email-to">Destinatário</Label>
            <Input
              id="email-to"
              type="email"
              placeholder="cliente@email.com"
              value={formData.to}
              onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
            />
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
    </Dialog>
  )
}