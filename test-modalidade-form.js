const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '../Banco de dados Aqui/database.db');
const db = new sqlite3.Database(dbPath);

console.log('🧪 Testando campos de modalidade e número de processo...');

// Verificar modalidades disponíveis
db.all('SELECT * FROM modalidades_compra ORDER BY nome', (err, modalidades) => {
  if (err) {
    console.error('❌ Erro ao buscar modalidades:', err);
    return;
  }
  
  console.log('\n📋 Modalidades disponíveis:');
  modalidades.forEach(mod => {
    console.log(`- ${mod.nome} (${mod.codigo}) - Requer processo: ${mod.requer_numero_processo ? 'SIM' : 'NÃO'}`);
  });
  
  // Testar a lógica do formulário
  console.log('\n🔍 Testando lógica do formulário:');
  
  modalidades.forEach(mod => {
    const requerProcesso = Boolean(mod.requer_numero_processo);
    console.log(`${mod.nome}: requer_numero_processo=${mod.requer_numero_processo} -> Boolean=${requerProcesso}`);
  });
  
  // Verificar se existe algum orçamento com modalidade e número de processo
  db.all(`
    SELECT o.*, m.nome as modalidade_nome, m.requer_numero_processo 
    FROM orcamentos o 
    LEFT JOIN modalidades_compra m ON o.modalidade = m.codigo 
    WHERE o.modalidade IS NOT NULL 
    ORDER BY o.created_at DESC 
    LIMIT 5
  `, (err, orcamentos) => {
    if (err) {
      console.error('❌ Erro ao buscar orçamentos:', err);
      return;
    }
    
    console.log('\n📊 Últimos orçamentos com modalidade:');
    if (orcamentos.length === 0) {
      console.log('Nenhum orçamento encontrado com modalidade.');
    } else {
      orcamentos.forEach(orc => {
        console.log(`- Orçamento ${orc.numero}: ${orc.modalidade_nome} | Processo: ${orc.numero_processo || 'N/A'} | Pregão: ${orc.numero_pregao || 'N/A'}`);
      });
    }
    
    db.close();
    console.log('\n✅ Teste concluído!');
  });
});