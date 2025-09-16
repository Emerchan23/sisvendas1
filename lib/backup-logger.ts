import * as fs from 'fs'
import * as path from 'path'

export interface BackupLogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  action: 'scheduler_start' | 'scheduler_stop' | 'backup_check' | 'backup_start' | 'backup_complete' | 'backup_error' | 'cleanup' | 'validation' | 'backup_retry' | 'scheduler' | 'notification_init' | 'notification_config' | 'notification_success' | 'notification_failure' | 'notification_retry' | 'backup_cleanup' | 'management_api' | 'notification_recipients'
  empresaId?: number
  empresaNome?: string
  message: string
  details?: any
  duration?: number
  backupFile?: string
  fileSize?: number
  error?: string
}

export class BackupLogger {
  private logsDir: string
  private currentLogFile: string
  private maxLogSize = 10 * 1024 * 1024 // 10MB
  private maxLogFiles = 30 // Manter 30 arquivos de log

  constructor() {
    this.logsDir = path.resolve(process.cwd(), 'logs')
    this.currentLogFile = this.getCurrentLogFile()
    this.ensureLogsDirectory()
  }

  private ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true })
    }
  }

  private getCurrentLogFile(): string {
    const today = new Date().toISOString().split('T')[0]
    return path.join(this.logsDir, `backup-${today}.log`)
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  private rotateLogsIfNeeded() {
    try {
      if (fs.existsSync(this.currentLogFile)) {
        const stats = fs.statSync(this.currentLogFile)
        if (stats.size > this.maxLogSize) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
          const rotatedFile = this.currentLogFile.replace('.log', `-${timestamp}.log`)
          fs.renameSync(this.currentLogFile, rotatedFile)
        }
      }

      // Limpar logs antigos
      this.cleanOldLogs()
    } catch (error) {
      console.error('Erro ao rotacionar logs:', error)
    }
  }

  private cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logsDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logsDir, file),
          mtime: fs.statSync(path.join(this.logsDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

      // Manter apenas os arquivos mais recentes
      if (files.length > this.maxLogFiles) {
        const filesToDelete = files.slice(this.maxLogFiles)
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file.path)
          } catch (error) {
            console.error(`Erro ao deletar log antigo ${file.name}:`, error)
          }
        })
      }
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error)
    }
  }

  log(entry: Omit<BackupLogEntry, 'id' | 'timestamp'>) {
    try {
      this.rotateLogsIfNeeded()
      
      const logEntry: BackupLogEntry = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        ...entry
      }

      const logLine = JSON.stringify(logEntry) + '\n'
      
      // Atualizar arquivo atual se mudou o dia
      const newLogFile = this.getCurrentLogFile()
      if (newLogFile !== this.currentLogFile) {
        this.currentLogFile = newLogFile
      }

      fs.appendFileSync(this.currentLogFile, logLine)

      // Log no console também para desenvolvimento
      const emoji = this.getEmojiForLevel(entry.level)
      const timestamp = new Date().toLocaleString('pt-BR')
      console.log(`${emoji} [${timestamp}] ${entry.action.toUpperCase()}: ${entry.message}`)
      
      if (entry.details) {
        console.log('   Detalhes:', entry.details)
      }

    } catch (error) {
      console.error('Erro ao escrever log:', error)
    }
  }

  private getEmojiForLevel(level: string): string {
    switch (level) {
      case 'success': return '✅'
      case 'info': return 'ℹ️'
      case 'warn': return '⚠️'
      case 'error': return '❌'
      default: return '📝'
    }
  }

  // Métodos de conveniência
  info(action: BackupLogEntry['action'], message: string, details?: any) {
    this.log({ level: 'info', action, message, details })
  }

  success(action: BackupLogEntry['action'], message: string, details?: any) {
    this.log({ level: 'success', action, message, details })
  }

  warn(action: BackupLogEntry['action'], message: string, details?: any) {
    this.log({ level: 'warn', action, message, details })
  }

  error(action: BackupLogEntry['action'], message: string, error?: any, details?: any) {
    this.log({ 
      level: 'error', 
      action, 
      message, 
      error: error instanceof Error ? error.message : String(error),
      details 
    })
  }

  // Métodos para logs específicos de backup
  logSchedulerStart() {
    this.success('scheduler_start', 'Scheduler de backup automático iniciado')
  }

  logSchedulerStop() {
    this.info('scheduler_stop', 'Scheduler de backup automático parado')
  }

  logBackupCheck(empresasEncontradas: number) {
    this.info('backup_check', `Verificação de backup executada`, {
      empresasEncontradas
    })
  }

  logBackupStart(empresaId: number, empresaNome: string) {
    this.info('backup_start', `Iniciando backup para empresa: ${empresaNome}`, {
      empresaId,
      empresaNome
    })
  }

  logBackupComplete(empresaId: number, empresaNome: string, backupFile: string, fileSize: number, duration: number) {
    this.success('backup_complete', `Backup concluído para empresa: ${empresaNome}`, {
      empresaId,
      empresaNome,
      backupFile,
      fileSize,
      duration,
      fileSizeMB: Math.round(fileSize / 1024 / 1024 * 100) / 100
    })
  }

  logBackupError(empresaId: number, empresaNome: string, error: any) {
    this.error('backup_error', `Erro no backup para empresa: ${empresaNome}`, error, {
      empresaId,
      empresaNome
    })
  }

  logCleanup(deletedFiles: number, freedSpace: number) {
    this.info('cleanup', `Limpeza de backups antigos concluída`, {
      deletedFiles,
      freedSpace,
      freedSpaceMB: Math.round(freedSpace / 1024 / 1024 * 100) / 100
    })
  }

  logValidation(backupFile: string, isValid: boolean, details?: any) {
    if (isValid) {
      this.success('validation', `Backup validado com sucesso: ${path.basename(backupFile)}`, details)
    } else {
      this.error('validation', `Falha na validação do backup: ${path.basename(backupFile)}`, null, details)
    }
  }

  // Método para ler logs recentes
  getRecentLogs(limit: number = 100): BackupLogEntry[] {
    try {
      const logs: BackupLogEntry[] = []
      
      // Ler arquivo de log atual
      if (fs.existsSync(this.currentLogFile)) {
        const content = fs.readFileSync(this.currentLogFile, 'utf-8')
        const lines = content.trim().split('\n').filter(line => line.trim())
        
        for (const line of lines.reverse()) {
          try {
            const entry = JSON.parse(line)
            logs.push(entry)
            if (logs.length >= limit) break
          } catch (error) {
            // Ignorar linhas malformadas
          }
        }
      }

      // Se precisar de mais logs, ler arquivos anteriores
      if (logs.length < limit) {
        const files = fs.readdirSync(this.logsDir)
          .filter(file => file.startsWith('backup-') && file.endsWith('.log') && file !== path.basename(this.currentLogFile))
          .map(file => ({
            name: file,
            path: path.join(this.logsDir, file),
            mtime: fs.statSync(path.join(this.logsDir, file)).mtime
          }))
          .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

        for (const file of files) {
          if (logs.length >= limit) break
          
          try {
            const content = fs.readFileSync(file.path, 'utf-8')
            const lines = content.trim().split('\n').filter(line => line.trim())
            
            for (const line of lines.reverse()) {
              try {
                const entry = JSON.parse(line)
                logs.push(entry)
                if (logs.length >= limit) break
              } catch (error) {
                // Ignorar linhas malformadas
              }
            }
          } catch (error) {
            console.error(`Erro ao ler arquivo de log ${file.name}:`, error)
          }
        }
      }

      return logs.slice(0, limit)
    } catch (error) {
      console.error('Erro ao ler logs recentes:', error)
      return []
    }
  }

  // Método para obter estatísticas dos logs
  getLogStats(): {
    totalLogs: number
    logsByLevel: Record<string, number>
    logsByAction: Record<string, number>
    lastBackup?: string
    totalBackups: number
    successfulBackups: number
    failedBackups: number
  } {
    const logs = this.getRecentLogs(1000) // Analisar últimos 1000 logs
    
    const stats = {
      totalLogs: logs.length,
      logsByLevel: {} as Record<string, number>,
      logsByAction: {} as Record<string, number>,
      lastBackup: undefined as string | undefined,
      totalBackups: 0,
      successfulBackups: 0,
      failedBackups: 0
    }

    for (const log of logs) {
      // Contar por nível
      stats.logsByLevel[log.level] = (stats.logsByLevel[log.level] || 0) + 1
      
      // Contar por ação
      stats.logsByAction[log.action] = (stats.logsByAction[log.action] || 0) + 1
      
      // Estatísticas de backup
      if (log.action === 'backup_complete') {
        stats.totalBackups++
        stats.successfulBackups++
        if (!stats.lastBackup || log.timestamp > stats.lastBackup) {
          stats.lastBackup = log.timestamp
        }
      } else if (log.action === 'backup_error') {
        stats.totalBackups++
        stats.failedBackups++
      }
    }

    return stats
  }
}

// Instância singleton
export const backupLogger = new BackupLogger()