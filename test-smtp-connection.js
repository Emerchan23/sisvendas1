const nodemailer = require('nodemailer');
const Database = require('better-sqlite3');
const path = require('path');

async function testSMTPConnection() {
  try {
    console.log('🔧 Testando conexão SMTP...');
    
    // Conectar ao banco
    const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
    const db = new Database(dbPath);
    
    // Buscar configurações
    const empresa = db.prepare('SELECT * FROM empresas LIMIT 1').get();
    
    if (!empresa) {
      console.log('❌ Empresa não encontrada');
      return;
    }
    
    console.log('🏢 Empresa:', empresa.nome);
    console.log('📧 Configurações SMTP:');
    console.log('- Host:', empresa.smtp_host);
    console.log('- Port:', empresa.smtp_port);
    console.log('- User:', empresa.smtp_user);
    console.log('- Secure:', empresa.smtp_secure);
    
    // Criar transporter
    const port = empresa.smtp_port || 587;
    const transporter = nodemailer.createTransport({
      host: empresa.smtp_host,
      port: port,
      secure: port === 465, // true para porta 465 (SSL), false para outras portas (STARTTLS)
      auth: {
        user: empresa.smtp_user,
        pass: empresa.smtp_password,
      },
    });
    
    // Testar conexão
    console.log('🔍 Verificando conexão...');
    await transporter.verify();
    console.log('✅ Conexão SMTP funcionando!');
    
    // Testar envio de e-mail
    console.log('📤 Testando envio de e-mail...');
    const info = await transporter.sendMail({
      from: `"${empresa.smtp_from_name || empresa.nome}" <${empresa.smtp_from_email}>`,
      to: empresa.smtp_from_email, // Enviar para si mesmo
      subject: 'Teste de Conexão SMTP',
      html: '<h1>Teste de E-mail</h1><p>Se você recebeu este e-mail, a configuração SMTP está funcionando!</p>'
    });
    
    console.log('✅ E-mail enviado com sucesso!');
    console.log('📧 Message ID:', info.messageId);
    
    db.close();
    
  } catch (error) {
    console.error('❌ Erro no teste SMTP:', error.message);
    
    // Identificar tipo de erro
    if (error.message.includes('EAUTH')) {
      console.log('🔐 Problema de autenticação - verifique usuário e senha');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('🌐 Conexão recusada - verifique host e porta');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.log('⏱️ Timeout - verifique conectividade');
    } else if (error.message.includes('Invalid login')) {
      console.log('🚫 Login inválido - verifique credenciais');
    }
  }
}

testSMTPConnection();