const Database = require('better-sqlite3');
const { join } = require('path');

const dbPath = join(process.cwd(), 'data', 'erp.sqlite');
const db = new Database(dbPath);

try {
  // Verificar se existe alguma empresa
  const empresa = db.prepare('SELECT * FROM empresas LIMIT 1').get();
  
  if (empresa) {
    console.log('✅ Empresa encontrada:', empresa.nome);
    console.log('📧 Configurações SMTP atuais:');
    console.log('- Host:', empresa.smtp_host || 'NÃO CONFIGURADO');
    console.log('- Porta:', empresa.smtp_port || 'NÃO CONFIGURADO');
    console.log('- Usuário:', empresa.smtp_user || 'NÃO CONFIGURADO');
    console.log('- Senha:', empresa.smtp_password ? '***CONFIGURADA***' : 'NÃO CONFIGURADO');
    console.log('- Nome do Remetente:', empresa.smtp_from_name || 'NÃO CONFIGURADO');
    console.log('- Email do Remetente:', empresa.smtp_from_email || 'NÃO CONFIGURADO');
    console.log('- SSL/TLS:', empresa.smtp_secure ? 'ATIVADO' : 'DESATIVADO');
  } else {
    console.log('❌ Nenhuma empresa encontrada no banco de dados');
  }
} catch (error) {
  console.error('❌ Erro ao acessar banco de dados:', error.message);
} finally {
  db.close();
}