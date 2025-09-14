import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const vendas = db.prepare(`
      SELECT v.*, c.nome as cliente_nome, p.nome as produto_nome
      FROM vendas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      LEFT JOIN produtos p ON v.produto_id = p.id
      ORDER BY v.data_venda DESC
    `).all()
    
    return NextResponse.json(vendas)
  } catch (error) {
    console.error('Error fetching vendas:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cliente_id, produto_id, quantidade, preco_unitario } = body
    
    const id = uuidv4()
    const total = quantidade * preco_unitario
    
    db.prepare(`
      INSERT INTO vendas (id, cliente_id, produto_id, quantidade, preco_unitario, total, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      cliente_id,
      produto_id,
      quantidade,
      preco_unitario,
      total,
      new Date().toISOString(),
      new Date().toISOString()
    )
    
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Error creating venda:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}