import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura-aqui'

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
      SET ultimo_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(usuario.id)

    // Criar token JWT
    const token = jwt.sign(
      {
        userId: usuario.id,
        email: usuario.email,
        role: usuario.role,
        permissoes: JSON.parse(usuario.permissoes || '{}')
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Remover senha da resposta
    const { senha: _, ...usuarioSemSenha } = usuario

    return NextResponse.json({
      success: true,
      token,
      usuario: {
        ...usuarioSemSenha,
        permissoes: JSON.parse(usuario.permissoes || '{}')
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