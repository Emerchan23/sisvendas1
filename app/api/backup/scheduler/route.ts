import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../../../lib/auth'
import { getRecentBackupLogs, forceBackupForEmpresa } from '../../../../lib/backup-service'
import { startBackupScheduler, stopBackupScheduler, isSchedulerActive, getSchedulerStatus, forceBackupCheck } from '../../../../workers/backup-scheduler'

// GET - Obter status do scheduler e logs recentes
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const limit = parseInt(searchParams.get('limit') || '50')

    switch (action) {
      case 'status':
        const schedulerStatus = getSchedulerStatus()
        return NextResponse.json({
          success: true,
          scheduler: {
            ...schedulerStatus,
            status: schedulerStatus.active ? 'running' : 'stopped'
          }
        })

      case 'logs':
        const logs = getRecentBackupLogs(limit)
        return NextResponse.json({
          success: true,
          logs,
          total: logs.length
        })

      default:
        // Status padrão com logs recentes
        const defaultStatus = getSchedulerStatus()
        return NextResponse.json({
          success: true,
          scheduler: {
            ...defaultStatus,
            status: defaultStatus.active ? 'running' : 'stopped'
          },
          recentLogs: getRecentBackupLogs(10)
        })
    }

  } catch (error) {
    console.error('Erro na API do scheduler:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Controlar scheduler e executar ações
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, empresaId } = body

    switch (action) {
      case 'start':
        if (isSchedulerActive()) {
          return NextResponse.json({
            success: false,
            message: 'Scheduler já está em execução'
          })
        }
        
        startBackupScheduler()
        return NextResponse.json({
          success: true,
          message: 'Scheduler de backup iniciado com sucesso',
          scheduler: {
            active: true,
            status: 'running'
          }
        })

      case 'stop':
        if (!isSchedulerActive()) {
          return NextResponse.json({
            success: false,
            message: 'Scheduler não está em execução'
          })
        }
        
        stopBackupScheduler()
        return NextResponse.json({
          success: true,
          message: 'Scheduler de backup parado com sucesso',
          scheduler: {
            active: false,
            status: 'stopped'
          }
        })

      case 'force-check':
        await forceBackupCheck()
        return NextResponse.json({
          success: true,
          message: 'Verificação de backup executada manualmente',
          timestamp: new Date().toISOString()
        })

      case 'force-backup':
        if (!empresaId) {
          return NextResponse.json(
            { error: 'ID da empresa é obrigatório para backup forçado' },
            { status: 400 }
          )
        }
        
        const log = await forceBackupForEmpresa(empresaId)
        return NextResponse.json({
          success: true,
          message: 'Backup executado manualmente',
          log
        })

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Erro na execução da ação do scheduler:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}