const puppeteer = require('puppeteer');

console.log('🔍 Debug da Interface de Backup');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📋 Fazendo login...');
    await page.goto('http://localhost:3145/login');
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', 'admin@sistema.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log('✅ Login realizado com sucesso');
    
    console.log('\n🖥️ Navegando para configurações...');
    await page.goto('http://localhost:3145/configuracoes');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verificar todas as abas disponíveis
    const tabs = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons
        .filter(btn => btn.getAttribute('role') === 'tab' || btn.textContent?.includes('Backup'))
        .map(btn => ({
          text: btn.textContent?.trim(),
          dataValue: btn.getAttribute('data-value'),
          value: btn.getAttribute('value'),
          role: btn.getAttribute('role'),
          className: btn.className
        }));
    });
    
    console.log('\n📋 Abas encontradas:', tabs);
    
    // Clicar na aba Backup
    const backupTabClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const backupButton = buttons.find(btn => btn.textContent?.includes('Backup'));
      if (backupButton) {
        console.log('Clicando na aba Backup:', backupButton.textContent);
        backupButton.click();
        return true;
      }
      return false;
    });
    
    if (backupTabClicked) {
      console.log('✅ Aba Backup clicada');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar o conteúdo da aba ativa
      const tabContent = await page.evaluate(() => {
        // Procurar por TabsContent com value="backup"
        const backupContent = document.querySelector('[data-state="active"]');
        if (backupContent) {
          return {
            found: true,
            innerHTML: backupContent.innerHTML.substring(0, 1000),
            buttons: Array.from(backupContent.querySelectorAll('button')).map(btn => btn.textContent?.trim()),
            inputs: Array.from(backupContent.querySelectorAll('input')).map(input => ({
              type: input.type,
              style: input.style.display,
              hidden: input.hidden
            }))
          };
        }
        
        // Fallback: procurar por qualquer conteúdo visível
        const allContent = document.body.innerHTML;
        const hasBackupContent = allContent.includes('Exportar Backup') || allContent.includes('Importar Backup');
        
        return {
          found: false,
          hasBackupContent,
          allButtons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent?.trim()).filter(text => text && text.includes('Backup'))
        };
      });
      
      console.log('\n📄 Conteúdo da aba:', tabContent);
      
      // Verificar se há erros no console
      const consoleErrors = await page.evaluate(() => {
        return window.console.errors || [];
      });
      
      if (consoleErrors.length > 0) {
        console.log('\n❌ Erros no console:', consoleErrors);
      }
      
      // Tentar forçar a renderização da aba
      console.log('\n🔄 Tentando forçar renderização...');
      await page.evaluate(() => {
        // Disparar evento de mudança de aba
        const event = new Event('change', { bubbles: true });
        document.dispatchEvent(event);
        
        // Tentar clicar novamente
        const buttons = Array.from(document.querySelectorAll('button'));
        const backupButton = buttons.find(btn => btn.textContent?.includes('Backup'));
        if (backupButton) {
          backupButton.click();
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar novamente
      const finalCheck = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
        
        return {
          exportButton: buttons.some(btn => btn.textContent?.includes('Exportar Backup')),
          importButton: buttons.some(btn => btn.textContent?.includes('Importar Backup')),
          fileInput: fileInputs.length > 0,
          allBackupButtons: buttons.filter(btn => btn.textContent?.includes('Backup')).map(btn => btn.textContent?.trim()),
          visibleElements: document.querySelectorAll('[data-state="active"]').length
        };
      });
      
      console.log('\n🔍 Verificação final:', finalCheck);
      
    } else {
      console.log('❌ Não foi possível clicar na aba Backup');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  } finally {
    console.log('\n⏸️ Mantendo navegador aberto para inspeção manual...');
    console.log('Pressione Ctrl+C para fechar');
    // Manter o navegador aberto para inspeção
    await new Promise(() => {});
  }
})();