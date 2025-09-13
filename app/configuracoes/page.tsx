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
import { AlertTriangle, Building, Save, Palette, FileText, Mail, TestTube, HardDrive, Download, Upload, Clock, Users, Package, Plus, Trash2, Edit, Ruler, List, Check, X, Eye, EyeOff, Shield } from "lucide-react"
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
  
  // Unidades de medida
  const [unidades, setUnidades] = useState<Array<{id: number, codigo: string, descricao: string, ativo: boolean}>>([])
  const [novaUnidade, setNovaUnidade] = useState({ codigo: '', descricao: '' })
  const [editandoUnidade, setEditandoUnidade] = useState<{id: number, codigo: string, descricao: string} | null>(null)
  const [carregandoUnidades, setCarregandoUnidades] = useState(false)
  
  // Modalidades de compra
  const [modalidades, setModalidades] = useState<Array<{id: number, codigo: string, nome: string, descricao: string, ativo: boolean}>>([])
  const [novaModalidade, setNovaModalidade] = useState({ codigo: '', nome: '', descricao: '' })
  const [editandoModalidade, setEditandoModalidade] = useState<{id: number, codigo: string, nome: string, descricao: string} | null>(null)
  const [carregandoModalidades, setCarregandoModalidades] = useState(false)
  
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
  
  // Configurações de autenticação
  const [authConfig, setAuthConfig] = useState({
    normalExpiryHours: 2,
    rememberMeExpiryDays: 7,
    sessionCheckInterval: 5,
    warningTime: 5
  })
  const [carregandoAuthConfig, setCarregandoAuthConfig] = useState(false)
  
  const { toast } = useToast()

  const carregarUnidadesMedida = async () => {
    try {
      setCarregandoUnidades(true)
      const response = await fetch('/api/unidades-medida')
      if (response.ok) {
        const data = await response.json()
        setUnidades(data)
      }
    } catch (error) {
      console.error('Erro ao carregar unidades de medida:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar unidades de medida",
        variant: "destructive",
      })
    } finally {
      setCarregandoUnidades(false)
    }
  }

  const adicionarUnidade = async () => {
    if (!novaUnidade.codigo.trim() || !novaUnidade.descricao.trim()) {
      toast({
        title: "Erro",
        description: "Código e descrição são obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/unidades-medida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaUnidade)
      })

      if (response.ok) {
        setNovaUnidade({ codigo: '', descricao: '' })
        await carregarUnidadesMedida()
        toast({
          title: "Sucesso",
          description: "Unidade de medida adicionada com sucesso!",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.message || "Erro ao adicionar unidade",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao adicionar unidade:', error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar unidade de medida",
        variant: "destructive",
      })
    }
  }

  const editarUnidade = async () => {
    if (!editandoUnidade || !editandoUnidade.codigo.trim() || !editandoUnidade.descricao.trim()) {
      toast({
        title: "Erro",
        description: "Código e descrição são obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/unidades-medida', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editandoUnidade)
      })

      if (response.ok) {
        setEditandoUnidade(null)
        await carregarUnidadesMedida()
        toast({
          title: "Sucesso",
          description: "Unidade de medida atualizada com sucesso!",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.message || "Erro ao atualizar unidade",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao editar unidade:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar unidade de medida",
        variant: "destructive",
      })
    }
  }

  const excluirUnidade = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta unidade de medida?')) {
      return
    }

    try {
      const response = await fetch('/api/unidades-medida', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        await carregarUnidadesMedida()
        toast({
          title: "Sucesso",
          description: "Unidade de medida excluída com sucesso!",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.message || "Erro ao excluir unidade",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao excluir unidade:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir unidade de medida",
        variant: "destructive",
      })
    }
  }

  // Funções para modalidades de compra
  const carregarModalidades = async () => {
    try {
      setCarregandoModalidades(true)
      const response = await fetch('/api/modalidades-compra')
      if (response.ok) {
        const data = await response.json()
        setModalidades(data)
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar modalidades de compra",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao carregar modalidades:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar modalidades de compra",
        variant: "destructive",
      })
    } finally {
      setCarregandoModalidades(false)
    }
  }

  const adicionarModalidade = async () => {
    if (!novaModalidade.codigo.trim() || !novaModalidade.nome.trim()) {
      toast({
        title: "Erro",
        description: "Código e nome são obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/modalidades-compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novaModalidade)
      })

      if (response.ok) {
        setNovaModalidade({ codigo: '', nome: '', descricao: '' })
        await carregarModalidades()
        toast({
          title: "Sucesso",
          description: "Modalidade de compra adicionada com sucesso!",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.message || "Erro ao adicionar modalidade",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao adicionar modalidade:', error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar modalidade de compra",
        variant: "destructive",
      })
    }
  }

  const editarModalidade = async () => {
    if (!editandoModalidade || !editandoModalidade.codigo.trim() || !editandoModalidade.nome.trim()) {
      toast({
        title: "Erro",
        description: "Código e nome são obrigatórios",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch('/api/modalidades-compra', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editandoModalidade)
      })

      if (response.ok) {
        setEditandoModalidade(null)
        await carregarModalidades()
        toast({
          title: "Sucesso",
          description: "Modalidade de compra atualizada com sucesso!",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.message || "Erro ao atualizar modalidade",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao editar modalidade:', error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar modalidade de compra",
        variant: "destructive",
      })
    }
  }

  const excluirModalidade = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta modalidade de compra?')) {
      return
    }

    try {
      const response = await fetch('/api/modalidades-compra', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        await carregarModalidades()
        toast({
          title: "Sucesso",
          description: "Modalidade de compra excluída com sucesso!",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.message || "Erro ao excluir modalidade",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao excluir modalidade:', error)
      toast({
        title: "Erro",
        description: "Erro ao excluir modalidade de compra",
        variant: "destructive",
      })
    }
  }

  const alternarStatusModalidade = async (id: number, ativo: boolean) => {
    try {
      // Buscar a modalidade atual para obter todos os dados necessários
      const modalidadeAtual = modalidades.find(m => m.id === id)
      if (!modalidadeAtual) {
        toast({
          title: "Erro",
          description: "Modalidade não encontrada",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/modalidades-compra', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          codigo: modalidadeAtual.codigo,
          nome: modalidadeAtual.nome,
          descricao: modalidadeAtual.descricao,
          ativo,
          requer_numero_processo: modalidadeAtual.requer_numero_processo
        })
      })

      if (response.ok) {
        await carregarModalidades()
        toast({
          title: "Sucesso",
          description: `Modalidade ${ativo ? 'ativada' : 'desativada'} com sucesso!`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.message || "Erro ao alterar status da modalidade",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao alterar status da modalidade:', error)
      toast({
        title: "Erro",
        description: "Erro ao alterar status da modalidade",
        variant: "destructive",
      })
    }
  }

  const alternarRequerProcesso = async (id: number, requerNumeroProcesso: boolean) => {
    try {
      // Buscar a modalidade atual para obter todos os dados necessários
      const modalidadeAtual = modalidades.find(m => m.id === id)
      if (!modalidadeAtual) {
        toast({
          title: "Erro",
          description: "Modalidade não encontrada",
          variant: "destructive",
        })
        return
      }

      const response = await fetch('/api/modalidades-compra', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          codigo: modalidadeAtual.codigo,
          nome: modalidadeAtual.nome,
          descricao: modalidadeAtual.descricao,
          ativo: modalidadeAtual.ativo,
          requer_numero_processo: requerNumeroProcesso 
        })
      })

      if (response.ok) {
        await carregarModalidades()
        toast({
          title: "Sucesso",
          description: `Configuração de número de processo ${requerNumeroProcesso ? 'ativada' : 'desativada'} com sucesso!`,
        })
      } else {
        const error = await response.json()
        toast({
          title: "Erro",
          description: error.message || "Erro ao alterar configuração de número de processo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao alterar configuração de número de processo:', error)
      toast({
        title: "Erro",
        description: "Erro ao alterar configuração de número de processo",
        variant: "destructive",
      })
    }
  }

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
    carregarUnidadesMedida()
    carregarModalidades()
    carregarConfigAuth()
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

  const carregarConfigAuth = async () => {
    try {
      setCarregandoAuthConfig(true)
      const response = await fetch('/api/config/auth')
      if (response.ok) {
        const data = await response.json()
        setAuthConfig(data)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de autenticação:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações de autenticação",
        variant: "destructive",
      })
    } finally {
      setCarregandoAuthConfig(false)
    }
  }

  const handleSalvarAuth = async () => {
    try {
      const response = await fetch('/api/config/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authConfig)
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Configurações de autenticação salvas com sucesso!",
        })
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao salvar configurações",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Erro ao salvar configurações de autenticação:', error)
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações de autenticação",
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
          description: "Servidor: " + details.server + " | Tempo: " + details.connectionTime + " | " + details.security,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <AppHeader />
      <main className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Configurações
            </h1>
            <p className="text-slate-600 mt-2">
              Sistema simplificado - Configurações gerais
            </p>
          </div>
        </div>

        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-8 bg-white/80 backdrop-blur-sm shadow-lg border-0 p-2 rounded-xl">
            <TabsTrigger value="geral" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium">Geral</TabsTrigger>
            <TabsTrigger value="unidades" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium">Unidades</TabsTrigger>
            <TabsTrigger value="modalidades" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium">Modalidades</TabsTrigger>
            <TabsTrigger value="personalizacao" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium">Personalização</TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium">E-mail</TabsTrigger>
            <TabsTrigger value="autenticacao" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium">Autenticação</TabsTrigger>
            <TabsTrigger value="backup" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium">Backup</TabsTrigger>
            <TabsTrigger value="usuarios" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300 rounded-lg font-medium">Usuários</TabsTrigger>
          </TabsList>

          <TabsContent value="geral" className="space-y-8">
            {/* Informações Gerais */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6 bg-gradient-to-br from-white to-blue-50/30">
                <p className="text-slate-600 mb-6">
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
                    <p className="text-xs text-slate-500 mt-1">
                      Resolução ideal: 48x48px ou 96x96px para melhor qualidade no cabeçalho
                    </p>
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
                <Button 
                  onClick={handleSalvarGeral} 
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações Gerais
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="unidades" className="space-y-8">
            {/* Configurações de Unidades de Medida */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Unidades de Medida
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6 bg-gradient-to-br from-white to-green-50/30">
                <p className="text-slate-600 mb-6">
                  Gerencie as unidades de medida disponíveis para os produtos nos orçamentos.
                </p>
                
                {/* Formulário para adicionar nova unidade */}
                <Card className="border border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Nova Unidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="novoCodigoUnidade">Código</Label>
                        <Input
                          id="novoCodigoUnidade"
                          value={novaUnidade.codigo || ''}
                          onChange={(e) => setNovaUnidade(s => ({ ...s, codigo: e.target.value.toUpperCase() }))}
                          placeholder="Ex: KG, M, UN"
                          maxLength={10}
                        />
                      </div>
                      <div>
                        <Label htmlFor="novaDescricaoUnidade">Descrição</Label>
                        <Input
                          id="novaDescricaoUnidade"
                          value={novaUnidade.descricao || ''}
                          onChange={(e) => setNovaUnidade(s => ({ ...s, descricao: e.target.value }))}
                          placeholder="Ex: Quilograma, Metro, Unidade"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          onClick={adicionarUnidade}
                          disabled={!novaUnidade.codigo || !novaUnidade.descricao}
                          className="w-full bg-green-500 hover:bg-green-600 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de unidades existentes */}
                <Card className="border border-green-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <List className="h-4 w-4" />
                      Unidades Cadastradas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {carregandoUnidades ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                      </div>
                    ) : unidades.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Ruler className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma unidade de medida cadastrada</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {unidades.map((unidade) => (
                          <div key={unidade.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-green-600 bg-green-100 px-2 py-1 rounded text-sm">
                                  {unidade.codigo}
                                </span>
                                <span className="text-gray-700">{unidade.descricao}</span>
                              </div>
                              {!unidade.ativo && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                  Inativo
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {editandoUnidade?.id === unidade.id ? (
                                <>
                                  <Input
                                    value={editandoUnidade?.codigo || ''}
                                    onChange={(e) => setEditandoUnidade(s => s ? { ...s, codigo: e.target.value.toUpperCase() } : null)}
                                    className="w-20 h-8 text-sm"
                                    maxLength={10}
                                  />
                                  <Input
                                    value={editandoUnidade?.descricao || ''}
                                    onChange={(e) => setEditandoUnidade(s => s ? { ...s, descricao: e.target.value } : null)}
                                    className="w-32 h-8 text-sm"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => editarUnidade(editandoUnidade.id, editandoUnidade.codigo, editandoUnidade.descricao)}
                                    className="h-8 bg-green-500 hover:bg-green-600"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditandoUnidade(null)}
                                    className="h-8"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditandoUnidade({ id: unidade.id, codigo: unidade.codigo, descricao: unidade.descricao })}
                                    className="h-8"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => excluirUnidade(unidade.id)}
                                    className="h-8"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modalidades" className="space-y-8">
            {/* Modalidades de Compra */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Modalidades de Compra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6 bg-gradient-to-br from-white to-blue-50/30">
                <p className="text-slate-600 mb-6">
                  Gerencie as modalidades de compra disponíveis no sistema. Você pode adicionar, editar ou desativar modalidades conforme necessário.
                </p>
                
                {/* Formulário para adicionar nova modalidade */}
                <Card className="border border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar Nova Modalidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="codigoModalidade">Código</Label>
                        <Input
                          id="codigoModalidade"
                          value={novaModalidade.codigo || ''}
                          onChange={(e) => setNovaModalidade(s => ({ ...s, codigo: e.target.value.toUpperCase() }))}
                          placeholder="Ex: CD, LIC, DISP"
                          maxLength={10}
                          className="uppercase"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nomeModalidade">Nome</Label>
                        <Input
                          id="nomeModalidade"
                          value={novaModalidade.nome || ''}
                          onChange={(e) => setNovaModalidade(s => ({ ...s, nome: e.target.value }))}
                          placeholder="Ex: Compra Direta"
                        />
                      </div>
                      <div>
                        <Label htmlFor="descricaoModalidade">Descrição</Label>
                        <Input
                          id="descricaoModalidade"
                          value={novaModalidade.descricao || ''}
                          onChange={(e) => setNovaModalidade(s => ({ ...s, descricao: e.target.value }))}
                          placeholder="Descrição da modalidade"
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={adicionarModalidade}
                      className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                      disabled={!novaModalidade.codigo.trim() || !novaModalidade.nome.trim()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Modalidade
                    </Button>
                  </CardContent>
                </Card>

                {/* Lista de modalidades */}
                <Card className="border border-blue-200">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <List className="h-4 w-4" />
                      Modalidades Cadastradas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {carregandoModalidades ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    ) : modalidades.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhuma modalidade de compra cadastrada</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {modalidades.map((modalidade) => (
                          <div key={modalidade.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded text-sm">
                                  {modalidade.codigo}
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-gray-700 font-medium">{modalidade.nome}</span>
                                  {modalidade.descricao && (
                                    <span className="text-gray-500 text-sm">{modalidade.descricao}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {modalidade.requer_numero_processo && (
                                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    Requer Nº Processo
                                  </span>
                                )}
                                {!modalidade.ativo && (
                                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                    Inativo
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {editandoModalidade?.id === modalidade.id ? (
                                <>
                                  <Input
                                    value={editandoModalidade.codigo}
                                    onChange={(e) => setEditandoModalidade(s => s ? { ...s, codigo: e.target.value.toUpperCase() } : null)}
                                    className="w-20 h-8 text-sm"
                                    maxLength={10}
                                  />
                                  <Input
                                    value={editandoModalidade?.nome || ''}
                                    onChange={(e) => setEditandoModalidade(s => s ? { ...s, nome: e.target.value } : null)}
                                    className="w-32 h-8 text-sm"
                                  />
                                  <Input
                                    value={editandoModalidade?.descricao || ''}
                                    onChange={(e) => setEditandoModalidade(s => s ? { ...s, descricao: e.target.value } : null)}
                                    className="w-40 h-8 text-sm"
                                    placeholder="Descrição"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={editarModalidade}
                                    className="h-8 bg-blue-500 hover:bg-blue-600"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditandoModalidade(null)}
                                    className="h-8"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant={modalidade.requer_numero_processo ? "default" : "outline"}
                                    onClick={() => alternarRequerProcesso(modalidade.id, !modalidade.requer_numero_processo)}
                                    className={`h-8 ${modalidade.requer_numero_processo ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'text-purple-600 border-purple-300 hover:bg-purple-50'}`}
                                    title={modalidade.requer_numero_processo ? 'Desativar campo de processo' : 'Ativar campo de processo'}
                                  >
                                    <FileText className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={modalidade.ativo ? "outline" : "default"}
                                    onClick={() => alternarStatusModalidade(modalidade.id, !modalidade.ativo)}
                                    className={`h-8 ${modalidade.ativo ? 'text-orange-600 border-orange-300 hover:bg-orange-50' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                                  >
                                    {modalidade.ativo ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditandoModalidade({ 
                                      id: modalidade.id, 
                                      codigo: modalidade.codigo, 
                                      nome: modalidade.nome, 
                                      descricao: modalidade.descricao 
                                    })}
                                    className="h-8"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => excluirModalidade(modalidade.id)}
                                    className="h-8"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="personalizacao" className="space-y-8">
            {/* Configurações de Personalização */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Personalização de Documentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6 bg-gradient-to-br from-white to-purple-50/30">
                <p className="text-slate-600 mb-6">
                  Personalize as cores, fontes e estilos dos documentos gerados (orçamentos, vales, etc.).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="corPrimaria">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="corPrimaria"
                        type="color"
                        value={personalizacaoConfig.corPrimaria || '#3b82f6'}
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
                        value={personalizacaoConfig.corSecundaria || '#64748b'}
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
                        value={personalizacaoConfig.corTexto || '#1f2937'}
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
                      value={personalizacaoConfig.tamanhoTitulo || 24}
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
                      value={personalizacaoConfig.tamanhoTexto || 14}
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
                      value={personalizacaoConfig.logoPersonalizada || ''}
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
                <Button 
                  onClick={handleSalvarPersonalizacao} 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações de Personalização
                </Button>
              </CardContent>
            </Card>
            
            {/* Preview dos Documentos */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Preview dos Documentos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-br from-white to-indigo-50/30">
                <DocumentPreview 
                  layoutConfig={{
                    primaryColor: personalizacaoConfig.corPrimaria,
                    secondaryColor: personalizacaoConfig.corSecundaria,
                    titleFont: personalizacaoConfig.fonteTitulo,
                    bodyFont: personalizacaoConfig.fonteTexto,
                    titleSize: personalizacaoConfig.tamanhoTitulo,
                    bodySize: personalizacaoConfig.tamanhoTexto,
                    logoUrl: personalizacaoConfig.logoPersonalizada,
                    validadeOrcamento: personalizacaoConfig.validadeOrcamento
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-8">
            {/* Configurações SMTP */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Configurações de E-mail (SMTP)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6 bg-gradient-to-br from-white to-green-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="smtpHost">Servidor SMTP</Label>
                <Input
                  id="smtpHost"
                  value={smtpConfig.host || ''}
                  onChange={(e) => setSmtpConfig(s => ({ ...s, host: e.target.value }))}
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtpPort">Porta</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={smtpConfig.port || 587}
                  onChange={(e) => setSmtpConfig(s => ({ ...s, port: parseInt(e.target.value) || 587 }))}
                  placeholder="587"
                />
              </div>
              <div>
                <Label htmlFor="smtpUser">Usuário</Label>
                <Input
                  id="smtpUser"
                  value={smtpConfig.user || ''}
                  onChange={(e) => setSmtpConfig(s => ({ ...s, user: e.target.value }))}
                  placeholder="usuario@gmail.com"
                />
              </div>
              <div>
                <Label htmlFor="smtpPassword">Senha</Label>
                <Input
                  id="smtpPassword"
                  type="password"
                  value={smtpConfig.password || ''}
                  onChange={(e) => setSmtpConfig(s => ({ ...s, password: e.target.value }))}
                  placeholder="senha"
                />
              </div>
              <div>
                <Label htmlFor="smtpFromName">Nome do Remetente</Label>
                <Input
                  id="smtpFromName"
                  value={smtpConfig.fromName || ''}
                  onChange={(e) => setSmtpConfig(s => ({ ...s, fromName: e.target.value }))}
                  placeholder="Sua Empresa"
                />
              </div>
              <div>
                <Label htmlFor="smtpFromEmail">E-mail do Remetente</Label>
                <Input
                  id="smtpFromEmail"
                  type="email"
                  value={smtpConfig.fromEmail || ''}
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
                <div className="flex gap-4">
                  <Button 
                    onClick={handleSalvarSmtp} 
                    className="flex-1 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações SMTP
                  </Button>
                  <Button 
                    onClick={handleTestarSmtp} 
                    variant="outline"
                    disabled={testingEmail}
                    className="min-w-[140px] border-2 border-green-200 hover:border-green-300 bg-white/80 hover:bg-green-50 text-green-700 font-medium py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    {testingEmail ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        Testando...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4 mr-2" />
                        Testar Conexão
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Templates de E-mail */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Templates de E-mail
                </CardTitle>
                <p className="text-blue-100 mt-2">
                  Configure mensagens padrão para diferentes tipos de envio de e-mail.
                </p>
              </CardHeader>
              <CardContent className="space-y-6 p-6 bg-gradient-to-br from-white to-blue-50/30">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="templateOrcamento">Template para Orçamentos</Label>
                    <textarea
                      id="templateOrcamento"
                      className="w-full min-h-[120px] p-3 border rounded-md resize-vertical"
                      value={emailTemplates.orcamento || ''}
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
                      value={emailTemplates.vale || ''}
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
                      value={emailTemplates.relatorio || ''}
                      onChange={(e) => setEmailTemplates(s => ({ ...s, relatorio: e.target.value }))}
                      placeholder="Prezado(a),&#10;&#10;Segue em anexo o relatório solicitado.&#10;&#10;Atenciosamente,&#10;{nomeEmpresa}"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Variáveis disponíveis: &#123;nomeEmpresa&#125;, &#123;periodo&#125;, &#123;tipoRelatorio&#125;
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSalvarTemplates} 
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Templates de E-mail
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="space-y-8">
            {/* Backup Local */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Backup Local
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6 bg-gradient-to-br from-white to-orange-50/30">
            <div className="flex gap-4">
              <Button 
                onClick={handleExportarBackup} 
                variant="outline" 
                className="flex-1 border-2 border-orange-200 hover:border-orange-300 bg-white/80 hover:bg-orange-50 text-orange-700 font-medium py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Backup
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1 border-2 border-orange-200 hover:border-orange-300 bg-white/80 hover:bg-orange-50 text-orange-700 font-medium py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <Upload className="h-4 w-4 mr-2" />
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
            <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Agendamento Automático
                </CardTitle>
                <p className="text-green-100 mt-2">
                  Configure backups automáticos para proteger seus dados.
                </p>
              </CardHeader>
              <CardContent className="space-y-6 p-6 bg-gradient-to-br from-white to-green-50/30">
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
                          value={backupConfig.backupFrequency || ''} 
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
                          value={backupConfig.backupTime || ''}
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
                          value={backupConfig.maxBackups || 7}
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
                
                <Button 
                  onClick={handleSalvarBackupConfig} 
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações de Backup
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="autenticacao" className="space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Configurações de Autenticação
                </CardTitle>
                <p className="text-indigo-100 mt-2">
                  Configure os tempos de expiração e segurança do sistema de login.
                </p>
              </CardHeader>
              <CardContent className="space-y-6 p-6 bg-gradient-to-br from-white to-indigo-50/30">
                {carregandoAuthConfig ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    <span className="ml-2 text-indigo-600">Carregando configurações...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="normalExpiryHours">Tempo de Expiração Normal (horas)</Label>
                      <Input
                        id="normalExpiryHours"
                        type="number"
                        min="1"
                        max="24"
                        value={authConfig.normalExpiryHours}
                        onChange={(e) => setAuthConfig(s => ({ ...s, normalExpiryHours: parseInt(e.target.value) || 2 }))}
                        placeholder="2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Tempo em horas para expiração do login normal
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="rememberMeExpiryDays">Tempo "Lembrar-me" (dias)</Label>
                      <Input
                        id="rememberMeExpiryDays"
                        type="number"
                        min="1"
                        max="30"
                        value={authConfig.rememberMeExpiryDays}
                        onChange={(e) => setAuthConfig(s => ({ ...s, rememberMeExpiryDays: parseInt(e.target.value) || 7 }))}
                        placeholder="7"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Tempo em dias para expiração quando "Lembrar-me" está ativo
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="sessionCheckInterval">Intervalo de Verificação (minutos)</Label>
                      <Input
                        id="sessionCheckInterval"
                        type="number"
                        min="1"
                        max="60"
                        value={authConfig.sessionCheckInterval}
                        onChange={(e) => setAuthConfig(s => ({ ...s, sessionCheckInterval: parseInt(e.target.value) || 5 }))}
                        placeholder="5"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Frequência de verificação da sessão em minutos
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="warningTime">Tempo de Aviso (minutos)</Label>
                      <Input
                        id="warningTime"
                        type="number"
                        min="1"
                        max="30"
                        value={authConfig.warningTime}
                        onChange={(e) => setAuthConfig(s => ({ ...s, warningTime: parseInt(e.target.value) || 5 }))}
                        placeholder="5"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Tempo em minutos antes da expiração para mostrar aviso
                      </p>
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleSalvarAuth} 
                  disabled={carregandoAuthConfig}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-medium py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações de Autenticação
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usuarios" className="space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gerenciamento de Usuários
                </CardTitle>
                <p className="text-purple-100 mt-2">
                  Gerencie usuários, permissões e controle de acesso ao sistema.
                </p>
              </CardHeader>
              <CardContent className="p-6 bg-gradient-to-br from-white to-purple-50/30">
                <UsuariosManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
