const fetch = require('node-fetch');

async function testApiValorUnitario() {
  console.log('🧪 Testando API - Valor Unitário e Detalhes Internos');
  console.log('=' .repeat(60));
  
  const baseUrl = 'http://localhost:3145';
  
  try {
    // 1. Criar um orçamento de teste
    console.log('\n📝 1. Criando orçamento de teste...');
    
    const novoOrcamento = {
      numero: `TESTE-${Date.now()}`,
      cliente_id: 'cliente-teste-123',
      data_orcamento: new Date().toISOString(),
      data_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      observacoes: 'Teste de valor unitário',
      modalidade: 'COTACAO',
      itens: [
        {
          id: 'item-teste-1',
          item_id: '',
          descricao: 'Produto Teste - Valor Unitário',
          marca: 'Marca Teste',
          unidade_medida: 'un',
          quantidade: 5,
          valor_unitario: 123.45, // VALOR CRÍTICO PARA TESTE
          desconto: 0,
          observacoes: '',
          link_ref: 'https://exemplo.com/produto-teste',
          custo_ref: 100.00
        },
        {
          id: 'item-teste-2',
          item_id: '',
          descricao: 'Segundo Produto Teste',
          marca: 'Outra Marca',
          unidade_medida: 'kg',
          quantidade: 2,
          valor_unitario: 67.89, // OUTRO VALOR CRÍTICO
          desconto: 0,
          observacoes: '',
          link_ref: 'https://exemplo.com/produto-2',
          custo_ref: 50.00
        }
      ]
    };
    
    console.log('📤 Dados enviados:', JSON.stringify(novoOrcamento, null, 2));
    
    const createResponse = await fetch(`${baseUrl}/api/orcamentos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(novoOrcamento)
    });
    
    const createResult = await createResponse.json();
    console.log(`📊 Status da criação: ${createResponse.status}`);
    console.log('📋 Resultado:', createResult);
    
    if (createResponse.status !== 200) {
      console.log('❌ Erro ao criar orçamento!');
      return;
    }
    
    const orcamentoId = createResult.id;
    console.log(`✅ Orçamento criado com ID: ${orcamentoId}`);
    
    // 2. Buscar o orçamento criado para verificar se os valores foram salvos
    console.log('\n🔍 2. Buscando orçamento criado...');
    
    const getResponse = await fetch(`${baseUrl}/api/orcamentos/${orcamentoId}`);
    const orcamentoSalvo = await getResponse.json();
    
    console.log(`📊 Status da busca: ${getResponse.status}`);
    console.log('📋 Orçamento salvo:', JSON.stringify(orcamentoSalvo, null, 2));
    
    // 3. Verificar se os valores unitários foram salvos corretamente
    console.log('\n🔍 3. Verificando valores unitários salvos...');
    
    if (orcamentoSalvo.itens && orcamentoSalvo.itens.length > 0) {
      orcamentoSalvo.itens.forEach((item, index) => {
        const valorEsperado = novoOrcamento.itens[index].valor_unitario;
        const valorSalvo = item.valor_unitario;
        
        console.log(`\n📦 Item ${index + 1}:`);
        console.log(`   📝 Descrição: ${item.descricao}`);
        console.log(`   💰 Valor esperado: R$ ${valorEsperado}`);
        console.log(`   💾 Valor salvo: R$ ${valorSalvo}`);
        console.log(`   🔗 Link ref: ${item.link_ref}`);
        console.log(`   💵 Custo ref: R$ ${item.custo_ref}`);
        
        if (valorSalvo === valorEsperado) {
          console.log(`   ✅ VALOR UNITÁRIO CORRETO!`);
        } else {
          console.log(`   ❌ VALOR UNITÁRIO INCORRETO! Esperado: ${valorEsperado}, Salvo: ${valorSalvo}`);
        }
        
        // Verificar detalhes internos (link_ref e custo_ref)
        const linkEsperado = novoOrcamento.itens[index].link_ref;
        const custoEsperado = novoOrcamento.itens[index].custo_ref;
        
        if (item.link_ref === linkEsperado) {
          console.log(`   ✅ LINK REF CORRETO!`);
        } else {
          console.log(`   ❌ LINK REF INCORRETO! Esperado: ${linkEsperado}, Salvo: ${item.link_ref}`);
        }
        
        if (item.custo_ref === custoEsperado) {
          console.log(`   ✅ CUSTO REF CORRETO!`);
        } else {
          console.log(`   ❌ CUSTO REF INCORRETO! Esperado: ${custoEsperado}, Salvo: ${item.custo_ref}`);
        }
      });
    } else {
      console.log('❌ Nenhum item encontrado no orçamento salvo!');
    }
    
    // 4. Testar atualização de valores
    console.log('\n🔄 4. Testando atualização de valores...');
    
    const orcamentoAtualizado = {
      ...orcamentoSalvo,
      itens: orcamentoSalvo.itens.map((item, index) => ({
        ...item,
        valor_unitario: index === 0 ? 999.99 : 555.55, // Novos valores para teste
        custo_ref: index === 0 ? 800.00 : 400.00
      }))
    };
    
    console.log('📤 Dados para atualização:', JSON.stringify(orcamentoAtualizado, null, 2));
    
    const updateResponse = await fetch(`${baseUrl}/api/orcamentos/${orcamentoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orcamentoAtualizado)
    });
    
    const updateResult = await updateResponse.json();
    console.log(`📊 Status da atualização: ${updateResponse.status}`);
    console.log('📋 Resultado da atualização:', updateResult);
    
    // 5. Verificar se a atualização funcionou
    console.log('\n🔍 5. Verificando atualização...');
    
    const getUpdatedResponse = await fetch(`${baseUrl}/api/orcamentos/${orcamentoId}`);
    const orcamentoAtualizadoSalvo = await getUpdatedResponse.json();
    
    console.log('📋 Orçamento após atualização:', JSON.stringify(orcamentoAtualizadoSalvo, null, 2));
    
    if (orcamentoAtualizadoSalvo.itens && orcamentoAtualizadoSalvo.itens.length > 0) {
      orcamentoAtualizadoSalvo.itens.forEach((item, index) => {
        const valorEsperado = index === 0 ? 999.99 : 555.55;
        const valorSalvo = item.valor_unitario;
        
        console.log(`\n📦 Item ${index + 1} (atualizado):`);
        console.log(`   💰 Valor esperado: R$ ${valorEsperado}`);
        console.log(`   💾 Valor salvo: R$ ${valorSalvo}`);
        
        if (valorSalvo === valorEsperado) {
          console.log(`   ✅ ATUALIZAÇÃO DO VALOR UNITÁRIO FUNCIONOU!`);
        } else {
          console.log(`   ❌ ATUALIZAÇÃO DO VALOR UNITÁRIO FALHOU! Esperado: ${valorEsperado}, Salvo: ${valorSalvo}`);
        }
      });
    }
    
    console.log('\n🎯 RESUMO DO TESTE:');
    console.log('=' .repeat(40));
    console.log('✅ Teste de API concluído');
    console.log('📊 Verifique os resultados acima para identificar problemas');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testApiValorUnitario().catch(console.error);