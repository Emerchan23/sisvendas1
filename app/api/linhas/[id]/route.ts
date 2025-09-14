import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/db'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Validação: impedir alteração manual do settlementStatus para 'ACERTADO'
    // Permite apenas quando há um acertoId sendo definido simultaneamente (operação do sistema)
    if (body.settlementStatus === 'ACERTADO' && !body.acertoId) {
      return NextResponse.json({ 
        error: 'O status ACERTADO só pode ser definido automaticamente quando um acerto é finalizado.' 
      }, { status: 400 })
    }
    
    // Build dynamic update query based on provided fields
    const fields = Object.keys(body).filter(key => key !== 'id')
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }
    
    const setClause = fields.map(field => `${field} = ?`).join(', ')
    const values = fields.map(field => body[field])
    values.push(id) // for WHERE clause
    
    const query = `UPDATE linhas_venda SET ${setClause} WHERE id = ?`
    
    const result = db.prepare(query).run(...values)
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Linha not found' }, { status: 404 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating linha:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Verificar se a linha de venda tem dependências (está associada a um acerto)
    const linhaAtual = db.prepare(`
      SELECT acertoId FROM linhas_venda WHERE id = ?
    `).get(id) as { acertoId: string | null } | undefined
    
    if (linhaAtual?.acertoId) {
      return NextResponse.json({ 
        error: 'Não é possível excluir esta linha de venda pois ela está associada a um acerto.' 
      }, { status: 400 })
    }
    
    const result = db.prepare('DELETE FROM linhas_venda WHERE id = ?').run(id)
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Linha not found' }, { status: 404 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting linha:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}