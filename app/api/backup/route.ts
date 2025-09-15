import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { verifyToken } from '../../../lib/auth'

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
    
    const backup: {
      timestamp: string;
      version: string;
      data: Record<string, unknown[]>;
    } = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {}
    }
    
    // Exportar dados de cada tabela
    for (const table of tables) {
      try {
        const rows = db.prepare(`SELECT * FROM ${table}`).all()
        backup.data[table] = rows
      } catch (error) {
        console.warn(`Tabela ${table} não encontrada ou erro ao exportar:`, error)
        backup.data[table] = []
      }
    }
    
    return NextResponse.json({
      success: true,
      backup,
      message: 'Backup gerado com sucesso'
    })
    
  } catch (error) {
    console.error('Erro ao gerar backup:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao gerar backup' },
      { status: 500 }
    )
  }
}

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
    const { backup } = body
    
    if (!backup || !backup.data) {
      return NextResponse.json(
        { error: 'Formato de backup inválido' },
        { status: 400 }
      )
    }
    
    // Desabilitar foreign keys temporariamente
    db.pragma('foreign_keys = OFF')
    
    // Começar transação
    db.exec('BEGIN TRANSACTION')
    
    try {
      // Limpar tabelas existentes (exceto configurações críticas)
      const tablesToClear = [
        'orcamento_itens', // Deletar primeiro devido a foreign key
        'vendas',
        'acertos', 
        'orcamentos',
        'vales',
        'outros_negocios',
        'linhas',
        'despesas_pendentes',
        'pagamentos_parciais'
      ]
      
      for (const table of tablesToClear) {
        try {
          db.exec(`DELETE FROM ${table}`)
        } catch (error) {
          console.warn(`Erro ao limpar tabela ${table}:`, error)
        }
      }
      
      // Importar dados do backup
      for (const [tableName, rows] of Object.entries(backup.data)) {
        if (!Array.isArray(rows) || rows.length === 0) continue
        
        const firstRow = rows[0] as Record<string, unknown>
        const columns = Object.keys(firstRow)
        const placeholders = columns.map(() => '?').join(', ')
        
        const insertSql = `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`
        const stmt = db.prepare(insertSql)
        
        for (const row of rows) {
          const rowData = row as Record<string, unknown>
          const values = columns.map(col => rowData[col])
          stmt.run(values)
        }
      }
      
      db.exec('COMMIT')
      
      // Reabilitar foreign keys
      db.pragma('foreign_keys = ON')
      
      return NextResponse.json({ 
        success: true, 
        message: 'Backup importado com sucesso',
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      db.exec('ROLLBACK')
      // Reabilitar foreign keys mesmo em caso de erro
      db.pragma('foreign_keys = ON')
      throw error
    }
    
  } catch (error) {
    console.error('Erro ao importar backup:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao importar backup' },
      { status: 500 }
    )
  }
}