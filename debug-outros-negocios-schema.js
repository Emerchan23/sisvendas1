const Database = require('better-sqlite3');

try {
  const db = new Database('../Banco de dados Aqui/erp.sqlite');
  
  console.log('=== SCHEMA DA TABELA outros_negocios ===');
  const schema = db.prepare('SELECT sql FROM sqlite_master WHERE type=\'table\' AND name=\'outros_negocios\'').get();
  console.log(schema ? schema.sql : 'Tabela não encontrada');
  
  console.log('\n=== FOREIGN KEYS ===');
  const foreignKeys = db.prepare('PRAGMA foreign_key_list(outros_negocios)').all();
  console.log(JSON.stringify(foreignKeys, null, 2));
  
  console.log('\n=== ÍNDICES ===');
  const indexes = db.prepare('PRAGMA index_list(outros_negocios)').all();
  console.log(JSON.stringify(indexes, null, 2));
  
  console.log('\n=== COLUNAS ===');
  const columns = db.prepare('PRAGMA table_info(outros_negocios)').all();
  console.log(JSON.stringify(columns, null, 2));
  
  db.close();
} catch (error) {
  console.error('Erro:', error.message);
}