// Script para testar e debugar o salvamento dos detalhes internos
// Execute este script no console do navegador na página de orçamentos

console.log('🔍 Iniciando teste de salvamento dos detalhes internos...');

// Interceptar todas as requisições fetch
const originalFetch = window.fetch;
const requestLog = [];

window.fetch = async function(...args) {
  const [url, options] = args;
  const timestamp = new Date().toISOString();
  
  console.log(`📤 [${timestamp}] Requisição interceptada:`, {
    url,
    method: options?.method || 'GET',
    headers: options?.headers,
    body: options?.body ? JSON.parse(options.body) : null
  });
  
  // Salvar no log
  requestLog.push({
    timestamp,
    url,
    method: options?.method || 'GET',
    body: options?.body ? JSON.parse(options.body) : null
  });
  
  try {
    const response = await originalFetch(...args);
    const responseClone = response.clone();
    const responseData = await responseClone.json().catch(() => null);
    
    console.log(`📥 [${timestamp}] Resposta recebida:`, {
      status: response.status,
      statusText: response.statusText,
      data: responseData
    });
    
    return response;
  } catch (error) {
    console.error(`❌ [${timestamp}] Erro na requisição:`, error);
    throw error;
  }
};

// Função para testar o salvamento
window.testarSalvamentoDetalhes = async function() {
  console.log('\n🧪 Iniciando teste de salvamento...');
  
  // Limpar log anterior
  requestLog.length = 0;
  
  // Verificar se estamos na página correta
  if (!window.location.pathname.includes('/orcamentos')) {
    console.error('❌ Execute este teste na página de orçamentos!');
    return;
  }
  
  // Aguardar um pouco para garantir que a página carregou
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Procurar por botões de "Detalhes internos"
  const detalhesButtons = document.querySelectorAll('button[aria-expanded]');
  console.log(`🔍 Encontrados ${detalhesButtons.length} botões de detalhes`);
  
  if (detalhesButtons.length === 0) {
    console.log('ℹ️ Nenhum botão de detalhes encontrado. Vamos adicionar um item primeiro.');
    
    // Procurar botão "Adicionar Item"
    const addButton = document.querySelector('button:has-text("Adicionar Item"), button[aria-label*="Adicionar"]');
    if (addButton) {
      console.log('➕ Clicando em Adicionar Item...');
      addButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Tentar expandir o primeiro item de detalhes
  const firstDetailsButton = document.querySelector('button[aria-expanded="false"]');
  if (firstDetailsButton) {
    console.log('📂 Expandindo detalhes internos...');
    firstDetailsButton.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Procurar campos de link_ref e custo_ref
    const linkRefInput = document.querySelector('input[placeholder*="link"], input[name*="link"]');
    const custoRefInput = document.querySelector('input[placeholder*="custo"], input[name*="custo"]');
    
    if (linkRefInput && custoRefInput) {
      console.log('✅ Campos de detalhes encontrados!');
      
      // Preencher os campos
      const testLink = 'https://exemplo-teste.com/produto';
      const testCusto = '25.50';
      
      console.log('📝 Preenchendo campos...');
      linkRefInput.value = testLink;
      linkRefInput.dispatchEvent(new Event('input', { bubbles: true }));
      linkRefInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      custoRefInput.value = testCusto;
      custoRefInput.dispatchEvent(new Event('input', { bubbles: true }));
      custoRefInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('✅ Campos preenchidos:', {
        linkRef: linkRefInput.value,
        custoRef: custoRefInput.value
      });
    } else {
      console.warn('⚠️ Campos de detalhes não encontrados!');
    }
  }
  
  // Procurar e clicar no botão Salvar
  const saveButton = document.querySelector('button:has-text("Salvar"), button[type="submit"]');
  if (saveButton && !saveButton.disabled) {
    console.log('💾 Clicando em Salvar...');
    saveButton.click();
    
    // Aguardar requisições
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n📊 Resumo das requisições:');
    requestLog.forEach((req, index) => {
      console.log(`${index + 1}. ${req.method} ${req.url}`);
      if (req.body && req.body.itens) {
        console.log('   📦 Itens enviados:', req.body.itens.length);
        req.body.itens.forEach((item, i) => {
          console.log(`     Item ${i + 1}:`, {
            descricao: item.descricao,
            valor_unitario: item.valor_unitario,
            link_ref: item.link_ref,
            custo_ref: item.custo_ref
          });
        });
      }
    });
  } else {
    console.warn('⚠️ Botão Salvar não encontrado ou está desabilitado!');
  }
};

// Função para verificar estado atual dos itens
window.verificarEstadoItens = function() {
  console.log('\n🔍 Verificando estado atual dos itens...');
  
  // Procurar todos os inputs de valor unitário
  const valorInputs = document.querySelectorAll('input[placeholder*="Valor"], input[name*="valor"]');
  console.log(`💰 Encontrados ${valorInputs.length} campos de valor`);
  
  valorInputs.forEach((input, index) => {
    console.log(`Valor ${index + 1}: ${input.value}`);
  });
  
  // Procurar campos de detalhes expandidos
  const linkInputs = document.querySelectorAll('input[placeholder*="link"], input[name*="link"]');
  const custoInputs = document.querySelectorAll('input[placeholder*="custo"], input[name*="custo"]');
  
  console.log(`🔗 Encontrados ${linkInputs.length} campos de link`);
  console.log(`💵 Encontrados ${custoInputs.length} campos de custo`);
  
  linkInputs.forEach((input, index) => {
    console.log(`Link ${index + 1}: ${input.value}`);
  });
  
  custoInputs.forEach((input, index) => {
    console.log(`Custo ${index + 1}: ${input.value}`);
  });
};

// Função para analisar logs de requisições
window.analisarLogs = function() {
  console.log('\n📋 Análise detalhada dos logs:');
  console.log('Total de requisições:', requestLog.length);
  
  const orcamentoRequests = requestLog.filter(req => req.url.includes('/api/orcamentos'));
  console.log('Requisições para orçamentos:', orcamentoRequests.length);
  
  orcamentoRequests.forEach((req, index) => {
    console.log(`\n📤 Requisição ${index + 1}:`);
    console.log('URL:', req.url);
    console.log('Método:', req.method);
    
    if (req.body) {
      console.log('Dados enviados:');
      console.log('- Cliente ID:', req.body.cliente_id);
      console.log('- Número:', req.body.numero);
      console.log('- Itens:', req.body.itens?.length || 0);
      
      if (req.body.itens && req.body.itens.length > 0) {
        req.body.itens.forEach((item, i) => {
          console.log(`  Item ${i + 1}:`);
          console.log(`    - Descrição: ${item.descricao}`);
          console.log(`    - Valor Unitário: ${item.valor_unitario}`);
          console.log(`    - Link Ref: ${item.link_ref || 'NÃO DEFINIDO'}`);
          console.log(`    - Custo Ref: ${item.custo_ref || 'NÃO DEFINIDO'}`);
        });
      }
    }
  });
};

console.log('\n✅ Script carregado! Funções disponíveis:');
console.log('- testarSalvamentoDetalhes(): Testa o fluxo completo de salvamento');
console.log('- verificarEstadoItens(): Verifica o estado atual dos campos');
console.log('- analisarLogs(): Analisa as requisições interceptadas');
console.log('\n🚀 Execute: testarSalvamentoDetalhes()');