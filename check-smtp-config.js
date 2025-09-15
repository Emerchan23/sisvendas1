const Database = require('better-sqlite3');
const { join } = require('path');

// Caminho do banco de dados
const dbPath = join(process.cwd(), '..', 'Banco de dados Aqui', 'erp.sqlite');

try {
  console.log('🔍 Verificando configurações SMTP...');
  console.log('📁 Caminho do banco:', dbPath);
  
  const db = new Database(dbPath);
  
  // Buscar empresa
  const empresa = db.prepare('SELECT * FROM empresas LIMIT 1').get();
  
  if (!empresa) {
    console.log('❌ Nenhuma empresa encontrada no banco de dados');
    console.log('\n🔧 Para resolver o erro de e-mail, você precisa:');
    console.log('1. Configurar uma empresa no sistema');
    console.log('2. Definir as configurações SMTP da empresa');
    process.exit(1);
  }
  
  console.log('\n🏢 Empresa encontrada:', empresa.nome || 'Sem nome');
  console.log('\n📧 Configurações SMTP:');
  console.log('- Host SMTP:', empresa.smtp_host || '❌ NÃO CONFIGURADO');
  console.log('- Porta SMTP:', empresa.smtp_port || '❌ NÃO CONFIGURADO (padrão: 587)');
  console.log('- Usuário SMTP:', empresa.smtp_user || '❌ NÃO CONFIGURADO');
  console.log('- Senha SMTP:', empresa.smtp_password ? '✅ CONFIGURADO' : '❌ NÃO CONFIGURADO');
  console.log('- E-mail remetente:', empresa.smtp_from_email || '❌ NÃO CONFIGURADO');
  console.log('- Nome remetente:', empresa.smtp_from_name || '❌ NÃO CONFIGURADO');
  console.log('- Conexão segura:', empresa.smtp_secure ? 'Sim' : 'Não');
  
  // Verificar se todas as configurações obrigatórias estão presentes
  const configsObrigatorias = [
    { campo: 'smtp_host', valor: empresa.smtp_host },
    { campo: 'smtp_user', valor: empresa.smtp_user },
    { campo: 'smtp_password', valor: empresa.smtp_password },
    { campo: 'smtp_from_email', valor: empresa.smtp_from_email }
  ];
  
  const configsFaltando = configsObrigatorias.filter(config => !config.valor);
  
  if (configsFaltando.length > 0) {
    console.log('\n❌ CONFIGURAÇÕES SMTP INCOMPLETAS!');
    console.log('\nCampos faltando:');
    configsFaltando.forEach(config => {
      console.log(`- ${config.campo}`);
    });
    console.log('\n🔧 Para resolver o erro de e-mail:');
    console.log('1. Acesse: Configurações → Empresa');
    console.log('2. Configure todos os campos SMTP obrigatórios');
    console.log('3. Teste a conexão SMTP');
  } else {
    console.log('\n✅ Todas as configurações SMTP obrigatórias estão presentes!');
    console.log('\n🔧 Se ainda há erro de e-mail, verifique:');
    console.log('1. Se as credenciais estão corretas');
    console.log('2. Se o servidor SMTP está acessível');
    console.log('3. Se a porta está correta (587 para TLS, 465 para SSL)');
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Erro ao verificar configurações SMTP:', error.message);
  process.exit(1);
}