import fs from 'fs'
import path from 'path'
import { db } from './db'
import { backupLogger } from './backup-logger'

interface BackupFile {
  name: string
  path: string
  size: number
  created: Date
  empresa_id: number
  empresa_nome: string
}

interface CleanupStats {
  filesRemoved: number
  spaceFreed: number
  oldestKept: Date | null
  newestRemoved: Date | null
}

class BackupCleaner {
  /**
   * Limpa backups antigos baseado na configuração
   */
  async cleanupOldBackups(): Promise<CleanupStats> {
    const stats: CleanupStats = {
      filesRemoved: 0,
      spaceFreed: 0,
      oldestKept: null,
      newestRemoved: null
    }

    try {
      // Buscar todas as empresas com configuração de backup
      const empresas = db.prepare(`
        SELECT 
          e.id, e.nome,
          COALESCE(ec.backup_frequency, 'daily') as frequency,
          COALESCE(ec.max_backups, 7) as max_backups,
          COALESCE(ec.backup_retention_days, 30) as retention_days
        FROM empresas e
        LEFT JOIN empresa_config ec ON e.id = ec.empresa_id
        WHERE e.ativo = 1
      `).all() as any[]

      backupLogger.info('backup_cleanup', `Iniciando limpeza para ${empresas.length} empresa(s)`)

      for (const empresa of empresas) {
        const empresaStats = await this.cleanupBackupsForEmpresa(
          empresa.id,
          empresa.nome,
          empresa.max_backups,
          empresa.retention_days
        )

        stats.filesRemoved += empresaStats.filesRemoved
        stats.spaceFreed += empresaStats.spaceFreed
        
        if (empresaStats.oldestKept && (!stats.oldestKept || empresaStats.oldestKept < stats.oldestKept)) {
          stats.oldestKept = empresaStats.oldestKept
        }
        
        if (empresaStats.newestRemoved && (!stats.newestRemoved || empresaStats.newestRemoved > stats.newestRemoved)) {
          stats.newestRemoved = empresaStats.newestRemoved
        }
      }

      // Limpar registros de validação antigos
      await this.cleanupValidationRecords()

      // Limpar logs antigos
      await this.cleanupOldLogs()

      if (stats.filesRemoved > 0) {
        backupLogger.info('backup_cleanup', 
          `Limpeza concluída: ${stats.filesRemoved} arquivo(s) removido(s), ${(stats.spaceFreed / 1024 / 1024).toFixed(2)} MB liberados`
        )
      } else {
        backupLogger.info('backup_cleanup', 'Limpeza concluída: nenhum arquivo removido')
      }

    } catch (error) {
      backupLogger.error('backup_cleanup', `Erro durante limpeza: ${error}`)
    }

    return stats
  }

