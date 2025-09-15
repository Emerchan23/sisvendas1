const puppeteer = require('puppeteer');

async function testValorUnitario() {
  console.log('🚀 Iniciando teste do valor unitário...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Interceptar requisições de rede
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.url().includes('/api/')) {
      console.log('📡 API Request:', request.method(), request.url());
      if (request.postData()) {
        console.log('📤 Request Data:', request.postData());
      }
    }
    request.continue();
  });
  
  page.on('response', async (response) => {
    if (response.url().includes('/api/')) {
      console.log('📥 API Response:', response.status(), response.url());
      try {
        const responseText = await response.text();
        if (responseText) {
          console.log('📋 Response Data:', responseText);
        }
      } catch (e) {
        console.log('⚠️ Erro ao ler resposta:', e.message);
      }
    }
  });
  
  // Capturar logs do console
  page.on('console', msg => {
    console.log('🖥️ Console:', msg.type(), msg.text());
  });
  
  // Capturar erros
  page.on('pageerror', error => {
    console.log('❌ Page Error:', error.message);
  });
  
  try {
    // Passo 1: Ir para a página de login
    console.log('\n1. Navegando para login...');
    await page.goto('http://localhost:3145/login', { waitUntil: 'networkidle2' });
    
    // Passo 2: Fazer login
    console.log('\n2. Fazendo login...');
    await page.type('#email', 'admin@sistema.com');
    await page.type('#senha', 'admin123');
    
    const loginButton = await page.$('button[type="submit"]');
    if (loginButton) {
      await loginButton.click();
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }
    
    // Passo 3: Ir para orçamentos
    console.log('\n3. Navegando para orçamentos...');
    await page.goto('http://localhost:3145/orcamentos', { waitUntil: 'networkidle2' });
    
    // Passo 4: Verificar se estamos na aba "Criar Orçamento"
    console.log('\n4. Verificando aba ativa...');
    const activeTab = await page.$('[data-state="active"]');
    if (activeTab) {
      const tabText = await page.evaluate(el => el.textContent, activeTab);
      console.log('📋 Aba ativa:', tabText);
    }
    
    // Passo 5: Procurar por inputs de valor unitário
    console.log('\n5. Procurando inputs de valor unitário...');
    const valorInputs = await page.$$('input[placeholder*="valor"], input[name*="valor"], input[id*="valor"]');
    console.log(`💰 Encontrados ${valorInputs.length} inputs relacionados a valor`);
    
    for (let i = 0; i < valorInputs.length; i++) {
      const input = valorInputs[i];
      const placeholder = await page.evaluate(el => el.placeholder, input);
      const name = await page.evaluate(el => el.name, input);
      const id = await page.evaluate(el => el.id, input);
      console.log(`  Input ${i + 1}: placeholder="${placeholder}", name="${name}", id="${id}"`);
    }
    
    // Passo 6: Procurar por botão "Adicionar Item"
    console.log('\n6. Procurando botão Adicionar Item...');
    const addButtons = await page.$$('button');
    let addItemButton = null;
    
    for (const button of addButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.toLowerCase().includes('adicionar')) {
        console.log('➕ Botão encontrado:', text);
        addItemButton = button;
        break;
      }
    }
    
    // Passo 7: Tentar adicionar um item se o botão existir
    if (addItemButton) {
      console.log('\n7. Clicando em Adicionar Item...');
      await addItemButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Procurar novamente por inputs após adicionar item
      console.log('\n8. Procurando inputs após adicionar item...');
      const newValorInputs = await page.$$('input[placeholder*="valor"], input[name*="valor"], input[id*="valor"], input[type="number"]');
      console.log(`💰 Encontrados ${newValorInputs.length} inputs após adicionar item`);
      
      // Tentar preencher um valor unitário
      if (newValorInputs.length > 0) {
        console.log('\n9. Testando preenchimento de valor unitário...');
        const valorInput = newValorInputs[newValorInputs.length - 1]; // Pegar o último input
        
        await valorInput.focus();
         await valorInput.click({ clickCount: 3 }); // Selecionar tudo
         await valorInput.type('25.50');
        
        console.log('✅ Valor 25.50 inserido no input');
        
        // Verificar se o valor foi aceito
        await new Promise(resolve => setTimeout(resolve, 1000));
        const valorAtual = await page.evaluate(el => el.value, valorInput);
        console.log('🔍 Valor atual no input:', valorAtual);
        
        // Simular blur para disparar eventos de validação
        await page.evaluate(el => el.blur(), valorInput);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const valorAposBlur = await page.evaluate(el => el.value, valorInput);
        console.log('🔍 Valor após blur:', valorAposBlur);
      }
    }
    
    console.log('\n✅ Teste concluído! Mantendo navegador aberto por 60 segundos para análise...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
}

testValorUnitario();