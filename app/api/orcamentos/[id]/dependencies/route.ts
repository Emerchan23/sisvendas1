import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
// Removed company imports - system simplified

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Simplified system without company filtering

    // Verificar dependências do orçamento
    const dependencies = {
      orcamento_itens: db.prepare(`
        SELECT COUNT(*) as count 
        FROM orcamento_itens 
        WHERE orcamento_id = ?
      `).get(id) as { count: number },
      
      // Verificar se o orçamento foi aprovado (pode ter gerado vendas)
      vendas_relacionadas: db.prepare(`
        SELECT COUNT(*) as count 
        FROM vendas 
        WHERE orcamento_id = ?
      `).get(id) as { count: number }
    }

    return NextResponse.json(dependencies)
  } catch (error) {
    console.error('Erro ao buscar dependências do orçamento:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}