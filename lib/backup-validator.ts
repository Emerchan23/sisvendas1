import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { db } from './db'
import { backupLogger } from './backup-logger'

interface BackupValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    fileSize: number
    recordCount: number
    tableCount: number
    checksum: string
  }
}

interface BackupIntegrityRecord {
  id?: number
  backup_file: string
  empresa_id: number
  empresa_nome: string
  file_size: number
  record_count: number
  table_count: number
  checksum: string
  validation_status: 'valid' | 'invalid' | 'warning'
  validation_errors: string
  created_at?: string
}

class BackupValidator {
  constructor() {
    this.initializeDatabase()
  }

  private initializeDatabase(): void {
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS backup_integrity (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          backup_file TEXT NOT NULL,
          empresa_id INTEGER NOT NULL,
          empresa_nome TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          record_count INTEGER NOT NULL,
          table_count INTEGER NOT NULL,
          checksum TEXT NOT NULL,
          validation_status TEXT NOT NULL,
          validation_errors TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `)
    } catch (error) {
      backupLogger.error('validation', `Erro ao inicializar tabela de integridade: ${error}`)
    }
  }

  /**
   * Valida um arquivo de backup
   */
  async validateBackupFile(filePath: string): Promise<BackupValidationResult> {
    const result: BackupValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      stats: {
        fileSize: 0,
        recordCount: 0,
        tableCount: 0,
        checksum: ''
      }
    }

    try {
      // Verificar se o arquivo existe
      if (!fs.existsSync(filePath)) {
        result.isValid = false
        result.errors.push('Arquivo de backup não encontrado')
        return result
      }

      // Obter estatísticas do arquivo
      const stats = fs.statSync(filePath)
      result.stats.fileSize = stats.size

      // Verificar se o arquivo não está vazio
      if (stats.size === 0) {
        result.isValid = false
        result.errors.push('Arquivo de backup está vazio')
        return result
      }

      // Calcular checksum
      result.stats.checksum = await this.calculateChecksum(filePath)

      // Ler e validar conteúdo JSON
      const content = fs.readFileSync(filePath, 'utf8')
      let backupData: any

      try {
        backupData = JSON.parse(content)
      } catch (parseError) {
        result.isValid = false
        result.errors.push('Arquivo de backup contém JSON inválido')
        return result
      }

      // Validar estrutura do backup
      const structureValidation = this.validateBackupStructure(backupData)
      result.errors.push(...structureValidation.errors)
      result.warnings.push(...structureValidation.warnings)
      
      if (structureValidation.errors.length > 0) {
        result.isValid = false
      }

      // Contar registros e tabelas
      if (backupData.data) {
        result.stats.tableCount = Object.keys(backupData.data).length
        result.stats.recordCount = Object.values(backupData.data)
          .reduce((total: number, tableData: any) => {
            return total + (Array.isArray(tableData) ? tableData.length : 0)
          }, 0) as number
      }

      // Validar integridade dos dados
      const dataValidation = this.validateBackupData(backupData)
      result.errors.push(...dataValidation.errors)
      result.warnings.push(...dataValidation.warnings)
      
      if (dataValidation.errors.length > 0) {
        result.isValid = false
      }

      // Salvar resultado da validação
      await this.saveValidationResult(filePath, backupData, result)

    } catch (error) {
      result.isValid = false
      result.errors.push(`Erro durante validação: ${error}`)
      backupLogger.error('validation', `Erro ao validar backup ${filePath}: ${error}`)
    }

    return result
  }

  /**
   * Valida a estrutura básica do backup
   */
  private validateBackupStructure(backupData: any): { errors: string[], warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    // Verificar campos obrigatórios
    if (!backupData.timestamp) {
      errors.push('Campo timestamp ausente')
    }

    if (!backupData.version) {
      warnings.push('Campo version ausente')
    }

    if (!backupData.empresa_id) {
      errors.push('Campo empresa_id ausente')
    }

    if (!backupData.empresa_nome) {
      errors.push('Campo empresa_nome ausente')
    }

    if (!backupData.data || typeof backupData.data !== 'object') {
      errors.push('Campo data ausente ou inválido')
    }

    // Verificar formato do timestamp
    if (backupData.timestamp) {
      const timestamp = new Date(backupData.timestamp)
      if (isNaN(timestamp.getTime())) {
        errors.push('Formato de timestamp inválido')
      }
    }

    return { errors, warnings }
  }

  /**
   * Valida os dados do backup
   */
  private validateBackupData(backupData: any): { errors: string[], warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    if (!backupData.data) {
      return { errors, warnings }
    }

    // Tabelas esperadas
    const expectedTables = [
      'clientes', 'vendas', 'acertos', 'orcamentos', 'orcamento_itens',
      'vales', 'outros_negocios', 'empresas', 'empresa_config',
      'modalidades', 'taxas', 'linhas', 'participantes',
      'despesas_pendentes', 'pagamentos_parciais', 'usuarios', 'configuracoes'
    ]

    // Verificar se tabelas críticas estão presentes
    const criticalTables = ['empresas', 'clientes', 'vendas']
    for (const table of criticalTables) {
      if (!backupData.data[table]) {
        errors.push(`Tabela crítica ausente: ${table}`)
      }
    }

    // Verificar se há tabelas vazias inesperadamente
    for (const [tableName, tableData] of Object.entries(backupData.data)) {
      if (!Array.isArray(tableData)) {
        errors.push(`Dados da tabela ${tableName} não são um array`)
        continue
      }

      // Avisar sobre tabelas importantes que estão vazias
      if (criticalTables.includes(tableName) && tableData.length === 0) {
        warnings.push(`Tabela crítica ${tableName} está vazia`)
      }
    }

    // Verificar consistência de IDs (se empresa_id está presente nos dados)
    if (backupData.empresa_id && backupData.data.empresas) {
      const empresaExists = backupData.data.empresas.some((empresa: any) => 
        empresa.id === backupData.empresa_id
      )
      
      if (!empresaExists) {
        errors.push('ID da empresa não encontrado nos dados da tabela empresas')
      }
    }

    return { errors, warnings }
  }

  /**
   * Calcula checksum MD5 do arquivo
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('md5')
      const stream = fs.createReadStream(filePath)
      
      stream.on('data', data => hash.update(data))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', reject)
    })
  }

  /**
   * Salva resultado da validação no banco
   */
  private async saveValidationResult(
    filePath: string, 
    backupData: any, 
    result: BackupValidationResult
  ): Promise<void> {
    try {
      const fileName = path.basename(filePath)
      const status = result.isValid ? 'valid' : (result.warnings.length > 0 ? 'warning' : 'invalid')
      const errors = [...result.errors, ...result.warnings].join('; ')

      db.prepare(`
        INSERT INTO backup_integrity 
        (backup_file, empresa_id, empresa_nome, file_size, record_count, 
         table_count, checksum, validation_status, validation_errors)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileName,
        backupData.empresa_id || 0,
        backupData.empresa_nome || 'Desconhecida',
        result.stats.fileSize,
        result.stats.recordCount,
        result.stats.tableCount,
        result.stats.checksum,
        status,
        errors || null
      )

      backupLogger.info('validation', 
        `Validação salva para ${fileName}: ${status} (${result.stats.recordCount} registros)`
      )
    } catch (error) {
      backupLogger.error('validation', `Erro ao salvar validação: ${error}`)
    }
  }

  /**
   * Valida todos os backups em um diretório
   */
  async validateBackupsInDirectory(backupDir: string): Promise<BackupValidationResult[]> {
    const results: BackupValidationResult[] = []

    try {
      if (!fs.existsSync(backupDir)) {
        backupLogger.warn('validation', `Diretório de backup não encontrado: ${backupDir}`)
        return results
      }

      const files = fs.readdirSync(backupDir)
      const backupFiles = files.filter(file => file.endsWith('.json'))

      backupLogger.info('validation', `Validando ${backupFiles.length} arquivo(s) de backup`)

      for (const file of backupFiles) {
        const filePath = path.join(backupDir, file)
        const result = await this.validateBackupFile(filePath)
        results.push(result)

        // Log do resultado
        if (result.isValid) {
          backupLogger.info('validation', `✅ ${file}: Válido`)
        } else {
          backupLogger.error('validation', `❌ ${file}: ${result.errors.join(', ')}`)
        }
      }

    } catch (error) {
      backupLogger.error('validation', `Erro ao validar diretório: ${error}`)
    }

    return results
  }

  /**
   * Obtém histórico de validações
   */
  getValidationHistory(limit: number = 50): BackupIntegrityRecord[] {
    try {
      return db.prepare(`
        SELECT * FROM backup_integrity 
        ORDER BY created_at DESC 
        LIMIT ?
      `).all(limit) as BackupIntegrityRecord[]
    } catch (error) {
      backupLogger.error('validation', `Erro ao buscar histórico: ${error}`)
      return []
    }
  }

  /**
   * Obtém estatísticas de validação
   */
  getValidationStats(): { total: number, valid: number, invalid: number, warnings: number } {
    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN validation_status = 'valid' THEN 1 ELSE 0 END) as valid,
          SUM(CASE WHEN validation_status = 'invalid' THEN 1 ELSE 0 END) as invalid,
          SUM(CASE WHEN validation_status = 'warning' THEN 1 ELSE 0 END) as warnings
        FROM backup_integrity
      `).get() as any

      return {
        total: stats.total || 0,
        valid: stats.valid || 0,
        invalid: stats.invalid || 0,
        warnings: stats.warnings || 0
      }
    } catch (error) {
      backupLogger.error('validation', `Erro ao obter estatísticas: ${error}`)
      return { total: 0, valid: 0, invalid: 0, warnings: 0 }
    }
  }

  /**
   * Remove registros de validação antigos
   */
  cleanupOldValidations(daysToKeep: number = 30): number {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
      
      const result = db.prepare(`
        DELETE FROM backup_integrity 
        WHERE created_at < ?
      `).run(cutoffDate.toISOString())

      if (result.changes > 0) {
        backupLogger.info('validation', 
          `Removidos ${result.changes} registro(s) de validação antigos`
        )
      }

      return result.changes
    } catch (error) {
      backupLogger.error('validation', `Erro ao limpar validações antigas: ${error}`)
      return 0
    }
  }
}

// Instância singleton
export const backupValidator = new BackupValidator()

// Funções de conveniência
export async function validateBackup(filePath: string): Promise<BackupValidationResult> {
  return backupValidator.validateBackupFile(filePath)
}

export async function validateAllBackups(backupDir: string): Promise<BackupValidationResult[]> {
  return backupValidator.validateBackupsInDirectory(backupDir)
}

export function getBackupValidationHistory(limit?: number): BackupIntegrityRecord[] {
  return backupValidator.getValidationHistory(limit)
}

export function getBackupValidationStats() {
  return backupValidator.getValidationStats()
}