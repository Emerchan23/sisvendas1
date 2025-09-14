import { NextRequest, NextResponse } from 'next/server'
import Database from 'better-sqlite3'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'erp.sqlite')

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
    
    const db = new Database(dbPath)
    
    const modalidade = db.prepare(`
      SELECT id, codigo, nome, descricao, ativo, created_at, updated_at
      FROM modalidades_compra
      WHERE id = ?
    `).get(id)
    
    db.close()
    
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
    
    const db = new Database(dbPath)
    
    // Verificar se existe outra modalidade com o mesmo código
    const existente = db.prepare('SELECT id FROM modalidades_compra WHERE codigo = ? AND id != ?').get(codigo, id)
    if (existente) {
      db.close()
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
      db.close()
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
    
    db.close()
    
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
    
    const db = new Database(dbPath)
    
    const stmt = db.prepare('DELETE FROM modalidades_compra WHERE id = ?')
    const result = stmt.run(id)
    
    db.close()
    
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