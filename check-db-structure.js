const Database = require('better-sqlite3');

console.log('🔍 Verificando estrutura do banco de dados...');

const db = new Database('../Banco de dados Aqui/erp.sqlite');

try {
  // Listar todas as tabelas
  const tables = db.prepare('SELECT name FROM sqlite_master WHERE type=\'table\'').all();
  console.log('📋 Tabelas encontradas:');
  tables.forEach(table => console.log('  -', table.name));
  
  // Procurar por tabelas de configuração
  console.log('\n🔍 Procurando por configurações...');
  const configTables = tables.filter(t => t.name.toLowerCase().includes('config'));
  console.log('📋 Tabelas de configuração:');
  configTables.forEach(table => console.log('  -', table.name));
  
  // Verificar se existe tabela configuracoes
  const configuracoes = tables.find(t => t.name === 'configuracoes');
  if (configuracoes) {
    console.log('\n📊 Conteúdo da tabela configuracoes:');
    const data = db.prepare('SELECT * FROM configuracoes').all();
    console.log(data);
  }
  
  // Verificar estrutura da tabela orcamentos para ver se tem campo data_validade
  console.log('\n🔍 Verificando estrutura da tabela orcamentos...');
  const orcamentosInfo = db.prepare('PRAGMA table_info(orcamentos)').all();
  console.log('📋 Campos da tabela orcamentos:');
  orcamentosInfo.forEach(field => {
    console.log(`  - ${field.name} (${field.type})`);
  });
  
} catch (error) {
  console.error('❌ Erro:', error.message);
} finally {
  db.close();
}