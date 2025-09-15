const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testBackupConsoleErrors() {
  console.log('🚀 Testando erros no console durante importação de backup...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Interceptar TODOS os logs do console
  page.on('console', msg => {
    console.log(`🖥️ Console [${msg.type()}]: ${msg.text()}`);
  });
  
  // Interceptar erros de página
  page.on('pageerror', error => {
    console.log(`❌ Erro de página: ${error.message}`);
  });
  
  // Interceptar requisições falhadas
  page.on('requestfailed', request => {
    console.log(`❌ Requisição falhou: ${request.url()} - ${request.failure().errorText}`);
  });
  
  // Interceptar requisições de backup
  page.on('request', request => {
    if (request.url().includes('/api/backup/import')) {
      console.log(`📤 Requisição BACKUP: ${request.method()} ${request.url()}`);
      console.log(`📤 Headers: ${JSON.stringify(request.headers(), null, 2)}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/backup/import')) {
      console.log(`📥 Resposta BACKUP: ${response.status()} ${response.url()}`);
    }
  });
  
  try {
    // 1. Login
    console.log('1. Fazendo login...');
    await page.goto('http://localhost:3145/login', { waitUntil: 'networkidle2', timeout: 60000 });
    
    await page.type('input[type="email"]', 'admin@sistema.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 });
    
    // 2. Ir para configurações
    console.log('2. Navegando para configurações...');
    await page.goto('http://localhost:3145/configuracoes', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 3. Clicar na aba Backup
    console.log('3. Clicando na aba Backup...');
    const tabs = await page.$$('button[role="tab"]');
    for (let tab of tabs) {
      const text = await tab.evaluate(el => el.textContent);
      if (text && text.includes('Backup')) {
        await tab.click();
        console.log('✅ Aba Backup clicada');
        break;
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Criar arquivo de backup de teste
    console.log('4. Criando arquivo de backup de teste...');
    const backupData = {
      clientes: [{ id: 1, nome: 'Cliente Teste', email: 'teste@teste.com' }],
      produtos: [{ id: 1, nome: 'Produto Teste', preco: 100 }]
    };
    
    const backupPath = path.join(__dirname, 'test-backup-console.json');
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    // 5. Testar a função handleImportarBackup com logs detalhados
    console.log('5. Testando função handleImportarBackup com logs detalhados...');
    
    const result = await page.evaluate((backupDataStr) => {
      return new Promise((resolve) => {
        try {
          console.log('🔍 Iniciando teste da função handleImportarBackup');
          
          // Verificar se a função existe
          const fileInput = document.querySelector('input[type="file"]');
          if (!fileInput) {
            console.error('❌ Input de arquivo não encontrado');
            resolve({ success: false, error: 'Input de arquivo não encontrado' });
            return;
          }
          
          console.log('✅ Input de arquivo encontrado:', fileInput);
          
          // Verificar se há um event listener (removido getEventListeners)
          console.log('🎧 Event listeners: Verificação removida (getEventListeners não disponível)');
          
          // Criar um arquivo simulado
          const file = new File([backupDataStr], 'test-backup.json', { type: 'application/json' });
          console.log('📄 Arquivo criado:', file);
          
          // Criar um evento de mudança simulado
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
          
          console.log('📁 Arquivos definidos:', fileInput.files);
          
          // Disparar o evento de mudança
          const event = new Event('change', { bubbles: true });
          console.log('🎯 Disparando evento de mudança...');
          
          fileInput.dispatchEvent(event);
          
          console.log('✅ Evento de mudança disparado');
          
          // Aguardar um pouco para ver se algo acontece
          setTimeout(() => {
            console.log('⏰ Timeout de verificação atingido');
            resolve({ success: true });
          }, 2000);
          
        } catch (error) {
          console.error('❌ Erro ao simular upload:', error);
          resolve({ success: false, error: error.message });
        }
      });
    }, JSON.stringify(backupData));
    
    console.log('Resultado da simulação:', result);
    
    // 6. Aguardar mais tempo para ver se há requisições
    console.log('6. Aguardando requisições por mais tempo...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    console.log('\n✅ Teste concluído');
    
    // Limpar arquivo de teste
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      console.log('🗑️ Arquivo de teste removido');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
}

testBackupConsoleErrors();