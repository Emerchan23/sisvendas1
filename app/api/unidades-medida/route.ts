import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    const unidades = db.prepare(`
      SELECT * FROM unidades_medida 
      WHERE ativo = 1 
      ORDER BY codigo ASC
    `).all()

    return NextResponse.json(unidades)
  } catch (error) {
    console.error('Erro ao buscar unidades de medida:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  let codigo = ''
  try {
    const body = await request.json()
    codigo = body.codigo
    const { descricao } = body

    if (!codigo || !descricao) {
      return NextResponse.json(
        { message: 'Código e descrição são obrigatórios' },
        { status: 400 }
      )
    }

    const stmt = db.prepare(`
      INSERT INTO unidades_medida (id, codigo, descricao, ativo)
      VALUES (?, ?, ?, 1)
    `)
    
    const id = uuidv4()
    const result = stmt.run(id, codigo.trim().toLowerCase(), descricao.trim())
    
    const newUnit = {
      id,
      codigo: codigo.trim().toLowerCase(),
      descricao: descricao.trim(),
      ativo: 1
    }

    return NextResponse.json(newUnit, { status: 201 })
  } catch (error: any) {
    console.error('Erro ao criar unidade de medida:', error)
    
    // Verificar se é erro de código duplicado
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json(
        { message: `Já existe uma unidade de medida com o código "${codigo.trim()}". Por favor, use um código diferente.` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  let codigo = ''
  try {
    const body = await request.json()
    const { id, descricao, ativo } = body
    codigo = body.codigo

    if (!id || !codigo || !descricao) {
      return NextResponse.json(
        { message: 'ID, código e descrição são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se a unidade existe
    const existingUnit = db.prepare(
      'SELECT * FROM unidades_medida WHERE id = ?'
    ).get(id)

    if (!existingUnit) {
      return NextResponse.json(
        { message: 'Unidade de medida não encontrada' },
        { status: 404 }
      )
    }

    const stmt = db.prepare(`
      UPDATE unidades_medida 
      SET codigo = ?, descricao = ?, ativo = ?
      WHERE id = ?
    `)
    
    stmt.run(codigo.trim().toLowerCase(), descricao.trim(), ativo ? 1 : 0, id)
    
    const updatedUnit = db.prepare(
      'SELECT * FROM unidades_medida WHERE id = ?'
    ).get(id)

    return NextResponse.json(updatedUnit)
  } catch (error: any) {
    console.error('Erro ao atualizar unidade de medida:', error)
    
    // Verificar se é erro de código duplicado
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json(
        { message: `Já existe uma unidade de medida com o código "${codigo.trim()}". Por favor, use um código diferente.` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Try to get ID from query params first, then from body
    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id')
    
    if (!id) {
      try {
        const body = await request.json()
        id = body.id ? String(body.id) : null
      } catch {
        // If no body or invalid JSON, id remains null
      }
    }

    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se a unidade existe
    const existingUnit = db.prepare(
      'SELECT id, codigo FROM unidades_medida WHERE id = ?'
    ).get(id)

    if (!existingUnit) {
      return NextResponse.json(
        { error: 'Unidade de medida não encontrada' },
        { status: 404 }
      )
    }

    // Como a tabela orcamento_itens não possui coluna unidade_medida,
    // removemos a verificação de uso por enquanto

    // Soft delete - marcar como inativo
    const stmt = db.prepare(`
      UPDATE unidades_medida 
      SET ativo = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    
    stmt.run(id)

    return NextResponse.json({ message: 'Unidade de medida excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir unidade de medida:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}