const Database = require('better-sqlite3');
const db = new Database('../Banco de dados Aqui/database.db');

console.log('TODOS OS ITENS NO BANCO:');
console.log('========================');

const todos = db.prepare('SELECT * FROM orcamento_itens ORDER BY created_at DESC').all();

console.log(`Total de itens encontrados: ${todos.length}`);
console.log('');

todos.forEach((item, i) => {
  console.log(`${i+1}. ID: ${item.id}`);
  console.log(`   Orçamento: ${item.orcamento_id}`);
  console.log(`   Descrição: ${item.descricao}`);
  console.log(`   Quantidade: ${item.quantidade}`);
  console.log(`   Valor Unit: R$ ${item.valor_unitario}`);
  console.log(`   Link Ref: ${item.link_ref || 'NULL'}`);
  console.log(`   Custo Ref: R$ ${item.custo_ref || '0'}`);
  console.log(`   Criado: ${item.created_at}`);
  console.log('   ---');
});

db.close();
console.log('\nVerificação concluída!');