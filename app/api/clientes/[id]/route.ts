import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/db'
import { isValidCPFOrCNPJ } from '../../../../lib/masks'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const cliente = db.prepare("SELECT * FROM clientes WHERE id = ?").get(id) as {
      id: string;
      nome: string;
      cpf_cnpj: string | null;
      endereco: string | null;
      telefone: string | null;
      email: string | null;
      created_at: string;
    } | undefined
    
    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }
    
    // Map database fields to match the Cliente type
    const mappedCliente = {
      id: cliente.id,
      nome: cliente.nome,
      documento: cliente.cpf_cnpj,
      endereco: cliente.endereco,
      telefone: cliente.telefone,
      email: cliente.email,
      createdAt: cliente.created_at
    }
    
    return NextResponse.json(mappedCliente)
  } catch (error) {
    console.error('Error fetching cliente:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json()
    const { id } = await params
    
    // Validar campos obrigatórios
    if (!body.nome || !body.nome.trim()) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }
    
    const documento = body.documento || body.cpf_cnpj
    
    // Validar CPF/CNPJ se fornecido
    if (documento && !isValidCPFOrCNPJ(documento)) {
      return NextResponse.json({ error: 'CPF/CNPJ inválido' }, { status: 400 })
    }
    
    db.prepare(`
      UPDATE clientes 
      SET nome=?, cpf_cnpj=?, endereco=?, telefone=?, email=?, updated_at=?
      WHERE id=?
    `).run(
      body.nome.trim(),
      documento || null,
      body.endereco?.trim() || null,
      body.telefone?.trim() || null,
      body.email?.trim() || null,
      new Date().toISOString(),
      id
    )
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error updating cliente:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Verificar se o cliente tem dependências em outras tabelas
    const vendas = db.prepare("SELECT COUNT(*) as count FROM vendas WHERE cliente_id = ?").get(id) as { count: number }
    const orcamentos = db.prepare("SELECT COUNT(*) as count FROM orcamentos WHERE cliente_id = ?").get(id) as { count: number }
    const outrosNegocios = db.prepare("SELECT COUNT(*) as count FROM outros_negocios WHERE cliente_id = ?").get(id) as { count: number }
    const valeMovimentos = db.prepare("SELECT COUNT(*) as count FROM vale_movimentos WHERE cliente_id = ?").get(id) as { count: number }
    
    const totalDependencias = vendas.count + orcamentos.count + outrosNegocios.count + valeMovimentos.count
    
    if (totalDependencias > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir este cliente pois ele possui registros associados (vendas, orçamentos, outros negócios ou vales).' 
      }, { status: 400 })
    }
    
    db.prepare("DELETE FROM clientes WHERE id = ?").run(id)
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting cliente:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}