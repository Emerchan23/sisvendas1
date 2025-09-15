const puppeteer = require('puppeteer');

async function testFrontendValorUnitario() {
  console.log('🧪 Testando Frontend - Valor Unitário e Detalhes Internos');
  console.log('=' .repeat(60));
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Interceptar logs do console
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log(`🔴 [CONSOLE ERROR]: ${text}`);
      } else if (type === 'warn') {
        console.log(`🟡 [CONSOLE WARN]: ${text}`);
      } else if (text.includes('FORM') || text.includes('valor') || text.includes('detalhes') || text.includes('SAVE') || text.includes('API')) {
        console.log(`🔵 [CONSOLE LOG]: ${text}`);
      }
    });
    
    // Interceptar requisições de rede
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/orcamentos')) {
        console.log(`🌐 [NETWORK]: ${response.status()} ${response.request().method()} ${url}`);
      }
    });
    
    console.log('\n🌐 1. Navegando para a página de orçamentos...');
    await page.goto('http://localhost:3145/orcamentos', { waitUntil: 'networkidle2' });
    
    console.log('\n⏳ 2. Aguardando carregamento da página...');
    await page.waitForSelector('button[data-state="active"], button[data-state="inactive"]', { timeout: 10000 });
    
    // Verificar se já estamos na aba "Criar Orçamento"
    const tabAtiva = await page.$('button[data-state="active"]');
    const tabTexto = await page.evaluate(el => el.textContent, tabAtiva);
    console.log(`📋 Aba ativa: ${tabTexto}`);
    
    if (!tabTexto.includes('Criar')) {
      console.log('🔄 Clicando na aba "Criar Orçamento"...');
      const allTabs = await page.$$('button[role="tab"]');
      for (const tab of allTabs) {
        const text = await page.evaluate(el => el.textContent, tab);
        if (text && text.includes('Criar')) {
          await tab.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
    }
    
    console.log('\n📝 3. Preenchendo dados básicos do orçamento...');
    
    // Aguardar o formulário carregar
    await page.waitForSelector('form, [data-testid="orcamento-form"]', { timeout: 10000 });
    
    // Preencher cliente
    console.log('👤 Preenchendo cliente...');
    const clienteInput = await page.waitForSelector('input[placeholder*="cliente"], input[name*="cliente"], #cliente', { timeout: 5000 });
    await clienteInput.type('Cliente Teste Frontend');
    console.log('✅ Cliente preenchido');
    
    console.log('\n➕ 4. Adicionando item ao orçamento...');
    
    // Procurar e clicar no botão "Adicionar Item"
    const addButtons = await page.$$('button');
    let addItemClicked = false;
    
    for (const button of addButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && (text.includes('Adicionar Item') || text.includes('+ Adicionar'))) {
        console.log(`🔍 Clicando em: "${text}"`);
        await button.click();
        addItemClicked = true;
        break;
      }
    }
    
    if (!addItemClicked) {
      console.log('⚠️ Botão "Adicionar Item" não encontrado, listando botões disponíveis...');
      const allButtons = await page.$$eval('button', buttons => 
        buttons.map(button => button.textContent?.trim()).filter(text => text)
      );
      console.log('📋 Botões disponíveis:', allButtons);
    }
    
    await page.waitForTimeout(1000);
    
    console.log('\n📦 5. Preenchendo dados do item...');
    
    // Preencher descrição do item (procurar na tabela)
    console.log('📝 Preenchendo descrição...');
    const descricaoInputs = await page.$$('input[placeholder*="descrição"], input[name*="descricao"], textarea[placeholder*="descrição"], td input');
    if (descricaoInputs.length > 0) {
      await descricaoInputs[0].type('Produto Teste - Valor Unitário Frontend');
      console.log('✅ Descrição preenchida');
    } else {
      console.log('❌ Campo descrição não encontrado');
    }
    
    // Preencher marca
    console.log('🏷️ Preenchendo marca...');
    const marcaInputs = await page.$$('input[placeholder*="marca"], input[name*="marca"]');
    if (marcaInputs.length > 0) {
      await marcaInputs[0].type('Marca Teste');
      console.log('✅ Marca preenchida');
    } else {
      console.log('⚠️ Campo marca não encontrado');
    }
    
    // Preencher quantidade
    console.log('🔢 Preenchendo quantidade...');
    const quantidadeInputs = await page.$$('input[placeholder*="quantidade"], input[name*="quantidade"], input[type="number"]');
    if (quantidadeInputs.length > 0) {
      await quantidadeInputs[0].click({ clickCount: 3 });
      await quantidadeInputs[0].type('5');
      console.log('✅ Quantidade preenchida');
    } else {
      console.log('⚠️ Campo quantidade não encontrado');
    }
    
    console.log('\n💰 6. TESTANDO VALOR UNITÁRIO - CRÍTICO!');
    
    // Procurar especificamente por campos de valor na tabela
    const allInputs = await page.$$('input');
    let valorInput = null;
    
    console.log(`🔍 Encontrados ${allInputs.length} inputs na página`);
    
    // Verificar cada input para encontrar o de valor
    for (let i = 0; i < allInputs.length; i++) {
      const input = allInputs[i];
      const placeholder = await page.evaluate(el => el.placeholder, input);
      const name = await page.evaluate(el => el.name, input);
      const className = await page.evaluate(el => el.className, input);
      const type = await page.evaluate(el => el.type, input);
      
      console.log(`📋 Input ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}", class="${className}"`);
      
      if (placeholder && (placeholder.includes('valor') || placeholder.includes('Valor') || placeholder.includes('R$')) ||
          name && (name.includes('valor') || name.includes('Valor')) ||
          className && className.includes('currency')) {
        valorInput = input;
        console.log(`✅ Campo valor encontrado no input ${i + 1}`);
        break;
      }
    }
    
    if (valorInput) {
      console.log('💰 Preenchendo valor unitário...');
      
      // Focar no campo e limpar
      await valorInput.focus();
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Delete');
      
      // Digitar o valor
      await valorInput.type('123.45');
      
      // Verificar se o valor foi aceito
      await page.waitForTimeout(500);
      const valorAtual = await page.evaluate(el => el.value, valorInput);
      console.log(`🔍 Valor digitado: "123.45"`);
      console.log(`🔍 Valor atual no campo: "${valorAtual}"`);
      
      if (valorAtual.includes('123') || valorAtual.includes('45')) {
        console.log('✅ Valor unitário aceito pelo campo!');
      } else {
        console.log('❌ Valor unitário NÃO foi aceito pelo campo!');
      }
    } else {
      console.log('❌ Campo de valor unitário NÃO ENCONTRADO!');
    }
    
    console.log('\n🔗 7. TESTANDO DETALHES INTERNOS...');
    
    // Procurar botão de detalhes internos
    const detalhesButtons = await page.$$('button');
    let detalhesClicked = false;
    
    for (const button of detalhesButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && text.includes('Detalhes internos')) {
        console.log(`🔍 Clicando em: "${text}"`);
        await button.click();
        detalhesClicked = true;
        await page.waitForTimeout(500);
        break;
      }
    }
    
    if (detalhesClicked) {
      console.log('✅ Seção "Detalhes internos" expandida');
      
      // Procurar campos de link e custo
      const allInputsAfter = await page.$$('input');
      
      for (let i = 0; i < allInputsAfter.length; i++) {
        const input = allInputsAfter[i];
        const placeholder = await page.evaluate(el => el.placeholder, input);
        const name = await page.evaluate(el => el.name, input);
        
        if (placeholder && (placeholder.includes('link') || placeholder.includes('Link') || placeholder.includes('referência'))) {
          console.log('🔗 Preenchendo link de referência...');
          await input.type('https://exemplo.com/produto-teste-frontend');
          console.log('✅ Link de referência preenchido');
        }
        
        if (placeholder && (placeholder.includes('custo') || placeholder.includes('Custo'))) {
          console.log('💵 Preenchendo custo de referência...');
          await input.click({ clickCount: 3 });
          await input.type('100.00');
          console.log('✅ Custo de referência preenchido');
        }
      }
    } else {
      console.log('⚠️ Botão "Detalhes internos" não encontrado');
    }
    
    console.log('\n💾 8. SALVANDO ORÇAMENTO...');
    
    // Procurar botão de salvar
    const saveButtons = await page.$$('button');
    let saveClicked = false;
    
    for (const button of saveButtons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text && (text.includes('Salvar') || text.includes('Criar') || text.includes('Confirmar'))) {
        console.log(`💾 Clicando em: "${text}"`);
        await button.click();
        saveClicked = true;
        break;
      }
    }
    
    if (saveClicked) {
      console.log('🔄 Salvamento iniciado...');
      
      // Aguardar resposta da API
      await page.waitForTimeout(5000);
      
      console.log('✅ Salvamento executado');
    } else {
      console.log('❌ Botão de salvar NÃO ENCONTRADO!');
    }
    
    console.log('\n🔍 9. Verificando resultado...');
    
    const currentUrl = page.url();
    console.log(`📍 URL atual: ${currentUrl}`);
    
    // Verificar se há mensagens de sucesso ou erro
    const messages = await page.$$eval('[role="alert"], .toast, .notification, .message', 
      elements => elements.map(el => el.textContent?.trim()).filter(text => text)
    ).catch(() => []);
    
    if (messages.length > 0) {
      console.log('📢 Mensagens encontradas:', messages);
    } else {
      console.log('📢 Nenhuma mensagem de feedback encontrada');
    }
    
    console.log('\n🎯 RESUMO DO TESTE FRONTEND:');
    console.log('=' .repeat(50));
    console.log('✅ Teste de frontend concluído');
    console.log('📊 Verifique os logs acima para identificar problemas');
    console.log('🔍 Verifique também os logs do console do navegador');
    
    // Manter o navegador aberto por um tempo para inspeção manual
    console.log('\n⏳ Mantendo navegador aberto por 30 segundos para inspeção...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
}

// Executar o teste
testFrontendValorUnitario().catch(console.error);