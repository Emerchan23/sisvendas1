const puppeteer = require('puppeteer');

async function debugPageStructure() {
  console.log('🔍 Debugando estrutura da página de orçamentos');
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
      console.log(`🔵 [CONSOLE ${type.toUpperCase()}]: ${text}`);
    });
    
    console.log('\n🌐 1. Navegando para a página inicial...');
    await page.goto('http://localhost:3145', { waitUntil: 'networkidle2' });
    
    console.log('\n🔐 2. Verificando se precisa fazer login...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verificar se estamos na página de login
    const isLoginPage = await page.$('#email');
    if (isLoginPage) {
      console.log('📝 Fazendo login...');
      await page.type('#email', 'admin@sistema.com');
      await page.type('#senha', 'admin123');
      
      const loginButton = await page.$('button[type="submit"]');
      if (loginButton) {
        await loginButton.click();
        console.log('⏳ Aguardando redirecionamento após login...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    console.log('\n🌐 3. Navegando para a página de orçamentos...');
    await page.goto('http://localhost:3145/orcamentos', { waitUntil: 'networkidle2' });
    
    console.log('\n⏳ 4. Aguardando carregamento básico...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n📋 5. Listando todos os botões na página...');
    const allButtons = await page.$$eval('button', buttons => 
      buttons.map((button, index) => ({
        index: index + 1,
        text: button.textContent?.trim(),
        className: button.className,
        role: button.getAttribute('role'),
        dataState: button.getAttribute('data-state'),
        type: button.type,
        disabled: button.disabled
      }))
    );
    
    console.log('📋 Botões encontrados:');
    allButtons.forEach(btn => {
      console.log(`  ${btn.index}. "${btn.text}" - class: "${btn.className}" - role: "${btn.role}" - data-state: "${btn.dataState}" - type: "${btn.type}" - disabled: ${btn.disabled}`);
    });
    
    console.log('\n📝 6. Listando todos os inputs na página...');
    const allInputs = await page.$$eval('input', inputs => 
      inputs.map((input, index) => ({
        index: index + 1,
        type: input.type,
        name: input.name,
        placeholder: input.placeholder,
        className: input.className,
        id: input.id,
        value: input.value
      }))
    );
    
    console.log('📝 Inputs encontrados:');
    allInputs.forEach(inp => {
      console.log(`  ${inp.index}. type: "${inp.type}" - name: "${inp.name}" - placeholder: "${inp.placeholder}" - class: "${inp.className}" - id: "${inp.id}" - value: "${inp.value}"`);
    });
    
    console.log('\n🏷️ 7. Listando elementos com data-state...');
    const elementsWithDataState = await page.$$eval('[data-state]', elements => 
      elements.map((el, index) => ({
        index: index + 1,
        tagName: el.tagName,
        text: el.textContent?.trim(),
        dataState: el.getAttribute('data-state'),
        className: el.className
      }))
    );
    
    console.log('🏷️ Elementos com data-state:');
    elementsWithDataState.forEach(el => {
      console.log(`  ${el.index}. <${el.tagName}> "${el.text}" - data-state: "${el.dataState}" - class: "${el.className}"`);
    });
    
    console.log('\n🎯 8. Listando elementos com role="tab"...');
    const tabElements = await page.$$eval('[role="tab"]', elements => 
      elements.map((el, index) => ({
        index: index + 1,
        tagName: el.tagName,
        text: el.textContent?.trim(),
        dataState: el.getAttribute('data-state'),
        className: el.className
      }))
    );
    
    console.log('🎯 Elementos com role="tab":');
    tabElements.forEach(el => {
      console.log(`  ${el.index}. <${el.tagName}> "${el.text}" - data-state: "${el.dataState}" - class: "${el.className}"`);
    });
    
    console.log('\n📊 9. Estrutura geral da página...');
    const pageStructure = await page.evaluate(() => {
      const main = document.querySelector('main');
      if (main) {
        return {
          mainExists: true,
          mainChildren: Array.from(main.children).map(child => ({
            tagName: child.tagName,
            className: child.className,
            text: child.textContent?.substring(0, 50) + '...'
          }))
        };
      }
      return { mainExists: false };
    });
    
    console.log('📊 Estrutura da página:', JSON.stringify(pageStructure, null, 2));
    
    console.log('\n🔍 10. Verificando URL atual...');
    const currentUrl = page.url();
    console.log('🌐 URL atual:', currentUrl);
    
    console.log('\n✅ Debug concluído! Mantendo navegador aberto por 30 segundos...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  } finally {
    await browser.close();
  }
}

// Executar o debug
debugPageStructure().catch(console.error);