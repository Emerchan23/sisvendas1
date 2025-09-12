import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { uid } from '../../../lib/util'

export async function GET() {
  try {
    const clientes = db.prepare("SELECT * FROM clientes ORDER BY created_at DESC").all() as {
      id: string;
      nome: string;
      cpf_cnpj: string | null;
      endereco: string | null;
      telefone: string | null;
      email: string | null;
      created_at: string;
    }[]
    
    // Map database fields to match the Cliente type
    const mappedClientes = clientes.map((cliente: {
      id: string;
      nome: string;
      cpf_cnpj: string | null;
      endereco: string | null;
      telefone: string | null;
      email: string | null;
      created_at: string;
    }) => ({
      id: cliente.id,
      nome: cliente.nome,
      documento: cliente.cpf_cnpj,
      endereco: cliente.endereco,
      telefone: cliente.telefone,
      email: cliente.email,
      createdAt: cliente.created_at
    }))
    
    return NextResponse.json(mappedClientes)
  } catch (error) {
    console.error('Error fetching clientes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const id = uid()
    
    db.prepare(`
      INSERT INTO clientes (id, nome, cpf_cnpj, endereco, telefone, email, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.nome,
      body.documento || body.cpf_cnpj || null,
      body.endereco || null,
      body.telefone || null,
      body.email || null,
      new Date().toISOString()
    )
    
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Error creating cliente:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}