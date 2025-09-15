const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../Banco de dados Aqui/database.db');

console.log('📋 Verificando estrutura da tabela orcamentos...');

db.all('PRAGMA table_info(orcamentos)', (err, rows) => {
  if (err) {
    console.error('❌ Erro:', err.message);
  } else {
    console.log('✅ Estrutura da tabela orcamentos:');
    rows.forEach(r => {
      console.log(`   - ${r.name}: ${r.type} ${r.notnull ? 'NOT NULL' : ''} ${r.dflt_value ? `DEFAULT ${r.dflt_value}` : ''}`);
    });
  }
  db.close();
});