import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Iniciando envio de email...')
    const body = await request.json()
    const { to, subject, html, attachments } = body
    
    console.log('📧 Dados recebidos:', { to, subject, hasHtml: !!html, attachmentsCount: attachments?.length || 0 })
    
    if (!to || !subject || !html) {
      console.log('❌ Campos obrigatórios faltando')
      return NextResponse.json(
        { error: 'Campos obrigatórios: to, subject, html' },
        { status: 400 }
      )
    }

    // Buscar configurações SMTP da empresa
    console.log('🏢 Buscando configurações da empresa...')
    const empresa = db.prepare('SELECT * FROM empresas LIMIT 1').get() as any
    
    if (!empresa) {
      console.log('❌ Nenhuma empresa encontrada no banco de dados')
      return NextResponse.json(
        { error: 'Empresa não encontrada. Configure uma empresa primeiro.' },
        { status: 400 }
      )
    }

    console.log('🏢 Empresa encontrada:', empresa.nome || 'Sem nome')
    console.log('📧 Verificando configurações SMTP...')
    console.log('- SMTP Host:', empresa.smtp_host ? '✅ Configurado' : '❌ Não configurado')
    console.log('- SMTP User:', empresa.smtp_user ? '✅ Configurado' : '❌ Não configurado')
    console.log('- SMTP Password:', empresa.smtp_password ? '✅ Configurado' : '❌ Não configurado')
    console.log('- SMTP From Email:', empresa.smtp_from_email ? '✅ Configurado' : '❌ Não configurado')

    // Verificar se as configurações SMTP estão completas
    if (!empresa.smtp_host || !empresa.smtp_user || !empresa.smtp_password || !empresa.smtp_from_email) {
      console.log('❌ Configurações SMTP incompletas')
      return NextResponse.json(
        { 
          error: 'Configurações SMTP incompletas. Configure o SMTP nas Configurações da Empresa.',
          missing: {
            smtp_host: !empresa.smtp_host,
            smtp_user: !empresa.smtp_user,
            smtp_password: !empresa.smtp_password,
            smtp_from_email: !empresa.smtp_from_email
          }
        },
        { status: 400 }
      )
    }

    // Configurar transporter do Nodemailer
    console.log('🔧 Configurando transporter SMTP...')
    const port = empresa.smtp_port || 587
    const transporterConfig = {
      host: empresa.smtp_host,
      port: port,
      secure: port === 465, // true para porta 465 (SSL), false para outras portas (STARTTLS)
      auth: {
        user: empresa.smtp_user,
        pass: empresa.smtp_password,
      },
    }
    
    console.log('🔧 Configuração SMTP:', {
      host: transporterConfig.host,
      port: transporterConfig.port,
      secure: transporterConfig.secure,
      user: transporterConfig.auth.user
    })
    
    const transporter = nodemailer.createTransport(transporterConfig)

    // Configurar opções do e-mail
    const mailOptions = {
      from: `"${empresa.smtp_from_name || empresa.nome || 'Sistema de Orçamentos'}" <${empresa.smtp_from_email}>`,
      to,
      subject,
      html,
      attachments: attachments || []
    }

    // Enviar e-mail
    console.log('📧 Tentando enviar e-mail...')
    console.log('📋 Detalhes do e-mail:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      messageLength: mailOptions.text?.length || 0
    })
    
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ E-mail enviado com sucesso:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response
    })

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      message: 'E-mail enviado com sucesso!' 
    })

  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error)
    
    // Identificar tipo de erro específico
    let errorMessage = 'Erro interno do servidor ao enviar e-mail'
    let errorDetails = error instanceof Error ? error.message : 'Erro desconhecido'
    
    if (error instanceof Error) {
      if (error.message.includes('EAUTH')) {
        errorMessage = 'Erro de autenticação SMTP. Verifique usuário e senha.'
      } else if (error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Não foi possível conectar ao servidor SMTP. Verifique host e porta.'
      } else if (error.message.includes('ETIMEDOUT')) {
        errorMessage = 'Timeout na conexão SMTP. Verifique a conectividade.'
      } else if (error.message.includes('Invalid login')) {
        errorMessage = 'Login inválido. Verifique as credenciais SMTP.'
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}