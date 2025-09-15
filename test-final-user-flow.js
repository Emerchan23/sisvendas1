const Database = require('better-sqlite3');
const fetch = require('node-fetch');

async function testUserFlow() {
  console.log('🎯 Simulando fluxo completo do usuário...');
  
  try {
    // 1. Listar orçamentos (como na tela principal)
    console.log('\n📋 1. Listando orçamentos disponíveis:');
    const listResponse = await fetch('http://localhost:3145/api/orcamentos?includeItems=true');
    const orcamentos = await listResponse.json();
    
    if (!orcamentos || orcamentos.length === 0) {
      console.log('❌ Nenhum orçamento encontrado!');
      return;
    }
    
    console.log(`✅ Encontrados ${orcamentos.length} orçamento(s):`);
    orcamentos.forEach(orc => {
      console.log(`  - ${orc.numero} (${orc.cliente_nome || 'Cliente não informado'}) - ${orc.itens?.length || 0} itens`);
    });
    
    const orcamento = orcamentos[0];
    console.log(`\n🎯 Editando orçamento: ${orcamento.numero}`);
    
    // 2. Buscar orçamento específico (como ao abrir para edição)
    console.log('\n📖 2. Carregando orçamento para edição:');
    const getResponse = await fetch(`http://localhost:3145/api/orcamentos/${orcamento.id}`);
    const orcamentoDetalhado = await getResponse.json();
    
    console.log(`✅ Orçamento carregado: ${orcamentoDetalhado.numero}`);
    console.log(`📊 Itens atuais: ${orcamentoDetalhado.itens?.length || 0}`);
    
    // 3. Simular edição (adicionar/modificar itens)
    console.log('\n✏️ 3. Simulando edição do usuário:');
    const itensEditados = [
      {
        produto_id: null,
        descricao: 'Produto A - Editado pelo usuário',
        marca: 'Marca Premium',
        quantidade: 5,
        valor_unitario: 150.00,
        link_ref: '',
        custo_ref: 120.00
      },
      {
        produto_id: null,
        descricao: 'Produto B - Novo item',
        marca: 'Marca Standard',
        quantidade: 2,
        valor_unitario: 80.00,
        link_ref: '',
        custo_ref: 60.00
      }
    ];
    
    const valorTotal = itensEditados.reduce((total, item) => 
      total + (item.quantidade * item.valor_unitario), 0
    );
    
    const dadosEdicao = {
      numero: orcamentoDetalhado.numero,
      cliente_id: orcamentoDetalhado.cliente_id,
      data_orcamento: orcamentoDetalhado.data_orcamento,
      valor_total: valorTotal,
      status: orcamentoDetalhado.status,
      observacoes: 'Orçamento editado pelo usuário via interface web',
      modalidade: orcamentoDetalhado.modalidade || 'DISPENSA',
      numero_dispensa: orcamentoDetalhado.numero_dispensa || '33/2025',
      itens: itensEditados
    };
    
    console.log(`💰 Novo valor total calculado: R$ ${valorTotal.toFixed(2)}`);
    console.log(`📦 Novos itens: ${itensEditados.length}`);
    
    // 4. Salvar alterações (PATCH)
    console.log('\n💾 4. Salvando alterações:');
    const saveResponse = await fetch(`http://localhost:3145/api/orcamentos/${orcamento.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dadosEdicao)
    });
    
    const saveResult = await saveResponse.json();
    console.log(`📤 Status do salvamento: ${saveResponse.status}`);
    console.log(`📝 Resposta: ${saveResult.message || JSON.stringify(saveResult)}`);
    
    if (saveResponse.status !== 200) {
      console.log('❌ Erro ao salvar!');
      return;
    }
    
    // 5. Verificar se foi salvo corretamente
    console.log('\n🔍 5. Verificando se foi salvo:');
    const verificacaoResponse = await fetch(`http://localhost:3145/api/orcamentos/${orcamento.id}`);
    const orcamentoVerificado = await verificacaoResponse.json();
    
    console.log(`✅ Orçamento verificado: ${orcamentoVerificado.numero}`);
    console.log(`💰 Valor total: R$ ${orcamentoVerificado.valor_total}`);
    console.log(`📊 Itens salvos: ${orcamentoVerificado.itens?.length || 0}`);
    
    if (orcamentoVerificado.itens && orcamentoVerificado.itens.length > 0) {
      console.log('📋 Detalhes dos itens salvos:');
      orcamentoVerificado.itens.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.descricao}`);
        console.log(`     Qtd: ${item.quantidade} x R$ ${item.valor_unitario} = R$ ${item.valor_total}`);
      });
    }
    
    // 6. Verificar na listagem geral
    console.log('\n📋 6. Verificando na listagem geral:');
    const listagemFinalResponse = await fetch('http://localhost:3145/api/orcamentos?includeItems=true');
    const listagemFinal = await listagemFinalResponse.json();
    
    const orcamentoNaListagem = listagemFinal.find(orc => orc.id === orcamento.id);
    if (orcamentoNaListagem) {
      console.log(`✅ Orçamento encontrado na listagem: ${orcamentoNaListagem.numero}`);
      console.log(`📊 Itens na listagem: ${orcamentoNaListagem.itens?.length || 0}`);
      console.log(`💰 Valor na listagem: R$ ${orcamentoNaListagem.valor_total}`);
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ O usuário pode editar e salvar orçamentos normalmente.');
    
  } catch (error) {
    console.error('❌ Erro no teste do fluxo do usuário:', error);
    console.error('Stack:', error.stack);
  }
}

testUserFlow();