import { db } from './db'
import { backupLogger } from './backup-logger'
import { forceBackupForEmpresa } from './backup-service'

interface RetryConfig {
  maxRetries: number
  retryDelayMs: number
  backoffMultiplier: number
}

interface FailedBackup {
  id?: number
  empresa_id: number
  empresa_nome: string
  failure_count: number
  last_failure: string
  next_retry: string
  error_message: string
  created_at?: string
}

class BackupRetryManager {
  private config: RetryConfig = {
    maxRetries: 3,
    retryDelayMs: 5 * 60 * 1000, // 5 minutos
    backoffMultiplier: 2
  }

  constructor() {
    this.initializeDatabase()
  }

  private initializeDatabase(): void {
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS backup_failures (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          empresa_id INTEGER NOT NULL,
          empresa_nome TEXT NOT NULL,
          failure_count INTEGER DEFAULT 1,
          last_failure TEXT NOT NULL,
          next_retry TEXT NOT NULL,
          error_message TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
    } catch (error) {
      backupLogger.error('retry_init', `Erro ao inicializar tabela de falhas: ${error}`)
    }
  }

  /**
   * Registra uma falha de backup
   */
  async recordFailure(empresaId: number, empresaNome: string, errorMessage: string): Promise<void> {
    try {
      const now = new Date().toISOString()
      
      // Verificar se já existe uma falha registrada para esta empresa
      const existingFailure = db.prepare(`
        SELECT * FROM backup_failures 
        WHERE empresa_id = ?
      `).get(empresaId) as FailedBackup | undefined

      if (existingFailure) {
        // Incrementar contador de falhas
        const newFailureCount = existingFailure.failure_count + 1
        const nextRetry = this.calculateNextRetry(newFailureCount)

        db.prepare(`
          UPDATE backup_failures 
          SET failure_count = ?, last_failure = ?, next_retry = ?, 
              error_message = ?, updated_at = CURRENT_TIMESTAMP
          WHERE empresa_id = ?
        `).run(newFailureCount, now, nextRetry, errorMessage, empresaId)

        backupLogger.warn('backup_retry', 
          `Falha ${newFailureCount}/${this.config.maxRetries} para empresa ${empresaNome}. Próxima tentativa: ${nextRetry}`
        )
      } else {
        // Primeira falha
        const nextRetry = this.calculateNextRetry(1)

        db.prepare(`
          INSERT INTO backup_failures 
          (empresa_id, empresa_nome, failure_count, last_failure, next_retry, error_message)
          VALUES (?, ?, 1, ?, ?, ?)
        `).run(empresaId, empresaNome, now, nextRetry, errorMessage)

        backupLogger.warn('backup_retry', 
          `Primeira falha registrada para empresa ${empresaNome}. Próxima tentativa: ${nextRetry}`
        )
      }
    } catch (error) {
      backupLogger.error('backup_retry', `Erro ao registrar falha: ${error}`)
    }
  }

  /**
   * Remove registro de falha após sucesso
   */
  async clearFailure(empresaId: number): Promise<void> {
    try {
      const result = db.prepare(`
        DELETE FROM backup_failures 
        WHERE empresa_id = ?
      `).run(empresaId)

      if (result.changes > 0) {
        backupLogger.info('backup_retry', `Falhas limpas para empresa ID ${empresaId}`)
      }
    } catch (error) {
      backupLogger.error('backup_retry', `Erro ao limpar falhas: ${error}`)
    }
  }

  /**
   * Calcula o próximo horário de retry com backoff exponencial
   */
  private calculateNextRetry(failureCount: number): string {
    const delay = this.config.retryDelayMs * Math.pow(this.config.backoffMultiplier, failureCount - 1)
    const nextRetry = new Date(Date.now() + delay)
    return nextRetry.toISOString()
  }

