const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Caminho correto do banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');

console.log('Testando conectividade do banco de dados...');
console.log('Caminho do banco:', dbPath);

try {
  // Verificar se o arquivo existe
  if (!fs.existsSync(dbPath)) {
    console.error('❌ Arquivo do banco de dados não encontrado:', dbPath);
    process.exit(1);
  }
  
  // Conectar ao banco
  const db = new Database(dbPath, { readonly: true });
  console.log('✅ Conectado ao banco de dados SQLite com sucesso!');
  
  // Testar uma consulta simples - listar todas as tabelas
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('✅ Consulta executada com sucesso!');
  console.log('Tabelas encontradas:', tables.map(t => t.name).join(', '));
  
  // Contar registros em algumas tabelas principais
  const mainTables = ['empresas', 'clientes', 'vendas', 'outros_negocios', 'orcamentos', 'acertos'];
  
  mainTables.forEach(tableName => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`✅ Tabela ${tableName}: ${count.count} registros`);
    } catch (err) {
      console.log(`❌ Erro ao contar registros em ${tableName}:`, err.message);
    }
  });
  
  // Testar uma consulta mais complexa
  try {
    const empresas = db.prepare('SELECT id, nome FROM empresas LIMIT 3').all();
    console.log('✅ Teste de consulta de empresas:', empresas.length > 0 ? 'Dados encontrados' : 'Nenhum dado');
  } catch (err) {
    console.log('❌ Erro ao consultar empresas:', err.message);
  }
  
  db.close();
  console.log('\n🎉 Teste de conectividade concluído com sucesso!');
  
} catch (err) {
  console.error('❌ Erro ao conectar ao banco de dados:', err.message);
  process.exit(1);
}