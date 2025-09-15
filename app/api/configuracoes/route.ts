import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const config_key = searchParams.get('config_key')
    
    if (config_key) {
      // Buscar configuração específica
      const config = db.prepare('SELECT * FROM configuracoes WHERE config_key = ?').get(config_key)
      return NextResponse.json(config || null)
    } else {
      // Buscar todas as configurações
      const configs = db.prepare('SELECT * FROM configuracoes ORDER BY config_key').all()
      return NextResponse.json(configs)
    }
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { config_key, config_value, descricao } = data
    
    if (!config_key || config_value === undefined) {
      return NextResponse.json(
        { error: 'config_key e config_value são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar se a configuração já existe
    const existingConfig = db.prepare('SELECT id FROM configuracoes WHERE config_key = ?').get(config_key)
    
    if (existingConfig) {
      // Atualizar configuração existente
      db.prepare(`
        UPDATE configuracoes 
        SET config_value = ?, descricao = ?, updated_at = datetime('now') 
        WHERE config_key = ?
      `).run(config_value, descricao || null, config_key)
      
      console.log(`✅ Configuração '${config_key}' atualizada com valor '${config_value}'`)
    } else {
      // Inserir nova configuração
      const id = uuidv4()
      db.prepare(`
        INSERT INTO configuracoes (id, config_key, config_value, descricao, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(id, config_key, config_value, descricao || null)
      
      console.log(`✅ Nova configuração '${config_key}' criada com valor '${config_value}'`)
    }
    
    // Retornar a configuração atualizada/criada
    const updatedConfig = db.prepare('SELECT * FROM configuracoes WHERE config_key = ?').get(config_key)
    
    return NextResponse.json({
      success: true,
      message: existingConfig ? 'Configuração atualizada com sucesso' : 'Configuração criada com sucesso',
      config: updatedConfig
    })
    
  } catch (error) {
    console.error('Erro ao salvar configuração:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const config_key = searchParams.get('config_key')
    
    if (!config_key) {
      return NextResponse.json(
        { error: 'config_key é obrigatório' },
        { status: 400 }
      )
    }
    
    const result = db.prepare('DELETE FROM configuracoes WHERE config_key = ?').run(config_key)
    
    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Configuração não encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Configuração removida com sucesso'
    })
    
  } catch (error) {
    console.error('Erro ao remover configuração:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}