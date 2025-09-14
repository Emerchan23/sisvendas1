import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    
    const modalidade = db.prepare(`
      SELECT * FROM modalidades WHERE id = ?
    `).get(id)
    
    if (!modalidade) {
      return NextResponse.json({ error: 'Modalidade não encontrada' }, { status: 404 })
    }
    
    return NextResponse.json(modalidade)
  } catch (error) {
    console.error('Error fetching modalidade:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { codigo, nome, descricao, ativo, requer_numero_processo } = body
    
    if (!codigo || !nome) {
      return NextResponse.json({ error: 'Código e nome são obrigatórios' }, { status: 400 })
    }
    
    const result = db.prepare(`
      UPDATE modalidades 
      SET codigo = ?, nome = ?, descricao = ?, ativo = ?, requer_numero_processo = ?, updated_at = ?
      WHERE id = ?
    `).run(
      codigo,
      nome,
      descricao || null,
      ativo !== undefined ? ativo : true,
      requer_numero_processo || false,
      new Date().toISOString(),
      id
    )
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Modalidade não encontrada' }, { status: 404 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating modalidade:', error)
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Código da modalidade já existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    
    const result = db.prepare(`
      DELETE FROM modalidades WHERE id = ?
    `).run(id)
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Modalidade não encontrada' }, { status: 404 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting modalidade:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}