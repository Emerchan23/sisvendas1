// Teste manual para verificar salvamento dos detalhes internos
// Execute este arquivo no console do navegador na página de orçamentos

console.log('🧪 Iniciando teste de detalhes internos...');

// Função para testar o salvamento dos detalhes internos
function testarDetalhesInternos() {
  console.log('🔍 Verificando elementos na página...');
  
  // Verificar se existem campos de detalhes internos
  const linkInputs = document.querySelectorAll('input[placeholder*="link"], input[name*="link"], input[id*="link"]');
  const custoInputs = document.querySelectorAll('input[placeholder*="custo"], input[name*="custo"], input[id*="custo"]');
  
  console.log('📋 Link inputs encontrados:', linkInputs.length);
  console.log('📋 Custo inputs encontrados:', custoInputs.length);
  
  linkInputs.forEach((input, index) => {
    console.log(`🔗 Link input ${index + 1}:`, {
      name: input.name,
      id: input.id,
      placeholder: input.placeholder,
      value: input.value,
      className: input.className
    });
  });
  
  custoInputs.forEach((input, index) => {
    console.log(`💰 Custo input ${index + 1}:`, {
      name: input.name,
      id: input.id,
      placeholder: input.placeholder,
      value: input.value,
      className: input.className
    });
  });
  
  // Verificar botões de detalhes internos
  const detalhesButtons = document.querySelectorAll('button:has-text("Detalhes internos"), [data-testid*="detalhes"], .detalhes');
  console.log('🔘 Botões de detalhes encontrados:', detalhesButtons.length);
  
  // Verificar modais ou dialogs
  const modals = document.querySelectorAll('[role="dialog"], .modal, [data-state="open"]');
  console.log('🪟 Modais encontrados:', modals.length);
  
  // Interceptar requisições fetch
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('🌐 Fetch interceptado:', args[0], args[1]);
    
    if (args[0] && args[0].includes('/api/orcamentos')) {
      console.log('📡 Requisição para API de orçamentos detectada!');
      
      if (args[1] && args[1].body) {
        try {
          const body = JSON.parse(args[1].body);
          console.log('📦 Body da requisição:', body);
          
          if (body.itens) {
            console.log('📋 Itens na requisição:', body.itens.length);
            body.itens.forEach((item, index) => {
              console.log(`📄 Item ${index + 1}:`, {
                descricao: item.descricao,
                valor_unitario: item.valor_unitario,
                link_ref: item.link_ref,
                custo_ref: item.custo_ref
              });
            });
          }
        } catch (e) {
          console.log('❌ Erro ao parsear body:', e);
        }
      }
    }
    
    return originalFetch.apply(this, args).then(response => {
      if (args[0] && args[0].includes('/api/orcamentos')) {
        console.log('📨 Resposta da API:', response.status, response.statusText);
        
        // Clone response para ler o body sem consumir o original
        const clonedResponse = response.clone();
        clonedResponse.json().then(data => {
          console.log('📄 Dados da resposta:', data);
        }).catch(e => {
          console.log('❌ Erro ao ler resposta:', e);
        });
      }
      return response;
    });
  };
  
  console.log('✅ Interceptador de fetch instalado!');
  console.log('📝 Agora tente salvar um orçamento com detalhes internos...');
}

// Função para simular preenchimento de detalhes internos
function preencherDetalhesInternos() {
  console.log('🖊️ Tentando preencher detalhes internos...');
  
  // Procurar por inputs de link e custo
  const linkInputs = document.querySelectorAll('input[name*="link"], input[placeholder*="link"]');
  const custoInputs = document.querySelectorAll('input[name*="custo"], input[placeholder*="custo"]');
  
  linkInputs.forEach((input, index) => {
    input.value = `https://exemplo-link-${index + 1}.com`;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`🔗 Link ${index + 1} preenchido:`, input.value);
  });
  
  custoInputs.forEach((input, index) => {
    input.value = `${(index + 1) * 10}.50`;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    console.log(`💰 Custo ${index + 1} preenchido:`, input.value);
  });
}

// Função para verificar estado atual dos dados
function verificarEstadoDados() {
  console.log('🔍 Verificando estado atual dos dados...');
  
  // Tentar acessar o estado do React (se disponível)
  const reactFiberKey = Object.keys(document.querySelector('body') || {}).find(key => key.startsWith('__reactFiber'));
  if (reactFiberKey) {
    console.log('⚛️ React Fiber detectado');
  }
  
  // Verificar localStorage
  console.log('💾 LocalStorage keys:', Object.keys(localStorage));
  
  // Verificar sessionStorage
  console.log('🗂️ SessionStorage keys:', Object.keys(sessionStorage));
}

// Executar testes
testarDetalhesInternos();
verificarEstadoDados();

console.log('🎯 Teste configurado! Use as seguintes funções:');
console.log('- testarDetalhesInternos(): Configura interceptadores');
console.log('- preencherDetalhesInternos(): Preenche campos automaticamente');
console.log('- verificarEstadoDados(): Verifica estado atual');