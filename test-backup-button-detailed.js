const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testBackupButtonDetailed() {
  let browser;
  
  try {
    console.log('🧪 Teste detalhado do botão Importar Backup');
    
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Interceptar logs do console
    page.on('console', msg => {
      console.log('🖥️ Console:', msg.text());
    });
    
    // Interceptar erros
    page.on('pageerror', error => {
      console.log('❌ Erro na página:', error.message);
    });
    
    // Interceptar requisições de rede
    page.on('response', response => {
      if (response.url().includes('/api/backup')) {
        console.log(`🌐 Requisição backup: ${response.status()} - ${response.url()}`);
      }
    });
    
    console.log('\n1. Navegando para login...');
    await page.goto('http://localhost:3145/login', { waitUntil: 'networkidle2', timeout: 60000 });
    
    console.log('2. Fazendo login...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.type('input[type="email"]', 'admin@sistema.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    console.log('3. Aguardando redirecionamento...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log('4. Navegando para configurações...');
    await page.goto('http://localhost:3145/configuracoes', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('5. Procurando e clicando na aba Backup...');
    const backupTab = await page.evaluateHandle(() => {
      const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
      return tabs.find(tab => tab.textContent && tab.textContent.includes('Backup'));
    });
    
    if (backupTab.asElement()) {
      await backupTab.asElement().click();
      console.log('✅ Aba Backup clicada');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('❌ Aba Backup não encontrada');
      return;
    }
    
    console.log('6. Verificando conteúdo da aba ativa...');
    const activeTabContent = await page.evaluate(() => {
      const activeContent = document.querySelector('[data-state="active"][role="tabpanel"]');
      return activeContent ? activeContent.textContent.substring(0, 100) : 'Não encontrado';
    });
    console.log('Conteúdo da aba ativa:', activeTabContent);
    
    console.log('7. Criando arquivo de backup de teste...');
    const testBackup = {
      data: {
        clientes: [{
          id: 999,
          nome: 'Cliente Teste Backup',
          email: 'teste@backup.com',
          telefone: '11999999999',
          documento: '12345678901',
          endereco: 'Rua Teste, 123',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]
      },
      metadata: {
        version: '1.0',
        created_at: new Date().toISOString(),
        total_records: 1
      }
    };
    
    const backupPath = path.join(__dirname, 'test-backup-detailed.json');
    fs.writeFileSync(backupPath, JSON.stringify(testBackup, null, 2));
    console.log('✅ Arquivo de backup criado:', backupPath);
    
    console.log('8. Procurando botão Importar Backup...');
    const importButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent && btn.textContent.includes('Importar Backup'));
    });
    
    if (importButton.asElement()) {
      console.log('✅ Botão Importar Backup encontrado');
      
      console.log('9. Verificando input de arquivo...');
      const fileInput = await page.$('input[type="file"][accept=".json"]');
      if (fileInput) {
        console.log('✅ Input de arquivo encontrado');
        
        console.log('10. Clicando no botão Importar Backup...');
        await importButton.asElement().click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('11. Selecionando arquivo...');
        await fileInput.uploadFile(backupPath);
        
        console.log('12. Aguardando processamento...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verificar se houve alguma mensagem de sucesso ou erro
        const toastMessages = await page.evaluate(() => {
          const toasts = Array.from(document.querySelectorAll('[data-sonner-toast]'));
          return toasts.map(toast => toast.textContent);
        });
        
        if (toastMessages.length > 0) {
          console.log('📢 Mensagens toast:', toastMessages);
        } else {
          console.log('⚠️ Nenhuma mensagem toast encontrada');
        }
        
        console.log('✅ Teste do botão Importar Backup concluído');
        
      } else {
        console.log('❌ Input de arquivo não encontrado');
      }
    } else {
      console.log('❌ Botão Importar Backup não encontrado');
      
      // Debug: listar todos os botões
      const allButtons = await page.$$eval('button', buttons => 
        buttons.map(btn => ({
          text: btn.textContent?.trim(),
          className: btn.className,
          onclick: btn.onclick ? 'tem onclick' : 'sem onclick'
        }))
      );
      
      console.log('🔍 Todos os botões na página:');
      allButtons.forEach((btn, index) => {
        if (btn.text && (btn.text.includes('Importar') || btn.text.includes('Backup'))) {
          console.log(`  ${index}: "${btn.text}" - ${btn.className} - ${btn.onclick}`);
        }
      });
    }
    
    // Limpar arquivo de teste
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath);
      console.log('🗑️ Arquivo de teste removido');
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testBackupButtonDetailed();