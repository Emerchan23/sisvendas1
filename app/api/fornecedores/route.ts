import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { uid } from '../../../lib/util'

export async function GET() {
  try {
    const fornecedores = db.prepare(`
      SELECT * FROM fornecedores 
      ORDER BY created_at DESC
    `).all() as {
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
      updated_at: string;
    }[]
    
    // Map database fields to match the Fornecedor type
    const mappedFornecedores = fornecedores.map((fornecedor) => ({
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
      createdAt: fornecedor.created_at,
      updatedAt: fornecedor.updated_at
    }))
    
    return NextResponse.json(mappedFornecedores)
  } catch (error) {
    console.error('Error fetching fornecedores:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const id = uid()
    
    db.prepare(`
      INSERT INTO fornecedores (
        id, nome, categoria, produtos_servicos, telefone, site_url, 
        usuario_login, senha_login, tags_busca, observacoes, status, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
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
      new Date().toISOString(),
      new Date().toISOString()
    )
    
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Error creating fornecedor:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}