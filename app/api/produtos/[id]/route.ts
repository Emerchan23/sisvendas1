import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/db'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { 
      nome, 
      descricao, 
      marca, 
      precoVenda, 
      custo, 
      taxaImposto, 
      modalidadeVenda, 
      estoque, 
      linkRef, 
      custoRef, 
      categoria 
    } = await request.json()
    const { id } = await params
    
    db.prepare(`
      UPDATE produtos 
      SET nome=?, descricao=?, marca=?, preco=?, custo=?, taxa_imposto=?, 
          modalidade_venda=?, estoque=?, link_ref=?, custo_ref=?, categoria=?, updated_at=?
      WHERE id=?
    `).run(
      nome,
      descricao,
      marca,
      precoVenda,
      custo || 0,
      taxaImposto || 0,
      modalidadeVenda,
      estoque || 0,
      linkRef,
      custoRef,
      categoria || null,
      new Date().toISOString(),
      id
    )
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating produto:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Verificar se o produto tem dependências em outras tabelas
    const orcamentoItens = db.prepare(`
      SELECT COUNT(*) as count 
      FROM orcamento_itens oi
      WHERE oi.produto_id = ?
    `).get(id) as { count: number }
    
    const linhasVenda = db.prepare(`
      SELECT COUNT(*) as count 
      FROM linhas_venda 
      WHERE produto = (SELECT nome FROM produtos WHERE id = ?)
    `).get(id) as { count: number }
    
    const vendas = db.prepare(`
      SELECT COUNT(*) as count 
      FROM vendas 
      WHERE produto_id = ?
    `).get(id) as { count: number }
    
    const totalDependencias = orcamentoItens.count + linhasVenda.count + vendas.count
    
    if (totalDependencias > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir este produto pois ele possui registros associados (orçamentos, vendas ou linhas de venda).' 
      }, { status: 400 })
    }
    
    db.prepare("DELETE FROM produtos WHERE id = ?").run(id)
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting produto:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}