const fetch = require('node-fetch');

// Simular exatamente o que o frontend faz
async function testFrontendFlow() {
  console.log('🔍 TESTE: Simulando fluxo completo do frontend');
  
  const baseUrl = 'http://localhost:3145';
  
  try {
    // 1. Simular dados como o frontend cria
    console.log('\n1. Criando dados como o frontend...');
    
    const frontendItens = [
      {
        descricao: "Produto Teste Frontend",
        marca: "Marca Teste",
        unidadeMedida: "un",
        quantidade: 2,
        valorUnitario: 150.75, // Valor que deveria ser salvo
        linkRef: "https://exemplo.com/produto",
        custoRef: 100.50,
        observacoes: "Observação do item"
      }
    ];
    
    console.log('📋 Itens do frontend:', JSON.stringify(frontendItens, null, 2));
    
    // 2. Converter para formato backend (como o frontend faz)
    console.log('\n2. Convertendo para formato backend...');
    
    const backendItens = frontendItens.map(item => ({
      id: `item-${Date.now()}`,
      item_id: "",
      descricao: item.descricao,
      marca: item.marca || "",
      unidade_medida: item.unidadeMedida || "un",
      quantidade: item.quantidade,
      valor_unitario: item.valorUnitario, // Campo crítico
      desconto: 0,
      observacoes: item.observacoes || "",
      link_ref: item.linkRef || null,
      custo_ref: item.custoRef || null
    }));
    
    console.log('📤 Itens convertidos para backend:', JSON.stringify(backendItens, null, 2));
    
    // 3. Criar dados completos do orçamento
    const dadosOrcamento = {
      numero: `TESTE-${Date.now()}`,
      cliente_id: `cliente-${Date.now()}`,
      data_orcamento: new Date().toISOString(),
      data_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      observacoes: "Teste de salvamento frontend",
      modalidade: "COTACAO",
      numero_pregao: null,
      numero_dispensa: null,
      numero_processo: null,
      itens: backendItens
    };
    
    console.log('\n3. Dados completos do orçamento:');
    console.log(JSON.stringify(dadosOrcamento, null, 2));
    
    // 4. Enviar para API (como o frontend faz)
    console.log('\n4. Enviando para API...');
    
    const response = await fetch(`${baseUrl}/api/orcamentos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dadosOrcamento)
    });
    
    console.log('📊 Status da resposta:', response.status);
    
    if (response.ok) {
      const resultado = await response.json();
      console.log('✅ Orçamento criado com sucesso!');
      console.log('📋 ID do orçamento:', resultado.id);
      
      // 5. Verificar se foi salvo corretamente
      console.log('\n5. Verificando se foi salvo corretamente...');
      
      const getResponse = await fetch(`${baseUrl}/api/orcamentos?incluir_itens=true`);
      const orcamentos = await getResponse.json();
      
      const orcamentoSalvo = orcamentos.find(o => o.id === resultado.id);
      
      if (orcamentoSalvo) {
        console.log('✅ Orçamento encontrado na listagem!');
        console.log('📋 Dados salvos:');
        console.log(`  - Número: ${orcamentoSalvo.numero}`);
        console.log(`  - Quantidade de itens: ${orcamentoSalvo.itens?.length || 0}`);
        
        if (orcamentoSalvo.itens && orcamentoSalvo.itens.length > 0) {
          orcamentoSalvo.itens.forEach((item, index) => {
            console.log(`\n  📦 Item ${index + 1}:`);
            console.log(`    - Descrição: ${item.descricao}`);
            console.log(`    - Marca: ${item.marca}`);
            console.log(`    - Quantidade: ${item.quantidade}`);
            console.log(`    - Valor unitário: ${item.valor_unitario}`);
            console.log(`    - Link ref: ${item.link_ref}`);
            console.log(`    - Custo ref: ${item.custo_ref}`);
            
            // Verificações críticas
            if (item.valor_unitario === 150.75) {
              console.log('    ✅ VALOR UNITÁRIO SALVO CORRETAMENTE!');
            } else {
              console.log(`    ❌ PROBLEMA: Valor unitário esperado 150.75, mas foi salvo ${item.valor_unitario}`);
            }
            
            if (item.link_ref === "https://exemplo.com/produto") {
              console.log('    ✅ LINK REF SALVO CORRETAMENTE!');
            } else {
              console.log(`    ❌ PROBLEMA: Link ref esperado 'https://exemplo.com/produto', mas foi salvo '${item.link_ref}'`);
            }
            
            if (item.custo_ref === 100.50) {
              console.log('    ✅ CUSTO REF SALVO CORRETAMENTE!');
            } else {
              console.log(`    ❌ PROBLEMA: Custo ref esperado 100.50, mas foi salvo ${item.custo_ref}`);
            }
          });
        } else {
          console.log('❌ PROBLEMA CRÍTICO: Nenhum item foi salvo!');
        }
      } else {
        console.log('❌ PROBLEMA: Orçamento não encontrado na listagem!');
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Erro ao criar orçamento:', response.status);
      console.log('Resposta:', error);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar teste
testFrontendFlow();