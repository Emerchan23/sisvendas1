const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== ESTRUTURA DA TABELA empresas ===');
const schema = db.prepare('PRAGMA table_info(empresas)').all();
schema.forEach(col => {
    console.log(`- ${col.name}: ${col.type} (default: ${col.dflt_value || 'NULL'})`);
});

console.log('\n=== TOTAL DE COLUNAS: ' + schema.length + ' ===');

db.close();
console.log('\n✅ Verificação concluída');