  /**
   * Verifica e executa retries pendentes
   */
  async processRetries(): Promise<void> {
    try {
      const now = new Date().toISOString()
      
      // Buscar falhas que devem ser tentadas novamente
      const pendingRetries = db.prepare(`
        SELECT * FROM backup_failures 
        WHERE next_retry <= ? AND failure_count < ?
        ORDER BY next_retry ASC
      `).all(now, this.config.maxRetries) as FailedBackup[]

      if (pendingRetries.length === 0) {
        return
      }

      backupLogger.info('backup_retry', `Processando ${pendingRetries.length} retry(s) pendente(s)`)

      for (const failure of pendingRetries) {
        try {
          backupLogger.info('backup_retry', 
            `Tentativa ${failure.failure_count + 1}/${this.config.maxRetries} para empresa ${failure.empresa_nome}`
          )

          // Tentar executar o backup novamente
          const result = await forceBackupForEmpresa(failure.empresa_id)

          if (result.status === 'success') {
            // Sucesso - limpar registro de falha
            await this.clearFailure(failure.empresa_id)
            backupLogger.info('backup_retry', 
              `Retry bem-sucedido para empresa ${failure.empresa_nome}`
            )
          } else {
            // Falha novamente - registrar nova falha
            await this.recordFailure(failure.empresa_id, failure.empresa_nome, result.message)
          }

          // Aguardar entre tentativas
          await new Promise(resolve => setTimeout(resolve, 2000))

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
          await this.recordFailure(failure.empresa_id, failure.empresa_nome, errorMessage)
          backupLogger.error('backup_retry', 
            `Erro no retry para empresa ${failure.empresa_nome}: ${errorMessage}`
          )
        }
      }

      // Limpar falhas que excederam o limite máximo
      await this.cleanupMaxFailures()

    } catch (error) {
      backupLogger.error('backup_retry', `Erro ao processar retries: ${error}`)
    }
  }

  /**
   * Remove falhas que excederam o limite máximo de tentativas
   */
  private async cleanupMaxFailures(): Promise<void> {
    try {
      const maxFailures = db.prepare(`
        SELECT * FROM backup_failures 
        WHERE failure_count >= ?
      `).all(this.config.maxRetries) as FailedBackup[]

      if (maxFailures.length > 0) {
        for (const failure of maxFailures) {
          backupLogger.error('backup_retry', 
            `Empresa ${failure.empresa_nome} excedeu limite de ${this.config.maxRetries} tentativas. Removendo da fila de retry.`
          )
        }

        db.prepare(`
          DELETE FROM backup_failures 
          WHERE failure_count >= ?
        `).run(this.config.maxRetries)
      }
    } catch (error) {
      backupLogger.error('backup_retry', `Erro ao limpar falhas máximas: ${error}`)
    }
  }

  /**
   * Obtém estatísticas de falhas
   */
  getFailureStats(): { total: number, byCompany: FailedBackup[] } {
    try {
      const failures = db.prepare(`
        SELECT * FROM backup_failures 
        ORDER BY failure_count DESC, last_failure DESC
      `).all() as FailedBackup[]

      return {
        total: failures.length,
        byCompany: failures
      }
    } catch (error) {
      backupLogger.error('backup_retry', `Erro ao obter estatísticas: ${error}`)
      return { total: 0, byCompany: [] }
    }
  }

  /**
   * Atualiza configuração de retry
   */
  updateConfig(newConfig: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...newConfig }
    backupLogger.info('backup_retry', `Configuração de retry atualizada: ${JSON.stringify(this.config)}`)
  }
}

// Instância singleton
export const backupRetryManager = new BackupRetryManager()

// Funções de conveniência
export async function recordBackupFailure(empresaId: number, empresaNome: string, errorMessage: string): Promise<void> {
  return backupRetryManager.recordFailure(empresaId, empresaNome, errorMessage)
}

export async function clearBackupFailure(empresaId: number): Promise<void> {
  return backupRetryManager.clearFailure(empresaId)
}

export async function processBackupRetries(): Promise<void> {
  return backupRetryManager.processRetries()
}

export function getBackupFailureStats() {
  return backupRetryManager.getFailureStats()
}