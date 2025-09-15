const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

async function testValorUnitarioFlow() {
  console.log('🧪 Testando fluxo completo do valor unitário...');
  
  try {
    // 1. Buscar um cliente existente
    console.log('\n1. Buscando clientes...');
    const clientesResponse = await fetch('http://localhost:3145/api/clientes');
    const clientes = await clientesResponse.json();
    
    if (clientes.length === 0) {
      console.log('❌ Nenhum cliente encontrado!');
      return;
    }
    
    const cliente = clientes[0];
    console.log(`✅ Cliente encontrado: ${cliente.nome}`);
    
    // 2. Criar orçamento com valor unitário específico
    const testData = {
      numero: `TEST-${Date.now()}`,
      cliente_id: cliente.id,
      data_orcamento: new Date().toISOString().split('T')[0],
      descricao: 'Teste de valor unitário',
      itens: [
        {
          descricao: 'Produto Teste A',
          marca: 'Marca A',
          quantidade: 2,
          valor_unitario: 150.75,
          link_ref: 'https://exemplo.com/produto-a',
          custo_ref: 100.50
        },
        {
          descricao: 'Produto Teste B',
          marca: 'Marca B',
          quantidade: 3,
          valor_unitario: 89.99,
          link_ref: 'https://exemplo.com/produto-b',
          custo_ref: 60.00
        }
      ]
    };
    
    console.log('\n2. Criando orçamento...');
    console.log('Dados enviados:', JSON.stringify(testData, null, 2));
    
    const createResponse = await fetch('http://localhost:3145/api/orcamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.log('❌ Erro ao criar orçamento:', createResponse.status, errorText);
      return;
    }
    
    const createdOrcamento = await createResponse.json();
    console.log('✅ Orçamento criado:', createdOrcamento.id);
    
    // 3. Buscar o orçamento criado para verificar se os valores foram salvos
    console.log('\n3. Verificando orçamento criado...');
    const getResponse = await fetch(`http://localhost:3145/api/orcamentos/${createdOrcamento.id}`);
    
    if (!getResponse.ok) {
      console.log('❌ Erro ao buscar orçamento:', getResponse.status);
      return;
    }
    
    const orcamentoCompleto = await getResponse.json();
    console.log('📋 Orçamento recuperado:');
    console.log(`   ID: ${orcamentoCompleto.id}`);
    console.log(`   Número: ${orcamentoCompleto.numero}`);
    console.log(`   Total de itens: ${orcamentoCompleto.itens ? orcamentoCompleto.itens.length : 0}`);
    
    if (orcamentoCompleto.itens && orcamentoCompleto.itens.length > 0) {
      console.log('\n📦 Itens salvos:');
      orcamentoCompleto.itens.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item.descricao}`);
        console.log(`      Quantidade: ${item.quantidade}`);
        console.log(`      Valor Unitário: ${item.valor_unitario}`);
        console.log(`      Valor Total: ${item.valor_total}`);
        console.log(`      ---`);
      });
      
      // Verificar se os valores unitários estão corretos
      const item1 = orcamentoCompleto.itens[0];
      const item2 = orcamentoCompleto.itens[1];
      
      console.log('\n🔍 Verificação dos valores:');
      console.log(`   Item 1 - Esperado: 150.75, Salvo: ${item1.valor_unitario} ${item1.valor_unitario == 150.75 ? '✅' : '❌'}`);
      console.log(`   Item 2 - Esperado: 89.99, Salvo: ${item2.valor_unitario} ${item2.valor_unitario == 89.99 ? '✅' : '❌'}`);
      
      if (item1.valor_unitario == 150.75 && item2.valor_unitario == 89.99) {
        console.log('\n🎉 SUCESSO: Valores unitários foram salvos corretamente!');
      } else {
        console.log('\n❌ PROBLEMA: Valores unitários não foram salvos corretamente!');
      }
    } else {
      console.log('❌ Nenhum item encontrado no orçamento!');
    }
    
    // 4. Testar atualização do orçamento
    console.log('\n4. Testando atualização do orçamento...');
    const updateData = {
      ...orcamentoCompleto,
      itens: [
        {
          descricao: 'Produto Atualizado A',
          marca: 'Marca A',
          quantidade: 1,
          valor_unitario: 299.99,
          link_ref: 'https://exemplo.com/produto-a-updated',
          custo_ref: 200.00
        }
      ]
    };
    
    const updateResponse = await fetch(`http://localhost:3145/api/orcamentos/${createdOrcamento.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.log('❌ Erro ao atualizar orçamento:', updateResponse.status, errorText);
      return;
    }
    
    console.log('✅ Orçamento atualizado com sucesso!');
    
    // 5. Verificar se a atualização foi salva corretamente
    console.log('\n5. Verificando atualização...');
    const getUpdatedResponse = await fetch(`http://localhost:3145/api/orcamentos/${createdOrcamento.id}`);
    const orcamentoAtualizado = await getUpdatedResponse.json();
    
    if (orcamentoAtualizado.itens && orcamentoAtualizado.itens.length > 0) {
      const itemAtualizado = orcamentoAtualizado.itens[0];
      console.log(`   Valor unitário atualizado: ${itemAtualizado.valor_unitario}`);
      console.log(`   Esperado: 299.99, Salvo: ${itemAtualizado.valor_unitario} ${itemAtualizado.valor_unitario == 299.99 ? '✅' : '❌'}`);
      
      if (itemAtualizado.valor_unitario == 299.99) {
        console.log('\n🎉 SUCESSO: Atualização do valor unitário funcionou!');
      } else {
        console.log('\n❌ PROBLEMA: Atualização do valor unitário falhou!');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

testValorUnitarioFlow();