import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const fornecedor = db.prepare(`
      SELECT * FROM fornecedores WHERE id = ?
    `).get(id) as {
      id: string;
      nome: string;
      categoria: string | null;
      produtos_servicos: string | null;
      telefone: string | null;
      site_url: string | null;
      usuario_login: string | null;
      senha_login: string | null;
      tags_busca: string | null;
      observacoes: string | null;
      status: string;
      created_at: string;
    } | undefined
    
    if (!fornecedor) {
      return NextResponse.json({ error: 'Fornecedor not found' }, { status: 404 })
    }
    
    // Map database fields to match the Fornecedor type
    const mappedFornecedor = {
      id: fornecedor.id,
      nome: fornecedor.nome,
      categoria: fornecedor.categoria,
      produtosServicos: fornecedor.produtos_servicos,
      telefone: fornecedor.telefone,
      siteUrl: fornecedor.site_url,
      usuarioLogin: fornecedor.usuario_login,
      senhaLogin: fornecedor.senha_login,
      tagsBusca: fornecedor.tags_busca,
      observacoes: fornecedor.observacoes,
      status: fornecedor.status,
      createdAt: fornecedor.created_at
    }
    
    return NextResponse.json(mappedFornecedor)
  } catch (error) {
    console.error('Error fetching fornecedor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const result = db.prepare(`
      UPDATE fornecedores SET 
        nome = ?, categoria = ?, produtos_servicos = ?, telefone = ?, 
        site_url = ?, usuario_login = ?, senha_login = ?, tags_busca = ?, 
        observacoes = ?, status = ?
      WHERE id = ?
    `).run(
      body.nome,
      body.categoria || null,
      body.produtosServicos || null,
      body.telefone || null,
      body.siteUrl || null,
      body.usuarioLogin || null,
      body.senhaLogin || null,
      body.tagsBusca || null,
      body.observacoes || null,
      body.status || 'ativo',
      id
    )
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Fornecedor not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating fornecedor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const result = db.prepare('DELETE FROM fornecedores WHERE id = ?').run(id)
    
    if (result.changes === 0) {
      return NextResponse.json({ error: 'Fornecedor not found' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting fornecedor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}