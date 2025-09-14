const Database = require('better-sqlite3');

try {
  const db = new Database('database.db');
  const info = db.prepare('PRAGMA table_info(modalidades_compra)').all();
  console.log('Estrutura da tabela modalidades_compra:');
  info.forEach(col => {
    console.log(`${col.name}: ${col.type}`);
  });
  db.close();
} catch (error) {
  console.error('Erro:', error.message);
}