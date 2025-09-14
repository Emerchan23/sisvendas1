import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../../lib/db'

// Removed company ID logic - system simplified

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Simplified system without company filtering
    
    const { id } = await params
    
    // Verificar dependências em todas as tabelas
    const vendas = db.prepare("SELECT COUNT(*) as count FROM vendas WHERE cliente_id = ?").get(id) as { count: number }
    const orcamentos = db.prepare("SELECT COUNT(*) as count FROM orcamentos WHERE cliente_id = ?").get(id) as { count: number }
    const outrosNegocios = db.prepare("SELECT COUNT(*) as count FROM outros_negocios WHERE cliente_id = ?").get(id) as { count: number }
    const valeMovimentos = db.prepare("SELECT COUNT(*) as count FROM vale_movimentos WHERE cliente_id = ?").get(id) as { count: number }
    
    return NextResponse.json({
      vendas: vendas.count,
      orcamentos: orcamentos.count,
      outrosNegocios: outrosNegocios.count,
      valeMovimentos: valeMovimentos.count,
      total: vendas.count + orcamentos.count + outrosNegocios.count + valeMovimentos.count
    })
  } catch (error) {
    console.error('Error fetching cliente dependencies:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}