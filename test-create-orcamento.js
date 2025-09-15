// Teste para criar um orçamento com detalhes internos e verificar os logs
// Execute com: node test-create-orcamento.js

const fetch = require('node-fetch');

async function testCreateOrcamento() {
  console.log('🧪 TESTE: Criando orçamento com detalhes internos...');
  
  const orcamentoData = {
    numero: `TESTE-DEBUG-${Date.now()}`,
    cliente_id: '1',
    data_orcamento: '2025-01-15',
    descricao: 'Teste de detalhes internos',
    itens: [
      {
        descricao: 'Produto com detalhes internos',
        quantidade: 2,
        valor_unitario: 50.00,
        link_ref: 'https://exemplo.com/produto1',
        custo_ref: 30.00
      },
      {
        descricao: 'Produto sem detalhes internos',
        quantidade: 1,
        valor_unitario: 25.00
        // link_ref e custo_ref não definidos
      }
    ]
  };
  
  try {
    console.log('📤 Enviando dados:', JSON.stringify(orcamentoData, null, 2));
    
    const response = await fetch('http://localhost:3145/api/orcamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orcamentoData)
    });
    
    const result = await response.json();
    
    console.log('📥 Status da resposta:', response.status);
    console.log('📥 Resposta da API:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Orçamento criado com sucesso!');
      console.log('💡 Verifique os logs do servidor para ver se os campos link_ref e custo_ref foram capturados.');
    } else {
      console.log('❌ Erro ao criar orçamento:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    console.log('💡 Certifique-se de que o servidor está rodando em http://localhost:3145');
  }
}

// Executar o teste
testCreateOrcamento();

console.log('\n📋 INSTRUÇÕES:');
console.log('1. Execute este script: node test-create-orcamento.js');
console.log('2. Observe os logs do servidor (terminal onde npm run dev está rodando)');
console.log('3. Procure por logs com "🚨 [CRITICAL DEBUG]" para ver os campos detalhes internos');
console.log('4. Verifique se link_ref e custo_ref estão sendo recebidos corretamente');