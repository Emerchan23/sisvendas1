import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'

export async function GET() {
  try {
    // Buscar configurações da empresa
    const config = db.prepare('SELECT * FROM empresas LIMIT 1').get() as any
    
    if (!config) {
      // Inserir empresa padrão se não existir
      db.prepare(`
        INSERT INTO empresas (nome, nome_do_sistema, imposto_padrao, capital_padrao)
        VALUES ('LP IND', 'LP IND', 10, 15)
      `).run()
      
      const newConfig = db.prepare('SELECT * FROM empresas LIMIT 1').get() as any
      return NextResponse.json(newConfig)
    }
    
    return NextResponse.json(config)
  } catch (error) {
    console.error('Erro ao buscar configurações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    console.log('📝 Salvando configurações:', data)
    
    // Verificar se já existe empresa
    const existingEmpresa = db.prepare('SELECT id FROM empresas LIMIT 1').get() as any
    
    if (existingEmpresa) {
      // Atualizar empresa existente - apenas campos fornecidos
      const updateFields = []
      const updateValues = []
      
      if (data.nome !== undefined) {
        updateFields.push('nome = ?')
        updateValues.push(data.nome)
      }
      if (data.razaoSocial !== undefined) {
        updateFields.push('razao_social = ?')
        updateValues.push(data.razaoSocial)
      }
      if (data.cnpj !== undefined) {
        updateFields.push('cnpj = ?')
        updateValues.push(data.cnpj)
      }
      if (data.endereco !== undefined) {
        updateFields.push('endereco = ?')
        updateValues.push(data.endereco)
      }
      if (data.email !== undefined) {
        updateFields.push('email = ?')
        updateValues.push(data.email)
      }
      if (data.telefone !== undefined) {
        updateFields.push('telefone = ?')
        updateValues.push(data.telefone)
      }
      if (data.logoUrl !== undefined) {
        updateFields.push('logo_url = ?')
        updateValues.push(data.logoUrl)
      }
      if (data.nomeDoSistema !== undefined) {
        updateFields.push('nome_do_sistema = ?')
        updateValues.push(data.nomeDoSistema)
      }
      if (data.impostoPadrao !== undefined) {
        updateFields.push('imposto_padrao = ?')
        updateValues.push(data.impostoPadrao)
      }
      if (data.capitalPadrao !== undefined) {
        updateFields.push('capital_padrao = ?')
        updateValues.push(data.capitalPadrao)
      }
      
      // Campos SMTP
      if (data.smtpHost !== undefined) {
        updateFields.push('smtp_host = ?')
        updateValues.push(data.smtpHost)
      }
      if (data.smtpPort !== undefined) {
        updateFields.push('smtp_port = ?')
        updateValues.push(data.smtpPort)
      }
      if (data.smtpSecure !== undefined) {
        updateFields.push('smtp_secure = ?')
        updateValues.push(data.smtpSecure ? 1 : 0)
      }
      if (data.smtpUser !== undefined) {
        updateFields.push('smtp_user = ?')
        updateValues.push(data.smtpUser)
      }
      if (data.smtpPassword !== undefined) {
        updateFields.push('smtp_password = ?')
        updateValues.push(data.smtpPassword)
      }
      if (data.smtpFromName !== undefined) {
        updateFields.push('smtp_from_name = ?')
        updateValues.push(data.smtpFromName)
      }
      if (data.smtpFromEmail !== undefined) {
        updateFields.push('smtp_from_email = ?')
        updateValues.push(data.smtpFromEmail)
      }
      
      // Email templates
      if (data.emailTemplateOrcamento !== undefined) {
        updateFields.push('email_template_orcamento = ?')
        updateValues.push(data.emailTemplateOrcamento)
      }
      if (data.emailTemplateVale !== undefined) {
        updateFields.push('email_template_vale = ?')
        updateValues.push(data.emailTemplateVale)
      }
      if (data.emailTemplateRelatorio !== undefined) {
        updateFields.push('email_template_relatorio = ?')
        updateValues.push(data.emailTemplateRelatorio)
      }
      
      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP')
        updateValues.push(existingEmpresa.id)
        
        const updateQuery = `UPDATE empresas SET ${updateFields.join(', ')} WHERE id = ?`
        
        console.log('🔄 Atualizando empresa existente ID:', existingEmpresa.id)
        console.log('📝 Campos a atualizar:', updateFields)
        
        db.prepare(updateQuery).run(...updateValues)
      } else {
        console.log('⚠️ Nenhum campo para atualizar')
      }
    } else {
      // Inserir nova empresa
      const insertQuery = `
        INSERT INTO empresas (
          nome, razao_social, cnpj, endereco, email, telefone, logo_url,
          nome_do_sistema, imposto_padrao, capital_padrao, smtp_host, smtp_port,
          smtp_secure, smtp_user, smtp_password, smtp_from_name, smtp_from_email
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `
      
      console.log('➕ Criando nova empresa')
      
      db.prepare(insertQuery).run(
        data.nome || null,
        data.razaoSocial || null,
        data.cnpj || null,
        data.endereco || null,
        data.email || null,
        data.telefone || null,
        data.logoUrl || null,
        data.nomeDoSistema || 'LP IND',
        data.impostoPadrao || 10,
        data.capitalPadrao || 15,
        data.smtpHost || null,
        data.smtpPort || 587,
        data.smtpSecure ? 1 : 0,
        data.smtpUser || null,
        data.smtpPassword || null,
        data.smtpFromName || null,
        data.smtpFromEmail || null
      )
    }
    
    // Retornar configuração atualizada
    const updatedConfig = db.prepare('SELECT * FROM empresas LIMIT 1').get()
    
    console.log('✅ Configurações salvas com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      config: updatedConfig
    })
  } catch (error) {
    console.error('❌ Erro ao salvar configurações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}