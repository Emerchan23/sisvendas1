import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Iniciando teste de conexão SMTP - Sistema simplificado para uma empresa')
    
    // Sistema simplificado - não precisa mais do empresaId pois só há uma empresa

    // Buscar configurações SMTP da tabela empresas
    const config = db.prepare("SELECT * FROM empresas LIMIT 1").get() as {
      smtp_host: string;
      smtp_port: number;
      smtp_secure: boolean;
      smtp_user: string;
      smtp_password: string;
      smtp_from_name: string;
      smtp_from_email: string;
      nome: string;
      [key: string]: unknown;
    } | undefined
    
    console.log('📊 Configurações carregadas:', {
      host: config?.smtp_host,
      port: config?.smtp_port,
      user: config?.smtp_user ? '***' + config.smtp_user.slice(-10) : 'não definido',
      password: config?.smtp_password ? '***definida' : 'não definida'
    })
    
    if (!config) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    // Extrair configurações SMTP do banco (declarar fora do try para usar no catch)
    const smtpHost = config.smtp_host
    const smtpPort = config.smtp_port || 587
    const smtpSecure = Boolean(config.smtp_secure)
    const smtpUser = config.smtp_user
    const smtpPassword = config.smtp_password
    const smtpFromName = config.smtp_from_name
    const smtpFromEmail = config.smtp_from_email

    // Validar configurações obrigatórias
    const missingFields = []
    if (!config.smtp_host || config.smtp_host === 'NÃO CONFIGURADO') missingFields.push('Host SMTP')
    if (!config.smtp_port || config.smtp_port === 0) missingFields.push('Porta SMTP')
    if (!config.smtp_user || config.smtp_user === 'NÃO CONFIGURADO') missingFields.push('Usuário SMTP')
    if (!config.smtp_password || config.smtp_password === 'NÃO CONFIGURADO') missingFields.push('Senha SMTP')
    
    if (missingFields.length > 0) {
      console.log('❌ Campos não configurados:', missingFields)
      return NextResponse.json(
        { 
          error: 'Configurações SMTP incompletas',
          details: `Os seguintes campos precisam ser configurados: ${missingFields.join(', ')}`,
          missingFields
        },
        { status: 400 }
      )
    }
    
    // Validações adicionais
    const validationErrors = []
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(config.smtp_user)) {
      validationErrors.push('O usuário SMTP deve ser um email válido')
    }
    
    // Validar porta
    if (config.smtp_port < 1 || config.smtp_port > 65535) {
      validationErrors.push('A porta SMTP deve estar entre 1 e 65535')
    }
    
    // Verificar se é Gmail e alertar sobre senha de app
    const isGmail = config.smtp_host?.includes('gmail.com')
    if (isGmail && config.smtp_password && !config.smtp_password.match(/^[a-z]{16}$/)) {
      validationErrors.push('Para Gmail, use uma senha de app de 16 caracteres (apenas letras minúsculas)')
    }
    
    if (validationErrors.length > 0) {
      console.log('❌ Erros de validação:', validationErrors)
      return NextResponse.json(
        { 
          error: 'Configurações SMTP inválidas',
          details: validationErrors.join('; '),
          validationErrors
        },
        { status: 400 }
      )
    }

    // Criar transporter com configuração correta para diferentes provedores
    const transporterConfig: any = {
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465, // true apenas para porta 465
      auth: {
        user: smtpUser,
        pass: smtpPassword
      },
      // Timeout para teste de conexão
      connectionTimeout: 10000, // 10 segundos
      greetingTimeout: 5000, // 5 segundos
      socketTimeout: 10000 // 10 segundos
    }
    
    // Para portas diferentes de 465, usar STARTTLS
    if (Number(smtpPort) !== 465) {
      transporterConfig.requireTLS = true
    }
    
    const transporter = nodemailer.createTransport(transporterConfig)

    // Testar conexão com logs detalhados
    console.log('🔄 Iniciando teste de conexão SMTP...')
    console.log(`📧 Servidor: ${smtpHost}:${smtpPort} (SSL: ${Boolean(smtpSecure)})`)
    console.log(`👤 Usuário: ${smtpUser}`)
    
    const startTime = Date.now()
    await transporter.verify()
    const connectionTime = Date.now() - startTime
    
    console.log(`✅ Conexão SMTP estabelecida com sucesso em ${connectionTime}ms`)
    
    return NextResponse.json({
      success: true,
      message: 'Conexão SMTP testada com sucesso!',
      details: {
        status: 'Conectado com sucesso',
        connectionTime: `${connectionTime}ms`,
        server: `${smtpHost}:${smtpPort}`,
        security: Boolean(smtpSecure) ? 'SSL/TLS ativado' : 'Conexão não segura',
        authentication: 'Credenciais válidas',
        timestamp: new Date().toLocaleString('pt-BR')
      },
      config: {
        host: smtpHost,
        port: smtpPort,
        secure: Boolean(smtpSecure),
        user: smtpUser,
        fromName: smtpFromName || config.nome,
        fromEmail: smtpFromEmail || smtpUser
      }
    })

  } catch (error: any) {
    console.error('❌ Erro no teste SMTP:', error)
    
    let errorMessage = 'Erro desconhecido'
    let troubleshootingTips: string[] = []
    
    // Detectar provedor baseado no host
    const isGmail = smtpHost?.includes('gmail.com')
    const isOutlook = smtpHost?.includes('outlook') || smtpHost?.includes('hotmail')
    const isYahoo = smtpHost?.includes('yahoo.com')
    
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      errorMessage = 'Falha na autenticação'
      
      if (isGmail) {
        troubleshootingTips = [
          '🔑 Para Gmail, você DEVE usar uma "Senha de app" (não a senha normal)',
          '1. Acesse https://myaccount.google.com/security',
          '2. Ative a verificação em 2 etapas',
          '3. Gere uma "Senha de app" específica para este sistema',
          '4. Use essa senha de 16 caracteres no campo senha'
        ]
      } else if (isOutlook) {
        troubleshootingTips = [
          '🔑 Para Outlook/Hotmail, verifique:',
          '1. Se a conta tem verificação em 2 etapas ativada',
          '2. Use uma senha de app se necessário',
          '3. Verifique se SMTP está habilitado na conta'
        ]
      } else {
        troubleshootingTips = [
          'Verifique se o usuário (email) está correto',
          'Confirme se a senha está correta',
          'Verifique se a autenticação está habilitada no servidor'
        ]
      }
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Timeout na conexão'
      troubleshootingTips = [
        'Verifique se o servidor SMTP está acessível',
        'Confirme se a porta está correta',
        'Verifique se não há firewall bloqueando a conexão'
      ]
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Conexão recusada'
      troubleshootingTips = [
        'Verifique se o host SMTP está correto',
        'Confirme se a porta está correta',
        'Verifique se o servidor SMTP está funcionando'
      ]
    } else if (error.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: error.response || 'As credenciais fornecidas são inválidas',
        troubleshooting: troubleshootingTips,
        provider: isGmail ? 'Gmail' : isOutlook ? 'Outlook' : isYahoo ? 'Yahoo' : 'Outro',
        timestamp: new Date().toLocaleString('pt-BR')
      },
      { status: 500 }
    )
  }
}