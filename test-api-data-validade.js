const fetch = require('node-fetch');

// Teste para verificar se a data de validade está sendo enviada e processada corretamente
async function testDataValidadeAPI() {
  console.log('🧪 Testando envio de data de validade para API...');
  
  const testData = {
    cliente_id: 1,
    data_orcamento: '2024-01-15',
    data_validade: '2024-02-15', // Data específica
    descricao: 'Teste de data de validade',
    modalidade: 'DIRETA',
    itens: [
      {
        descricao: 'Item teste',
        quantidade: 1,
        valor_unitario: 100.00
      }
    ]
  };
  
  console.log('📤 Dados sendo enviados:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch('http://localhost:3145/api/orcamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('📥 Resposta da API:', JSON.stringify(result, null, 2));
    console.log('✅ Status:', response.status);
    
    if (response.ok && result.id) {
      // Verificar se o orçamento foi salvo com a data correta
      console.log('\n🔍 Verificando orçamento salvo no banco...');
      await checkSavedOrcamento(result.id);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

// Teste sem data de validade (deve usar padrão)
async function testSemDataValidade() {
  console.log('\n🧪 Testando sem data de validade (deve usar padrão)...');
  
  const testData = {
    cliente_id: 1,
    data_orcamento: '2024-01-15',
    // data_validade não informada
    descricao: 'Teste sem data de validade',
    modalidade: 'DIRETA',
    itens: [
      {
        descricao: 'Item teste 2',
        quantidade: 1,
        valor_unitario: 50.00
      }
    ]
  };
  
  console.log('📤 Dados sendo enviados (sem data_validade):', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch('http://localhost:3145/api/orcamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    console.log('📥 Resposta da API:', JSON.stringify(result, null, 2));
    console.log('✅ Status:', response.status);
    
    if (response.ok && result.id) {
      // Verificar se o orçamento foi salvo com a data padrão
      console.log('\n🔍 Verificando orçamento salvo no banco...');
      await checkSavedOrcamento(result.id);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error);
  }
}

async function checkSavedOrcamento(orcamentoId) {
  const Database = require('better-sqlite3');
  const path = require('path');
  const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
  const db = new Database(dbPath);
  
  try {
    const orcamento = db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(orcamentoId);
    
    if (orcamento) {
      console.log('💾 Orçamento salvo no banco:');
      console.log('  - ID:', orcamento.id);
      console.log('  - Número:', orcamento.numero);
      console.log('  - Data Orçamento:', orcamento.data_orcamento);
      console.log('  - Data Validade:', orcamento.data_validade);
      console.log('  - Modalidade:', orcamento.modalidade);
      console.log('  - Status:', orcamento.status);
      
      // Calcular diferença de dias
      if (orcamento.data_orcamento && orcamento.data_validade) {
        const dataOrc = new Date(orcamento.data_orcamento);
        const dataVal = new Date(orcamento.data_validade);
        const diffTime = Math.abs(dataVal - dataOrc);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        console.log('  - Diferença em dias:', diffDays);
      }
    } else {
      console.log('❌ Orçamento não encontrado no banco');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar orçamento no banco:', error);
  } finally {
    db.close();
  }
}

// Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes de data de validade...');
  
  await testDataValidadeAPI();
  await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
  await testSemDataValidade();
  
  console.log('\n✅ Testes concluídos!');
}

runTests().catch(console.error);