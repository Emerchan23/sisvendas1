const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

console.log('🧪 Teste de Importação de Backup - Versão Corrigida');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Interceptar logs do console
  page.on('console', msg => {
    if (msg.text().includes('handleImportarBackup')) {
      console.log('🎯 Console Log:', msg.text());
    }
  });
  
  // Interceptar requisições de rede
  let apiRequest = null;
  let apiResponse = null;
  
  page.on('request', request => {
    if (request.url().includes('/api/backup/import')) {
      apiRequest = {
        url: request.url(),
        method: request.method(),
        headers: request.headers()
      };
      console.log('📤 Requisição interceptada:', apiRequest);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/backup/import')) {
      apiResponse = {
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      };
      console.log('📥 Resposta interceptada:', apiResponse);
    }
  });
  
  try {
    // 1. Fazer login
     console.log('🔐 Fazendo login...');
     await page.goto('http://localhost:3145/login');
     await page.waitForSelector('input[type="email"]');
     await page.type('input[type="email"]', 'admin@sistema.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    console.log('✅ Login realizado');
    
    // 2. Navegar para configurações
     console.log('🔧 Navegando para configurações...');
     await page.goto('http://localhost:3145/configuracoes');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar carregamento da página
    console.log('✅ Página de configurações carregada');
    
    // 3. Clicar na aba Backup
    console.log('📂 Clicando na aba Backup...');
    await page.evaluate(() => {
      const backupButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent && btn.textContent.trim() === 'Backup'
      );
      if (!backupButton) {
        throw new Error('Botão Backup não encontrado');
      }
      backupButton.click();
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('✅ Aba Backup ativa');
    
    // 4. Verificar elementos
    console.log('🔍 Verificando elementos...');
    const button = await page.evaluateHandle(() => {
      return Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent && btn.textContent.includes('Importar Backup')
      );
    });
    const fileInput = await page.$('input[type="file"][accept=".json"]');
    
    const buttonElement = await button.asElement();
    if (!buttonElement) {
      console.log('❌ Botão "Importar Backup" não encontrado');
      return;
    }
    
    if (!fileInput) {
      console.log('❌ Input de arquivo não encontrado');
      return;
    }
    
    console.log('✅ Botão e input encontrados');
    
    // 5. Verificar token no localStorage
    const token = await page.evaluate(() => {
      return localStorage.getItem('auth_token');
    });
    
    if (token) {
      console.log('✅ Token encontrado no localStorage');
    } else {
      console.log('❌ Token NÃO encontrado no localStorage');
    }
    
    // 6. Fazer upload do arquivo de backup correto
    console.log('📤 Fazendo upload do arquivo de backup...');
    const backupPath = path.join(__dirname, 'backup-test.json');
    
    if (!fs.existsSync(backupPath)) {
      console.log('❌ Arquivo backup-test.json não encontrado');
      return;
    }
    
    await fileInput.uploadFile(backupPath);
    console.log('✅ Arquivo enviado');
    
    // 7. Aguardar processamento
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 8. Verificar mensagens de toast
    const toastMessages = await page.evaluate(() => {
      const toasts = document.querySelectorAll('[data-sonner-toast]');
      return Array.from(toasts).map(toast => toast.textContent);
    });
    
    console.log('\n📊 RESUMO DO TESTE:');
    console.log('===================');
    console.log('🔑 Token presente:', token ? 'Sim' : 'Não');
    console.log('📤 Requisição enviada:', apiRequest ? 'Sim' : 'Não');
    console.log('📥 Resposta recebida:', apiResponse ? 'Sim' : 'Não');
    
    if (apiResponse) {
      console.log('📊 Status da resposta:', apiResponse.status);
      if (apiResponse.status === 200) {
        console.log('✅ Importação bem-sucedida!');
      } else {
        console.log('❌ Erro na importação - Status:', apiResponse.status);
      }
    }
    
    console.log('💬 Mensagens de toast:', toastMessages.length > 0 ? toastMessages : 'Nenhuma');
    
    if (toastMessages.length > 0) {
      toastMessages.forEach((msg, i) => {
        console.log(`   ${i + 1}. ${msg}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    await browser.close();
  }
})();