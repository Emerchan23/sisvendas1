const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Iniciando teste de validação de CPF/CNPJ inválido...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navegar para a página
    console.log('📍 Navegando para http://localhost:3145');
    await page.goto('http://localhost:3145', { waitUntil: 'networkidle0' });
    
    // Fazer login
    console.log('🔐 Fazendo login...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'admin@sistema.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Login realizado com sucesso');
    
    // Navegar para clientes
    console.log('👥 Navegando para página de clientes...');
    await page.waitForSelector('a[href="/clientes"]', { timeout: 10000 });
    await page.click('a[href="/clientes"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Preencher formulário com CPF inválido
    console.log('📝 Preenchendo formulário com CPF inválido: 123.456.789-00');
    
    // Nome
    await page.waitForSelector('input[name="nome"]', { timeout: 10000 });
    await page.type('input[name="nome"]', 'Cliente Teste Inválido');
    
    // CPF inválido
    await page.type('input[name="documento"]', '12345678900');
    
    // Aguardar um pouco para a validação processar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se o campo está inválido (borda vermelha)
    const documentInput = await page.$('input[name="documento"]');
    const inputClasses = await page.evaluate(el => el.className, documentInput);
    console.log('🔍 Classes do input documento:', inputClasses);
    
    const hasRedBorder = inputClasses.includes('border-red-500');
    console.log('🔴 Campo com borda vermelha?', hasRedBorder);
    
    // Verificar se há mensagem de erro
    const validationMessage = await page.$eval('input[name="documento"]', el => {
      const parent = el.closest('div');
      const message = parent.querySelector('div[class*="text-red"]');
      return message ? message.textContent : null;
    }).catch(() => null);
    
    console.log('💬 Mensagem de validação:', validationMessage);
    
    // Preencher outros campos
    await page.type('input[name="endereco"]', 'Rua Teste, 123');
    await page.type('input[name="telefone"]', '11999999999');
    await page.type('input[name="email"]', 'cliente.invalido@teste.com');
    
    // Tentar submeter o formulário
    console.log('📤 Tentando submeter formulário...');
    const submitButton = await page.$('button[type="submit"]');
    const isDisabled = await page.evaluate(btn => btn.disabled, submitButton);
    console.log('🔘 Botão desabilitado?', isDisabled);
    
    if (isDisabled) {
      console.log('✅ TESTE PASSOU: Botão está desabilitado com CPF inválido!');
    } else {
      // Tentar clicar no botão para ver se há validação
      await page.click('button[type="submit"]');
      console.log('⚠️ Botão não estava desabilitado, mas tentou submeter...');
      
      // Aguardar possível toast de erro
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar se o cliente foi adicionado na lista (não deveria)
      const clienteAdicionado = await page.$eval('table tbody', tbody => {
        return tbody.textContent.includes('Cliente Teste Inválido');
      }).catch(() => false);
      
      console.log('👤 Cliente adicionado na lista?', clienteAdicionado);
      
      if (!clienteAdicionado) {
        console.log('✅ TESTE PASSOU: CPF inválido foi rejeitado e cliente não foi cadastrado!');
      } else {
        console.log('❌ TESTE FALHOU: Cliente com CPF inválido foi cadastrado!');
      }
    }
    
    // Verificar se há toast de erro
    const toastError = await page.$('[role="alert"]').catch(() => null);
    if (toastError) {
      const toastText = await page.evaluate(el => el.textContent, toastError);
      console.log('🍞 Toast de erro:', toastText);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
  
  console.log('🔍 Mantendo navegador aberto para inspeção...');
  // await browser.close();
})();