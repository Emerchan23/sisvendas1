import { db } from './db'
import fs from 'fs'
import path from 'path'
import { backupLogger } from './backup-logger'
import { recordBackupFailure, clearBackupFailure } from './backup-retry'
import { notifyBackupSuccess, notifyBackupFailure } from './backup-notifications'
import { validateBackup } from './backup-validator'

interface BackupConfig {
  id: number
  nome: string
  auto_backup_enabled: number
  backup_frequency: string
  backup_time: string
  keep_local_backup: number
  max_backups: number
  last_backup: string | null
}

interface BackupLog {
  timestamp: string
  empresa_id: number
  status: 'success' | 'error'
  message: string
  backup_size?: number
  duration?: number
}

/**
 * Verifica se é hora de executar backup para uma empresa
 */
function shouldExecuteBackup(empresa: BackupConfig): boolean {
  if (!empresa.auto_backup_enabled) {
    return false
  }

  const now = new Date()
  const currentTime = now.toTimeString().slice(0, 5) // HH:MM
  const [targetHour, targetMinute] = empresa.backup_time.split(':').map(Number)
  
  // Verificar se é o horário correto (com tolerância de 1 minuto)
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  
  const isCorrectTime = currentHour === targetHour && 
    Math.abs(currentMinute - targetMinute) <= 1
  
  if (!isCorrectTime) {
    return false
  }

  // Verificar frequência
  if (!empresa.last_backup) {
    return true // Primeiro backup
  }

  const lastBackup = new Date(empresa.last_backup)
  const timeDiff = now.getTime() - lastBackup.getTime()
  const hoursDiff = timeDiff / (1000 * 60 * 60)

  switch (empresa.backup_frequency) {
    case 'daily':
      return hoursDiff >= 23 // Pelo menos 23 horas desde o último backup
    case 'weekly':
      return hoursDiff >= 167 // 7 dias - 1 hora
    case 'monthly':
      return hoursDiff >= 719 // 30 dias - 1 hora
    default:
      return false
  }
}

/**
 * Executa backup para uma empresa específica
 */
async function executeBackupForEmpresa(empresa: BackupConfig): Promise<BackupLog> {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  
  try {
    backupLogger.logBackupStart(empresa.id, empresa.nome)
    console.log(`🔄 Iniciando backup automático para empresa: ${empresa.nome}`)
    
    // Exportar todas as tabelas principais
    const tables = [
      'clientes',
      'vendas', 
      'acertos',
      'orcamentos',
      'orcamento_itens',
      'vales',
      'outros_negocios',
      'empresas',
      'empresa_config',
      'modalidades',
      'taxas',
      'linhas',
      'participantes',
      'despesas_pendentes',
      'pagamentos_parciais',
      'usuarios',
      'configuracoes'
    ]
    
    const backup = {
      timestamp,
      version: '1.0',
      empresa_id: empresa.id,
      empresa_nome: empresa.nome,
      data: {} as Record<string, unknown[]>
    }
    
    // Exportar dados de cada tabela
    let totalRecords = 0
    for (const table of tables) {
      try {
        const rows = db.prepare(`SELECT * FROM ${table}`).all()
        backup.data[table] = rows
        totalRecords += rows.length
        console.log(`  ✅ ${table}: ${rows.length} registros`)
      } catch (error) {
        console.warn(`  ⚠️ Tabela ${table} não encontrada:`, error)
        backup.data[table] = []
      }
    }
    
    // Salvar backup localmente se configurado
    let backupSize = 0
    if (empresa.keep_local_backup) {
      const backupDir = path.join(process.cwd(), 'backups', 'automatic')
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }
      
      const filename = `backup_${empresa.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp.replace(/[:.]/g, '-')}.json`
      const filepath = path.join(backupDir, filename)
      
      const backupContent = JSON.stringify(backup, null, 2)
      fs.writeFileSync(filepath, backupContent)
      backupSize = Buffer.byteLength(backupContent, 'utf8')
      
      console.log(`  💾 Backup salvo: ${filename} (${(backupSize / 1024).toFixed(2)} KB)`)
      
      // Validar integridade do backup
      backupLogger.info('validation', `Validando integridade do backup: ${filename}`)
      const validationResult = await validateBackup(filepath)
      
      if (!validationResult.isValid) {
        const errorMessage = `Backup falhou na validação: ${validationResult.errors.join(', ')}`
        console.error(`  ❌ ${errorMessage}`)
        
        // Registrar falha de validação
        await recordBackupFailure(empresa.id, empresa.nome, errorMessage)
        await notifyBackupFailure(empresa.id, empresa.nome, errorMessage)
        
        throw new Error(errorMessage)
      }
      
      if (validationResult.warnings.length > 0) {
        backupLogger.warn('validation', 
          `Backup com avisos: ${validationResult.warnings.join(', ')}`
        )
        console.warn(`  ⚠️ Backup com avisos: ${validationResult.warnings.join(', ')}`)
      }
      
      backupLogger.info('validation', 
        `Backup validado: ${validationResult.stats.recordCount} registros, ${validationResult.stats.tableCount} tabelas`
      )
      console.log(`  ✅ Backup validado: ${validationResult.stats.recordCount} registros, ${validationResult.stats.tableCount} tabelas`)
      
      // Limpar backups antigos
      await cleanOldBackups(empresa, backupDir)
    }
    
    // Atualizar timestamp do último backup
    db.prepare(`
      UPDATE empresas 
      SET last_backup = ? 
      WHERE id = ?
    `).run(timestamp, empresa.id)
    
    const duration = Date.now() - startTime
    console.log(`✅ Backup concluído para ${empresa.nome} em ${duration}ms`)
    
    const successLog = {
      timestamp,
      empresa_id: empresa.id,
      status: 'success' as const,
      message: `Backup executado com sucesso. ${totalRecords} registros exportados.`,
      backup_size: backupSize,
      duration
    }
    
    backupLogger.logBackupComplete(empresa.id, empresa.nome, `backup_${empresa.nome}_${timestamp}.json`, backupSize, duration)
    
    // Limpar falhas anteriores em caso de sucesso
    await clearBackupFailure(empresa.id)
    
    // Enviar notificação de sucesso
    await notifyBackupSuccess(empresa.id, empresa.nome, totalRecords, backupSize, duration)
    
    return successLog
    
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    console.error(`❌ Erro no backup para ${empresa.nome}:`, error)
    
    const errorLog = {
      timestamp,
      empresa_id: empresa.id,
      status: 'error' as const,
      message: `Erro no backup: ${errorMessage}`,
      duration
    }
    
    backupLogger.logBackupError(empresa.id, empresa.nome, errorMessage)
    
    // Registrar falha para retry automático
    await recordBackupFailure(empresa.id, empresa.nome, errorMessage)
    
    // Enviar notificação de falha
    await notifyBackupFailure(empresa.id, empresa.nome, errorMessage)
    
    return errorLog
  }
}

