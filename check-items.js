const Database = require('better-sqlite3');
const db = new Database('../Banco de dados Aqui/database.db');

console.log('ÚLTIMOS ITENS CRIADOS:');
const itens = db.prepare('SELECT * FROM orcamento_itens ORDER BY rowid DESC LIMIT 3').all();

itens.forEach((item, i) => {
  console.log(`\nItem ${i+1}:`);
  console.log(`  id: ${item.id}`);
  console.log(`  orcamento_id: ${item.orcamento_id}`);
  console.log(`  descricao: ${item.descricao}`);
  console.log(`  quantidade: ${item.quantidade}`);
  console.log(`  valor_unitario: ${item.valor_unitario}`);
  console.log(`  valor_total: ${item.valor_total}`);
  console.log(`  link_ref: ${item.link_ref}`);
  console.log(`  custo_ref: ${item.custo_ref}`);
  console.log(`  created_at: ${item.created_at}`);
});

db.close();

console.log('\n🔍 ANÁLISE:');
console.log('- Se link_ref e custo_ref estão null/undefined, o problema está no salvamento');
console.log('- Confirma que os campos não estão chegando na API ou não estão sendo inseridos no banco');