const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');

try {
    const db = new Database(dbPath);
    console.log('✅ Conectado ao banco de dados');
    
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    
    console.log('\n📊 Tabelas encontradas no banco:');
    tables.forEach(table => {
        console.log(`- ${table.name}`);
        
        // Contar registros em cada tabela
        try {
            const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
            console.log(`  └─ Registros: ${count.count}`);
        } catch (e) {
            console.log(`  └─ Erro ao contar: ${e.message}`);
        }
    });
    
    db.close();
    console.log('\n✅ Verificação concluída');
    
} catch (error) {
    console.error('❌ Erro:', error.message);
}