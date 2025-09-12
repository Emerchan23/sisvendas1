import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Simplified system without company filtering

    // Verificar dependências da venda
    const dependencies = {
      // Verificar se há acertos relacionados (através de linhas_venda)
      acertos_relacionados: db.prepare(`
        SELECT COUNT(*) as count 
        FROM linhas_venda lv
        WHERE lv.venda_id = ? AND lv.acertoId IS NOT NULL
      `).get(id) as { count: number },
      
      // Verificar se há pagamentos relacionados
      pagamentos_relacionados: db.prepare(`
        SELECT COUNT(*) as count 
        FROM pagamentos_parciais pp
        JOIN vendas v ON pp.venda_id = v.id
        WHERE v.id = ?
      `).get(id) as { count: number }
    }

    return NextResponse.json(dependencies)
  } catch (error) {
    console.error('Erro ao buscar dependências da venda:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}