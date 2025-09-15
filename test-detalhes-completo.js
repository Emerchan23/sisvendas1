// Teste completo para verificar o fluxo dos detalhes internos
// Execute este arquivo no console do navegador

console.log('🧪 TESTE COMPLETO - Detalhes Internos');
console.log('=====================================');

// Interceptar todas as requisições fetch
const originalFetch = window.fetch;
let interceptedRequests = [];

window.fetch = function(...args) {
  const url = args[0];
  const options = args[1] || {};
  
  console.log('🌐 FETCH INTERCEPTADO:', url);
  
  if (url && url.includes('/api/orcamentos')) {
    console.log('📡 REQUISIÇÃO PARA API DE ORÇAMENTOS!');
    console.log('🔍 URL:', url);
    console.log('🔍 Method:', options.method || 'GET');
    
    if (options.body) {
      try {
        const bodyData = JSON.parse(options.body);
        console.log('📦 BODY DA REQUISIÇÃO:');
        console.log(JSON.stringify(bodyData, null, 2));
        
        if (bodyData.itens && Array.isArray(bodyData.itens)) {
          console.log('📋 ANÁLISE DOS ITENS:');
          bodyData.itens.forEach((item, index) => {
            console.log(`📄 Item ${index + 1}:`);
            console.log(`  - Descrição: ${item.descricao}`);
            console.log(`  - Valor Unitário: ${item.valor_unitario}`);
            console.log(`  - Link Ref: ${item.link_ref}`);
            console.log(`  - Custo Ref: ${item.custo_ref}`);
            console.log(`  - Quantidade: ${item.quantidade}`);
            console.log(`  - Marca: ${item.marca}`);
            
            // Verificar se os detalhes internos estão presentes
            if (item.link_ref || item.custo_ref) {
              console.log('✅ DETALHES INTERNOS ENCONTRADOS NO ITEM!');
            } else {
              console.log('❌ DETALHES INTERNOS AUSENTES NO ITEM!');
            }
          });
        }
        
        // Armazenar requisição para análise posterior
        interceptedRequests.push({
          url,
          method: options.method || 'GET',
          body: bodyData,
          timestamp: new Date().toISOString()
        });
        
      } catch (e) {
        console.log('❌ Erro ao parsear body:', e);
      }
    }
  }
  
  return originalFetch.apply(this, args).then(response => {
    if (url && url.includes('/api/orcamentos')) {
      console.log('📨 RESPOSTA DA API:');
      console.log('Status:', response.status, response.statusText);
      
      // Clone para ler sem consumir
      const clonedResponse = response.clone();
      clonedResponse.json().then(data => {
        console.log('📄 Dados da resposta:');
        console.log(JSON.stringify(data, null, 2));
      }).catch(e => {
        console.log('❌ Erro ao ler resposta:', e);
      });
    }
    return response;
  }).catch(error => {
    if (url && url.includes('/api/orcamentos')) {
      console.log('❌ ERRO NA REQUISIÇÃO:', error);
    }
    throw error;
  });
};

// Função para analisar o estado atual da página
function analisarEstadoPagina() {
  console.log('\n🔍 ANÁLISE DO ESTADO DA PÁGINA');
  console.log('================================');
  
  // Verificar se estamos na página correta
  const url = window.location.href;
  console.log('📍 URL atual:', url);
  
  // Procurar por campos de detalhes internos
  const linkInputs = document.querySelectorAll('input[placeholder="https://loja.com/item"]');
  const custoInputs = document.querySelectorAll('input[placeholder="0,00"]');
  
  console.log('🔗 Campos de link encontrados:', linkInputs.length);
  console.log('💰 Campos de custo encontrados:', custoInputs.length);
  
  // Verificar botões de detalhes internos
  const detalhesButtons = document.querySelectorAll('button');
  let detalhesButtonsCount = 0;
  
  detalhesButtons.forEach(button => {
    const text = button.textContent || '';
    if (text.includes('Detalhes internos')) {
      detalhesButtonsCount++;
      console.log('🔘 Botão "Detalhes internos" encontrado:', button);
    }
  });
  
  console.log('🔘 Total de botões "Detalhes internos":', detalhesButtonsCount);
  
  // Verificar se há itens na tabela
  const tableRows = document.querySelectorAll('table tbody tr');
  console.log('📋 Linhas de itens na tabela:', tableRows.length);
  
  return {
    linkInputs: linkInputs.length,
    custoInputs: custoInputs.length,
    detalhesButtons: detalhesButtonsCount,
    tableRows: tableRows.length
  };
}

