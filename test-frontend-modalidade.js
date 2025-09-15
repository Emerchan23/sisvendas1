// Teste para verificar se a modalidade está sendo enviada corretamente do frontend

const testData = {
  cliente_id: '3a3e6425-6296-48a5-9193-c3fb2144401c',
  data_orcamento: '2025-01-15',
  data_validade: '2025-02-15',
  descricao: 'Teste modalidade frontend',
  observacoes: 'Teste de salvamento da modalidade',
  modalidade: 'PREGAO',
  numero_pregao: '456/2025',
  numero_processo: '789/2025',
  itens: [
    {
      descricao: 'Item de teste',
      quantidade: 1,
      valor_unitario: 100.00,
      marca: 'Teste'
    }
  ]
};

console.log('🧪 Testando envio de modalidade via API...');
console.log('📤 Dados que serão enviados:', JSON.stringify(testData, null, 2));

fetch('http://localhost:3000/api/orcamentos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('📡 Status da resposta:', response.status);
  return response.json();
})
.then(data => {
  console.log('📥 Resposta da API:', JSON.stringify(data, null, 2));
  
  if (data.modalidade === testData.modalidade) {
    console.log('✅ MODALIDADE RETORNADA CORRETAMENTE!');
  } else {
    console.log('❌ MODALIDADE NÃO RETORNADA CORRETAMENTE!');
    console.log('   Enviado:', testData.modalidade);
    console.log('   Retornado:', data.modalidade);
  }
  
  if (data.numero_pregao === testData.numero_pregao) {
    console.log('✅ NÚMERO PREGÃO RETORNADO CORRETAMENTE!');
  } else {
    console.log('❌ NÚMERO PREGÃO NÃO RETORNADO CORRETAMENTE!');
    console.log('   Enviado:', testData.numero_pregao);
    console.log('   Retornado:', data.numero_pregao);
  }
  
  // Verificar no banco se foi salvo
  console.log('\n🔍 Verificando no banco de dados...');
  
  const Database = require('better-sqlite3');
  const path = require('path');
  
  const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
  const db = new Database(dbPath);
  
  const orcamentoSalvo = db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(data.id);
  
  if (orcamentoSalvo) {
    console.log('📊 Dados salvos no banco:');
    console.log('   - Modalidade:', orcamentoSalvo.modalidade);
    console.log('   - Número Pregão:', orcamentoSalvo.numero_pregao);
    console.log('   - Número Processo:', orcamentoSalvo.numero_processo);
    
    if (orcamentoSalvo.modalidade === testData.modalidade) {
      console.log('✅ MODALIDADE PERSISTIDA CORRETAMENTE NO BANCO!');
    } else {
      console.log('❌ MODALIDADE NÃO PERSISTIDA CORRETAMENTE!');
    }
  } else {
    console.log('❌ Orçamento não encontrado no banco!');
  }
  
  // Limpar teste
  if (data.id) {
    db.prepare('DELETE FROM orcamento_itens WHERE orcamento_id = ?').run(data.id);
    db.prepare('DELETE FROM orcamentos WHERE id = ?').run(data.id);
    console.log('🧹 Dados de teste removidos');
  }
  
  db.close();
  console.log('\n✅ TESTE FRONTEND CONCLUÍDO!');
})
.catch(error => {
  console.error('❌ Erro no teste:', error);
});