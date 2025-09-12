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

    // Verificar dependências do produto
    const dependencies = {
      orcamento_itens: db.prepare(`
        SELECT COUNT(*) as count 
        FROM orcamento_itens oi
        JOIN orcamentos o ON oi.orcamento_id = o.id
        WHERE oi.produto_id = ?
      `).get(id) as { count: number },
      
      linhas_venda: db.prepare(`
        SELECT COUNT(*) as count 
        FROM linhas_venda lv
        JOIN vendas v ON lv.venda_id = v.id
        WHERE lv.produto_id = ?
      `).get(id) as { count: number }
    }

    return NextResponse.json(dependencies)
  } catch (error) {
    console.error('Erro ao buscar dependências do produto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}