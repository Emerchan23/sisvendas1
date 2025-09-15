import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  try {
    const vendas = db.prepare(`
      SELECT v.*, c.nome as cliente_nome
      FROM vendas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      ORDER BY v.data DESC
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
    const { cliente_id, valor, observacoes } = body
    
    const id = uuidv4()
    
    const stmt = db.prepare(`
      INSERT INTO vendas (id, cliente_id, valor, data, observacoes)
      VALUES (?, ?, ?, ?, ?)
    `)
  
    stmt.run(
      id,
      cliente_id,
      valor,
      new Date().toISOString(),
      observacoes || null
    )
    
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Error creating venda:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}