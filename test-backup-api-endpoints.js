const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

console.log('🧪 Teste das APIs de Backup');

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
    
    // Testar API de exportação
    console.log('\n📤 Testando API de exportação...');
    const exportResponse = await page.evaluate(async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/backup/export', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        return {
          ok: response.ok,
          status: response.status,
          data: response.ok ? await response.json() : await response.text()
        };
      } catch (error) {
        return {
          ok: false,
          error: error.message
        };
      }
    });
    
    console.log('Resposta da API de exportação:', exportResponse);
    
    if (exportResponse.ok) {
      console.log('✅ API de exportação funcionando');
      
      // Testar API de importação com dados válidos
      console.log('\n📥 Testando API de importação...');
      const importResponse = await page.evaluate(async (backupData) => {
        try {
          const token = localStorage.getItem('auth_token');
          const response = await fetch('/api/backup/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(backupData)
          });
          return {
            ok: response.ok,
            status: response.status,
            data: response.ok ? await response.json() : await response.text()
          };
        } catch (error) {
          return {
            ok: false,
            error: error.message
          };
        }
      }, exportResponse.data);
      
      console.log('Resposta da API de importação:', importResponse);
      
      if (importResponse.ok) {
        console.log('✅ API de importação funcionando');
      } else {
        console.log('❌ Erro na API de importação:', importResponse);
      }
    } else {
      console.log('❌ Erro na API de exportação:', exportResponse);
    }
    
    // Testar interface de backup
    console.log('\n🖥️ Testando interface de backup...');
    await page.goto('http://localhost:3145/configuracoes');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Clicar na aba Backup
    const backupTabClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const backupButton = buttons.find(btn => btn.textContent?.includes('Backup'));
      if (backupButton) {
        backupButton.click();
        return true;
      }
      return false;
    });
    
    if (backupTabClicked) {
      console.log('✅ Aba Backup encontrada e clicada');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar se os botões de backup estão presentes
      const backupButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return {
          exportar: buttons.some(btn => btn.textContent?.includes('Exportar Backup')),
          importar: buttons.some(btn => btn.textContent?.includes('Importar Backup')),
          fileInput: document.querySelector('input[type="file"]') !== null
        };
      });
      
      console.log('Elementos da interface:', backupButtons);
      
      if (backupButtons.exportar && backupButtons.importar && backupButtons.fileInput) {
        console.log('✅ Interface de backup completa');
      } else {
        console.log('❌ Interface de backup incompleta');
      }
    } else {
      console.log('❌ Aba Backup não encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
})();