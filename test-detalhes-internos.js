const { chromium } = require('playwright');

async function testDetalhesInternos() {
  console.log('🧪 Testando detalhes internos do orçamento...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navegar para a página de orçamentos
    await page.goto('http://localhost:3000/orcamentos');
    await page.waitForLoadState('networkidle');
    
    console.log('📋 Navegando para criar novo orçamento...');
    
    // Aguardar a página carregar e clicar em "Criar Orçamento"
    await page.waitForSelector('button:has-text("Criar Orçamento")', { timeout: 10000 });
    await page.click('button:has-text("Criar Orçamento")');
    await page.waitForTimeout(1000);
    
    console.log('✅ Formulário de orçamento aberto');
    
    // Preencher dados básicos do cliente
    console.log('📝 Preenchendo dados do cliente...');
    await page.fill('input[placeholder*="Nome do cliente"]', 'Cliente Teste Detalhes');
    await page.fill('input[placeholder*="CPF/CNPJ"]', '12345678901');
    await page.fill('input[placeholder*="Telefone"]', '(11) 99999-9999');
    
    // Preencher primeiro item
    console.log('📦 Preenchendo primeiro item...');
    await page.fill('input[placeholder*="Ex.: Velas aromáticas"]', 'Produto com Detalhes Internos');
    await page.fill('input[placeholder*="Ex.: Marca X"]', 'Marca Teste');
    await page.fill('input[type="number"][step="1"]', '2');
    
    // Preencher valor unitário
    const valorUnitarioInputs = await page.$$('input[placeholder="0,00"]');
    if (valorUnitarioInputs.length > 0) {
      await valorUnitarioInputs[0].fill('150,75');
      console.log('💰 Valor unitário preenchido: R$ 150,75');
    }
    
    // Expandir detalhes internos
    console.log('🔍 Expandindo detalhes internos...');
    const detalhesButton = await page.$('button:has-text("Detalhes internos")');
    if (detalhesButton) {
      await detalhesButton.click();
      await page.waitForTimeout(500);
      console.log('✅ Detalhes internos expandidos');
      
      // Preencher link de referência
      const linkInput = await page.$('input[placeholder="https://loja.com/item"]');
      if (linkInput) {
        await linkInput.fill('https://exemplo.com/produto-teste');
        console.log('🔗 Link de referência preenchido');
      } else {
        console.log('❌ Campo de link não encontrado');
      }
      
      // Preencher custo de referência
      const custoInputs = await page.$$('input[placeholder="0,00"]');
      if (custoInputs.length > 1) {
        await custoInputs[1].fill('100,50');
        console.log('💵 Custo de referência preenchido: R$ 100,50');
      } else {
        console.log('❌ Campo de custo não encontrado');
      }
    } else {
      console.log('❌ Botão de detalhes internos não encontrado');
    }
    
    // Aguardar um pouco para garantir que os campos foram preenchidos
    await page.waitForTimeout(1000);
    
    // Salvar orçamento
    console.log('💾 Salvando orçamento...');
    const salvarButton = await page.$('button:has-text("Salvar Orçamento")');
    if (salvarButton) {
      await salvarButton.click();
      
      // Aguardar confirmação de salvamento
      await page.waitForTimeout(3000);
      
      // Verificar se apareceu mensagem de sucesso
      const successMessage = await page.$('.toast, [data-sonner-toast]');
      if (successMessage) {
        const messageText = await page.evaluate(el => el.textContent, successMessage);
        console.log(`✅ Mensagem de sucesso: ${messageText}`);
      }
      
      console.log('✅ Orçamento salvo com sucesso!');
    } else {
      console.log('❌ Botão salvar não encontrado');
    }
    
    // Aguardar um pouco e verificar se voltou para a listagem
    await page.waitForTimeout(2000);
    
    // Verificar se o orçamento aparece na listagem
    console.log('🔍 Verificando se o orçamento aparece na listagem...');
    const orcamentoNaLista = await page.$('text="Cliente Teste Detalhes"');
    if (orcamentoNaLista) {
      console.log('✅ Orçamento encontrado na listagem!');
      
      // Clicar no orçamento para abrir e verificar os detalhes
      await orcamentoNaLista.click();
      await page.waitForTimeout(2000);
      
      // Expandir detalhes internos novamente para verificar se foram salvos
      const detalhesButtonVerify = await page.$('button:has-text("Detalhes internos")');
      if (detalhesButtonVerify) {
        await detalhesButtonVerify.click();
        await page.waitForTimeout(500);
        
        // Verificar se o link foi salvo
        const linkInputVerify = await page.$('input[placeholder="https://loja.com/item"]');
        if (linkInputVerify) {
          const linkValue = await page.evaluate(el => el.value, linkInputVerify);
          console.log(`🔗 Link salvo: ${linkValue}`);
          if (linkValue === 'https://exemplo.com/produto-teste') {
            console.log('✅ LINK DE REFERÊNCIA SALVO CORRETAMENTE!');
          } else {
            console.log('❌ LINK DE REFERÊNCIA NÃO FOI SALVO CORRETAMENTE!');
          }
        }
        
        // Verificar se o custo foi salvo
        const custoInputsVerify = await page.$$('input[placeholder="0,00"]');
        if (custoInputsVerify.length > 1) {
          const custoValue = await page.evaluate(el => el.value, custoInputsVerify[1]);
          console.log(`💵 Custo salvo: ${custoValue}`);
          if (custoValue === '100,50' || custoValue === '100.50') {
            console.log('✅ CUSTO DE REFERÊNCIA SALVO CORRETAMENTE!');
          } else {
            console.log('❌ CUSTO DE REFERÊNCIA NÃO FOI SALVO CORRETAMENTE!');
          }
        }
      }
    } else {
      console.log('❌ Orçamento não encontrado na listagem');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
}

testDetalhesInternos();