async function testOrcamentoEdit() {
  console.log('🔍 Testando edição e salvamento de orçamento...');
  
  try {
    const orcamentoId = 'a55694c9-6232-4045-9a4e-e917a85c485f';
    
    // 1. Primeiro, buscar o orçamento atual
    console.log('\n📋 Buscando orçamento atual...');
    const getResponse = await fetch(`http://localhost:3145/api/orcamentos?includeItems=true`);
    
    if (!getResponse.ok) {
      throw new Error(`Erro ao buscar orçamentos: ${getResponse.status}`);
    }
    
    const orcamentos = await getResponse.json();
    const orcamento = orcamentos.find(o => o.id === orcamentoId);
    
    if (!orcamento) {
      throw new Error('Orçamento não encontrado');
    }
    
    console.log('✅ Orçamento encontrado:', orcamento.numero);
    console.log('📊 Itens atuais:', orcamento.itens?.length || 0);
    
    // 2. Simular uma edição - adicionar um novo item
    console.log('\n✏️ Simulando edição - adicionando novo item...');
    
    const itensAtualizados = [
      ...(orcamento.itens || []),
      {
        produto_id: null,
        descricao: 'Item Editado via Teste',
        marca: 'Marca Teste',
        unidade_medida: 'un',
        quantidade: 3,
        valor_unitario: 75.00,
        link_ref: '',
        custo_ref: 0
      }
    ];
    
    const dadosAtualizacao = {
      numero: orcamento.numero,
      cliente_id: orcamento.cliente_id,
      data_orcamento: orcamento.data_orcamento,
      valor_total: orcamento.valor_total + 225.00, // 3 * 75.00
      status: orcamento.status,
      observacoes: orcamento.observacoes,
      modalidade: orcamento.modalidade,
      numero_dispensa: orcamento.numero_dispensa,
      itens: itensAtualizados
    };
    
    // 3. Enviar atualização via PATCH
    console.log('💾 Enviando atualização via PATCH...');
    const patchResponse = await fetch(`http://localhost:3145/api/orcamentos/${orcamentoId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dadosAtualizacao)
    });
    
    if (!patchResponse.ok) {
      const errorText = await patchResponse.text();
      throw new Error(`Erro no PATCH: ${patchResponse.status} - ${errorText}`);
    }
    
    const patchResult = await patchResponse.json();
    console.log('✅ Atualização realizada:', patchResult.message);
    
    // 4. Verificar se a atualização foi salva corretamente
    console.log('\n🔍 Verificando se a atualização foi salva...');
    const verifyResponse = await fetch(`http://localhost:3145/api/orcamentos?includeItems=true`);
    
    if (!verifyResponse.ok) {
      throw new Error(`Erro ao verificar: ${verifyResponse.status}`);
    }
    
    const orcamentosVerify = await verifyResponse.json();
    const orcamentoAtualizado = orcamentosVerify.find(o => o.id === orcamentoId);
    
    console.log('📊 Itens após atualização:', orcamentoAtualizado.itens?.length || 0);
    console.log('💰 Valor total atualizado:', orcamentoAtualizado.valor_total);
    
    // Mostrar detalhes dos itens
    console.log('\n📋 Itens do orçamento:');
    orcamentoAtualizado.itens?.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.descricao} - Qtd: ${item.quantidade} - Valor: R$ ${item.valor_unitario}`);
    });
    
    if (orcamentoAtualizado.itens?.length === itensAtualizados.length) {
      console.log('\n🎉 SUCESSO! Orçamento editado e salvo corretamente!');
      console.log('✅ Todos os itens foram preservados e o novo item foi adicionado');
    } else {
      console.log('\n❌ FALHA! Problema na edição/salvamento do orçamento');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de edição:', error.message);
    console.error('Stack:', error.stack);
  }
}

testOrcamentoEdit();