/**
 * Remove backups antigos baseado na configuração max_backups
 */
async function cleanOldBackups(empresa: BackupConfig, backupDir: string): Promise<void> {
  try {
    const files = fs.readdirSync(backupDir)
    const empresaFiles = files
      .filter(file => file.includes(empresa.nome.replace(/[^a-zA-Z0-9]/g, '_')))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        mtime: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
    
    if (empresaFiles.length > empresa.max_backups) {
      const filesToDelete = empresaFiles.slice(empresa.max_backups)
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path)
        console.log(`  🗑️ Backup antigo removido: ${file.name}`)
      }
    }
  } catch (error) {
    console.warn('Erro ao limpar backups antigos:', error)
  }
}

/**
 * Salva log de backup no banco de dados
 */
function saveBackupLog(log: BackupLog): void {
  try {
    // Criar tabela de logs se não existir
    db.exec(`
      CREATE TABLE IF NOT EXISTS backup_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        empresa_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        message TEXT NOT NULL,
        backup_size INTEGER,
        duration INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    db.prepare(`
      INSERT INTO backup_logs (timestamp, empresa_id, status, message, backup_size, duration)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      log.timestamp,
      log.empresa_id,
      log.status,
      log.message,
      log.backup_size || null,
      log.duration || null
    )
  } catch (error) {
    console.error('Erro ao salvar log de backup:', error)
  }
}

/**
 * Função principal que verifica e executa backups automáticos
 */
export async function checkAndExecuteBackups(): Promise<void> {
  try {
    backupLogger.info('backup_check', 'Verificando agendamentos de backup...')
    console.log('🔍 Verificando agendamentos de backup...')
    
    // Buscar empresas com backup automático habilitado
    const empresas = db.prepare(`
      SELECT id, nome, auto_backup_enabled, backup_frequency, 
             backup_time, keep_local_backup, max_backups, last_backup
      FROM empresas 
      WHERE auto_backup_enabled = 1
    `).all() as BackupConfig[]
    
    if (empresas.length === 0) {
      console.log('ℹ️ Nenhuma empresa com backup automático habilitado')
      return
    }
    
    console.log(`📋 Encontradas ${empresas.length} empresa(s) com backup automático`)
    
    for (const empresa of empresas) {
      if (shouldExecuteBackup(empresa)) {
        console.log(`⏰ Executando backup para: ${empresa.nome}`)
        const log = await executeBackupForEmpresa(empresa)
        saveBackupLog(log)
        
        // Aguardar um pouco entre backups para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 1000))
      } else {
        console.log(`⏭️ Backup não necessário para: ${empresa.nome}`)
      }
    }
    
    console.log('✅ Verificação de backups concluída')
    
  } catch (error) {
    console.error('❌ Erro na verificação de backups:', error)
  }
}

/**
 * Obtém logs de backup recentes
 */
export function getRecentBackupLogs(limit: number = 50): BackupLog[] {
  try {
    return db.prepare(`
      SELECT * FROM backup_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `).all(limit) as BackupLog[]
  } catch (error) {
    console.error('Erro ao buscar logs de backup:', error)
    return []
  }
}

/**
 * Força execução de backup para uma empresa específica
 */
export async function forceBackupForEmpresa(empresaId: number): Promise<BackupLog> {
  const empresa = db.prepare(`
    SELECT id, nome, auto_backup_enabled, backup_frequency, 
           backup_time, keep_local_backup, max_backups, last_backup
    FROM empresas 
    WHERE id = ?
  `).get(empresaId) as BackupConfig
  
  if (!empresa) {
    throw new Error('Empresa não encontrada')
  }
  
  const log = await executeBackupForEmpresa(empresa)
  saveBackupLog(log)
  
  return log
}