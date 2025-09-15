const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Iniciando teste de validação CPF/CNPJ...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('📱 Navegando para http://localhost:3145...');
    await page.goto('http://localhost:3145', { waitUntil: 'networkidle2' });
    
    console.log('🔐 Fazendo login...');
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', 'admin@admin.com');
    await page.type('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Login realizado com sucesso');
    
    console.log('👥 Navegando para página de clientes...');
    await page.goto('http://localhost:3145/clientes', { waitUntil: 'networkidle2' });
    
    // Teste 1: CPF inválido
    console.log('\n📝 Teste 1: Tentando cadastrar com CPF inválido...');
    await page.waitForSelector('input[name="nome"]');
    await page.type('input[name="nome"]', 'Teste Cliente Inválido');
    
    const cpfInput = await page.$('input[name="documento"]');
    await cpfInput.click();
    await cpfInput.type('111.111.111-11'); // CPF inválido
    
    // Aguardar validação
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Tentar submeter
    await page.click('button[type="submit"]');
    
    // Aguardar possível toast
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se apareceu toast de erro
    const toastError = await page.$('.toast, [data-sonner-toast], .Toastify__toast--error');
    if (toastError) {
      const toastText = await page.evaluate(el => el.textContent, toastError);
      console.log('✅ TESTE 1 PASSOU: Toast de erro encontrado:', toastText);
    } else {
      console.log('❌ TESTE 1 FALHOU: Nenhum toast de erro foi exibido');
    }
    
    // Limpar campos
    await page.evaluate(() => {
      document.querySelector('input[name="nome"]').value = '';
      document.querySelector('input[name="documento"]').value = '';
    });
    
    // Teste 2: CPF válido
    console.log('\n📝 Teste 2: Testando com CPF válido...');
    await page.type('input[name="nome"]', 'Teste Cliente Válido');
    
    const cpfInputValid = await page.$('input[name="documento"]');
    await cpfInputValid.click();
    await cpfInputValid.type('111.444.777-35'); // CPF válido
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verificar se não há indicador de erro
    const errorIndicator = await page.$('.text-red-500, .border-red-500');
    if (!errorIndicator) {
      console.log('✅ TESTE 2 PASSOU: CPF válido aceito sem erros');
    } else {
      console.log('❌ TESTE 2 FALHOU: CPF válido sendo rejeitado');
    }
    
    console.log('\n🔍 Mantendo navegador aberto para inspeção...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // 10 segundos
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Teste concluído!');
  }
})();