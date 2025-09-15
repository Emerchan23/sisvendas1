// Função para fazer requisição usando fetch (Node.js 18+)
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return {
      statusCode: response.status,
      data: data
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function testDetalhesInternosHTTP() {
  console.log('🧪 Testando detalhes internos via HTTP...');
  
  try {
    // 1. Criar orçamento com detalhes internos
    const orcamentoData = {
      cliente_id: 1,
      data_orcamento: new Date().toISOString().split('T')[0],
      validade: 30,
      observacoes: 'Teste detalhes internos',
      desconto: 0,
      itens: [
        {
          item_servico: 'Produto Teste Detalhes',
          marca: 'Marca Teste',
          unidade_medida: 'un',
          quantidade: 1,
          valor_unitario: 100.50,
          link_ref: 'https://exemplo.com/produto1',
          custo_ref: 75.25
        }
      ]
    };
    
    console.log('📤 Enviando dados para API:', JSON.stringify(orcamentoData, null, 2));
    
    const createResult = await makeRequest('http://localhost:3000/api/orcamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orcamentoData)
    });
    console.log('✅ Orçamento criado:', createResult.statusCode);
    console.log('📋 Dados retornados:', JSON.stringify(createResult.data, null, 2));
    
    if (createResult.statusCode === 201 && createResult.data.id) {
      const orcamentoId = createResult.data.id;
      
      // 2. Buscar o orçamento criado para verificar se os detalhes foram salvos
      const getResult = await makeRequest('http://localhost:3000/api/orcamentos', {
        method: 'GET'
      });
      console.log('📥 Buscando orçamentos:', getResult.statusCode);
      
      if (getResult.statusCode === 200) {
        const orcamentos = getResult.data;
        const orcamentoCriado = orcamentos.find(o => o.id === orcamentoId);
        
        if (orcamentoCriado && orcamentoCriado.itens && orcamentoCriado.itens.length > 0) {
          const item = orcamentoCriado.itens[0];
          console.log('🔍 Verificando detalhes internos do item:');
          console.log('- valor_unitario:', item.valorUnitario);
          console.log('- link_ref:', item.linkRef);
          console.log('- custo_ref:', item.custoRef);
          
          // Verificar se os valores foram salvos corretamente
          const valorOk = item.valorUnitario === 100.5;
          const linkOk = item.linkRef === 'https://exemplo.com/produto1';
          const custoOk = item.custoRef === 75.25;
          
          console.log('\n📊 Resultado da verificação:');
          console.log('- Valor unitário salvo:', valorOk ? '✅' : '❌', `(${item.valorUnitario})`);
          console.log('- Link ref salvo:', linkOk ? '✅' : '❌', `(${item.linkRef})`);
          console.log('- Custo ref salvo:', custoOk ? '✅' : '❌', `(${item.custoRef})`);
          
          if (valorOk && linkOk && custoOk) {
            console.log('\n🎉 SUCESSO: Todos os detalhes internos foram salvos corretamente!');
          } else {
            console.log('\n❌ PROBLEMA: Alguns detalhes internos não foram salvos corretamente.');
          }
        } else {
          console.log('❌ Orçamento não encontrado ou sem itens');
        }
      }
    } else {
      console.log('❌ Falha ao criar orçamento:', createResult);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testDetalhesInternosHTTP();