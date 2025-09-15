const fetch = require('node-fetch');

async function testSmtpAPI() {
  console.log('🧪 Testando API de configurações SMTP...');
  
  try {
    // 1. Buscar configuração atual
    console.log('📋 Buscando configuração atual...');
    const getResponse = await fetch('http://localhost:3145/api/config');
    const currentConfig = await getResponse.json();
    console.log('✅ Configuração atual:', {
      smtp_host: currentConfig.smtp_host,
      smtp_port: currentConfig.smtp_port,
      smtp_user: currentConfig.smtp_user,
      smtp_from_email: currentConfig.smtp_from_email
    });
    
    // 2. Salvar nova configuração SMTP
    console.log('\n💾 Salvando nova configuração SMTP...');
    const smtpData = {
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smtpSecure: true,
      smtpUser: 'teste@gmail.com',
      smtpPassword: 'senha123',
      smtpFromName: 'Sistema Teste',
      smtpFromEmail: 'noreply@sistema.com'
    };
    
    const postResponse = await fetch('http://localhost:3145/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(smtpData)
    });
    
    const saveResult = await postResponse.json();
    console.log('📤 Resposta do salvamento:', saveResult.success ? '✅ Sucesso' : '❌ Erro');
    if (saveResult.error) {
      console.log('❌ Erro:', saveResult.error);
    }
    
    // 3. Verificar se foi salvo corretamente
    console.log('\n🔍 Verificando se foi salvo...');
    const verifyResponse = await fetch('http://localhost:3145/api/config');
    const verifyConfig = await verifyResponse.json();
    
    console.log('📊 Dados após salvamento:');
    console.log('  smtp_host:', verifyConfig.smtp_host);
    console.log('  smtp_port:', verifyConfig.smtp_port);
    console.log('  smtp_user:', verifyConfig.smtp_user);
    console.log('  smtp_password:', verifyConfig.smtp_password ? '[DEFINIDA]' : '[VAZIA]');
    console.log('  smtp_from_name:', verifyConfig.smtp_from_name);
    console.log('  smtp_from_email:', verifyConfig.smtp_from_email);
    console.log('  smtp_secure:', verifyConfig.smtp_secure);
    
    // 4. Verificar no banco de dados
    console.log('\n🗄️ Verificando no banco de dados...');
    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('../Banco de dados Aqui/erp.sqlite');
    
    db.get('SELECT smtp_host, smtp_port, smtp_user, smtp_password, smtp_from_name, smtp_from_email, smtp_secure FROM empresas WHERE id = ?', ['default'], (err, row) => {
      if (err) {
        console.log('❌ Erro ao consultar banco:', err);
      } else if (row) {
        console.log('✅ Dados no banco:');
        console.log('  smtp_host:', row.smtp_host);
        console.log('  smtp_port:', row.smtp_port);
        console.log('  smtp_user:', row.smtp_user);
        console.log('  smtp_password:', row.smtp_password ? '[DEFINIDA]' : '[VAZIA]');
        console.log('  smtp_from_name:', row.smtp_from_name);
        console.log('  smtp_from_email:', row.smtp_from_email);
        console.log('  smtp_secure:', row.smtp_secure);
        
        // Verificar se os dados coincidem
        const matches = {
          host: row.smtp_host === smtpData.smtpHost,
          port: row.smtp_port === smtpData.smtpPort,
          user: row.smtp_user === smtpData.smtpUser,
          password: row.smtp_password === smtpData.smtpPassword,
          fromName: row.smtp_from_name === smtpData.smtpFromName,
          fromEmail: row.smtp_from_email === smtpData.smtpFromEmail,
          secure: row.smtp_secure === (smtpData.smtpSecure ? 1 : 0)
        };
        
        console.log('\n📋 Verificação de dados:');
        Object.entries(matches).forEach(([key, match]) => {
          console.log(`  ${key}: ${match ? '✅' : '❌'}`);
        });
        
        const allMatch = Object.values(matches).every(m => m);
        console.log(`\n🎯 RESULTADO: ${allMatch ? '✅ TODOS OS DADOS FORAM SALVOS CORRETAMENTE!' : '❌ ALGUNS DADOS NÃO FORAM SALVOS CORRETAMENTE!'}`);
      } else {
        console.log('❌ Nenhuma empresa encontrada no banco');
      }
      
      db.close();
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testSmtpAPI();