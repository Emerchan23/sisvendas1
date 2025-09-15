const { db } = require('./lib/db.js');

try {
  console.log('🔍 Testando conectividade com o banco de dados...');
  
  // Testar se o banco está acessível
  const result = db.prepare('SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"').get();
  console.log('✅ Banco conectado. Tabelas encontradas:', result.count);
  
  // Testar tabelas específicas
  const tables = ['linhas_venda', 'fornecedores', 'outros_negocios', 'orcamentos', 'empresas'];
  
  for (const table of tables) {
    try {
      const exists = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
      if (exists) {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        console.log(`✅ Tabela ${table}: ${count.count} registros`);
      } else {
        console.log(`❌ Tabela ${table}: não existe`);
      }
    } catch (e) {
      console.log(`❌ Erro ao acessar tabela ${table}:`, e.message);
    }
  }
  
} catch (error) {
  console.error('❌ Erro de conectividade:', error.message);
  console.error('Stack:', error.stack);
}