import { NextRequest, NextResponse } from 'next/server'
import { getRecentBackupLogs } from '../../../../../lib/backup-service'
import { startBackupScheduler, stopBackupScheduler, isSchedulerActive, getSchedulerStatus, forceBackupCheck } from '../../../../../workers/backup-scheduler'

// GET - Obter status do scheduler (sem autenticação para testes)
export async function GET(request: NextRequest) {
  try {
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
    console.error('Erro na API de teste do scheduler:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Controlar scheduler (sem autenticação para testes)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

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

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Erro na execução da ação do scheduler (teste):', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}