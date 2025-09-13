const Database = require('better-sqlite3');
const db = new Database('./vendas.db');

console.log('=== TABELAS NO BANCO DE DADOS ===');

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tabelas encontradas:', tables.length);
  
  tables.forEach((table, index) => {
    console.log(`${index + 1}. ${table.name}`);
  });
  
  // Se houver tabelas, vamos ver a estrutura da primeira que parece ser de vendas
  if (tables.length > 0) {
    const vendaTable = tables.find(t => t.name.toLowerCase().includes('venda') || t.name.toLowerCase().includes('linha'));
    if (vendaTable) {
      console.log(`\n=== ESTRUTURA DA TABELA ${vendaTable.name} ===`);
      const columns = db.prepare(`PRAGMA table_info(${vendaTable.name})`).all();
      columns.forEach(col => {
        console.log(`- ${col.name} (${col.type})`);
      });
      
      console.log(`\n=== PRIMEIROS 3 REGISTROS DA TABELA ${vendaTable.name} ===`);
      const rows = db.prepare(`SELECT * FROM ${vendaTable.name} LIMIT 3`).all();
      rows.forEach((row, index) => {
        console.log(`${index + 1}.`, row);
      });
    }
  }
  
} catch (error) {
  console.error('Erro:', error.message);
}

db.close();