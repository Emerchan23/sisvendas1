import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { v4 as uuidv4 } from 'uuid'

// Criar tabela modalidades se não existir (apenas em runtime)
if (process.env.NEXT_PHASE !== 'phase-production-build' && db.exec) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS modalidades (
      id TEXT PRIMARY KEY,
      codigo TEXT NOT NULL UNIQUE,
      nome TEXT NOT NULL,
      descricao TEXT,
      ativo BOOLEAN DEFAULT 1,
      requer_numero_processo BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export async function GET(request: NextRequest) {
  try {
    const modalidades = db.prepare(`
      SELECT * FROM modalidades 
      WHERE ativo = 1 
      ORDER BY nome
    `).all()
    
    return NextResponse.json(modalidades)
  } catch (error) {
    console.error('Error fetching modalidades:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { codigo, nome, descricao, requer_numero_processo } = body
    
    if (!codigo || !nome) {
      return NextResponse.json({ error: 'Código e nome são obrigatórios' }, { status: 400 })
    }
    
    const id = uuidv4()
    
    const now = new Date().toISOString()
    
    db.prepare(`
      INSERT INTO modalidades (id, codigo, nome, descricao, requer_numero_processo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      codigo,
      nome,
      descricao || null,
      requer_numero_processo ? 1 : 0,
      now,
      now
    )
    
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Error creating modalidade:', error)
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return NextResponse.json({ error: 'Código da modalidade já existe' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}