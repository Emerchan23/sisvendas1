import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/db'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { 
      nome, 
      descricao, 
      marca, 
      preco,
      precoVenda, 
      custo, 
      taxaImposto, 
      modalidadeVenda, 
      estoque, 
      linkRef, 
      custoRef, 
      categoria 
    } = await request.json()
    
    // Use preco if available, otherwise use precoVenda, default to 0
    const precoFinal = preco || precoVenda || 0
    const { id } = await params
    
    // Validate required fields
    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }
    
    console.log('Updating produto with data:', {
      id,
      nome,
      descricao,
      marca,
      precoFinal,
      custo: custo || 0,
      taxaImposto: taxaImposto || 0,
      modalidadeVenda,
      estoque: estoque || 0,
      linkRef,
      custoRef,
      categoria: categoria || null
    })
    
    db.prepare(`
      UPDATE produtos 
      SET nome=?, descricao=?, marca=?, preco=?, custo=?, taxa_imposto=?, 
          modalidade_venda=?, estoque=?, link_ref=?, custo_ref=?, categoria=?, updated_at=?
      WHERE id=?
    `).run(
      nome,
      descricao,
      marca,
      precoFinal,
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