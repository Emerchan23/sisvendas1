const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Iniciando teste das abas...');
    
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
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
    console.log('✅ Página de configurações carregada');
    
    // Verificar se as abas estão presentes
    const tabs = await page.$$eval('[role="tab"]', tabs => 
      tabs.map(tab => ({ 
        value: tab.getAttribute('data-value') || tab.getAttribute('value'),
        text: tab.textContent.trim(),
        ariaSelected: tab.getAttribute('aria-selected')
      }))
    );
    console.log('📋 Abas encontradas:', tabs);
    
    // Verificar aba ativa inicial
    const activeTab = tabs.find(tab => tab.ariaSelected === 'true');
    console.log('🎯 Aba ativa inicial:', activeTab);
    
    // Verificar conteúdo inicial
    const initialContent = await page.$eval('[role="tabpanel"]', panel => {
      return {
        visible: panel.style.display !== 'none',
        innerHTML: panel.innerHTML.substring(0, 200) + '...'
      };
    });
    console.log('📄 Conteúdo inicial:', initialContent);
    
    // Tentar clicar na aba Backup
    console.log('🔄 Tentando clicar na aba Backup...');
    const backupTab = await page.$('[role="tab"][data-value="backup"], [role="tab"][value="backup"]');
    
    if (backupTab) {
      console.log('✅ Aba Backup encontrada');
      
      // Aguardar um pouco e clicar
      await page.waitForTimeout(1000);
      await backupTab.click();
      console.log('✅ Clique na aba Backup executado');
      
      // Aguardar mudança
      await page.waitForTimeout(2000);
      
      // Verificar se a aba mudou
      const newActiveTab = await page.$eval('[role="tab"][aria-selected="true"]', tab => ({
        value: tab.getAttribute('data-value') || tab.getAttribute('value'),
        text: tab.textContent.trim()
      }));
      console.log('🎯 Nova aba ativa:', newActiveTab);
      
      // Verificar conteúdo após clique
      const backupContent = await page.$eval('[role="tabpanel"]', panel => {
        return {
          visible: panel.style.display !== 'none',
          innerHTML: panel.innerHTML.substring(0, 500) + '...'
        };
      });
      console.log('📄 Conteúdo da aba Backup:', backupContent);
      
      // Verificar se existem múltiplos painéis
      const allPanels = await page.$$eval('[role="tabpanel"]', panels => 
        panels.map((panel, index) => ({
          index,
          visible: panel.style.display !== 'none',
          hasContent: panel.innerHTML.length > 100,
          preview: panel.innerHTML.substring(0, 100) + '...'
        }))
      );
      console.log('📋 Todos os painéis:', allPanels);
      
      // Procurar especificamente pelo conteúdo de backup
      const backupElements = await page.evaluate(() => {
        const elements = [];
        
        // Procurar por elementos com "backup" no texto
        const allElements = document.querySelectorAll('*');
        for (let el of allElements) {
          if (el.textContent && el.textContent.toLowerCase().includes('backup') && el.textContent.length < 200) {
            elements.push({
              tag: el.tagName,
              text: el.textContent.trim(),
              visible: el.offsetParent !== null
            });
          }
        }
        
        return elements.slice(0, 10); // Limitar resultados
      });
      console.log('🔍 Elementos com "backup":', backupElements);
      
    } else {
      console.log('❌ Aba Backup não encontrada');
    }
    
    // Verificar erros no console
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(`ERROR: ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(2000);
    if (logs.length > 0) {
      console.log('🚨 Erros no console:', logs);
    } else {
      console.log('✅ Nenhum erro no console');
    }
    
    console.log('\n🔍 Mantendo navegador aberto para inspeção manual...');
    console.log('Pressione Ctrl+C para fechar');
    
    // Manter aberto
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
})();