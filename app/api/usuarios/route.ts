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

    // Processar permissões para garantir que seja um objeto
    const usuariosProcessados = usuarios.map((usuario: any) => ({
      ...usuario,
      permissoes: usuario.permissoes ? JSON.parse(usuario.permissoes) : {}
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

    const body = await request.json()
    console.log('POST /api/usuarios - Dados recebidos:', JSON.stringify(body, null, 2))
    
    const { nome, email, senha, role, ativo, permissoes } = body
    
    // Verificar se todos os campos obrigatórios estão presentes
    if (!nome || !email || !senha || !role) {
      console.log('POST /api/usuarios - Erro: Campos obrigatórios faltando', {
        nome: !!nome,
        email: !!email,
        senha: !!senha,
        role: !!role
      })
      return NextResponse.json(
        { error: 'Todos os campos obrigatórios devem ser preenchidos' },
        { status: 400 }
      )
    }

    // Verificar se o email já existe
    const usuarioExistente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email)
    console.log('POST /api/usuarios - Verificação de email único:', { email, existe: !!usuarioExistente })
    if (usuarioExistente) {
      console.log('POST /api/usuarios - Erro: Email já existe')
      return NextResponse.json(
        { error: 'Email já está em uso' },
        { status: 400 }
      )
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10)
    console.log('POST /api/usuarios - Senha hasheada com sucesso')
    
    // Processar permissões - converter array para objeto se necessário
    let permissoesObj = {}
    if (Array.isArray(permissoes)) {
      // Se recebeu um array, converter para objeto
      permissoes.forEach(perm => {
        permissoesObj[perm] = true
      })
    } else if (typeof permissoes === 'object' && permissoes !== null) {
      // Se já é um objeto, usar diretamente
      permissoesObj = permissoes
    }
    const permissoesProcessadas = JSON.stringify(permissoesObj)
    console.log('POST /api/usuarios - Permissões processadas:', permissoesProcessadas)
    
    // Gerar ID único para o usuário
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Inserir usuário
    console.log('POST /api/usuarios - Tentando inserir usuário:', {
      id: userId,
      nome,
      email,
      role,
      ativo: ativo ? 1 : 0,
      permissoes: permissoesProcessadas
    })
    
    const result = db.prepare(`
      INSERT INTO usuarios (id, nome, email, senha, role, ativo, permissoes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, nome, email, senhaHash, role, ativo ? 1 : 0, permissoesProcessadas)

    // Buscar o usuário criado usando o userId gerado
    const usuarioCriado = db.prepare(`
      SELECT id, nome, email, role, ativo, permissoes, created_at
      FROM usuarios 
      WHERE id = ?
    `).get(userId)
    
    console.log('POST /api/usuarios - Usuário criado com sucesso:', usuarioCriado)
    
    if (!usuarioCriado) {
      console.log('POST /api/usuarios - Erro: Usuário não encontrado após criação')
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      usuario: {
        ...usuarioCriado,
        permissoes: JSON.parse(usuarioCriado.permissoes || '[]')
      }
    })

  } catch (error) {
    console.error('POST /api/usuarios - Erro detalhado:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    })
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}