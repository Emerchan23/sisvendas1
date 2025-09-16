const Database = require('better-sqlite3');
const path = require('path');

// Configurar o caminho do banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

try {
  console.log('=== ESTRUTURA DA TABELA VENDAS ===');
  const vendasSchema = db.prepare('PRAGMA table_info(vendas)').all();
  vendasSchema.forEach(col => {
    console.log(`- ${col.name}: ${col.type}`);
  });
  
  console.log('\n=== ESTRUTURA DA TABELA VALES ===');
  const valesSchema = db.prepare('PRAGMA table_info(vales)').all();
  valesSchema.forEach(col => {
    console.log(`- ${col.name}: ${col.type}`);
  });
  
} catch (error) {
  console.error('❌ Erro:', error.message);
} finally {
  db.close();
}