import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    
    // Exportar todas as tabelas principais
    const tables = [
      'clientes',
      'produtos', 
      'vendas',
      'acertos',
      'orcamentos',
      'orcamento_itens', // CRÍTICO: Exportar itens dos orçamentos
      'vales',
      'outros_negocios',
      'empresas',
      'empresa_config',
      'modalidades',
      'taxas',
      'linhas',
      'participantes'
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
    
    return NextResponse.json(backup)
  } catch (error) {
    console.error('Erro ao gerar backup:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao gerar backup' },
      { status: 500 }
    )
  }
}