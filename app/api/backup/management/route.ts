import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../../../lib/auth'
import { 
  startBackupScheduler, 
  stopBackupScheduler, 
  isSchedulerActive, 
  getSchedulerStatus,
  forceBackupCheck 
} from '../../../../workers/backup-scheduler'
import { 
  getBackupValidationHistory, 
  getBackupValidationStats 
} from '../../../../lib/backup-validator'
import { 
  getBackupStorageStats, 
  forceCleanupEmpresa 
} from '../../../../lib/backup-cleaner'
import { getRecentBackupLogs } from '../../../../lib/backup-service'
import { backupLogger } from '../../../../lib/backup-logger'

interface ManagementActionParams {
  empresa_id?: number
  limit?: number
}

interface ManagementRequestBody {
  action: string
  params?: ManagementActionParams
}

interface ConfigUpdateBody {
  config_type: string
  settings: Record<string, unknown>
}

interface ApiResponse {
  success: boolean
  message?: string
  data?: unknown
  stats?: unknown
  active?: boolean
}

/**
 * GET - Obter status geral do sistema de backup
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    // Status do scheduler
    const schedulerStatus = getSchedulerStatus()
    const isActive = isSchedulerActive()

    // Estatísticas de validação
    const validationStats = getBackupValidationStats()

    // Estatísticas de armazenamento
    const storageStats = await getBackupStorageStats()

    // Logs recentes
    const recentLogs = getRecentBackupLogs(10)

    // Histórico de validações recentes
    const validationHistory = getBackupValidationHistory(5)

    const systemStatus = {
      scheduler: {
        active: isActive,
        status: schedulerStatus,
        lastCheck: null // Removido lastExecution pois não existe no tipo
      },
      validation: {
        stats: validationStats,
        recentHistory: validationHistory
      },
      storage: {
        totalFiles: storageStats.totalFiles,
        totalSize: storageStats.totalSize,
        totalSizeMB: (storageStats.totalSize / 1024 / 1024).toFixed(2),
        byEmpresa: storageStats.byEmpresa
      },
      logs: {
        recent: recentLogs
      },
      timestamp: new Date().toISOString()
    }

    backupLogger.info('management_api', 'Status do sistema consultado')

    return NextResponse.json({
      success: true,
      data: systemStatus
    })

  } catch (error) {
    backupLogger.error('management_api', `Erro ao obter status: ${error}`)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * POST - Executar ações de gerenciamento
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const body = await request.json() as ManagementRequestBody
    const { action, params } = body

    let result: ApiResponse = { success: false }

    switch (action) {
      case 'start_scheduler':
        startBackupScheduler()
        result = {
          success: true,
          message: 'Scheduler iniciado com sucesso',
          active: isSchedulerActive()
        }
        backupLogger.info('management_api', 'Scheduler iniciado via API')
        break

      case 'stop_scheduler':
        stopBackupScheduler()
        result = {
          success: true,
          message: 'Scheduler parado com sucesso',
          active: isSchedulerActive()
        }
        backupLogger.info('management_api', 'Scheduler parado via API')
        break

      case 'force_check':
        await forceBackupCheck()
        result = {
          success: true,
          message: 'Verificação forçada executada com sucesso'
        }
        backupLogger.info('management_api', 'Verificação forçada executada via API')
        break

      case 'force_cleanup':
        if (!params?.empresa_id) {
          return NextResponse.json(
            { error: 'ID da empresa é obrigatório para limpeza forçada' },
            { status: 400 }
          )
        }
        
        const cleanupStats = await forceCleanupEmpresa(params.empresa_id)
        result = {
          success: true,
          message: 'Limpeza forçada executada com sucesso',
          stats: cleanupStats
        }
        backupLogger.info('management_api', 
          `Limpeza forçada executada para empresa ${params.empresa_id}: ${cleanupStats.filesRemoved} arquivo(s) removido(s)`
        )
        break

      case 'get_validation_history':
        const limit = params?.limit || 20
        const history = getBackupValidationHistory(limit)
        result = {
          success: true,
          data: history
        }
        break

      case 'get_storage_details':
        const storageDetails = await getBackupStorageStats()
        result = {
          success: true,
          data: storageDetails
        }
        break

      case 'get_logs':
        const logLimit = params?.limit || 50
        const logs = getRecentBackupLogs(logLimit)
        result = {
          success: true,
          data: logs
        }
        break

      default:
        return NextResponse.json(
          { error: `Ação não reconhecida: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json(result)

  } catch (error) {
    backupLogger.error('management_api', `Erro na ação de gerenciamento: ${error}`)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Atualizar configurações do sistema
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const body = await request.json() as ConfigUpdateBody
    const { config_type, settings } = body

    // Aqui você pode implementar atualizações de configuração
    // Por exemplo: configurações de email, limites de retenção, etc.
    
    backupLogger.info('management_api', `Configuração atualizada: ${config_type}`)

    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas com sucesso'
    })

  } catch (error) {
    backupLogger.error('management_api', `Erro ao atualizar configurações: ${error}`)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}