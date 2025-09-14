import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db'

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura-aqui'

// Função para carregar configurações de autenticação
async function getAuthConfig() {
  try {
    const config = db.prepare(`
      SELECT config_key, config_value FROM configuracoes 
      WHERE config_key IN ('normalExpiryHours', 'rememberMeExpiryDays')
    `).all() as { config_key: string; config_value: string }[]
    
    const configObj: any = {}
    config.forEach(item => {
      configObj[item.config_key] = JSON.parse(item.config_value)
    })
    
    return {
      normalExpiryHours: configObj.normalExpiryHours || 2,
      rememberMeExpiryDays: configObj.rememberMeExpiryDays || 7
    }
  } catch (error) {
    console.error('Erro ao carregar configurações de autenticação:', error)
    // Retornar valores padrão em caso de erro
    return {
      normalExpiryHours: 2,
      rememberMeExpiryDays: 7
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 Iniciando processo de login...')
    const { email, senha, rememberMe } = await request.json()
    console.log('📧 Email recebido:', email)

    if (!email || !senha) {
      console.log('❌ Email ou senha não fornecidos')
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar usuário no banco
    console.log('🔍 Buscando usuário no banco...')
    const usuario = db.prepare(`
      SELECT id, nome, email, senha, role, ativo, permissoes, ultimo_login
      FROM usuarios 
      WHERE email = ? AND ativo = 1
    `).get(email) as any
    console.log('👤 Usuário encontrado:', usuario ? 'Sim' : 'Não')

    if (!usuario) {
      console.log('❌ Usuário não encontrado ou inativo')
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Verificar senha
    console.log('🔑 Verificando senha...')
    const senhaValida = await bcrypt.compare(senha, usuario.senha)
    console.log('✅ Senha válida:', senhaValida)
    if (!senhaValida) {
      console.log('❌ Senha inválida')
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

    // Carregar configurações de autenticação
    const authConfig = await getAuthConfig()
    
    // Criar token JWT
    console.log('🎫 Criando token JWT...')
    const expiresIn = rememberMe ? `${authConfig.rememberMeExpiryDays}d` : `${authConfig.normalExpiryHours}h`
    console.log('⏰ Tempo de expiração:', expiresIn)
    const token = jwt.sign(
      {
        userId: usuario.id,
        email: usuario.email,
        role: usuario.role,
        permissoes: JSON.parse(usuario.permissoes || '{}')
      },
      JWT_SECRET,
      { expiresIn }
    )
    console.log('🎫 Token criado com sucesso')

    // Remover senha da resposta
    const { senha: _, ...usuarioSemSenha } = usuario

    const response = {
      success: true,
      token,
      usuario: {
        ...usuarioSemSenha,
        permissoes: JSON.parse(usuario.permissoes || '{}')
      }
    }
    
    console.log('✅ Login realizado com sucesso, enviando resposta...')
    return NextResponse.json(response)

  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}