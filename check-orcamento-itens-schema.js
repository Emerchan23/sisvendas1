const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('🔍 Verificando estrutura da tabela orcamento_itens...');

try {
  // 1. Verificar estrutura da tabela
  console.log('\n1️⃣ ESTRUTURA DA TABELA orcamento_itens:');
  const tableInfo = db.prepare("PRAGMA table_info(orcamento_itens)").all();
  
  if (tableInfo.length === 0) {
    console.log('   ❌ Tabela orcamento_itens NÃO existe!');
  } else {
    tableInfo.forEach(col => {
      const notNull = col.notnull ? 'NOT NULL' : 'NULL';
      const defaultVal = col.dflt_value ? `DEFAULT ${col.dflt_value}` : '';
      console.log(`   - ${col.name} (${col.type}) ${notNull} ${defaultVal}`);
    });
  }

  // 2. Verificar se existem registros
  console.log('\n2️⃣ REGISTROS NA TABELA:');
  const count = db.prepare('SELECT COUNT(*) as total FROM orcamento_itens').get();
  console.log(`   📊 Total de itens: ${count.total}`);

  if (count.total > 0) {
    // Mostrar alguns exemplos
    console.log('\n3️⃣ EXEMPLOS DE REGISTROS:');
    const samples = db.prepare(`
      SELECT id, orcamento_id, descricao, quantidade, valor_unitario, valor_total
      FROM orcamento_itens 
      LIMIT 5
    `).all();
    
    samples.forEach((item, index) => {
      console.log(`   ${index + 1}. ID: ${item.id}`);
      console.log(`      Descrição: ${item.descricao}`);
      console.log(`      Quantidade: ${item.quantidade}`);
      console.log(`      Valor Unitário: ${item.valor_unitario}`);
      console.log(`      Valor Total: ${item.valor_total}`);
      console.log(`      ---`);
    });
  }

  // 3. Verificar se há problemas com valores zerados
  console.log('\n4️⃣ ANÁLISE DE VALORES:');
  const zeroValues = db.prepare(`
    SELECT COUNT(*) as total 
    FROM orcamento_itens 
    WHERE valor_unitario = 0 OR valor_unitario IS NULL
  `).get();
  
  console.log(`   ⚠️  Itens com valor unitário zero ou nulo: ${zeroValues.total}`);

  const validValues = db.prepare(`
    SELECT COUNT(*) as total 
    FROM orcamento_itens 
    WHERE valor_unitario > 0
  `).get();
  
  console.log(`   ✅ Itens com valor unitário válido: ${validValues.total}`);

  // 4. Verificar orçamentos recentes
  console.log('\n5️⃣ ORÇAMENTOS RECENTES:');
  const recentOrcamentos = db.prepare(`
    SELECT o.id, o.numero, COUNT(oi.id) as itens_count,
           AVG(oi.valor_unitario) as valor_medio
    FROM orcamentos o
    LEFT JOIN orcamento_itens oi ON o.id = oi.orcamento_id
    WHERE o.created_at >= date('now', '-7 days')
    GROUP BY o.id, o.numero
    ORDER BY o.created_at DESC
    LIMIT 5
  `).all();

  if (recentOrcamentos.length > 0) {
    recentOrcamentos.forEach(orc => {
      console.log(`   📋 ${orc.numero}: ${orc.itens_count} itens, valor médio: R$ ${(orc.valor_medio || 0).toFixed(2)}`);
    });
  } else {
    console.log('   📋 Nenhum orçamento recente encontrado');
  }

  console.log('\n✅ Verificação concluída!');

} catch (error) {
  console.error('❌ Erro durante a verificação:', error.message);
  console.error('Stack:', error.stack);
} finally {
  db.close();
  console.log('\n🔒 Conexão com banco fechada.');
}