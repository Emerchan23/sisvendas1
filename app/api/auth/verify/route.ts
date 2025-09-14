import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura-aqui'

export async function GET(request: NextRequest) {
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
      const decoded = jwt.verify(token, JWT_SECRET) as any
      
      // Verificar se usuário ainda existe e está ativo
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

      return NextResponse.json({
        success: true,
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
    console.error('Erro na verificação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}