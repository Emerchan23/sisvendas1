import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura-aqui'

export async function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Token não fornecido' }
    }

    const token = authHeader.substring(7)

    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Verificar se usuário ainda existe e está ativo
    const usuario = db.prepare(`
      SELECT id, nome, email, role, ativo, permissoes
      FROM usuarios 
      WHERE id = ? AND ativo = 1
    `).get(decoded.userId) as any

    if (!usuario) {
      return { success: false, error: 'Usuário não encontrado ou inativo' }
    }

    const permissoes = JSON.parse(usuario.permissoes || '{}')
    
    return { 
      success: true, 
      usuario: {
        ...usuario,
        permissoes
      }
    }
  } catch (error) {
    return { success: false, error: 'Token inválido' }
  }
}