  /**
   * Limpa backups de uma empresa específica
   */
  private async cleanupBackupsForEmpresa(
    empresaId: number,
    empresaNome: string,
    maxBackups: number,
    retentionDays: number
  ): Promise<CleanupStats> {
    const stats: CleanupStats = {
      filesRemoved: 0,
      spaceFreed: 0,
      oldestKept: null,
      newestRemoved: null
    }

    try {
      const backupDir = path.join(process.cwd(), 'backups', empresaNome.replace(/[^a-zA-Z0-9]/g, '_'))
      
      if (!fs.existsSync(backupDir)) {
        return stats
      }

      // Listar todos os arquivos de backup
      const backupFiles = await this.getBackupFiles(backupDir, empresaId, empresaNome)
      
      if (backupFiles.length === 0) {
        return stats
      }

      // Ordenar por data (mais recente primeiro)
      backupFiles.sort((a, b) => b.created.getTime() - a.created.getTime())

      // Calcular data limite para retenção
      const retentionDate = new Date()
      retentionDate.setDate(retentionDate.getDate() - retentionDays)

      // Determinar quais arquivos remover
      const filesToRemove: BackupFile[] = []
      
      // Remover por quantidade (manter apenas os N mais recentes)
      if (backupFiles.length > maxBackups) {
        filesToRemove.push(...backupFiles.slice(maxBackups))
      }
      
      // Remover por idade (mais antigos que retention_days)
      for (const file of backupFiles) {
        if (file.created < retentionDate && !filesToRemove.includes(file)) {
          filesToRemove.push(file)
        }
      }

      // Remover arquivos
      for (const file of filesToRemove) {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path)
            stats.filesRemoved++
            stats.spaceFreed += file.size
            
            if (!stats.newestRemoved || file.created > stats.newestRemoved) {
              stats.newestRemoved = file.created
            }
            
            backupLogger.info('backup_cleanup', 
              `Removido: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`
            )
          }
        } catch (error) {
          backupLogger.error('backup_cleanup', `Erro ao remover ${file.name}: ${error}`)
        }
      }

      // Determinar o mais antigo mantido
      const keptFiles = backupFiles.filter(f => !filesToRemove.includes(f))
      if (keptFiles.length > 0) {
        stats.oldestKept = keptFiles[keptFiles.length - 1].created
      }

      if (stats.filesRemoved > 0) {
        backupLogger.info('backup_cleanup', 
          `${empresaNome}: ${stats.filesRemoved} arquivo(s) removido(s), ${keptFiles.length} mantido(s)`
        )
      }

    } catch (error) {
      backupLogger.error('backup_cleanup', `Erro ao limpar backups de ${empresaNome}: ${error}`)
    }

    return stats
  }

  /**
   * Obtém lista de arquivos de backup de um diretório
   */
  private async getBackupFiles(backupDir: string, empresaId: number, empresaNome: string): Promise<BackupFile[]> {
    const files: BackupFile[] = []

    try {
      const dirFiles = fs.readdirSync(backupDir)
      
      for (const fileName of dirFiles) {
        if (!fileName.endsWith('.json')) continue
        
        const filePath = path.join(backupDir, fileName)
        const stats = fs.statSync(filePath)
        
        // Extrair data do nome do arquivo (formato: backup_EMPRESA_YYYYMMDD_HHMMSS.json)
        const dateMatch = fileName.match(/_([0-9]{8}_[0-9]{6})\.json$/)
        let fileDate = stats.birthtime
        
        if (dateMatch) {
          const dateStr = dateMatch[1]
          const year = parseInt(dateStr.substr(0, 4))
          const month = parseInt(dateStr.substr(4, 2)) - 1
          const day = parseInt(dateStr.substr(6, 2))
          const hour = parseInt(dateStr.substr(9, 2))
          const minute = parseInt(dateStr.substr(11, 2))
          const second = parseInt(dateStr.substr(13, 2))
          
          fileDate = new Date(year, month, day, hour, minute, second)
        }
        
        files.push({
          name: fileName,
          path: filePath,
          size: stats.size,
          created: fileDate,
          empresa_id: empresaId,
          empresa_nome: empresaNome
        })
      }
    } catch (error) {
      backupLogger.error('backup_cleanup', `Erro ao listar arquivos em ${backupDir}: ${error}`)
    }

    return files
  }

  /**
   * Limpa registros de validação antigos
   */
  private async cleanupValidationRecords(): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 90) // Manter 90 dias
      
      const result = db.prepare(`
        DELETE FROM backup_integrity 
        WHERE created_at < ?
      `).run(cutoffDate.toISOString())

      if (result.changes > 0) {
        backupLogger.info('backup_cleanup', 
          `Removidos ${result.changes} registro(s) de validação antigos`
        )
      }
    } catch (error) {
      backupLogger.error('backup_cleanup', `Erro ao limpar registros de validação: ${error}`)
    }
  }

  /**
   * Limpa logs antigos
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 60) // Manter 60 dias
      
      const result = db.prepare(`
        DELETE FROM backup_logs 
        WHERE created_at < ?
      `).run(cutoffDate.toISOString())

      if (result.changes > 0) {
        backupLogger.info('backup_cleanup', 
          `Removidos ${result.changes} log(s) antigo(s)`
        )
      }
    } catch (error) {
      backupLogger.error('backup_cleanup', `Erro ao limpar logs antigos: ${error}`)
    }
  }

  /**
   * Obtém estatísticas de uso de espaço
   */
  async getStorageStats(): Promise<{
    totalFiles: number
    totalSize: number
    byEmpresa: Array<{
      empresa_id: number
      empresa_nome: string
      fileCount: number
      totalSize: number
      oldestBackup: Date | null
      newestBackup: Date | null
    }>
  }> {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      byEmpresa: [] as any[]
    }

    try {
      const empresas = db.prepare(`
        SELECT id, nome FROM empresas WHERE ativo = 1
      `).all() as any[]

      for (const empresa of empresas) {
        const backupDir = path.join(process.cwd(), 'backups', empresa.nome.replace(/[^a-zA-Z0-9]/g, '_'))
        
        if (!fs.existsSync(backupDir)) {
          continue
        }

        const backupFiles = await this.getBackupFiles(backupDir, empresa.id, empresa.nome)
        
        if (backupFiles.length === 0) {
          continue
        }

        const empresaSize = backupFiles.reduce((sum, file) => sum + file.size, 0)
        const dates = backupFiles.map(f => f.created).sort((a, b) => a.getTime() - b.getTime())
        
        stats.byEmpresa.push({
          empresa_id: empresa.id,
          empresa_nome: empresa.nome,
          fileCount: backupFiles.length,
          totalSize: empresaSize,
          oldestBackup: dates[0] || null,
          newestBackup: dates[dates.length - 1] || null
        })

        stats.totalFiles += backupFiles.length
        stats.totalSize += empresaSize
      }
    } catch (error) {
      backupLogger.error('backup_cleanup', `Erro ao obter estatísticas: ${error}`)
    }

    return stats
  }

  /**
   * Força limpeza de uma empresa específica
   */
  async forceCleanupEmpresa(empresaId: number): Promise<CleanupStats> {
    try {
      const empresa = db.prepare(`
        SELECT 
          e.id, e.nome,
          COALESCE(ec.max_backups, 7) as max_backups,
          COALESCE(ec.backup_retention_days, 30) as retention_days
        FROM empresas e
        LEFT JOIN empresa_config ec ON e.id = ec.empresa_id
        WHERE e.id = ? AND e.ativo = 1
      `).get(empresaId) as any

      if (!empresa) {
        throw new Error('Empresa não encontrada ou inativa')
      }

      backupLogger.info('backup_cleanup', `Forçando limpeza para empresa: ${empresa.nome}`)
      
      return await this.cleanupBackupsForEmpresa(
        empresa.id,
        empresa.nome,
        empresa.max_backups,
        empresa.retention_days
      )
    } catch (error) {
      backupLogger.error('backup_cleanup', `Erro ao forçar limpeza: ${error}`)
      throw error
    }
  }
}

// Instância singleton
export const backupCleaner = new BackupCleaner()

// Funções de conveniência
export async function cleanupOldBackups(): Promise<CleanupStats> {
  return backupCleaner.cleanupOldBackups()
}

export async function getBackupStorageStats() {
  return backupCleaner.getStorageStats()
}

export async function forceCleanupEmpresa(empresaId: number): Promise<CleanupStats> {
  return backupCleaner.forceCleanupEmpresa(empresaId)
}