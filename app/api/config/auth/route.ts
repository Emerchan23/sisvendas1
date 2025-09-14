import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Configurações padrão de autenticação
const DEFAULT_AUTH_CONFIG = {
  normalExpiryHours: 2,
  rememberMeExpiryDays: 7,
  sessionCheckIntervalMinutes: 5,
  warningTimeMinutes: 5
}

async function getAuthConfig() {
  try {
    // Buscar configurações de autenticação no banco
    const config = db.prepare(`
      SELECT config_value FROM configuracoes
      WHERE config_key = 'auth_settings'
    `).get() as { config_value: string } | undefined

    if (config) {
      const settings = JSON.parse(config.config_value)
      return {
        normalExpiryHours: parseInt(settings.normalExpiryHours) || 2,
        rememberMeExpiryDays: parseInt(settings.rememberMeExpiryDays) || 7,
        sessionCheckInterval: parseInt(settings.sessionCheckInterval) || 5,
        warningTime: parseInt(settings.warningTime) || 5
      }
    }
  } catch (error) {
    console.error('Erro ao buscar configurações de autenticação:', error)
  }

  // Valores padrão se não encontrar configurações
  return {
    normalExpiryHours: 2,
    rememberMeExpiryDays: 7,
    sessionCheckInterval: 5,
    warningTime: 5
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Validar dados recebidos
    const normalExpiryHours = parseInt(data.normalExpiryHours) || 2
    const rememberMeExpiryDays = parseInt(data.rememberMeExpiryDays) || 7
    const sessionCheckInterval = parseInt(data.sessionCheckInterval) || 5
    const warningTime = parseInt(data.warningTime) || 5
    
    // Criar objeto de configuração
    const authSettings = {
      normalExpiryHours,
      rememberMeExpiryDays,
      sessionCheckInterval,
      warningTime
    }
    
    // Salvar no banco de dados
    db.prepare(`
      INSERT OR REPLACE INTO configuracoes (id, config_key, config_value, descricao, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      'auth-settings-1',
      'auth_settings',
      JSON.stringify(authSettings),
      'Configurações de autenticação do sistema'
    )
    
    console.log('Configurações de autenticação salvas:', authSettings)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configurações salvas com sucesso',
      data: authSettings
    })
  } catch (error) {
    console.error('Erro ao salvar configurações de autenticação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const authConfig = await getAuthConfig()
    return NextResponse.json(authConfig)
  } catch (error) {
    console.error('Erro ao buscar configurações de autenticação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}