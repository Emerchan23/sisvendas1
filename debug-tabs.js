const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Iniciando debug das abas...');
    
    // 1. Navegar para login
    console.log('📱 1. Navegando para a página de login...');
    await page.goto('http://localhost:3145/login', { waitUntil: 'networkidle2', timeout: 60000 });
    
    // 2. Fazer login
    console.log('🔐 2. Fazendo login...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'admin@sistema.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    
    // 3. Navegar para configurações
    console.log('⚙️ 3. Navegando para configurações...');
    await page.goto('http://localhost:3145/configuracoes', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 4. Debug completo das abas
    console.log('🔍 4. Analisando estrutura das abas...');
    
    const tabsInfo = await page.evaluate(() => {
      // Procurar por elementos de abas
      const tabsRoot = document.querySelector('[data-slot="tabs"]');
      const tabsList = document.querySelector('[role="tablist"]');
      const allTabs = document.querySelectorAll('[role="tab"]');
      const allButtons = document.querySelectorAll('button');
      
      const info = {
        tabsRoot: tabsRoot ? {
          tagName: tabsRoot.tagName,
          className: tabsRoot.className,
          children: Array.from(tabsRoot.children).map(child => ({
            tagName: child.tagName,
            className: child.className,
            textContent: child.textContent?.substring(0, 50)
          }))
        } : null,
        
        tabsList: tabsList ? {
          tagName: tabsList.tagName,
          className: tabsList.className,
          children: Array.from(tabsList.children).map(child => ({
            tagName: child.tagName,
            className: child.className,
            textContent: child.textContent?.trim(),
            attributes: {
              role: child.getAttribute('role'),
              value: child.getAttribute('value'),
              'data-state': child.getAttribute('data-state'),
              'aria-selected': child.getAttribute('aria-selected')
            }
          }))
        } : null,
        
        allTabs: Array.from(allTabs).map(tab => ({
          tagName: tab.tagName,
          className: tab.className,
          textContent: tab.textContent?.trim(),
          attributes: {
            role: tab.getAttribute('role'),
            value: tab.getAttribute('value'),
            'data-state': tab.getAttribute('data-state'),
            'aria-selected': tab.getAttribute('aria-selected')
          }
        })),
        
        buttonsWithBackup: Array.from(allButtons)
          .filter(btn => btn.textContent?.toLowerCase().includes('backup'))
          .map(btn => ({
            tagName: btn.tagName,
            className: btn.className,
            textContent: btn.textContent?.trim(),
            attributes: {
              role: btn.getAttribute('role'),
              value: btn.getAttribute('value'),
              'data-state': btn.getAttribute('data-state'),
              type: btn.getAttribute('type')
            }
          }))
      };
      
      return info;
    });
    
    console.log('📊 Informações das abas:');
    console.log('\n=== TABS ROOT ===');
    console.log(JSON.stringify(tabsInfo.tabsRoot, null, 2));
    
    console.log('\n=== TABS LIST ===');
    console.log(JSON.stringify(tabsInfo.tabsList, null, 2));
    
    console.log('\n=== ALL TABS ===');
    console.log(JSON.stringify(tabsInfo.allTabs, null, 2));
    
    console.log('\n=== BUTTONS WITH BACKUP ===');
    console.log(JSON.stringify(tabsInfo.buttonsWithBackup, null, 2));
    
    // 5. Tentar clicar na aba Backup usando diferentes métodos
    console.log('\n🎯 5. Tentando ativar a aba Backup...');
    
    const backupTab = tabsInfo.allTabs.find(tab => 
      tab.textContent?.toLowerCase().includes('backup')
    );
    
    if (backupTab) {
      console.log('✅ Aba Backup encontrada:', backupTab);
      
      // Tentar clicar usando diferentes seletores
      const selectors = [
        `[role="tab"][value="backup"]`,
        `[role="tab"]:nth-child(6)`, // Assumindo que é a 6ª aba
      ];
      
      for (const selector of selectors) {
        try {
          console.log(`🎯 Tentando seletor: ${selector}`);
          await page.click(selector);
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Verificar se funcionou
          const activeTab = await page.evaluate(() => {
            const active = document.querySelector('[role="tab"][aria-selected="true"]');
            return active ? active.textContent?.trim() : null;
          });
          
          console.log(`📋 Aba ativa após clique: ${activeTab}`);
          
          if (activeTab?.toLowerCase().includes('backup')) {
            console.log('✅ Sucesso! Aba Backup ativada');
            break;
          }
        } catch (e) {
          console.log(`❌ Seletor ${selector} falhou:`, e.message);
        }
      }
    } else {
      console.log('❌ Aba Backup não encontrada');
    }
    
    // Aguardar um pouco para ver o resultado
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
})();