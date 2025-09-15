import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'

export async function GET() {
  try {
    const modalidades = db.prepare(`
      SELECT id, codigo, nome, descricao, ativo, requer_numero_processo, created_at, updated_at
      FROM modalidades_compra
      ORDER BY nome ASC
    `).all()
    
    return NextResponse.json(modalidades)
  } catch (error) {
    console.error('Erro ao buscar modalidades de compra:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { codigo, nome, descricao } = await request.json()
    
    if (!codigo || !nome) {
      return NextResponse.json(
        { error: 'Código e nome são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar se já existe uma modalidade com o mesmo código
    const existente = db.prepare('SELECT id FROM modalidades_compra WHERE codigo = ?').get(codigo)
    if (existente) {
      return NextResponse.json(
        { error: 'Já existe uma modalidade com este código' },
        { status: 400 }
      )
    }
    
    const stmt = db.prepare(`
      INSERT INTO modalidades_compra (codigo, nome, descricao, ativo)
      VALUES (?, ?, ?, 1)
    `)
    
    const result = stmt.run(codigo.toUpperCase(), nome, descricao || null)
    
    const novaModalidade = db.prepare(`
      SELECT id, codigo, nome, descricao, ativo, requer_numero_processo, created_at, updated_at
      FROM modalidades_compra
      WHERE id = ?
    `).get(result.lastInsertRowid)
    
    return NextResponse.json(novaModalidade, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar modalidade de compra:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, codigo, nome, descricao, ativo, requer_numero_processo } = await request.json()
    
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
      SET codigo = ?, nome = ?, descricao = ?, ativo = ?, requer_numero_processo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    const result = stmt.run(
      codigo.toUpperCase(), 
      nome, 
      descricao || null, 
      ativo !== undefined ? (ativo ? 1 : 0) : 1,
      requer_numero_processo !== undefined ? (requer_numero_processo ? 1 : 0) : 0,
      id
    )
    
    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Modalidade não encontrada' },
        { status: 404 }
      )
    }
    
    const modalidadeAtualizada = db.prepare(`
      SELECT id, codigo, nome, descricao, ativo, requer_numero_processo, created_at, updated_at
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id')
    
    // Se não encontrou o ID na query string, tenta pegar do body
    if (!id) {
      try {
        const body = await request.json()
        id = body.id
      } catch {
        // Ignora erro de parsing do JSON
      }
    }
    
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