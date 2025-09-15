const Database = require('better-sqlite3');
const path = require('path');

// Usar o mesmo caminho que a API usa
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
console.log('🔍 Verificando banco correto da API:', dbPath);

try {
  const db = new Database(dbPath);
  
  console.log('\n=== ITENS NO BANCO CORRETO ===');
  const itens = db.prepare('SELECT * FROM orcamento_itens ORDER BY created_at DESC LIMIT 10').all();
  
  console.log(`Total de itens encontrados: ${itens.length}`);
  console.log('');
  
  itens.forEach((item, i) => {
    console.log(`${i+1}. ID: ${item.id}`);
    console.log(`   Descrição: ${item.descricao}`);
    console.log(`   Link Ref: ${item.link_ref || 'NULL'}`);
    console.log(`   Custo Ref: R$ ${item.custo_ref || 0}`);
    console.log(`   Criado: ${item.created_at}`);
    console.log('   ---');
  });
  
  // Estatísticas
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN link_ref IS NOT NULL AND link_ref != '' THEN 1 END) as com_link,
      COUNT(CASE WHEN custo_ref IS NOT NULL AND custo_ref > 0 THEN 1 END) as com_custo
    FROM orcamento_itens
  `).get();
  
  console.log('\n=== ESTATÍSTICAS ===');
  console.log(`Total de itens: ${stats.total}`);
  console.log(`Com link_ref: ${stats.com_link} (${stats.total > 0 ? ((stats.com_link/stats.total)*100).toFixed(1) : 0}%)`);
  console.log(`Com custo_ref: ${stats.com_custo} (${stats.total > 0 ? ((stats.com_custo/stats.total)*100).toFixed(1) : 0}%)`);
  
  db.close();
  console.log('\n✅ Verificação concluída!');
  
} catch (error) {
  console.error('❌ Erro ao acessar banco:', error.message);
  console.error('Caminho tentado:', dbPath);
}