// Função para preencher detalhes internos automaticamente
function preencherDetalhesInternos() {
  console.log('\n🖊️ PREENCHENDO DETALHES INTERNOS');
  console.log('=================================');
  
  // Primeiro, expandir todos os detalhes internos
  const detalhesButtons = document.querySelectorAll('button');
  let expandidos = 0;
  
  detalhesButtons.forEach(button => {
    const text = button.textContent || '';
    if (text.includes('Detalhes internos')) {
      console.log('🔘 Clicando em botão "Detalhes internos"...');
      button.click();
      expandidos++;
    }
  });
  
  console.log('✅ Detalhes internos expandidos:', expandidos);
  
  // Aguardar um pouco para os campos aparecerem
  setTimeout(() => {
    // Preencher campos de link
    const linkInputs = document.querySelectorAll('input[placeholder="https://loja.com/item"]');
    linkInputs.forEach((input, index) => {
      const testLink = `https://exemplo-${index + 1}.com/produto-teste`;
      input.value = testLink;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      console.log(`🔗 Link ${index + 1} preenchido:`, testLink);
    });
    
    // Preencher campos de custo (procurar especificamente os de custo ref)
    const allInputs = document.querySelectorAll('input');
    let custoCount = 0;
    
    allInputs.forEach(input => {
      const label = input.closest('div')?.querySelector('label');
      const labelText = label?.textContent || '';
      
      if (labelText.includes('Custo ref') || labelText.includes('custo ref')) {
        const testCusto = `${(custoCount + 1) * 15}.50`;
        input.value = testCusto;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`💰 Custo ${custoCount + 1} preenchido:`, testCusto);
        custoCount++;
      }
    });
    
    console.log('✅ Preenchimento concluído!');
    console.log('📝 Agora tente salvar o orçamento para ver se os dados são enviados...');
    
  }, 1000);
}

// Função para verificar dados antes do salvamento
function verificarDadosAntesSalvamento() {
  console.log('\n🔍 VERIFICAÇÃO ANTES DO SALVAMENTO');
  console.log('===================================');
  
  // Verificar valores nos campos de link
  const linkInputs = document.querySelectorAll('input[placeholder="https://loja.com/item"]');
  linkInputs.forEach((input, index) => {
    console.log(`🔗 Link ${index + 1} atual:`, input.value);
  });
  
  // Verificar valores nos campos de custo
  const allInputs = document.querySelectorAll('input');
  let custoCount = 0;
  
  allInputs.forEach(input => {
    const label = input.closest('div')?.querySelector('label');
    const labelText = label?.textContent || '';
    
    if (labelText.includes('Custo ref') || labelText.includes('custo ref')) {
      console.log(`💰 Custo ${custoCount + 1} atual:`, input.value);
      custoCount++;
    }
  });
}

// Função para analisar requisições interceptadas
function analisarRequisicoes() {
  console.log('\n📊 ANÁLISE DAS REQUISIÇÕES INTERCEPTADAS');
  console.log('=========================================');
  
  if (interceptedRequests.length === 0) {
    console.log('❌ Nenhuma requisição interceptada ainda.');
    return;
  }
  
  interceptedRequests.forEach((req, index) => {
    console.log(`\n📡 Requisição ${index + 1}:`);
    console.log('URL:', req.url);
    console.log('Method:', req.method);
    console.log('Timestamp:', req.timestamp);
    
    if (req.body && req.body.itens) {
      console.log('Itens enviados:', req.body.itens.length);
      req.body.itens.forEach((item, itemIndex) => {
        console.log(`  Item ${itemIndex + 1}:`);
        console.log(`    - link_ref: ${item.link_ref}`);
        console.log(`    - custo_ref: ${item.custo_ref}`);
        console.log(`    - valor_unitario: ${item.valor_unitario}`);
      });
    }
  });
}

// Executar análise inicial
analisarEstadoPagina();

console.log('\n🎯 FUNÇÕES DISPONÍVEIS:');
console.log('========================');
console.log('- analisarEstadoPagina(): Analisa o estado atual da página');
console.log('- preencherDetalhesInternos(): Preenche automaticamente os campos');
console.log('- verificarDadosAntesSalvamento(): Verifica dados antes de salvar');
console.log('- analisarRequisicoes(): Mostra requisições interceptadas');
console.log('\n📝 INSTRUÇÕES:');
console.log('1. Execute preencherDetalhesInternos() para preencher os campos');
console.log('2. Execute verificarDadosAntesSalvamento() antes de salvar');
console.log('3. Salve o orçamento normalmente');
console.log('4. Execute analisarRequisicoes() para ver o que foi enviado');

// Disponibilizar funções globalmente
window.testeDetalhes = {
  analisarEstadoPagina,
  preencherDetalhesInternos,
  verificarDadosAntesSalvamento,
  analisarRequisicoes
};

console.log('\n✅ Teste configurado! Use window.testeDetalhes.nomeDaFuncao()');