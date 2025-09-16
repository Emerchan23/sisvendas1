/**
 * Scheduler de backup automático
 * Executa verificações de backup usando cron jobs
 */

import * as cron from 'node-cron'
import { checkAndExecuteBackups } from '../lib/backup-service'
import { backupLogger } from '../lib/backup-logger'
import { processBackupRetries } from '../lib/backup-retry'
import { cleanupOldBackups } from '../lib/backup-cleaner'

class BackupScheduler {
  private cronJob: cron.ScheduledTask | null = null
  private isRunning = false
  private readonly CRON_PATTERN = '0 * * * *' // A cada hora no minuto 0

  start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler de backup já está em execução')
      return
    }

    console.log('🚀 Iniciando scheduler de backup automático...')
    
    // Criar cron job
    this.cronJob = cron.schedule(this.CRON_PATTERN, async () => {
      await this.executeCheck()
      
      // Processar retries de backups falhados
      backupLogger.info('backup_retry', 'Processando retries de backups falhados...')
      await processBackupRetries()
      
      // Executar limpeza de backups antigos (uma vez por dia às 02:00)
      const now = new Date()
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        backupLogger.info('scheduler', 'Executando limpeza de backups antigos...')
        try {
          const cleanupStats = await cleanupOldBackups()
          if (cleanupStats.filesRemoved > 0) {
            backupLogger.info('scheduler', 
              `Limpeza concluída: ${cleanupStats.filesRemoved} arquivo(s) removido(s), ${(cleanupStats.spaceFreed / 1024 / 1024).toFixed(2)} MB liberados`
            )
          }
        } catch (error) {
          backupLogger.error('scheduler', `Erro na limpeza automática: ${error}`)
        }
      }
    }, {
      timezone: 'America/Sao_Paulo'
    })

    // Iniciar o cron job
    this.cronJob.start()
    this.isRunning = true

    console.log(`✅ Scheduler configurado com padrão cron: ${this.CRON_PATTERN} (a cada hora)`)
    
    // Executar verificação inicial após 30 segundos
    setTimeout(() => {
      this.executeCheck()
    }, 30000)
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Scheduler de backup não está em execução')
      return
    }

    console.log('🛑 Parando scheduler de backup...')
    
    if (this.cronJob) {
      this.cronJob.stop()
      this.cronJob.destroy()
      this.cronJob = null
    }
    
    this.isRunning = false
    console.log('✅ Scheduler de backup parado')
  }

  private async executeCheck() {
    try {
      const timestamp = new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo'
      })
      console.log(`🔍 [${timestamp}] Executando verificação de backup automático...`)
      
      await checkAndExecuteBackups()
      
      console.log(`✅ [${timestamp}] Verificação de backup concluída`)
    } catch (error) {
      console.error('❌ Erro durante verificação de backup:', error)
      // Log do erro para análise posterior
      this.logError(error)
    }
  }

  private logError(error: any) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: 'scheduler_error'
    }
    
    console.error('📝 Log de erro do scheduler:', JSON.stringify(errorLog, null, 2))
  }

  isActive() {
    return this.isRunning
  }

  getStatus() {
    return {
      active: this.isRunning,
      cronPattern: this.CRON_PATTERN,
      nextExecution: this.cronJob ? 'A cada hora no minuto 0' : null,
      timezone: 'America/Sao_Paulo'
    }
  }
}

// Instância global do scheduler
const backupScheduler = new BackupScheduler()

// Funções exportadas para controle externo
export function startBackupScheduler() {
  if (backupScheduler.isActive()) {
    backupLogger.warn('scheduler_start', 'Scheduler já está em execução')
    return
  }

  backupLogger.info('scheduler_start', 'Iniciando scheduler de backup automático...')
  backupScheduler.start()
  backupLogger.logSchedulerStart()
}

export function stopBackupScheduler() {
  if (!backupScheduler.isActive()) {
    backupLogger.warn('scheduler_stop', 'Scheduler não estava em execução')
    return
  }
  
  backupScheduler.stop()
  backupLogger.logSchedulerStop()
}

export function isSchedulerActive() {
  return backupScheduler.isActive()
}

export function getSchedulerStatus() {
  return backupScheduler.getStatus()
}

export async function forceBackupCheck() {
  console.log('🔧 Executando verificação forçada de backup...')
  await checkAndExecuteBackups()
}

// Auto-inicializar em produção e desenvolvimento
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
  console.log('🔄 Auto-iniciando scheduler de backup...')
  // Aguardar um pouco para garantir que tudo esteja carregado
  setTimeout(() => {
    startBackupScheduler()
  }, 5000)
}

export default backupScheduler