const Database = require('better-sqlite3');

try {
  const db = new Database('database.db');
  console.log('Tabelas no banco database.db:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(tables);
  db.close();
} catch (error) {
  console.error('Erro:', error.message);
}