"use client"

// Configuração do sistema - agora gerenciada pelo backend

export type Config = {
  nome?: string
  logoUrl?: string
  razaoSocial?: string
  cnpj?: string
  endereco?: string
  email?: string
  telefone?: string
  nomeDoSistema?: string
  impostoPadrao?: number
  capitalPadrao?: number
  // Configurações SMTP
  smtpHost?: string
  smtpPort?: number
  smtpSecure?: boolean
  smtpUser?: string
  smtpPassword?: string
  smtpFromName?: string
  smtpFromEmail?: string
  // Configurações de personalização
  corPrimaria?: string
  corSecundaria?: string
  corTexto?: string
  fonteTitulo?: string
  fonteTexto?: string
  tamanhoTitulo?: number
  tamanhoTexto?: number
  logoPersonalizada?: string
  validadeDias?: number
  // Templates de e-mail
  emailTemplateOrcamento?: string
  emailTemplateVale?: string
  emailTemplateRelatorio?: string
  // Configurações de backup automático
  autoBackupEnabled?: boolean
  backupFrequency?: string
  backupTime?: string
  keepLocalBackup?: boolean
  maxBackups?: number
  lastBackup?: string
  [key: string]: any
}

// Valor padrão para configuração
const defaultConfig: Config = {
  nome: "LP IND",
  logoUrl: undefined
}

// Configuração em memória (deve ser carregada do backend)
let currentConfig: Config = { ...defaultConfig }

/**
 * Obtém a configuração atual do sistema
 */
export function getConfig(): Config {
  return { ...currentConfig }
}

/**
 * Salva a configuração do sistema
 */
export async function saveConfig(config: Partial<Config>): Promise<void> {
  try {
    console.log('Salvando configurações:', config)
    
    // Salvar no backend
    const response = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })
    
    console.log('Resposta da API:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
      const errorMessage = errorData.error || `Erro HTTP ${response.status}: ${response.statusText}`
      throw new Error(`Erro ao salvar configurações: ${errorMessage}`)
    }
    
    const result = await response.json()
    
    // Atualizar configuração em memória com os dados retornados
    if (result.config) {
      currentConfig = {
        nome: result.config.nome || '',
        logoUrl: result.config.logo_url || '',
        cnpj: result.config.cnpj || '',
        telefone: result.config.telefone || '',
        endereco: result.config.endereco || '',
        email: result.config.email || '',
        razaoSocial: result.config.razao_social || '',
        nomeDoSistema: result.config.nome_do_sistema || 'LP IND',
        impostoPadrao: result.config.imposto_padrao || 10,
        capitalPadrao: result.config.capital_padrao || 15,
        smtpHost: result.config.smtp_host || '',
        smtpPort: result.config.smtp_port || 587,
        smtpSecure: result.config.smtp_secure === 1,
        smtpUser: result.config.smtp_user || '',
        smtpPassword: result.config.smtp_password || '',
        smtpFromName: result.config.smtp_from_name || '',
        smtpFromEmail: result.config.smtp_from_email || '',
        emailTemplateOrcamento: result.config.email_template_orcamento || '',
        emailTemplateVale: result.config.email_template_vale || '',
        emailTemplateRelatorio: result.config.email_template_relatorio || '',
        corPrimaria: result.config.cor_primaria || '#3b82f6',
        corSecundaria: result.config.cor_secundaria || '#64748b',
        corTexto: result.config.cor_texto || '#1f2937',
        fonteTitulo: result.config.fonte_titulo || 'Inter',
        fonteTexto: result.config.fonte_texto || 'Inter',
        tamanhoTitulo: result.config.tamanho_titulo || 24,
        tamanhoTexto: result.config.tamanho_texto || 14,
        logoPersonalizada: result.config.logo_personalizada || '',
        validadeDias: result.config.validade_orcamento || 30,
        autoBackupEnabled: result.config.auto_backup_enabled === 1,
        backupFrequency: result.config.backup_frequency || 'daily',
        backupTime: result.config.backup_time || '02:00',
        keepLocalBackup: result.config.keep_local_backup === 1,
        maxBackups: result.config.max_backups || 7,
        lastBackup: result.config.last_backup || null
      }
    }
    
    // Disparar evento de mudança
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('erp-config-changed', { detail: currentConfig }))
    }
    

  } catch (error) {
    console.error('Erro ao salvar configuração:', error)
    throw error
  }
}

/**
 * Carrega configuração do backend
 */
export async function loadConfig(): Promise<Config> {
  try {
    const response = await fetch('/api/config')
    
    if (!response.ok) {
      console.warn('Erro ao carregar configurações, usando padrão')
      return currentConfig
    }
    
    const config = await response.json()
    
    // Mapear dados do banco para o formato esperado
    currentConfig = {
      nome: config.nome || '',
      logoUrl: config.logo_url || '',
      cnpj: config.cnpj || '',
      telefone: config.telefone || '',
      endereco: config.endereco || '',
      email: config.email || '',
      razaoSocial: config.razao_social || '',
      nomeDoSistema: config.nome_do_sistema || 'LP IND',
      impostoPadrao: config.imposto_padrao || 10,
      capitalPadrao: config.capital_padrao || 15,
      smtpHost: config.smtp_host || '',
      smtpPort: config.smtp_port || 587,
      smtpSecure: config.smtp_secure === 1,
      smtpUser: config.smtp_user || '',
      smtpPassword: config.smtp_password || '',
      smtpFromName: config.smtp_from_name || '',
      smtpFromEmail: config.smtp_from_email || '',
      emailTemplateOrcamento: config.email_template_orcamento || '',
      emailTemplateVale: config.email_template_vale || '',
      emailTemplateRelatorio: config.email_template_relatorio || '',
      corPrimaria: config.cor_primaria || '#3b82f6',
      corSecundaria: config.cor_secundaria || '#64748b',
      corTexto: config.cor_texto || '#1f2937',
      fonteTitulo: config.fonte_titulo || 'Inter',
      fonteTexto: config.fonte_texto || 'Inter',
      tamanhoTitulo: config.tamanho_titulo || 24,
      tamanhoTexto: config.tamanho_texto || 14,
      logoPersonalizada: config.logo_personalizada || '',
      validadeDias: config.validade_orcamento || 30,
      autoBackupEnabled: config.auto_backup_enabled === 1,
      backupFrequency: config.backup_frequency || 'daily',
      backupTime: config.backup_time || '02:00',
      keepLocalBackup: config.keep_local_backup === 1,
      maxBackups: config.max_backups || 7,
      lastBackup: config.last_backup || null
    }
    
    return currentConfig
  } catch (error) {
    console.error('Erro ao carregar configuração:', error)
    return currentConfig
  }
}

/**
 * Carrega configuração do backend (placeholder)
 */
export function loadConfigFromBackend(config: Config): void {
  currentConfig = { ...config }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("erp-config-changed"))
  }
}

// Re-exportar o evento de mudança
export const CONFIG_CHANGED_EVENT = "erp-config-changed"