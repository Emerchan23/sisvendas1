const puppeteer = require('puppeteer');

console.log('🔍 Debug da aba Backup...');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Analisar conteúdo da aba Backup
    console.log('🔍 Analisando conteúdo da aba Backup...');
    
    const backupContent = await page.evaluate(() => {
      // Buscar todos os botões
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
        tagName: btn.tagName,
        textContent: btn.textContent?.trim(),
        className: btn.className,
        id: btn.id,
        type: btn.type
      }));
      
      // Buscar inputs de arquivo
      const fileInputs = Array.from(document.querySelectorAll('input[type="file"]')).map(input => ({
        tagName: input.tagName,
        type: input.type,
        accept: input.accept,
        className: input.className,
        id: input.id
      }));
      
      // Buscar elementos que contenham "import" ou "backup"
      const importElements = Array.from(document.querySelectorAll('*')).filter(el => 
        el.textContent && (el.textContent.toLowerCase().includes('import') || 
                          el.textContent.toLowerCase().includes('backup'))
      ).map(el => ({
        tagName: el.tagName,
        textContent: el.textContent?.trim().substring(0, 100),
        className: el.className,
        id: el.id
      }));
      
      return {
        buttons,
        fileInputs,
        importElements,
        bodyText: document.body.textContent?.substring(0, 500)
      };
    });
    
    console.log('\n📊 CONTEÚDO DA ABA BACKUP:');
    console.log('==========================');
    
    console.log('\n🔘 Botões encontrados:');
    backupContent.buttons.forEach((btn, i) => {
      console.log(`  ${i + 1}. "${btn.textContent}" (${btn.tagName})`);
    });
    
    console.log('\n📁 Inputs de arquivo:');
    backupContent.fileInputs.forEach((input, i) => {
      console.log(`  ${i + 1}. accept: "${input.accept}" (${input.tagName})`);
    });
    
    console.log('\n🔍 Elementos com "import" ou "backup":');
    backupContent.importElements.forEach((el, i) => {
      console.log(`  ${i + 1}. ${el.tagName} - "${el.textContent}"`);
    });
    
    console.log('\n📄 Texto da página (primeiros 500 chars):');
    console.log(backupContent.bodyText);
    
    // Aguardar para visualização
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error.message);
  } finally {
    await browser.close();
  }
})();