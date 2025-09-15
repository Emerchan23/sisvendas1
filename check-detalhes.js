const Database = require('better-sqlite3');
const db = new Database('../Banco de dados Aqui/database.db');

console.log('VERIFICANDO ITENS COM DETALHES INTERNOS:');

// Buscar itens com link_ref preenchido
const itensComLink = db.prepare(`
  SELECT * FROM orcamento_itens 
  WHERE link_ref IS NOT NULL AND link_ref != '' 
  ORDER BY created_at DESC LIMIT 10
`).all();

console.log(`\nItens com link_ref: ${itensComLink.length}`);
itensComLink.forEach((item, i) => {
  console.log(`${i+1}. ${item.descricao}`);
  console.log(`   Link: ${item.link_ref}`);
  console.log(`   Custo: R$ ${item.custo_ref}`);
  console.log(`   Criado: ${item.created_at}`);
  console.log('');
});

// Buscar itens com custo_ref > 0
const itensComCusto = db.prepare(`
  SELECT * FROM orcamento_itens 
  WHERE custo_ref IS NOT NULL AND custo_ref > 0 
  ORDER BY created_at DESC LIMIT 10
`).all();

console.log(`Itens com custo_ref > 0: ${itensComCusto.length}`);
itensComCusto.forEach((item, i) => {
  console.log(`${i+1}. ${item.descricao}`);
  console.log(`   Link: ${item.link_ref || 'VAZIO'}`);
  console.log(`   Custo: R$ ${item.custo_ref}`);
  console.log(`   Criado: ${item.created_at}`);
  console.log('');
});

// Estatísticas gerais
const stats = db.prepare(`
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN link_ref IS NOT NULL AND link_ref != '' THEN 1 END) as com_link,
    COUNT(CASE WHEN custo_ref IS NOT NULL AND custo_ref > 0 THEN 1 END) as com_custo
  FROM orcamento_itens
`).get();

console.log('ESTATÍSTICAS:');
console.log(`Total de itens: ${stats.total}`);
console.log(`Com link_ref: ${stats.com_link} (${((stats.com_link/stats.total)*100).toFixed(1)}%)`);
console.log(`Com custo_ref: ${stats.com_custo} (${((stats.com_custo/stats.total)*100).toFixed(1)}%)`);

db.close();