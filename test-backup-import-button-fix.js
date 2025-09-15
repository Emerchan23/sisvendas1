const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🚀 Testando funcionalidade do botão Importar Backup...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Interceptar requisições de rede
  await page.setRequestInterception(true);
  
  page.on('request', (request) => {
    console.log(`📤 Requisição: ${request.method()} ${request.url()}`);
    if (request.url().includes('/api/backup/import')) {
      console.log('📋 Headers:', request.headers());
      console.log('📋 Body:', request.postData());
    }
    request.continue();
  });
  
  page.on('response', async (response) => {
    if (response.url().includes('/api/backup/import')) {
      console.log(`📥 Resposta API Import: ${response.status()}`);
      try {
        const responseText = await response.text();
        console.log('📋 Resposta:', responseText);
      } catch (e) {
        console.log('❌ Erro ao ler resposta:', e.message);
      }
    }
  });
  
  // Capturar erros do console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Erro no console:', msg.text());
    }
  });
  
  try {
    // 1. Fazer login
    console.log('🔐 Fazendo login...');
    await page.goto('http://localhost:3145/login');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    
    await page.type('input[type="email"]', 'admin@admin.com');
    await page.type('input[type="password"]', 'admin');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('✅ Login realizado com sucesso');
    
    // 2. Navegar para configurações
    console.log('🔧 Navegando para configurações...');
    await page.goto('http://localhost:3145/configuracoes');
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
    console.log('✅ Página de configurações carregada');
    
    // 3. Clicar na aba Backup
    console.log('📁 Clicando na aba Backup...');
    await page.click('[data-state="inactive"][value="backup"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Aba Backup ativada');
    
    // 4. Verificar se o botão Importar Backup existe
    console.log('🔍 Verificando botão Importar Backup...');
    const importButton = await page.$('button:has-text("Importar Backup")');
    if (!importButton) {
      // Tentar seletor alternativo
      const altButton = await page.$('button[class*="border-orange"]:has-text("Importar")');
      if (!altButton) {
        console.log('❌ Botão Importar Backup não encontrado');
        // Listar todos os botões disponíveis
        const buttons = await page.$$eval('button', buttons => 
          buttons.map(btn => ({ text: btn.textContent, classes: btn.className }))
        );
        console.log('📋 Botões disponíveis:', buttons);
        return;
      }
    }
    console.log('✅ Botão Importar Backup encontrado');
    
    // 5. Criar arquivo de teste para importação
    console.log('📄 Criando arquivo de backup de teste...');
    const testBackup = {
      data: {
        clientes: [
          {
            id: 999,
            nome: 'Cliente Teste Import',
            email: 'teste@import.com',
            telefone: '11999999999',
            documento: '12345678901',
            tipo_documento: 'cpf',
            endereco: 'Rua Teste, 123',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234567',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
      },
      metadata: {
        version: '1.0',
        created_at: new Date().toISOString(),
        tables: ['clientes']
      }
    };
    
    const testFilePath = path.join(__dirname, 'test-backup.json');
    fs.writeFileSync(testFilePath, JSON.stringify(testBackup, null, 2));
    console.log('✅ Arquivo de backup criado:', testFilePath);
    
    // 6. Simular seleção de arquivo
    console.log('📂 Simulando seleção de arquivo...');
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      console.log('❌ Input de arquivo não encontrado');
      return;
    }
    
    await fileInput.uploadFile(testFilePath);
    console.log('✅ Arquivo selecionado');
    
    // 7. Aguardar processamento
    console.log('⏳ Aguardando processamento...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 8. Verificar se houve toast de sucesso ou erro
    console.log('🔍 Verificando resultado...');
    const toasts = await page.$$eval('[data-sonner-toast]', toasts => 
      toasts.map(toast => toast.textContent)
    );
    
    if (toasts.length > 0) {
      console.log('📢 Toasts encontrados:', toasts);
    } else {
      console.log('⚠️ Nenhum toast encontrado');
    }
    
    // 9. Verificar logs do console da página
    console.log('📋 Logs finais do console:');
    const logs = await page.evaluate(() => {
      return window.console.history || [];
    });
    
    console.log('✅ Teste concluído');
    
    // Limpar arquivo de teste
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    // Manter navegador aberto para inspeção
    console.log('🔍 Navegador mantido aberto para inspeção. Pressione Ctrl+C para fechar.');
    // await browser.close();
  }
})();