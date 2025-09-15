const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testImportBackupButton() {
  console.log('🚀 Iniciando teste do botão Importar Backup...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // Interceptar requisições da API
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().includes('/api/backup/import')) {
        console.log('📡 Requisição para API de importação detectada:', request.url());
      }
      request.continue();
    });
    
    page.on('response', async (response) => {
      if (response.url().includes('/api/backup/import')) {
        console.log('📨 Resposta da API de importação:', response.status());
        try {
          const responseText = await response.text();
          console.log('📄 Conteúdo da resposta:', responseText);
        } catch (e) {
          console.log('❌ Erro ao ler resposta:', e.message);
        }
      }
    });
    
    // 1. Navegar para a página de login
    console.log('📱 1. Navegando para a página de login...');
    await page.goto('http://localhost:3145/login', { waitUntil: 'networkidle2', timeout: 60000 });
    
    // 2. Fazer login
    console.log('🔐 2. Fazendo login...');
    await page.type('input[type="email"]', 'admin@sistema.com');
    await page.type('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // 3. Navegar para configurações
    console.log('⚙️ 3. Navegando para configurações...');
    await page.goto('http://localhost:3145/configuracoes', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // 4. Aguardar um pouco para a página carregar
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 5. Encontrar e clicar na aba Backup
    console.log('🔍 4. Procurando pela aba Backup...');
    
    // Baseado no debug, a aba Backup é um button com role="tab" e textContent="Backup"
    const backupTabClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button[role="tab"]'));
      const backupTab = buttons.find(btn => btn.textContent && btn.textContent.trim() === 'Backup');
      
      if (backupTab) {
        console.log('✅ Aba Backup encontrada:', {
          tagName: backupTab.tagName,
          textContent: backupTab.textContent,
          role: backupTab.getAttribute('role'),
          dataState: backupTab.getAttribute('data-state')
        });
        backupTab.click();
        return true;
      }
      return false;
    });
    
    if (!backupTabClicked) {
      throw new Error('Aba Backup não encontrada ou não foi possível clicar');
    }
    
    console.log('✅ Clique realizado na aba Backup');
    
    // 6. Aguardar a aba carregar completamente
     await new Promise(resolve => setTimeout(resolve, 3000));
     
     // Verificar se o conteúdo da aba foi carregado
     console.log('🔍 Verificando conteúdo da aba Backup...');
     const tabContent = await page.evaluate(() => {
       const tabsContent = document.querySelector('[data-state="active"]');
       return tabsContent ? tabsContent.textContent : 'Nenhum conteúdo ativo encontrado';
     });
     
     console.log('📄 Conteúdo da aba ativa:', tabContent.substring(0, 200) + '...');
    
    // 7. Criar arquivo de backup de teste
    console.log('📄 5. Criando arquivo de backup de teste...');
    const testBackupData = {
      clientes: [
        {
          id: 'test-cliente-1',
          nome: 'Cliente Teste',
          cpf_cnpj: '12345678901',
          telefone: '11999999999',
          email: 'teste@teste.com'
        }
      ],
      produtos: [
        {
          id: 'test-produto-1',
          nome: 'Produto Teste',
          preco: 100.00,
          categoria: 'Teste'
        }
      ]
    };
    
    const testFilePath = path.join(__dirname, 'test-backup.json');
    fs.writeFileSync(testFilePath, JSON.stringify(testBackupData, null, 2));
    
    // 8. Procurar pelo botão "Importar Backup"
    console.log('🔍 6. Procurando pelo botão Importar Backup...');
    
    // Tentar encontrar por texto que contenha "Importar Backup"
    const foundImportButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => btn.textContent.includes('Importar Backup'));
    });
    
    if (!foundImportButton) {
      // Debug: listar botões relacionados
      const buttons = await page.$$eval('button', buttons => 
        buttons.map(btn => ({
          text: btn.textContent,
          className: btn.className
        }))
      );
      
      console.log('🔍 Botões encontrados na página:', JSON.stringify(buttons.filter(b => b.text && (b.text.includes('Importar') || b.text.includes('Backup'))), null, 2));
      console.log('❌ Botão Importar Backup não encontrado');
      return;
    }
    
    console.log('✅ Botão Importar Backup encontrado');
    
    // 9. Clicar no botão Importar Backup
    console.log('👆 7. Clicando no botão Importar Backup...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const importButton = buttons.find(btn => btn.textContent.includes('Importar Backup'));
      if (importButton) {
        importButton.click();
      }
    });
    
    // 10. Aguardar um pouco para o input file aparecer
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 11. Procurar pelo input file
    console.log('📁 8. Procurando pelo input file...');
    const fileInput = await page.$('input[type="file"][accept=".json"]');
    
    if (!fileInput) {
      console.log('❌ Input file não encontrado após clicar no botão');
      
      // Debug: listar todos os inputs
      const allInputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({
          type: input.type,
          accept: input.accept || '',
          style: input.style.display || '',
          className: input.className
        }))
      );
      
      console.log('🔍 Todos os inputs na página:', JSON.stringify(allInputs, null, 2));
      return;
    }
    
    console.log('✅ Input file encontrado');
    
    // 12. Simular seleção do arquivo
    console.log('📁 9. Simulando seleção do arquivo...');
    await fileInput.uploadFile(testFilePath);
    
    // 13. Aguardar processamento
    console.log('⏳ 10. Aguardando processamento...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 14. Verificar mensagens de feedback
    console.log('📢 11. Verificando mensagens de feedback...');
    const toastMessages = await page.$$eval('[data-sonner-toast], .toast, [role="alert"]', elements => 
      elements.map(el => el.textContent)
    );
    
    if (toastMessages.length > 0) {
      console.log('✅ Mensagens encontradas:', toastMessages);
    } else {
      console.log('❌ Nenhuma mensagem de feedback encontrada');
    }
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.log('❌ Erro durante o teste:', error.message);
  } finally {
    // Limpar arquivo de teste
    const testFilePath = path.join(__dirname, 'test-backup.json');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log('🧹 Arquivo de teste removido');
    }
    
    await browser.close();
  }
}

testImportBackupButton();