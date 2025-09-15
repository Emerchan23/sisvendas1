const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Debugando página de configurações...');
    
    // Fazer login
    await page.goto('http://localhost:3145/login');
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'admin@admin.com');
    await page.type('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log('✅ Login realizado');
    
    // Navegar para configurações
    await page.goto('http://localhost:3145/configuracoes');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Aguardar carregamento
    console.log('✅ Página de configurações carregada');
    
    // Verificar se a página carregou corretamente
    const title = await page.title();
    console.log('📄 Título da página:', title);
    
    // Verificar se há erros no console
    const logs = [];
    page.on('console', msg => {
      logs.push(`${msg.type().toUpperCase()}: ${msg.text()}`);
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (logs.length > 0) {
      console.log('📋 Logs do console:', logs.slice(-10)); // Últimos 10 logs
    }
    
    // Verificar elementos presentes na página
    const pageContent = await page.evaluate(() => {
      return {
        hasTablist: !!document.querySelector('[role="tablist"]'),
        hasTabs: !!document.querySelector('[role="tab"]'),
        hasTabsComponent: !!document.querySelector('[data-radix-collection-item]'),
        hasConfigTitle: document.body.textContent.includes('Configurações'),
        bodyText: document.body.textContent.substring(0, 500)
      };
    });
    
    console.log('🔍 Análise da página:', pageContent);
    
    // Procurar por elementos de abas com diferentes seletores
    const tabElements = await page.evaluate(() => {
      const selectors = [
        '[role="tablist"]',
        '[role="tab"]',
        '.tabs',
        '[data-radix-collection-item]',
        'button[data-state]',
        '[data-value="geral"]',
        '[data-value="backup"]'
      ];
      
      const results = {};
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        results[selector] = {
          count: elements.length,
          elements: Array.from(elements).slice(0, 3).map(el => ({
            tag: el.tagName,
            text: el.textContent?.trim().substring(0, 50),
            attributes: Array.from(el.attributes).reduce((acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            }, {})
          }))
        };
      });
      
      return results;
    });
    
    console.log('🔍 Elementos de abas encontrados:', JSON.stringify(tabElements, null, 2));
    
    // Verificar se há componentes React carregados
    const reactInfo = await page.evaluate(() => {
      return {
        hasReact: !!window.React,
        hasNextJS: !!window.__NEXT_DATA__,
        nextData: window.__NEXT_DATA__ ? {
          page: window.__NEXT_DATA__.page,
          buildId: window.__NEXT_DATA__.buildId
        } : null
      };
    });
    
    console.log('⚛️ Informações React/Next.js:', reactInfo);
    
    console.log('\n🔍 Mantendo navegador aberto para inspeção manual...');
    console.log('Pressione Ctrl+C para fechar');
    
    // Manter aberto
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  }
})();