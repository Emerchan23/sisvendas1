const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== ESTRUTURA DA TABELA linhas_venda ===');
const schema = db.prepare('PRAGMA table_info(linhas_venda)').all();
schema.forEach(col => {
    console.log(`- ${col.name}: ${col.type}`);
});

console.log('\n=== ESTRUTURA DA TABELA acertos ===');
const acertosSchema = db.prepare('PRAGMA table_info(acertos)').all();
acertosSchema.forEach(col => {
    console.log(`- ${col.name}: ${col.type}`);
});

db.close();