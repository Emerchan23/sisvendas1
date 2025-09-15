const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testBackupManualTrigger() {
  console.log('🚀 Testando trigger manual do backup...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Interceptar requisições de rede
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    if (request.url().includes('/api/backup/import')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
      console.log(`📤 Requisição BACKUP: ${request.method()} ${request.url()}`);
      console.log(`📤 Headers: ${JSON.stringify(request.headers(), null, 2)}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/backup/import')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
      console.log(`📥 Resposta BACKUP: ${response.status()} ${response.url()}`);
    }
  });
  
  // Interceptar logs do console
  page.on('console', msg => {
    if (msg.text().includes('backup') || msg.text().includes('import') || msg.text().includes('Backup')) {
      console.log(`🖥️ Console: ${msg.text()}`);
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
    let backupTabFound = false;
    for (let tab of tabs) {
      const text = await tab.evaluate(el => el.textContent);
      if (text && text.includes('Backup')) {
        await tab.click();
        backupTabFound = true;
        console.log('✅ Aba Backup clicada');
        break;
      }
    }
    
    if (!backupTabFound) {
      console.log('❌ Aba Backup não encontrada');
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Criar arquivo de backup de teste
    console.log('4. Criando arquivo de backup de teste...');
    const backupData = {
      clientes: [{ id: 1, nome: 'Cliente Teste', email: 'teste@teste.com' }],
      produtos: [{ id: 1, nome: 'Produto Teste', preco: 100 }]
    };
    
    const backupPath = path.join(__dirname, 'test-backup-manual.json');
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    // 5. Testar diretamente a função handleImportarBackup via JavaScript
    console.log('5. Testando função handleImportarBackup diretamente...');
    
    // Limpar requisições anteriores
    requests.length = 0;
    responses.length = 0;
    
    // Criar um arquivo simulado e chamar a função diretamente
    const result = await page.evaluate((backupDataStr) => {
      return new Promise((resolve) => {
        try {
          // Simular um evento de mudança no input de arquivo
          const fileInput = document.querySelector('input[type="file"]');
          if (!fileInput) {
            resolve({ success: false, error: 'Input de arquivo não encontrado' });
            return;
          }
          
          // Criar um arquivo simulado
          const file = new File([backupDataStr], 'test-backup.json', { type: 'application/json' });
          
          // Criar um evento de mudança simulado
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
          
          // Disparar o evento de mudança
          const event = new Event('change', { bubbles: true });
          fileInput.dispatchEvent(event);
          
          console.log('✅ Evento de mudança disparado');
          resolve({ success: true });
        } catch (error) {
          console.error('❌ Erro ao simular upload:', error);
          resolve({ success: false, error: error.message });
        }
      });
    }, JSON.stringify(backupData));
    
    console.log('Resultado da simulação:', result);
    
    // 6. Aguardar requisições
    console.log('6. Aguardando requisições...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 7. Mostrar resultados
    console.log('\n📊 Resumo das requisições:');
    console.log(`Total de requisições: ${requests.length}`);
    console.log(`Total de respostas: ${responses.length}`);
    
    if (requests.length > 0) {
      requests.forEach((req, index) => {
        console.log(`\nRequisição ${index + 1}:`);
        console.log(`  URL: ${req.url}`);
        console.log(`  Método: ${req.method}`);
        console.log(`  Authorization: ${req.headers.authorization || 'NÃO ENCONTRADO'}`);
        if (req.postData) {
          console.log(`  Dados: ${req.postData.substring(0, 200)}...`);
        }
      });
    }
    
    if (responses.length > 0) {
      responses.forEach((res, index) => {
        console.log(`\nResposta ${index + 1}:`);
        console.log(`  URL: ${res.url}`);
        console.log(`  Status: ${res.status} ${res.statusText}`);
      });
    }
    
    // Limpar arquivo de teste
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      console.log('\n🗑️ Arquivo de teste removido');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
}

testBackupManualTrigger();