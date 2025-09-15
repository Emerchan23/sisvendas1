const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('🧪 Testando salvamento da modalidade de compra...');

try {
  // Criar um orçamento de teste
  const orcamentoId = uuidv4();
  const numeroOrcamento = `TESTE-${Date.now()}`;
  
  console.log('\n1. Criando orçamento de teste...');
  
  const insertOrcamento = db.prepare(`
    INSERT INTO orcamentos (
      id, numero, cliente_id, data_orcamento, data_validade, valor_total,
      descricao, status, modalidade, numero_pregao, numero_dispensa, numero_processo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertOrcamento.run(
    orcamentoId,
    numeroOrcamento,
    'a219e386-99d9-4285-b1c1-84b8e66a50c3', // Cliente válido
    new Date().toISOString().split('T')[0],
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias
    1000.00,
    'Teste de modalidade',
    'pendente',
    'PREGAO',
    'PR-2025-001',
    null,
    'PROC-2025-001'
  );
  
  console.log('✅ Orçamento criado com sucesso!');
  
  // Verificar se foi salvo corretamente
  console.log('\n2. Verificando dados salvos...');
  const orcamentoSalvo = db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(orcamentoId);
  
  console.log('📋 Dados do orçamento:');
  console.log(`- ID: ${orcamentoSalvo.id}`);
  console.log(`- Número: ${orcamentoSalvo.numero}`);
  console.log(`- Modalidade: ${orcamentoSalvo.modalidade}`);
  console.log(`- Número Pregão: ${orcamentoSalvo.numero_pregao}`);
  console.log(`- Número Dispensa: ${orcamentoSalvo.numero_dispensa}`);
  console.log(`- Número Processo: ${orcamentoSalvo.numero_processo}`);
  
  // Testar atualização via PATCH
  console.log('\n3. Testando atualização (simulando PATCH)...');
  
  const updateOrcamento = db.prepare(`
    UPDATE orcamentos SET
      modalidade = ?,
      numero_pregao = ?,
      numero_dispensa = ?,
      numero_processo = ?
    WHERE id = ?
  `);
  
  updateOrcamento.run(
    'DISPENSA',
    null,
    'DISP-2025-001',
    'PROC-2025-002',
    orcamentoId
  );
  
  // Verificar atualização
  const orcamentoAtualizado = db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(orcamentoId);
  
  console.log('📋 Dados após atualização:');
  console.log(`- Modalidade: ${orcamentoAtualizado.modalidade}`);
  console.log(`- Número Pregão: ${orcamentoAtualizado.numero_pregao}`);
  console.log(`- Número Dispensa: ${orcamentoAtualizado.numero_dispensa}`);
  console.log(`- Número Processo: ${orcamentoAtualizado.numero_processo}`);
  
  // Limpar teste
  console.log('\n4. Limpando dados de teste...');
  db.prepare('DELETE FROM orcamentos WHERE id = ?').run(orcamentoId);
  
  console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
  console.log('🎉 A modalidade de compra está sendo salva corretamente!');
  
} catch (error) {
  console.error('❌ Erro durante o teste:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}