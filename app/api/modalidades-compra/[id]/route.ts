import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }
    
    const modalidade = db.prepare(`
      SELECT id, codigo, nome, descricao, ativo, created_at, updated_at
      FROM modalidades_compra
      WHERE id = ?
    `).get(id)
    
    if (!modalidade) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(modalidade)
  } catch (error) {
    console.error('Erro ao buscar modalidade de compra:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { codigo, nome, descricao, ativo } = await request.json()
    
    if (!id || !codigo || !nome) {
      return NextResponse.json(
        { error: 'ID, código e nome são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar se existe outra modalidade com o mesmo código
    const existente = db.prepare('SELECT id FROM modalidades_compra WHERE codigo = ? AND id != ?').get(codigo, id)
    if (existente) {
      return NextResponse.json(
        { error: 'Já existe uma modalidade com este código' },
        { status: 400 }
      )
    }
    
    const stmt = db.prepare(`
      UPDATE modalidades_compra 
      SET codigo = ?, nome = ?, descricao = ?, ativo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    const result = stmt.run(
      codigo.toUpperCase(), 
      nome, 
      descricao || null, 
      ativo !== undefined ? (ativo ? 1 : 0) : 1, 
      id
    )
    
    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }
    
    const modalidadeAtualizada = db.prepare(`
      SELECT id, codigo, nome, descricao, ativo, created_at, updated_at
      FROM modalidades_compra
      WHERE id = ?
    `).get(id)
    
    return NextResponse.json(modalidadeAtualizada)
  } catch (error) {
    console.error('Erro ao atualizar modalidade de compra:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }
    
    const stmt = db.prepare('DELETE FROM modalidades_compra WHERE id = ?')
    const result = stmt.run(id)
    
    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir modalidade de compra:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}