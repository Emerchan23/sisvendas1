// Script para testar o fluxo completo da interface
const axios = require('axios');

const BASE_URL = 'http://localhost:3145';

async function testInterfaceFlow() {
  console.log('🧪 TESTANDO FLUXO COMPLETO DA INTERFACE');
  console.log('=====================================');
  
  try {
    // 1. Primeiro, vamos criar um cliente para usar no orçamento
    console.log('\n1. Criando cliente de teste...');
    const clienteData = {
      nome: 'Cliente Teste Interface',
      cpf_cnpj: '11144477735', // CPF válido
      telefone: '(11) 99999-9999',
      email: 'teste@interface.com',
      endereco: 'Rua Teste, 123'
    };
    
    const clienteResponse = await axios.post(`${BASE_URL}/api/clientes`, clienteData);
    const clienteId = clienteResponse.data.id;
    console.log('✅ Cliente criado:', clienteId);
    
    // 2. Agora vamos criar um orçamento com itens que têm detalhes internos
    console.log('\n2. Criando orçamento com detalhes internos...');
    const orcamentoData = {
      cliente_id: clienteId,
      data_orcamento: '2025-09-15',
      data_validade: '2025-10-15',
      descricao: 'Orçamento teste interface',
      condicoes_pagamento: 'À vista',
      prazo_entrega: '10 dias',
      modalidade: 'compra_direta',
      itens: [
        {
          descricao: 'Produto Interface A',
          marca: 'Marca A',
          quantidade: 2,
          valor_unitario: 150.00,
          link_ref: 'https://interface.com/produto-a',
          custo_ref: 120.00
        },
        {
          descricao: 'Produto Interface B',
          marca: 'Marca B', 
          quantidade: 1,
          valor_unitario: 300.00,
          link_ref: 'https://interface.com/produto-b',
          custo_ref: 250.00
        },
        {
          descricao: 'Produto Interface C - Sem detalhes',
          marca: 'Marca C',
          quantidade: 3,
          valor_unitario: 50.00
          // Sem link_ref e custo_ref propositalmente
        }
      ]
    };
    
    console.log('📤 Enviando dados do orçamento...');
    console.log('Dados enviados:', JSON.stringify(orcamentoData, null, 2));
    
    const orcamentoResponse = await axios.post(`${BASE_URL}/api/orcamentos`, orcamentoData);
    const orcamentoId = orcamentoResponse.data.id;
    
    console.log('✅ Orçamento criado:', orcamentoId);
    console.log('📋 Resposta da API:', JSON.stringify(orcamentoResponse.data, null, 2));
    
    // 3. Verificar se os dados foram salvos corretamente
    console.log('\n3. Verificando dados salvos...');
    const verificacaoResponse = await axios.get(`${BASE_URL}/api/orcamentos?incluir_itens=true`);
    const orcamentoCriado = verificacaoResponse.data.find(o => o.id === orcamentoId);
    
    if (orcamentoCriado) {
      console.log('\n📊 ANÁLISE DOS ITENS SALVOS:');
      orcamentoCriado.itens.forEach((item, i) => {
        console.log(`\nItem ${i + 1}:`);
        console.log(`  Descrição: ${item.descricao}`);
        console.log(`  Valor Unit: R$ ${item.valor_unitario}`);
        console.log(`  Link Ref: ${item.link_ref || 'VAZIO'}`);
        console.log(`  Custo Ref: R$ ${item.custo_ref || 0}`);
        
        // Verificar se os detalhes internos foram salvos
        if (item.link_ref && item.custo_ref > 0) {
          console.log(`  ✅ Detalhes internos SALVOS corretamente`);
        } else if (!item.link_ref && item.custo_ref === 0) {
          console.log(`  ⚪ Sem detalhes internos (esperado)`);
        } else {
          console.log(`  ❌ Problema nos detalhes internos`);
        }
      });
      
      // Estatísticas
      const comDetalhes = orcamentoCriado.itens.filter(item => item.link_ref && item.custo_ref > 0).length;
      const total = orcamentoCriado.itens.length;
      
      console.log(`\n📈 RESULTADO:`);
      console.log(`Total de itens: ${total}`);
      console.log(`Com detalhes internos: ${comDetalhes}`);
      console.log(`Taxa de sucesso: ${((comDetalhes/total)*100).toFixed(1)}%`);
      
      if (comDetalhes >= 2) {
        console.log('\n🎉 TESTE PASSOU! Detalhes internos estão sendo salvos corretamente.');
      } else {
        console.log('\n❌ TESTE FALHOU! Detalhes internos não estão sendo salvos.');
      }
    } else {
      console.log('❌ Orçamento não encontrado na verificação');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Dados:', error.response.data);
    }
  }
}

// Executar teste
testInterfaceFlow().then(() => {
  console.log('\n🏁 Teste concluído!');
}).catch(error => {
  console.error('💥 Erro fatal:', error);
});