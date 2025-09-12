import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const backup = await request.json()
    
    if (!backup.data) {
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
        'linhas_venda',
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