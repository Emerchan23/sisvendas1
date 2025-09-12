import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura-aqui'

// Função para verificar autenticação e permissões
function verificarAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Token não fornecido', status: 401 }
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Verificar se usuário ainda existe e está ativo
    const usuario = db.prepare(`
      SELECT id, nome, email, role, ativo, permissoes
      FROM usuarios 
      WHERE id = ? AND ativo = 1
    `).get(decoded.userId) as any

    if (!usuario) {
      return { error: 'Usuário não encontrado ou inativo', status: 401 }
    }

    const permissoes = JSON.parse(usuario.permissoes || '{}')
    
    // Verificar se tem permissão para gerenciar usuários
    if (usuario.role !== 'admin' && !permissoes.usuarios) {
      return { error: 'Sem permissão para gerenciar usuários', status: 403 }
    }

    return { usuario, permissoes }
  } catch (error) {
    return { error: 'Token inválido', status: 401 }
  }
}

// PUT - Atualizar usuário
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = verificarAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const { nome, email, senha, role, ativo, permissoes } = await request.json()

    // Verificar se usuário existe
    const usuarioExiste = db.prepare('SELECT COUNT(*) as count FROM usuarios WHERE id = ?').get(id) as { count: number }
    
    if (usuarioExiste.count === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se email já está em uso por outro usuário
    if (email) {
      const emailExiste = db.prepare('SELECT COUNT(*) as count FROM usuarios WHERE email = ? AND id != ?').get(email, id) as { count: number }
      
      if (emailExiste.count > 0) {
        return NextResponse.json(
          { error: 'Email já está em uso' },
          { status: 400 }
        )
      }
    }

    // Preparar dados para atualização
    const dadosAtualizacao: any = {}
    const campos: string[] = []
    const valores: any[] = []

    if (nome !== undefined) {
      campos.push('nome = ?')
      valores.push(nome)
    }

    if (email !== undefined) {
      campos.push('email = ?')
      valores.push(email)
    }

    if (senha !== undefined && senha !== '') {
      const hashedPassword = await bcrypt.hash(senha, 10)
      campos.push('senha = ?')
      valores.push(hashedPassword)
    }

    if (role !== undefined) {
      campos.push('role = ?')
      valores.push(role)
    }

    if (ativo !== undefined) {
      campos.push('ativo = ?')
      valores.push(ativo ? 1 : 0)
    }

    if (permissoes !== undefined) {
      campos.push('permissoes = ?')
      valores.push(JSON.stringify(permissoes))
    }

    campos.push('updated_at = CURRENT_TIMESTAMP')
    valores.push(id)

    if (campos.length === 1) { // Apenas updated_at
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      )
    }

    // Executar atualização
    db.prepare(`
      UPDATE usuarios 
      SET ${campos.join(', ')}
      WHERE id = ?
    `).run(...valores)

    // Buscar usuário atualizado
    const usuarioAtualizado = db.prepare(`
      SELECT id, nome, email, role, ativo, permissoes, ultimo_login, created_at, updated_at
      FROM usuarios 
      WHERE id = ?
    `).get(id) as any

    return NextResponse.json({
      success: true,
      usuario: {
        ...usuarioAtualizado,
        permissoes: JSON.parse(usuarioAtualizado.permissoes || '{}')
      }
    })

  } catch (error) {
    console.error('Erro ao atualizar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Excluir usuário
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = verificarAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params

    // Verificar se usuário existe
    const usuario = db.prepare('SELECT id, role FROM usuarios WHERE id = ?').get(id) as any
    
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Não permitir excluir o próprio usuário
    if (auth.usuario.id === id) {
      return NextResponse.json(
        { error: 'Não é possível excluir seu próprio usuário' },
        { status: 400 }
      )
    }

    // Excluir usuário (soft delete - marcar como inativo)
    db.prepare(`
      UPDATE usuarios 
      SET ativo = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id)

    return NextResponse.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    })

  } catch (error) {
    console.error('Erro ao excluir usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}