const { chromium } = require('playwright');

async function testValorUnitarioEDetalhes() {
  console.log('🧪 Iniciando teste de valor unitário e detalhes internos...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navegar diretamente para o formulário de novo orçamento
    await page.goto('http://localhost:3145/orcamentos/novo');
    await page.waitForTimeout(3000);
    
    console.log('📄 Página de novo orçamento carregada');
    
    // Aguardar o formulário carregar completamente
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Preencher cliente primeiro
    console.log('👤 Selecionando cliente...');
    const clienteSelect = page.locator('select, [data-testid="cliente-select"], button:has-text("Selecione")');
    if (await clienteSelect.count() > 0) {
      await clienteSelect.first().click();
      await page.waitForTimeout(1000);
      
      // Tentar selecionar o primeiro cliente disponível
      const primeiroCliente = page.locator('option:not([value=""]), [role="option"]').first();
      if (await primeiroCliente.count() > 0) {
        await primeiroCliente.click();
        await page.waitForTimeout(1000);
        console.log('👤 Cliente selecionado');
      }
    }
    
    // Adicionar item se necessário
    const addItemButton = page.locator('button:has-text("Adicionar Item"), button:has-text("+ Adicionar")');
    if (await addItemButton.count() > 0) {
      await addItemButton.first().click();
      await page.waitForTimeout(1000);
      console.log('📦 Item adicionado');
    }
    
    // Aguardar os campos do item aparecerem
    await page.waitForTimeout(2000);
    
    // Preencher descrição do item
    const descricaoInputs = page.locator('input[placeholder*="Descrição"], input[name*="descricao"], textarea[placeholder*="Descrição"]');
    if (await descricaoInputs.count() > 0) {
      await descricaoInputs.first().fill('Produto Teste - Valor Unitário');
      await page.waitForTimeout(500);
      console.log('📝 Descrição preenchida');
    }
    
    // Preencher marca
    const marcaInputs = page.locator('input[placeholder*="Marca"], input[name*="marca"]');
    if (await marcaInputs.count() > 0) {
      await marcaInputs.first().fill('Marca Teste');
      await page.waitForTimeout(500);
      console.log('🏷️ Marca preenchida');
    }
    
    // Preencher quantidade
    const quantidadeInputs = page.locator('input[placeholder*="Qtd"], input[name*="quantidade"], input[type="number"]');
    if (await quantidadeInputs.count() > 0) {
      await quantidadeInputs.first().fill('5');
      await page.waitForTimeout(500);
      console.log('🔢 Quantidade preenchida');
    }
    
    // TESTE CRÍTICO: Preencher valor unitário
    console.log('💰 Procurando campo valor unitário...');
    
    // Tentar diferentes seletores para o campo valor unitário
    const valorUnitarioSelectors = [
      'input[placeholder*="Valor Unit"]',
      'input[placeholder*="0,00"]',
      'input[name*="valorUnitario"]',
      'input[name*="valor_unitario"]',
      'input[type="number"]:not([name*="quantidade"])'
    ];
    
    let valorUnitarioInput = null;
    for (const selector of valorUnitarioSelectors) {
      const input = page.locator(selector);
      if (await input.count() > 0) {
        valorUnitarioInput = input.first();
        console.log(`💰 Campo valor unitário encontrado com seletor: ${selector}`);
        break;
      }
    }
    
    if (valorUnitarioInput) {
      await valorUnitarioInput.click();
      await valorUnitarioInput.fill('');
      await valorUnitarioInput.fill('25.50');
      await page.waitForTimeout(1000);
      
      // Verificar se o valor foi preenchido
      const valorPreenchido = await valorUnitarioInput.inputValue();
      console.log('💰 Valor unitário preenchido:', valorPreenchido);
      
      // Simular blur para garantir que o valor seja processado
      await valorUnitarioInput.blur();
      await page.waitForTimeout(500);
    } else {
      console.log('❌ Campo valor unitário NÃO encontrado!');
      
      // Listar todos os inputs disponíveis para debug
      const allInputs = await page.locator('input').all();
      console.log('🔍 Inputs disponíveis:');
      for (let i = 0; i < allInputs.length; i++) {
        const placeholder = await allInputs[i].getAttribute('placeholder') || '';
        const name = await allInputs[i].getAttribute('name') || '';
        const type = await allInputs[i].getAttribute('type') || '';
        console.log(`  ${i + 1}. placeholder: "${placeholder}", name: "${name}", type: "${type}"`);
      }
    }
    
    // TESTE CRÍTICO: Procurar detalhes internos
    console.log('🔍 Procurando detalhes internos...');
    
    const detalhesSelectors = [
      'text=Detalhes internos',
      'button:has-text("Detalhes internos")',
      '[data-testid="detalhes-internos"]',
      'button:has-text("Detalhes")',
      '.detalhes-internos'
    ];
    
    let detalhesButton = null;
    for (const selector of detalhesSelectors) {
      const button = page.locator(selector);
      if (await button.count() > 0) {
        detalhesButton = button.first();
        console.log(`🔍 Botão detalhes internos encontrado com seletor: ${selector}`);
        break;
      }
    }
    
    if (detalhesButton) {
      await detalhesButton.click();
      await page.waitForTimeout(1000);
      
      // Procurar campo de texto para detalhes
      const detalhesTextareaSelectors = [
        'textarea[placeholder*="detalhes"]',
        'textarea[placeholder*="observações"]',
        'textarea[name*="detalhes"]',
        'textarea',
        'input[type="text"]:not([name*="descricao"]):not([name*="marca"])'
      ];
      
      let detalhesTextarea = null;
      for (const selector of detalhesTextareaSelectors) {
        const textarea = page.locator(selector);
        if (await textarea.count() > 0) {
          detalhesTextarea = textarea.first();
          console.log(`📝 Campo detalhes encontrado com seletor: ${selector}`);
          break;
        }
      }
      
      if (detalhesTextarea) {
        await detalhesTextarea.fill('Detalhes internos de teste - informações importantes');
        await page.waitForTimeout(500);
        
        const detalhesPreenchidos = await detalhesTextarea.inputValue();
        console.log('📝 Detalhes internos preenchidos:', detalhesPreenchidos);
        
        // Fechar modal se necessário
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      } else {
        console.log('❌ Campo de detalhes internos NÃO encontrado!');
      }
    } else {
      console.log('❌ Botão detalhes internos NÃO encontrado!');
      
      // Listar todos os botões disponíveis para debug
      const allButtons = await page.locator('button').all();
      console.log('🔍 Botões disponíveis:');
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent() || '';
        console.log(`  ${i + 1}. "${text.trim()}"`);
      }
    }
    
    console.log('\n📊 TESTE CONCLUÍDO');
    console.log('Aguardando 5 segundos para inspeção manual...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
}

// Executar o teste
testValorUnitarioEDetalhes().catch(console.error);