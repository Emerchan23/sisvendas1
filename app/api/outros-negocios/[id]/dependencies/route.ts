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

    // Verificar dependências do outro negócio
    const dependencies = {
      pagamentos_parciais: db.prepare(`
        SELECT COUNT(*) as count 
        FROM pagamentos_parciais 
        WHERE outro_negocio_id = ?
      `).get(id) as { count: number },
      
      // Verificar se há acertos relacionados
      acertos_relacionados: db.prepare(`
        SELECT COUNT(*) as count 
        FROM acertos a
        JOIN outros_negocios ong ON a.outro_negocio_id = ong.id
        WHERE ong.id = ?
      `).get(id) as { count: number }
    }

    return NextResponse.json(dependencies)
  } catch (error) {
    console.error('Erro ao buscar dependências do outro negócio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}