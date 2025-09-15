const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Iniciando teste de validação de CPF/CNPJ válido...');
  
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
    
    const cpfValido = '111.444.777-35'; // CPF válido para teste
    
    // Preencher formulário com CPF válido
    console.log(`📝 Preenchendo formulário com CPF válido: ${cpfValido}`);
    
    // Nome
    await page.waitForSelector('input[name="nome"]', { timeout: 10000 });
    await page.type('input[name="nome"]', 'Cliente Teste Válido');
    
    // CPF válido
    await page.type('input[name="documento"]', cpfValido.replace(/[.-]/g, ''));
    
    // Força o blur para executar a validação
    await page.click('input[name="nome"]');
    
    // Aguardar um pouco para a validação processar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se o campo está válido (borda verde)
    const documentInput = await page.$('input[name="documento"]');
    const inputClasses = await page.evaluate(el => el.className, documentInput);
    console.log('🔍 Classes do input documento:', inputClasses);
    
    // Verificar se há mensagem de validação
    const validationMessage = await page.$eval('input[name="documento"]', el => {
      const parent = el.closest('div');
      const message = parent.querySelector('div[class*="text-"]');
      return message ? message.textContent : null;
    }).catch(() => null);
    
    console.log('💬 Mensagem de validação:', validationMessage);
    
    // Preencher outros campos
    await page.type('input[name="endereco"]', 'Rua Teste, 123');
    await page.type('input[name="telefone"]', '11999999999');
    await page.type('input[name="email"]', 'cliente.valido@teste.com');
    
    // Tentar submeter o formulário
    console.log('📤 Tentando submeter formulário...');
    const submitButton = await page.$('button[type="submit"]');
    const isDisabled = await page.evaluate(btn => btn.disabled, submitButton);
    console.log('🔘 Botão desabilitado?', isDisabled);
    
    if (!isDisabled) {
      await page.click('button[type="submit"]');
      console.log('✅ Formulário submetido com sucesso!');
      
      // Aguardar possível toast ou feedback
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar se o cliente foi adicionado na lista
      const clienteAdicionado = await page.$eval('table tbody', tbody => {
        return tbody.textContent.includes('Cliente Teste Válido');
      }).catch(() => false);
      
      console.log('👤 Cliente adicionado na lista?', clienteAdicionado);
      
      if (clienteAdicionado) {
        console.log('🎉 TESTE PASSOU: CPF válido foi aceito e cliente foi cadastrado!');
      } else {
        console.log('❌ TESTE FALHOU: Cliente não foi adicionado na lista');
      }
    } else {
      console.log('❌ TESTE FALHOU: Botão está desabilitado mesmo com CPF válido');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
  
  console.log('🔍 Mantendo navegador aberto para inspeção...');
  // await browser.close();
})();