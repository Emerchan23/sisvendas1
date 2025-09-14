import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'API funcionando', timestamp: new Date().toISOString() })
}

export async function POST(request: NextRequest) {
  try {
    const { email, senha } = await request.json()
    
    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário no banco
    const usuario = db.prepare(`
      SELECT id, nome, email, senha, role, ativo, permissoes, ultimo_login
      FROM usuarios 
      WHERE email = ? AND ativo = 1
    `).get(email) as any

    if (!usuario) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha)
    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Atualizar último login
    db.prepare(`
      UPDATE usuarios 
      SET ultimo_login = datetime('now', 'localtime') 
      WHERE id = ?
    `).run(usuario.id)

    // Criar token JWT simples
    const token = jwt.sign(
      {
        userId: usuario.id,
        email: usuario.email,
        role: usuario.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Resposta simples
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      }
    })

  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}