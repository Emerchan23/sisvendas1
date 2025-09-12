"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CurrencyInput } from "@/components/ui/currency-input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  ERP_CHANGED_EVENT,
  getBackup,
  restoreBackup,
} from "@/lib/data-store"
import { getConfig, saveConfig, loadConfig, type Config } from "@/lib/config"
import { formatCNPJ, formatPhone, unformatCNPJ, unformatPhone } from "@/lib/masks"
import { OrcamentoPreview } from "@/components/orcamento-preview"
import DocumentPreview from '@/components/document-preview';
import { AlertTriangle } from "lucide-react"
import { UsuariosManagement } from "@/components/UsuariosManagement"

export default function ConfiguracoesPage() {
  const [formData, setFormData] = useState<Partial<Config>>({})
  const [smtpConfig, setSmtpConfig] = useState({
    host: "",
    port: 587,
    secure: false,
    user: "",
    password: "",
    fromName: "",
    fromEmail: ""
  })

  // Estado de loading para teste de email
  const [testingEmail, setTestingEmail] = useState(false)
  
  // Templates de e-mail
  const [emailTemplates, setEmailTemplates] = useState({
    orcamento: "Prezado(a) cliente,\n\nSegue em anexo o orçamento solicitado.\n\nAtenciosamente,\n{nomeEmpresa}",
    vale: "Prezado(a),\n\nSegue em anexo o vale solicitado.\n\nAtenciosamente,\n{nomeEmpresa}",
    relatorio: "Prezado(a),\n\nSegue em anexo o relatório solicitado.\n\nAtenciosamente,\n{nomeEmpresa}"
  })
  
  // Configurações de personalização
  const [personalizacaoConfig, setPersonalizacaoConfig] = useState({
    corPrimaria: "#3b82f6",
    corSecundaria: "#64748b",
    corTexto: "#1f2937",
    fonteTitulo: "Inter",
    fonteTexto: "Inter",
    tamanhoTitulo: 24,
    tamanhoTexto: 14,
    logoPersonalizada: "",
    validadeOrcamento: 30
  })

  // Backup
  const [mergeImport, setMergeImport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Configurações de backup
  const [backupConfig, setBackupConfig] = useState({
    autoBackupEnabled: false,
    backupFrequency: "every3days",
    backupTime: "02:00",
    keepLocalBackup: true,
    maxBackups: 7,
    lastBackup: null as string | null
  })
  
  const { toast } = useToast()



  const reload = async () => {
    try {
      const config = await loadConfig()
      setFormData({
        nome: config.nome || "Minha Empresa",
        razaoSocial: config.razaoSocial || "",
        cnpj: config.cnpj || "",
        endereco: config.endereco || "",
        email: config.email || "",
        telefone: config.telefone || "",
        logoUrl: config.logoUrl || "",
        nomeDoSistema: config.nomeDoSistema || "LP IND",
        impostoPadrao: config.impostoPadrao || 10,
        capitalPadrao: config.capitalPadrao || 15
      })
      
      // Carregar configurações SMTP
      setSmtpConfig({
        host: config.smtpHost || "",
        port: config.smtpPort || 587,
        secure: config.smtpSecure || false,
        user: config.smtpUser || "",
        password: config.smtpPassword || "",
        fromName: config.smtpFromName || "",
        fromEmail: config.smtpFromEmail || ""
      })

      // Carregar templates de e-mail
      setEmailTemplates({
        orcamento: config.emailTemplateOrcamento || "Prezado(a) cliente,\n\nSegue em anexo o orçamento solicitado.\n\nAtenciosamente,\n{nomeEmpresa}",
        vale: config.emailTemplateVale || "Prezado(a),\n\nSegue em anexo o vale solicitado.\n\nAtenciosamente,\n{nomeEmpresa}",
        relatorio: config.emailTemplateRelatorio || "Prezado(a),\n\nSegue em anexo o relatório solicitado.\n\nAtenciosamente,\n{nomeEmpresa}"
      })

      // Carregar configurações de personalização
      setPersonalizacaoConfig({
        corPrimaria: config.corPrimaria || "#3b82f6",
        corSecundaria: config.corSecundaria || "#64748b",
        corTexto: config.corTexto || "#1f2937",
        fonteTitulo: config.fonteTitulo || "Inter",
        fonteTexto: config.fonteTexto || "Inter",
        tamanhoTitulo: config.tamanhoTitulo || 24,
        tamanhoTexto: config.tamanhoTexto || 14,
        logoPersonalizada: config.logoPersonalizada || "",
        validadeOrcamento: config.validadeOrcamento || 30
      })

      // Carregar configurações de backup
      setBackupConfig({
        autoBackupEnabled: config.autoBackupEnabled || false,
        backupFrequency: config.backupFrequency || "every3days",
        backupTime: config.backupTime || "02:00",
        keepLocalBackup: config.keepLocalBackup !== undefined ? config.keepLocalBackup : true,
        maxBackups: config.maxBackups || 7,
        lastBackup: config.lastBackup || null
      })

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados. Verifique a conexão com o servidor.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    reload()
    const onChange = () => reload()
    window.addEventListener(ERP_CHANGED_EVENT, onChange as EventListener)
    window.addEventListener("storage", onChange)
    return () => {
      window.removeEventListener(ERP_CHANGED_EVENT, onChange as EventListener)
      window.removeEventListener("storage", onChange)
    }
  }, [])

  const handleSalvarGeral = async () => {
    try {
      // Salvar configurações gerais
      const configData = {
        nome: formData.nome,
        razaoSocial: formData.razaoSocial,
        cnpj: formData.cnpj,
        endereco: formData.endereco,
        email: formData.email,
        telefone: formData.telefone,
        logoUrl: formData.logoUrl,
        nomeDoSistema: formData.nomeDoSistema,
        impostoPadrao: formData.impostoPadrao,
        capitalPadrao: formData.capitalPadrao,
        ...smtpConfig,
        smtpHost: smtpConfig.host,
        smtpPort: smtpConfig.port,
        smtpSecure: smtpConfig.secure,
        smtpUser: smtpConfig.user,
        smtpPassword: smtpConfig.password,
        smtpFromName: smtpConfig.fromName,
        smtpFromEmail: smtpConfig.fromEmail
      }
      
      await saveConfig(configData)
      
      // Disparar evento para atualizar outros componentes
      window.dispatchEvent(new CustomEvent(ERP_CHANGED_EVENT, { detail: { key: "config" } }))
      
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso!",
      })
      
      await reload()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive",
      })
    }
  }

  const handleSalvarSmtp = async () => {
    try {
      const configData = {
        smtpHost: smtpConfig.host,
        smtpPort: smtpConfig.port,
        smtpSecure: smtpConfig.secure,
        smtpUser: smtpConfig.user,
        smtpPassword: smtpConfig.password,
        smtpFromName: smtpConfig.fromName,
        smtpFromEmail: smtpConfig.fromEmail
      }
      
      const currentConfig = getConfig()
      saveConfig({ ...currentConfig, ...configData })
      
      toast({
        title: "Sucesso",
        description: "Configurações SMTP salvas com sucesso!",
      })
    } catch (error) {
      console.error('Erro ao salvar SMTP:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações SMTP",
        variant: "destructive",
      })
    }
  }

  const handleSalvarPersonalizacao = async () => {
    try {
      const configData = {
        corPrimaria: personalizacaoConfig.corPrimaria,
        corSecundaria: personalizacaoConfig.corSecundaria,
        corTexto: personalizacaoConfig.corTexto,
        fonteTitulo: personalizacaoConfig.fonteTitulo,
        fonteTexto: personalizacaoConfig.fonteTexto,
        tamanhoTitulo: personalizacaoConfig.tamanhoTitulo,
        tamanhoTexto: personalizacaoConfig.tamanhoTexto,
        logoPersonalizada: personalizacaoConfig.logoPersonalizada,
        validadeOrcamento: personalizacaoConfig.validadeOrcamento || 30
      }
      
      const currentConfig = getConfig()
      saveConfig({ ...currentConfig, ...configData })
      
      toast({
        title: "Sucesso",
        description: "Configurações de personalização salvas com sucesso!",
      })
    } catch (error) {
      console.error('Erro ao salvar personalização:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de personalização",
        variant: "destructive",
      })
    }
  }

  const handleSalvarTemplates = async () => {
    try {
      const configData = {
        emailTemplateOrcamento: emailTemplates.orcamento,
        emailTemplateVale: emailTemplates.vale,
        emailTemplateRelatorio: emailTemplates.relatorio
      }
      
      const currentConfig = getConfig()
      saveConfig({ ...currentConfig, ...configData })
      
      toast({
        title: "Sucesso",
        description: "Templates de e-mail salvos com sucesso!",
      })
    } catch (error) {
      console.error('Erro ao salvar templates:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar templates de e-mail",
        variant: "destructive",
      })
    }
  }

  const handleTestarSmtp = async () => {
    try {
      setTestingEmail(true)
      
      // Primeiro salvar as configurações SMTP atuais
      await handleSalvarSmtp()
      
      // Mostrar toast de carregamento
      toast({
        title: "🔄 Testando conexão...",
        description: "Verificando comunicação com o servidor SMTP",
      })
      
      const response = await fetch('/api/email/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          empresaId: 1 // ID padrão da empresa
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Sucesso - mostrar informações detalhadas
        const details = result.details
        toast({
          title: "✅ Conexão SMTP Estabelecida!",
          description: `Servidor: ${details.server} | Tempo: ${details.connectionTime} | ${details.security}`,
        })
        
        // Log detalhado no console para o usuário técnico
        console.log('📧 Teste de Conexão SMTP - SUCESSO')
        console.log('📊 Detalhes da Conexão:')
        console.log(`   • Status: ${details.status}`)
        console.log(`   • Servidor: ${details.server}`)
        console.log(`   • Segurança: ${details.security}`)
        console.log(`   • Autenticação: ${details.authentication}`)
        console.log(`   • Tempo de Conexão: ${details.connectionTime}`)
        console.log(`   • Testado em: ${details.timestamp}`)
        
      } else {
        // Erro - mostrar informações detalhadas
        const errorMsg = result.error || "Erro ao testar conexão SMTP"
        const errorDetails = result.details || ""
        const troubleshooting = result.troubleshooting || []
        
        toast({
          title: "❌ Falha na Conexão SMTP",
          description: `${errorMsg}${errorDetails ? ` - ${errorDetails}` : ''}`,
          variant: "destructive",
        })
        
        // Log detalhado no console para diagnóstico
        console.error('📧 Teste de Conexão SMTP - FALHA')
        console.error(`❌ Erro: ${errorMsg}`)
        if (errorDetails) console.error(`📝 Detalhes: ${errorDetails}`)
        if (troubleshooting.length > 0) {
          console.error('🔧 Dicas para solução:')
          troubleshooting.forEach((tip: string, index: number) => {
            console.error(`   ${index + 1}. ${tip}`)
          })
        }
        if (result.timestamp) console.error(`⏰ Testado em: ${result.timestamp}`)
      }
    } catch (error) {
      console.error('❌ Erro crítico ao testar SMTP:', error)
      toast({
        title: "❌ Erro Crítico",
        description: "Falha na comunicação com o servidor. Verifique sua conexão.",
        variant: "destructive",
      })
    } finally {
      setTestingEmail(false)
    }
  }

  const handleExportarBackup = async () => {
    try {
      const response = await fetch('/api/backup/export')
      if (!response.ok) {
        throw new Error('Erro ao exportar backup')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Sucesso",
        description: "Backup exportado com sucesso!",
      })
    } catch (error) {
      console.error('Erro ao exportar backup:', error)
      toast({
        title: "Erro",
        description: "Erro ao exportar backup",
        variant: "destructive",
      })
    }
  }

  const handleImportarBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      // Ler o arquivo como texto
      const fileContent = await file.text()
      let backupData
      
      try {
        backupData = JSON.parse(fileContent)
      } catch (parseError) {
        console.error('Erro ao fazer parse do arquivo:', parseError)
        toast({
          title: "Erro",
          description: "Arquivo de backup inválido. Certifique-se de que é um arquivo JSON válido.",
          variant: "destructive",
        })
        return
      }
      
      const response = await fetch('/api/backup/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao importar backup')
      }
      
      toast({
        title: "Sucesso",
        description: "Backup importado com sucesso!",
      })
      
      // Recarregar a página após importar
      window.location.reload()
    } catch (error) {
      console.error('Erro ao importar backup:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao importar backup'
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }





  const handleSalvarBackupConfig = async () => {
    try {
      const configData = {
        autoBackupEnabled: backupConfig.autoBackupEnabled,
        backupFrequency: backupConfig.backupFrequency,
        backupTime: backupConfig.backupTime,
        keepLocalBackup: backupConfig.keepLocalBackup,
        maxBackups: backupConfig.maxBackups,
        lastBackup: backupConfig.lastBackup
      }
      
      const currentConfig = getConfig()
      saveConfig({ ...currentConfig, ...configData })
      
      toast({
        title: "Sucesso",
        description: "Configurações de backup salvas com sucesso!",
      })
    } catch (error) {
      console.error('Erro ao salvar configurações de backup:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de backup",
        variant: "destructive",
      })
    }
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        </div>

        <div className="text-sm text-muted-foreground">
          Sistema simplificado - Configurações gerais
        </div>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="personalizacao">Personalização</TabsTrigger>
            <TabsTrigger value="email">E-mail</TabsTrigger>
            <TabsTrigger value="backup">Backup</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-6">
            {/* Informações Gerais */}
            <Card>
              <CardHeader>
                <CardTitle>Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure as informações básicas do sistema.
                </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome da Empresa</Label>
                <Input
                  id="nome"
                  value={formData.nome || ""}
                  onChange={(e) =>
                    setFormData((s: Partial<Config>) => ({ ...s, nome: e.target.value }))
                  }
                  placeholder="Minha Empresa LTDA"
                />
              </div>
              <div>
                <Label htmlFor="nomeDoSistema">Nome do Sistema</Label>
                <Input
                  id="nomeDoSistema"
                  value={formData.nomeDoSistema || ""}
                  onChange={(e) => setFormData((s: Partial<Config>) => ({ ...s, nomeDoSistema: e.target.value }))}
                  placeholder="LP IND"
                />
              </div>
              <div>
                <Label htmlFor="razaoSocial">Razão Social</Label>
                <Input
                  id="razaoSocial"
                  value={formData.razaoSocial || ""}
                  onChange={(e) =>
                    setFormData((s: Partial<Config>) => ({ ...s, razaoSocial: e.target.value }))
                  }
                  placeholder="Minha Empresa LTDA"
                />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={formatCNPJ(formData.cnpj || '')}
                  onChange={(e) => {
                    const formatted = formatCNPJ(e.target.value)
                    setFormData((s: Partial<Config>) => ({ ...s, cnpj: unformatCNPJ(formatted) }))
                  }}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
              </div>
              <div>
                <Label htmlFor="logoUrl">URL do Logo</Label>
                <Input
                  id="logoUrl"
                  value={formData.logoUrl || ""}
                  onChange={(e) => setFormData((s: Partial<Config>) => ({ ...s, logoUrl: e.target.value }))}
                  placeholder="https://exemplo.com/logo.png"
                />
              </div>
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco || ""}
                  onChange={(e) => setFormData((s: Partial<Config>) => ({ ...s, endereco: e.target.value }))}
                  placeholder="Rua, Número, Bairro, Cidade - UF"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData((s: Partial<Config>) => ({ ...s, email: e.target.value }))}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formatPhone(formData.telefone || '')}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value)
                    setFormData((s: Partial<Config>) => ({ ...s, telefone: unformatPhone(formatted) }))
                  }}
                  placeholder="(11) 99999-9999"
                  maxLength={15}
                />
              </div>
            </div>
                <Button onClick={handleSalvarGeral} className="w-full">
                  Salvar Configurações Gerais
                </Button>
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="personalizacao" className="space-y-6">
            {/* Configurações de Personalização */}
            <Card>
              <CardHeader>
                <CardTitle>Personalização de Documentos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Personalize as cores, fontes e estilos dos documentos gerados (orçamentos, vales, etc.).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="corPrimaria">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="corPrimaria"
                        type="color"
                        value={personalizacaoConfig.corPrimaria}
                        onChange={(e) => setPersonalizacaoConfig(s => ({ ...s, corPrimaria: e.target.value }))}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={personalizacaoConfig.corPrimaria}
                        onChange={(e) => setPersonalizacaoConfig(s => ({ ...s, corPrimaria: e.target.value }))}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="corSecundaria">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="corSecundaria"
                        type="color"
                        value={personalizacaoConfig.corSecundaria}
                        onChange={(e) => setPersonalizacaoConfig(s => ({ ...s, corSecundaria: e.target.value }))}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={personalizacaoConfig.corSecundaria}
                        onChange={(e) => setPersonalizacaoConfig(s => ({ ...s, corSecundaria: e.target.value }))}
                        placeholder="#64748b"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="corTexto">Cor do Texto</Label>
                    <div className="flex gap-2">
                      <Input
                        id="corTexto"
                        type="color"
                        value={personalizacaoConfig.corTexto}
                        onChange={(e) => setPersonalizacaoConfig(s => ({ ...s, corTexto: e.target.value }))}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={personalizacaoConfig.corTexto}
                        onChange={(e) => setPersonalizacaoConfig(s => ({ ...s, corTexto: e.target.value }))}
                        placeholder="#1f2937"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="fonteTitulo">Fonte dos Títulos</Label>
                    <Select value={personalizacaoConfig.fonteTitulo} onValueChange={(value) => setPersonalizacaoConfig(s => ({ ...s, fonteTitulo: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a fonte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="fonteTexto">Fonte do Texto</Label>
                    <Select value={personalizacaoConfig.fonteTexto} onValueChange={(value) => setPersonalizacaoConfig(s => ({ ...s, fonteTexto: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a fonte" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tamanhoTitulo">Tamanho dos Títulos (px)</Label>
                    <Input
                      id="tamanhoTitulo"
                      type="number"
                      value={personalizacaoConfig.tamanhoTitulo}
                      onChange={(e) => setPersonalizacaoConfig(s => ({ ...s, tamanhoTitulo: parseInt(e.target.value) || 24 }))}
                      placeholder="24"
                      min="12"
                      max="48"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tamanhoTexto">Tamanho do Texto (px)</Label>
                    <Input
                      id="tamanhoTexto"
                      type="number"
                      value={personalizacaoConfig.tamanhoTexto}
                      onChange={(e) => setPersonalizacaoConfig(s => ({ ...s, tamanhoTexto: parseInt(e.target.value) || 14 }))}
                      placeholder="14"
                      min="10"
                      max="24"
                    />
                  </div>
                  <div>
                    <Label htmlFor="logoPersonalizada">Logo Personalizada (URL)</Label>
                    <Input
                      id="logoPersonalizada"
                      value={personalizacaoConfig.logoPersonalizada}
                      onChange={(e) => setPersonalizacaoConfig(s => ({ ...s, logoPersonalizada: e.target.value }))}
                      placeholder="https://exemplo.com/logo-personalizada.png"
                    />
                  </div>
                  <div>
                    <Label htmlFor="validadeOrcamento">Validade do Orçamento (dias)</Label>
                    <Input
                      id="validadeOrcamento"
                      type="number"
                      min="1"
                      max="365"
                      value={personalizacaoConfig.validadeOrcamento || 30}
                      onChange={(e) => setPersonalizacaoConfig(s => ({ ...s, validadeOrcamento: parseInt(e.target.value) || 30 }))}
                      placeholder="30"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Número de dias que o orçamento permanece válido
                    </p>
                  </div>
                </div>
                <Button onClick={handleSalvarPersonalizacao} className="w-full">
                  Salvar Configurações de Personalização
                </Button>
              </CardContent>
            </Card>
            
            {/* Preview dos Documentos */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Preview dos Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <DocumentPreview 
                  layoutConfig={{
                    primaryColor: personalizacaoConfig.corPrimaria,
                    secondaryColor: personalizacaoConfig.corSecundaria,
                    titleFont: personalizacaoConfig.fonteTitulo,
                    bodyFont: personalizacaoConfig.fonteTexto,
                    titleSize: personalizacaoConfig.tamanhoTitulo,
                    bodySize: personalizacaoConfig.tamanhoTexto,
                    logoUrl: personalizacaoConfig.logoPersonalizada
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            {/* Configurações SMTP */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações de E-mail (SMTP)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpHost">Servidor SMTP</Label>
                <Input
                  id="smtpHost"
                  value={smtpConfig.host}
                  onChange={(e) => setSmtpConfig(s => ({ ...s, host: e.target.value }))}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtpPort">Porta</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={smtpConfig.port}
                  onChange={(e) => setSmtpConfig(s => ({ ...s, port: parseInt(e.target.value) || 587 }))}
                  placeholder="587"
                />
              </div>
              <div>
                <Label htmlFor="smtpUser">Usuário</Label>
                <Input
                  id="smtpUser"
                  value={smtpConfig.user}
                  onChange={(e) => setSmtpConfig(s => ({ ...s, user: e.target.value }))}
                  placeholder="usuario@gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtpPassword">Senha</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  value={smtpConfig.password}
                  onChange={(e) => setSmtpConfig(s => ({ ...s, password: e.target.value }))}
                  placeholder="senha"
                />
              </div>
              <div>
                <Label htmlFor="smtpFromName">Nome do Remetente</Label>
                <Input
                  id="smtpFromName"
                  value={smtpConfig.fromName}
                  onChange={(e) => setSmtpConfig(s => ({ ...s, fromName: e.target.value }))}
                  placeholder="Sua Empresa"
                />
              </div>
              <div>
                <Label htmlFor="smtpFromEmail">E-mail do Remetente</Label>
                <Input
                  id="smtpFromEmail"
                  type="email"
                  value={smtpConfig.fromEmail}
                  onChange={(e) => setSmtpConfig(s => ({ ...s, fromEmail: e.target.value }))}
                  placeholder="noreply@suaempresa.com"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="smtpSecure"
                checked={smtpConfig.secure}
                onCheckedChange={(checked) => setSmtpConfig(s => ({ ...s, secure: !!checked }))}
              />
              <Label htmlFor="smtpSecure">Usar SSL/TLS</Label>
            </div>
                <div className="flex gap-2">
                  <Button onClick={handleSalvarSmtp} className="flex-1">
                    Salvar Configurações SMTP
                  </Button>
                  <Button 
                    onClick={handleTestarSmtp} 
                    variant="outline"
                    disabled={testingEmail}
                    className="min-w-[140px]"
                  >
                    {testingEmail ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Testando...
                      </>
                    ) : (
                      "Testar Conexão"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Templates de E-mail */}
            <Card>
              <CardHeader>
                <CardTitle>Templates de E-mail</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure mensagens padrão para diferentes tipos de envio de e-mail.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="templateOrcamento">Template para Orçamentos</Label>
                    <textarea
                      id="templateOrcamento"
                      className="w-full min-h-[120px] p-3 border rounded-md resize-vertical"
                      value={emailTemplates.orcamento}
                      onChange={(e) => setEmailTemplates(s => ({ ...s, orcamento: e.target.value }))}
                      placeholder="Prezado(a) cliente,&#10;&#10;Segue em anexo o orçamento solicitado.&#10;&#10;Atenciosamente,&#10;{nomeEmpresa}"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Variáveis disponíveis: &#123;nomeEmpresa&#125;, &#123;nomeCliente&#125;, &#123;numeroOrcamento&#125;
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="templateVale">Template para Vales</Label>
                    <textarea
                      id="templateVale"
                      className="w-full min-h-[120px] p-3 border rounded-md resize-vertical"
                      value={emailTemplates.vale}
                      onChange={(e) => setEmailTemplates(s => ({ ...s, vale: e.target.value }))}
                      placeholder="Prezado(a),&#10;&#10;Segue em anexo o vale solicitado.&#10;&#10;Atenciosamente,&#10;{nomeEmpresa}"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Variáveis disponíveis: &#123;nomeEmpresa&#125;, &#123;nomeCliente&#125;, &#123;numeroVale&#125;
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="templateRelatorio">Template para Relatórios</Label>
                    <textarea
                      id="templateRelatorio"
                      className="w-full min-h-[120px] p-3 border rounded-md resize-vertical"
                      value={emailTemplates.relatorio}
                      onChange={(e) => setEmailTemplates(s => ({ ...s, relatorio: e.target.value }))}
                      placeholder="Prezado(a),&#10;&#10;Segue em anexo o relatório solicitado.&#10;&#10;Atenciosamente,&#10;{nomeEmpresa}"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Variáveis disponíveis: &#123;nomeEmpresa&#125;, &#123;periodo&#125;, &#123;tipoRelatorio&#125;
                    </p>
                  </div>
                </div>
                
                <Button onClick={handleSalvarTemplates} className="w-full">
                  Salvar Templates de E-mail
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            {/* Backup Local */}
            <Card>
              <CardHeader>
                <CardTitle>Backup Local</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={handleExportarBackup} variant="outline" className="flex-1">
                Exportar Backup
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
              >
                Importar Backup
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mergeImport"
                checked={mergeImport}
                onCheckedChange={(checked) => setMergeImport(!!checked)}
              />
              <Label htmlFor="mergeImport">Mesclar dados (não substituir)</Label>
            </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImportarBackup}
                />
              </CardContent>
            </Card>





            {/* Agendamento Automático */}
            <Card>
              <CardHeader>
                <CardTitle>Agendamento Automático</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autoBackupEnabled"
                        checked={backupConfig.autoBackupEnabled}
                        onCheckedChange={(checked) => setBackupConfig(s => ({ ...s, autoBackupEnabled: !!checked }))}
                      />
                      <Label htmlFor="autoBackupEnabled">Ativar backup automático</Label>
                    </div>
                  </div>
                  
                  {backupConfig.autoBackupEnabled && (
                    <>
                      <div>
                        <Label htmlFor="backupFrequency">Frequência do Backup</Label>
                        <Select 
                          value={backupConfig.backupFrequency} 
                          onValueChange={(value) => setBackupConfig(s => ({ ...s, backupFrequency: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Diário</SelectItem>
                            <SelectItem value="every2days">A cada 2 dias</SelectItem>
                            <SelectItem value="every3days">A cada 3 dias</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="backupTime">Horário do Backup</Label>
                        <Input
                          id="backupTime"
                          type="time"
                          value={backupConfig.backupTime}
                          onChange={(e) => setBackupConfig(s => ({ ...s, backupTime: e.target.value }))}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Horário em que o backup será executado automaticamente
                        </p>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="keepLocalBackup"
                            checked={backupConfig.keepLocalBackup}
                            onCheckedChange={(checked) => setBackupConfig(s => ({ ...s, keepLocalBackup: !!checked }))}
                          />
                          <Label htmlFor="keepLocalBackup">Manter cópia local do backup</Label>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="maxBackups">Máximo de Backups Mantidos</Label>
                        <Input
                          id="maxBackups"
                          type="number"
                          min="1"
                          max="30"
                          value={backupConfig.maxBackups}
                          onChange={(e) => setBackupConfig(s => ({ ...s, maxBackups: parseInt(e.target.value) || 7 }))}
                          placeholder="7"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Número máximo de backups a serem mantidos (os mais antigos serão removidos)
                        </p>
                      </div>
                      
                      {backupConfig.lastBackup && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm text-blue-700">
                            Último backup: {new Date(backupConfig.lastBackup).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <Button onClick={handleSalvarBackupConfig} className="w-full">
                  Salvar Configurações de Backup
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios" className="space-y-6">
            <UsuariosManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
