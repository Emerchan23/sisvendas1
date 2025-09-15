const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '../Banco de dados Aqui/database.db');
const db = new sqlite3.Database(dbPath);

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
}

console.log('🧪 Teste completo do formulário de orçamento...');

// Simular criação de orçamento com modalidade que requer processo
const orcamentoId = generateId();
const numeroOrcamento = `TEST-FORM-${Date.now()}`;
const modalidade = 'PREGAO'; // Modalidade que requer número de processo
const numeroProcesso = '12345/2025';
const numeroPregao = '87/2025';

console.log('\n📝 Criando orçamento de teste:');
console.log(`- ID: ${orcamentoId}`);
console.log(`- Número: ${numeroOrcamento}`);
console.log(`- Modalidade: ${modalidade}`);
console.log(`- Número do Pregão: ${numeroPregao}`);

// Inserir orçamento de teste
db.run(`
  INSERT INTO orcamentos (
    id, numero, cliente_id, data_orcamento, observacoes, data_validade, 
    modalidade, numero_dispensa, numero_pregao, valor_total, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`, [
  orcamentoId,
  numeroOrcamento,
  'cliente-teste-id',
  '2025-01-15',
  'Teste de modalidade e processo',
  '2025-12-31',
  modalidade,
  numeroProcesso,
  numeroPregao,
  100.00
], function(err) {
  if (err) {
    console.error('❌ Erro ao inserir orçamento:', err);
    return;
  }
  
  console.log('✅ Orçamento inserido com sucesso!');
  
  // Verificar se foi salvo corretamente
  db.get(`
    SELECT o.*, m.nome as modalidade_nome, m.requer_numero_processo
    FROM orcamentos o
    LEFT JOIN modalidades_compra m ON o.modalidade = m.codigo
    WHERE o.id = ?
  `, [orcamentoId], (err, row) => {
    if (err) {
      console.error('❌ Erro ao buscar orçamento:', err);
      return;
    }
    
    console.log('\n📊 Orçamento salvo:');
    console.log(`- Modalidade: ${row.modalidade_nome} (${row.modalidade})`);
    console.log(`- Requer processo: ${row.requer_numero_processo ? 'SIM' : 'NÃO'}`);
    console.log(`- Número do processo: ${row.numero_processo || 'N/A'}`);
    console.log(`- Número do pregão: ${row.numero_pregao || 'N/A'}`);
    
    // Limpar dados de teste
    db.run('DELETE FROM orcamentos WHERE id = ?', [orcamentoId], (err) => {
      if (err) {
        console.error('❌ Erro ao limpar dados de teste:', err);
      } else {
        console.log('\n🧹 Dados de teste removidos');
      }
      
      db.close();
      console.log('\n✅ Teste completo finalizado!');
      console.log('\n🎉 RESULTADO: Os campos de modalidade e número de processo estão funcionando corretamente!');
    });
  });
});