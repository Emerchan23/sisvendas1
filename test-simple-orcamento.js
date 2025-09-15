const fetch = require('node-fetch');

async function testSimpleOrcamento() {
  console.log('🧪 Testando criação simples de orçamento...');
  
  try {
    // 1. Buscar cliente
    const clientesResponse = await fetch('http://localhost:3145/api/clientes');
    const clientes = await clientesResponse.json();
    
    if (!clientes || clientes.length === 0) {
      console.log('❌ Nenhum cliente encontrado');
      return;
    }
    
    const cliente = clientes[0];
    console.log('✅ Cliente encontrado:', cliente.nome);
    
    // 2. Criar orçamento simples SEM itens
    const orcamentoData = {
      numero: `SIMPLE-${Date.now()}`,
      cliente_id: cliente.id,
      data_orcamento: '2025-01-15',
      descricao: 'Teste simples sem itens',
      itens: [{
        descricao: 'Item teste',
        quantidade: 1,
        valor_unitario: 100.00
      }]
    };
    
    console.log('📤 Enviando dados:', JSON.stringify(orcamentoData, null, 2));
    
    const response = await fetch('http://localhost:3145/api/orcamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orcamentoData)
    });
    
    console.log('📥 Status da resposta:', response.status);
    const responseText = await response.text();
    console.log('📥 Resposta completa:', responseText);
    
    if (response.ok) {
      const orcamento = JSON.parse(responseText);
      console.log('✅ Orçamento criado com sucesso!');
      console.log('📋 ID:', orcamento.id);
      console.log('📋 Número:', orcamento.numero);
      console.log('📋 Valor Total:', orcamento.valor_total);
      
      if (orcamento.itens && orcamento.itens.length > 0) {
        console.log('📋 Itens:');
        orcamento.itens.forEach((item, index) => {
          console.log(`   ${index + 1}. ${item.descricao} - Qtd: ${item.quantidade} - Valor Unit.: ${item.valor_unitario}`);
        });
      }
    } else {
      console.log('❌ Erro ao criar orçamento:', response.status, responseText);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testSimpleOrcamento();