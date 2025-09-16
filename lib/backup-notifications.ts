import nodemailer from 'nodemailer'
import { db } from './db'
import { backupLogger } from './backup-logger'

interface EmailConfig {
  enabled: boolean
  smtp_host: string
  smtp_port: number
  smtp_secure: boolean
  smtp_user: string
  smtp_password: string
  from_email: string
  from_name: string
}

interface NotificationRecipient {
  id: number
  email: string
  nome: string
  notify_success: boolean
  notify_failure: boolean
  empresa_id?: number
}

class BackupNotificationManager {
  private transporter: nodemailer.Transporter | null = null
  private emailConfig: EmailConfig | null = null

  constructor() {
    this.initializeDatabase()
    this.loadEmailConfig()
  }

  private initializeDatabase(): void {
    try {
      // Tabela de configurações de email
      db.exec(`
        CREATE TABLE IF NOT EXISTS email_config (
          id INTEGER PRIMARY KEY,
          enabled INTEGER DEFAULT 0,
          smtp_host TEXT,
          smtp_port INTEGER DEFAULT 587,
          smtp_secure INTEGER DEFAULT 0,
          smtp_user TEXT,
          smtp_password TEXT,
          from_email TEXT,
          from_name TEXT DEFAULT 'Sistema de Backup',
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Tabela de destinatários de notificações
      db.exec(`
        CREATE TABLE IF NOT EXISTS notification_recipients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          nome TEXT NOT NULL,
          notify_success INTEGER DEFAULT 1,
          notify_failure INTEGER DEFAULT 1,
          empresa_id INTEGER,
          active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Inserir configuração padrão se não existir
      const existingConfig = db.prepare('SELECT id FROM email_config WHERE id = 1').get()
      if (!existingConfig) {
        db.prepare(`
          INSERT INTO email_config (id, enabled) VALUES (1, 0)
        `).run()
      }
    } catch (error) {
      backupLogger.error('notification_init', `Erro ao inicializar tabelas de notificação: ${error}`)
    }
  }

  private async loadEmailConfig(): Promise<void> {
    try {
      const config = db.prepare(`
        SELECT * FROM email_config WHERE id = 1
      `).get() as EmailConfig | undefined

      if (config && config.enabled) {
        this.emailConfig = config
        await this.createTransporter()
      }
    } catch (error) {
      backupLogger.error('notification_config', `Erro ao carregar configuração de email: ${error}`)
    }
  }

  private async createTransporter(): Promise<void> {
    if (!this.emailConfig) return

    try {
      this.transporter = nodemailer.createTransport({
        host: this.emailConfig.smtp_host,
        port: this.emailConfig.smtp_port,
        secure: Boolean(this.emailConfig.smtp_secure),
        auth: {
          user: this.emailConfig.smtp_user,
          pass: this.emailConfig.smtp_password
        }
      })

      // Testar conexão
      await this.transporter.verify()
      backupLogger.info('notification_config', 'Configuração de email carregada com sucesso')
    } catch (error) {
      backupLogger.error('notification_config', `Erro ao configurar transporter de email: ${error}`)
      this.transporter = null
    }
  }

  /**
   * Envia notificação de backup bem-sucedido
   */
  async notifyBackupSuccess(
    empresaId: number, 
    empresaNome: string, 
    totalRecords: number, 
    backupSize: number, 
    duration: number
  ): Promise<void> {
    if (!this.isConfigured()) return

    try {
      const recipients = this.getRecipients(empresaId, 'success')
      if (recipients.length === 0) return

      const subject = `✅ Backup Concluído - ${empresaNome}`
      const html = this.generateSuccessEmailHtml(empresaNome, totalRecords, backupSize, duration)

      await this.sendToRecipients(recipients, subject, html)
      backupLogger.info('notification_success', `Notificação de sucesso enviada para ${recipients.length} destinatário(s)`)
    } catch (error) {
      backupLogger.error('notification_success', `Erro ao enviar notificação de sucesso: ${error}`)
    }
  }

  /**
   * Envia notificação de falha no backup
   */
  async notifyBackupFailure(
    empresaId: number, 
    empresaNome: string, 
    errorMessage: string, 
    retryCount?: number
  ): Promise<void> {
    if (!this.isConfigured()) return

    try {
      const recipients = this.getRecipients(empresaId, 'failure')
      if (recipients.length === 0) return

      const subject = `❌ Falha no Backup - ${empresaNome}`
      const html = this.generateFailureEmailHtml(empresaNome, errorMessage, retryCount)

      await this.sendToRecipients(recipients, subject, html)
      backupLogger.info('notification_failure', `Notificação de falha enviada para ${recipients.length} destinatário(s)`)
    } catch (error) {
      backupLogger.error('notification_failure', `Erro ao enviar notificação de falha: ${error}`)
    }
  }

  /**
   * Envia notificação de retry bem-sucedido
   */
  async notifyRetrySuccess(
    empresaId: number, 
    empresaNome: string, 
    retryAttempt: number
  ): Promise<void> {
    if (!this.isConfigured()) return

    try {
      const recipients = this.getRecipients(empresaId, 'success')
      if (recipients.length === 0) return

      const subject = `🔄 Backup Recuperado - ${empresaNome}`
      const html = this.generateRetrySuccessEmailHtml(empresaNome, retryAttempt)

      await this.sendToRecipients(recipients, subject, html)
      backupLogger.info('notification_retry', `Notificação de retry bem-sucedido enviada para ${recipients.length} destinatário(s)`)
    } catch (error) {
      backupLogger.error('notification_retry', `Erro ao enviar notificação de retry: ${error}`)
    }
  }

  private isConfigured(): boolean {
    return this.transporter !== null && this.emailConfig !== null
  }

  private getRecipients(empresaId: number, type: 'success' | 'failure'): NotificationRecipient[] {
    try {
      const query = type === 'success' 
        ? `SELECT * FROM notification_recipients 
           WHERE active = 1 
           AND notify_success = 1 
           AND (empresa_id IS NULL OR empresa_id = ?)
           ORDER BY nome`
        : `SELECT * FROM notification_recipients 
           WHERE active = 1 
           AND notify_failure = 1 
           AND (empresa_id IS NULL OR empresa_id = ?)
           ORDER BY nome`
      
      return db.prepare(query).all(empresaId) as NotificationRecipient[]
    } catch (error) {
      backupLogger.error('notification_recipients', `Erro ao buscar destinatários: ${error}`)
      return []
    }
  }

  private async sendToRecipients(
    recipients: NotificationRecipient[], 
    subject: string, 
    html: string
  ): Promise<void> {
    if (!this.transporter || !this.emailConfig) return

    const emailPromises = recipients.map(recipient => 
      this.transporter!.sendMail({
        from: `"${this.emailConfig!.from_name}" <${this.emailConfig!.from_email}>`,
        to: recipient.email,
        subject,
        html
      })
    )

    await Promise.allSettled(emailPromises)
  }

  private generateSuccessEmailHtml(
    empresaNome: string, 
    totalRecords: number, 
    backupSize: number, 
    duration: number
  ): string {
    const sizeInKB = (backupSize / 1024).toFixed(2)
    const durationInSeconds = (duration / 1000).toFixed(2)
    const timestamp = new Date().toLocaleString('pt-BR')

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">✅ Backup Concluído com Sucesso</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333;">Detalhes do Backup</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Empresa:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${empresaNome}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Data/Hora:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${timestamp}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Registros:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${totalRecords.toLocaleString('pt-BR')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Tamanho:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${sizeInKB} KB</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Duração:</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${durationInSeconds}s</td>
            </tr>
          </table>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>Esta é uma notificação automática do Sistema de Backup.</p>
        </div>
      </div>
    `
  }

  private generateFailureEmailHtml(
    empresaNome: string, 
    errorMessage: string, 
    retryCount?: number
  ): string {
    const timestamp = new Date().toLocaleString('pt-BR')
    const retryInfo = retryCount ? `<p><strong>Tentativa:</strong> ${retryCount}/3</p>` : ''

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f44336; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">❌ Falha no Backup</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333;">Detalhes da Falha</h2>
          
          <p><strong>Empresa:</strong> ${empresaNome}</p>
          <p><strong>Data/Hora:</strong> ${timestamp}</p>
          ${retryInfo}
          
          <div style="background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #c62828;">Erro:</h3>
            <p style="margin-bottom: 0; font-family: monospace;">${errorMessage}</p>
          </div>
          
          <p style="color: #666;">O sistema tentará executar o backup novamente automaticamente.</p>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>Esta é uma notificação automática do Sistema de Backup.</p>
        </div>
      </div>
    `
  }

  private generateRetrySuccessEmailHtml(empresaNome: string, retryAttempt: number): string {
    const timestamp = new Date().toLocaleString('pt-BR')

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #2196F3; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🔄 Backup Recuperado</h1>
        </div>
        
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333;">Backup Executado com Sucesso</h2>
          
          <p><strong>Empresa:</strong> ${empresaNome}</p>
          <p><strong>Data/Hora:</strong> ${timestamp}</p>
          <p><strong>Tentativa:</strong> ${retryAttempt}</p>
          
          <div style="background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 15px 0;">
            <p style="margin: 0;">✅ O backup foi executado com sucesso após falha anterior. O sistema está funcionando normalmente.</p>
          </div>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>Esta é uma notificação automática do Sistema de Backup.</p>
        </div>
      </div>
    `
  }

  /**
   * Atualiza configuração de email
   */
  async updateEmailConfig(config: Partial<EmailConfig>): Promise<boolean> {
    try {
      const keys = Object.keys(config) as (keyof EmailConfig)[]
      const updateFields = keys.map(key => `${key} = ?`).join(', ')
      
      const values = Object.values(config)
      values.push(1) // WHERE id = 1

      const query = `UPDATE email_config SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`
      db.prepare(query).run(...values)

      await this.loadEmailConfig()
      backupLogger.info('notification_config', 'Configuração de email atualizada')
      return true
    } catch (error) {
      backupLogger.error('notification_config', `Erro ao atualizar configuração: ${error}`)
      return false
    }
  }

  /**
   * Adiciona destinatário de notificações
   */
  addRecipient(
    email: string, 
    nome: string, 
    notifySuccess: boolean = true, 
    notifyFailure: boolean = true, 
    empresaId?: number
  ): boolean {
    try {
      db.prepare(`
        INSERT INTO notification_recipients 
        (email, nome, notify_success, notify_failure, empresa_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(email, nome, notifySuccess ? 1 : 0, notifyFailure ? 1 : 0, empresaId || null)

      backupLogger.info('notification_recipients', `Destinatário adicionado: ${email}`)
      return true
    } catch (error) {
      backupLogger.error('notification_recipients', `Erro ao adicionar destinatário: ${error}`)
      return false
    }
  }

  /**
   * Lista todos os destinatários
   */
  getRecipientsList(): NotificationRecipient[] {
    try {
      return db.prepare(`
        SELECT * FROM notification_recipients 
        WHERE active = 1 
        ORDER BY nome
      `).all() as NotificationRecipient[]
    } catch (error) {
      backupLogger.error('notification_recipients', `Erro ao listar destinatários: ${error}`)
      return []
    }
  }
}

// Instância singleton
export const backupNotificationManager = new BackupNotificationManager()

// Funções de conveniência
export async function notifyBackupSuccess(
  empresaId: number, 
  empresaNome: string, 
  totalRecords: number, 
  backupSize: number, 
  duration: number
): Promise<void> {
  return backupNotificationManager.notifyBackupSuccess(empresaId, empresaNome, totalRecords, backupSize, duration)
}

export async function notifyBackupFailure(
  empresaId: number, 
  empresaNome: string, 
  errorMessage: string, 
  retryCount?: number
): Promise<void> {
  return backupNotificationManager.notifyBackupFailure(empresaId, empresaNome, errorMessage, retryCount)
}

export async function notifyRetrySuccess(
  empresaId: number, 
  empresaNome: string, 
  retryAttempt: number
): Promise<void> {
  return backupNotificationManager.notifyRetrySuccess(empresaId, empresaNome, retryAttempt)
}