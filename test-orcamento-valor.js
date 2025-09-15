// Teste direto para verificar salvamento de orçamento com valor unitário
const fetch = require('node-fetch');

async function testarSalvamentoOrcamento() {
  console.log('🧪 Iniciando teste de salvamento de orçamento...');
  
  const dadosOrcamento = {
    numero: 'TEST-' + Date.now(),
    cliente_id: 1, // Assumindo que existe um cliente com ID 1
    data_orcamento: new Date().toISOString().split('T')[0],
    data_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    descricao: 'Teste de orçamento com valor unitário',
    observacoes: 'Teste automatizado',
    condicoes_pagamento: 'À vista',
    prazo_entrega: '10 dias',
    vendedor_id: 1,
    desconto: 0,
    status: 'pendente',
    itens: [
      {
        descricao: 'Produto Teste A - Valor Unitário',
        marca: 'Marca Teste',
        quantidade: 5,
        valor_unitario: 25.50, // VALOR UNITÁRIO ESPECÍFICO
        link_ref: 'https://exemplo.com/produto-teste-a',
        custo_ref: 20.00
      },
      {
        descricao: 'Produto Teste B - Valor Unitário',
        marca: 'Marca Teste 2',
        quantidade: 3,
        valor_unitario: 15.75, // VALOR UNITÁRIO ESPECÍFICO
        link_ref: 'https://exemplo.com/produto-teste-b',
        custo_ref: 12.50
      }
    ]
  };
  
  console.log('📤 Dados a serem enviados:');
  console.log(JSON.stringify(dadosOrcamento, null, 2));
  
  try {
    // Teste 1: Criar orçamento
    console.log('\n🔄 Enviando requisição POST para criar orçamento...');
    const response = await fetch('http://localhost:3145/api/orcamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosOrcamento)
    });
    
    console.log('📊 Status da resposta:', response.status);
    const resultado = await response.json();
    console.log('📋 Resposta da API:');
    console.log(JSON.stringify(resultado, null, 2));
    
    if (resultado.id) {
      console.log('\n✅ Orçamento criado com ID:', resultado.id);
      
      // Teste 2: Buscar o orçamento criado para verificar se os dados foram salvos
      console.log('\n🔍 Buscando orçamento criado para verificar dados...');
      const getResponse = await fetch(`http://localhost:3145/api/orcamentos/${resultado.id}`);
      const orcamentoSalvo = await getResponse.json();
      
      console.log('📋 Orçamento salvo no banco:');
      console.log(JSON.stringify(orcamentoSalvo, null, 2));
      
      // Verificar se os valores unitários foram salvos corretamente
      if (orcamentoSalvo.itens && orcamentoSalvo.itens.length > 0) {
        console.log('\n🔍 Verificando valores unitários salvos:');
        orcamentoSalvo.itens.forEach((item, index) => {
          console.log(`Item ${index + 1}:`);
          console.log(`  - Descrição: ${item.descricao}`);
          console.log(`  - Valor Unitário: ${item.valor_unitario}`);
          console.log(`  - Link Ref: ${item.link_ref}`);
          console.log(`  - Custo Ref: ${item.custo_ref}`);
          
          if (item.valor_unitario > 0) {
            console.log(`  ✅ Valor unitário salvo corretamente!`);
          } else {
            console.log(`  ❌ PROBLEMA: Valor unitário não foi salvo!`);
          }
        });
      } else {
        console.log('❌ PROBLEMA: Nenhum item foi encontrado no orçamento salvo!');
      }
    } else {
      console.log('❌ ERRO: Orçamento não foi criado!');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testarSalvamentoOrcamento();