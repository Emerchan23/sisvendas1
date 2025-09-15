const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Teste simples de validação CPF/CNPJ...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📱 Navegando para http://localhost:3145...');
    await page.goto('http://localhost:3145');
    
    console.log('🔐 Fazendo login...');
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.type('#email', 'admin@admin.com');
    await page.type('#senha', 'admin');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation();
    console.log('✅ Login realizado');
    
    console.log('👥 Indo para clientes...');
    await page.goto('http://localhost:3145/clientes');
    await page.waitForSelector('input[name="nome"]', { timeout: 10000 });
    
    console.log('📝 Preenchendo formulário com CPF inválido...');
    await page.type('input[name="nome"]', 'Teste CPF Inválido');
    
    const cpfInput = await page.$('input[name="documento"]');
    await cpfInput.click();
    await cpfInput.type('111.111.111-11'); // CPF inválido
    
    console.log('⏳ Aguardando 2 segundos...');
    await page.waitForTimeout(2000);
    
    console.log('🔄 Tentando submeter...');
    await page.click('button[type="submit"]');
    
    console.log('⏳ Aguardando toast...');
    await page.waitForTimeout(3000);
    
    // Verificar se apareceu toast
    const toast = await page.$('[data-sonner-toast]');
    if (toast) {
      const text = await page.evaluate(el => el.textContent, toast);
      console.log('✅ Toast encontrado:', text);
      
      if (text.includes('CPF/CNPJ inválido') || text.includes('inválido')) {
        console.log('🎉 SUCESSO: Validação funcionando!');
      } else {
        console.log('❌ FALHA: Toast não contém mensagem esperada');
      }
    } else {
      console.log('❌ FALHA: Nenhum toast encontrado');
    }
    
    console.log('\n🔍 Mantendo aberto por 15 segundos para inspeção...');
    await page.waitForTimeout(15000);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await browser.close();
    console.log('✅ Teste finalizado');
  }
})();