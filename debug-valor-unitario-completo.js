const puppeteer = require('puppeteer');

async function debugValorUnitarioCompleto() {
  console.log('🔍 [DEBUG] Iniciando teste completo do valor unitário e detalhes internos...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Interceptar requisições para monitorar API calls
  await page.setRequestInterception(true);
  
  const apiCalls = [];
  
  page.on('request', (request) => {
    if (request.url().includes('/api/')) {
      console.log(`📤 [API REQUEST] ${request.method()} ${request.url()}`);
      if (request.postData()) {
        console.log(`📤 [API BODY]`, request.postData());
      }
      apiCalls.push({
        method: request.method(),
        url: request.url(),
        body: request.postData()
      });
    }
    request.continue();
  });
  
  page.on('response', async (response) => {
    if (response.url().includes('/api/')) {
      console.log(`📥 [API RESPONSE] ${response.status()} ${response.url()}`);
      try {
        const responseText = await response.text();
        if (responseText) {
          console.log(`📥 [API RESPONSE BODY]`, responseText.substring(0, 500));
        }
      } catch (e) {
        console.log(`📥 [API RESPONSE] Não foi possível ler o corpo da resposta`);
      }
    }
  });
  
  // Interceptar erros do console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ [BROWSER ERROR]', msg.text());
    } else if (msg.text().includes('DEBUG')) {
      console.log('🔍 [BROWSER DEBUG]', msg.text());
    }
  });
  
  try {
    // 1. Fazer login
    console.log('\n1️⃣ Fazendo login...');
    await page.goto('http://localhost:3145/login');
    await page.waitForSelector('input[type="email"]');
    
    await page.type('input[type="email"]', 'admin@sistema.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation();
    console.log('✅ Login realizado com sucesso');
    
    // 2. Navegar para orçamentos
    console.log('\n2️⃣ Navegando para orçamentos...');
    await page.goto('http://localhost:3145/orcamentos');
    await page.waitForSelector('[data-state="active"]');
    console.log('✅ Página de orçamentos carregada');
    
    // 3. Adicionar um item
    console.log('\n3️⃣ Adicionando item...');
    const addButton = await page.waitForSelector('button:has-text("Adicionar Item")');
    await addButton.click();
    console.log('✅ Item adicionado');
    
    // 4. Preencher dados básicos do item
    console.log('\n4️⃣ Preenchendo dados básicos...');
    
    // Preencher cliente
    await page.fill('input[placeholder*="nome do cliente"]', 'Cliente Teste Debug');
    
    // Preencher descrição do item
    await page.fill('input[placeholder*="Velas aromáticas"]', 'Produto Teste Debug');
    
    // Preencher quantidade
    await page.fill('input[type="number"][min="0"][step="1"]', '5');
    
    console.log('✅ Dados básicos preenchidos');
    
    // 5. Testar valor unitário
    console.log('\n5️⃣ Testando valor unitário...');
    
    // Encontrar o input de valor unitário
    const valorInputs = await page.$$('input[placeholder="0,00"]');
    console.log(`🔍 Encontrados ${valorInputs.length} inputs de valor`);
    
    if (valorInputs.length > 0) {
      const valorUnitarioInput = valorInputs[0]; // Primeiro deve ser o valor unitário
      
      // Limpar e preencher valor
      await valorUnitarioInput.click({ clickCount: 3 });
      await valorUnitarioInput.type('125,75');
      
      // Verificar se o valor foi aceito
      const valorDigitado = await valorUnitarioInput.inputValue();
      console.log(`💰 Valor digitado no input: "${valorDigitado}"`);
      
      // Aguardar um pouco para processamento
      await page.waitForTimeout(1000);
      
      // Verificar se o total foi calculado
      const totalElement = await page.$('.text-3xl.font-bold.tabular-nums');
      if (totalElement) {
        const totalText = await totalElement.textContent();
        console.log(`💰 Total calculado: ${totalText}`);
      }
    }
    
    // 6. Testar detalhes internos
    console.log('\n6️⃣ Testando detalhes internos...');
    
    // Encontrar e clicar no botão de detalhes internos
    const detalhesButton = await page.$('button:has-text("Detalhes internos")');
    if (detalhesButton) {
      await detalhesButton.click();
      console.log('✅ Detalhes internos expandidos');
      
      await page.waitForTimeout(500);
      
      // Preencher link de referência
      const linkInput = await page.$('input[placeholder*="https://loja.com/item"]');
      if (linkInput) {
        await linkInput.fill('https://exemplo.com/produto-teste');
        console.log('✅ Link de referência preenchido');
      }
      
      // Preencher custo de referência
      if (valorInputs.length > 1) {
        const custoInput = valorInputs[1]; // Segundo deve ser o custo ref
        await custoInput.click({ clickCount: 3 });
        await custoInput.type('95,50');
        
        const custoDigitado = await custoInput.inputValue();
        console.log(`💰 Custo de referência digitado: "${custoDigitado}"`);
      }
    }
    
    // 7. Salvar orçamento
    console.log('\n7️⃣ Salvando orçamento...');
    
    const salvarButton = await page.$('button:has-text("Salvar Orçamento")');
    if (salvarButton) {
      const isDisabled = await salvarButton.evaluate(btn => btn.disabled);
      console.log(`🔍 Botão salvar habilitado: ${!isDisabled}`);
      
      if (!isDisabled) {
        await salvarButton.click();
        console.log('✅ Clique no botão salvar executado');
        
        // Aguardar resposta da API
        await page.waitForTimeout(3000);
        
        // Verificar se houve toast de sucesso ou erro
        const toastElements = await page.$$('[data-sonner-toast]');
        for (const toast of toastElements) {
          const toastText = await toast.textContent();
          console.log(`🔔 Toast: ${toastText}`);
        }
      } else {
        console.log('❌ Botão salvar está desabilitado');
      }
    }
    
    // 8. Verificar dados salvos via API
    console.log('\n8️⃣ Verificando dados salvos via API...');
    
    // Fazer uma requisição direta para verificar os dados
    const response = await fetch('http://localhost:3145/api/orcamentos?incluir_itens=true');
    if (response.ok) {
      const orcamentos = await response.json();
      const ultimoOrcamento = orcamentos[orcamentos.length - 1];
      
      if (ultimoOrcamento && ultimoOrcamento.itens && ultimoOrcamento.itens.length > 0) {
        const item = ultimoOrcamento.itens[0];
        console.log('📋 Último orçamento salvo:');
        console.log(`   ID: ${ultimoOrcamento.id}`);
        console.log(`   Cliente: ${ultimoOrcamento.cliente?.nome}`);
        console.log(`   Item descrição: ${item.descricao}`);
        console.log(`   Item quantidade: ${item.quantidade}`);
        console.log(`   Item valor_unitario: ${item.valor_unitario}`);
        console.log(`   Item link_ref: ${item.link_ref}`);
        console.log(`   Item custo_ref: ${item.custo_ref}`);
        console.log(`   Valor total: ${ultimoOrcamento.valor_total}`);
        
        // Verificar se os valores estão corretos
        const valorEsperado = 125.75;
        const custoEsperado = 95.50;
        
        if (Math.abs(item.valor_unitario - valorEsperado) < 0.01) {
          console.log('✅ Valor unitário salvo corretamente!');
        } else {
          console.log(`❌ Valor unitário incorreto! Esperado: ${valorEsperado}, Salvo: ${item.valor_unitario}`);
        }
        
        if (item.custo_ref && Math.abs(item.custo_ref - custoEsperado) < 0.01) {
          console.log('✅ Custo de referência salvo corretamente!');
        } else {
          console.log(`❌ Custo de referência incorreto! Esperado: ${custoEsperado}, Salvo: ${item.custo_ref}`);
        }
        
        if (item.link_ref === 'https://exemplo.com/produto-teste') {
          console.log('✅ Link de referência salvo corretamente!');
        } else {
          console.log(`❌ Link de referência incorreto! Esperado: https://exemplo.com/produto-teste, Salvo: ${item.link_ref}`);
        }
      } else {
        console.log('❌ Nenhum orçamento encontrado ou sem itens');
      }
    } else {
      console.log('❌ Erro ao buscar orçamentos via API');
    }
    
    console.log('\n📊 RESUMO DAS CHAMADAS DA API:');
    apiCalls.forEach((call, index) => {
      console.log(`${index + 1}. ${call.method} ${call.url}`);
      if (call.body) {
        console.log(`   Body: ${call.body.substring(0, 200)}...`);
      }
    });
    
    // Manter navegador aberto para inspeção
    console.log('\n🔍 Mantendo navegador aberto por 60 segundos para inspeção...');
    await page.waitForTimeout(60000);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
}

debugValorUnitarioCompleto().catch(console.error);