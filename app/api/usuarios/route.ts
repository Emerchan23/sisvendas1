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

// GET - Listar usuários
export async function GET(request: NextRequest) {
  try {
    const auth = verificarAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const usuarios = db.prepare(`
      SELECT id, nome, email, role, ativo, permissoes, ultimo_login, created_at, updated_at
      FROM usuarios 
      WHERE ativo = 1
      ORDER BY created_at DESC
    `).all()

    // Processar permissões para garantir que seja um array
    const usuariosProcessados = usuarios.map((usuario: any) => ({
      ...usuario,
      permissoes: usuario.permissoes ? JSON.parse(usuario.permissoes) : []
    }))

    return NextResponse.json({ success: true, usuarios: usuariosProcessados })

  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar usuário
export async function POST(request: NextRequest) {
  try {
    const auth = verificarAuth(request)
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { nome, email, senha, role, permissoes } = await request.json()

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const emailExiste = db.prepare('SELECT COUNT(*) as count FROM usuarios WHERE email = ?').get(email) as { count: number }
    
    if (emailExiste.count > 0) {
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10)

    // Criar usuário
    const novoUsuario = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      nome,
      email,
      senha: hashedPassword,
      role: role || 'user',
      ativo: 1,
      permissoes: JSON.stringify(permissoes || {})
    }

    db.prepare(`
      INSERT INTO usuarios (id, nome, email, senha, role, ativo, permissoes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      novoUsuario.id,
      novoUsuario.nome,
      novoUsuario.email,
      novoUsuario.senha,
      novoUsuario.role,
      novoUsuario.ativo,
      novoUsuario.permissoes
    )

    // Retornar usuário sem senha
    const { senha: _, ...usuarioSemSenha } = novoUsuario
    
    return NextResponse.json({
      success: true,
      usuario: {
        ...usuarioSemSenha,
        permissoes: JSON.parse(novoUsuario.permissoes)
      }
    })

  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}