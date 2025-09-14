import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura-aqui'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    try {
      // Verificar se o token atual ainda é válido (mesmo que próximo do vencimento)
      const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true }) as any
      
      // Buscar usuário no banco para garantir que ainda está ativo
      const usuario = db.prepare(`
        SELECT id, nome, email, role, ativo, permissoes, ultimo_login
        FROM usuarios 
        WHERE id = ? AND ativo = 1
      `).get(decoded.userId) as any

      if (!usuario) {
        return NextResponse.json(
          { error: 'Usuário não encontrado ou inativo' },
          { status: 401 }
        )
      }

      // Criar novo token com tempo de expiração renovado
      const newToken = jwt.sign(
        {
          userId: usuario.id,
          email: usuario.email,
          role: usuario.role,
          permissoes: JSON.parse(usuario.permissoes || '{}')
        },
        JWT_SECRET,
        { expiresIn: '2h' }
      )

      // Atualizar último login
      db.prepare(`
        UPDATE usuarios 
        SET ultimo_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(usuario.id)

      return NextResponse.json({
        success: true,
        token: newToken,
        usuario: {
          ...usuario,
          permissoes: JSON.parse(usuario.permissoes || '{}')
        }
      })

    } catch (jwtError) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

  } catch (error) {
    console.error('Erro no refresh do token:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}