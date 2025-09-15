const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testBackupNetwork() {
  console.log('🚀 Testando requisições de rede do botão Importar Backup...');
  
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
    if (request.url().includes('/api/')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData()
      });
      console.log(`📤 Requisição: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText()
      });
      console.log(`📥 Resposta: ${response.status()} ${response.url()}`);
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
    
    const backupPath = path.join(__dirname, 'test-backup-network.json');
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    // 5. Clicar no botão Importar Backup
    console.log('5. Clicando no botão Importar Backup...');
    const buttons = await page.$$('button');
    let importButton = null;
    for (let button of buttons) {
      const text = await button.evaluate(el => el.textContent);
      if (text && text.includes('Importar Backup')) {
        importButton = button;
        break;
      }
    }
    
    if (!importButton) {
      console.log('❌ Botão Importar Backup não encontrado');
      return;
    }
    
    // Limpar requisições anteriores
    requests.length = 0;
    responses.length = 0;
    
    await importButton.click();
    
    // 6. Selecionar arquivo
    console.log('6. Selecionando arquivo...');
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      await fileInput.uploadFile(backupPath);
      console.log('✅ Arquivo selecionado');
    } else {
      console.log('❌ Input de arquivo não encontrado');
    }
    
    // 7. Aguardar requisições
    console.log('7. Aguardando requisições...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 8. Mostrar resultados
    console.log('\n📊 Resumo das requisições:');
    console.log(`Total de requisições: ${requests.length}`);
    console.log(`Total de respostas: ${responses.length}`);
    
    requests.forEach((req, index) => {
      console.log(`\nRequisição ${index + 1}:`);
      console.log(`  URL: ${req.url}`);
      console.log(`  Método: ${req.method}`);
      console.log(`  Headers: ${JSON.stringify(req.headers, null, 2)}`);
      if (req.postData) {
        console.log(`  Dados: ${req.postData.substring(0, 200)}...`);
      }
    });
    
    responses.forEach((res, index) => {
      console.log(`\nResposta ${index + 1}:`);
      console.log(`  URL: ${res.url}`);
      console.log(`  Status: ${res.status} ${res.statusText}`);
    });
    
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

testBackupNetwork();