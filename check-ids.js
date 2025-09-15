const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../Banco de dados Aqui/database.db');

console.log('🔍 Verificando IDs na tabela orcamento_itens...');

db.all('SELECT * FROM orcamento_itens ORDER BY created_at DESC LIMIT 5', (err, rows) => {
  if (err) {
    console.error('❌ Erro:', err.message);
  } else {
    console.log('📊 Últimos itens:');
    if (rows.length === 0) {
      console.log('   Nenhum item encontrado.');
    } else {
      rows.forEach(r => {
        console.log(`   ID: "${r.id}" (tipo: ${typeof r.id})`);
        console.log(`   Orçamento: "${r.orcamento_id}"`);
        console.log(`   Descrição: "${r.descricao}"`);
        console.log(`   Valor Unitário: ${r.valor_unitario}`);
        console.log('   ---');
      });
    }
  }
  db.close();
});