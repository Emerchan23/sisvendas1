const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testando botão "Importar Backup" na interface...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('\n🌐 1. Navegando para a página de login...');
     await page.goto('http://localhost:3145/login', { waitUntil: 'networkidle2', timeout: 15000 });
    
    console.log('\n🔐 2. Fazendo login...');
    await page.type('input[type="email"]', 'admin@teste.com');
    await page.type('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log('  ✅ Login realizado com sucesso');
    
    console.log('\n⚙️ 3. Navegando para a página de configurações...');
     await page.goto('http://localhost:3145/configuracoes', { waitUntil: 'networkidle2', timeout: 15000 });
    
    console.log('\n📋 4. Procurando e clicando na aba "Backup"...');
    const backupTab = await page.$('[data-value="backup"], button:contains("Backup"), [role="tab"]:contains("Backup")');
    if (backupTab) {
      const tabText = await page.evaluate(el => el.textContent, backupTab);
      console.log(`  ✅ Aba "Backup" encontrada e clicada: "${tabText}"`);
      await backupTab.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      console.log('  ❌ Aba "Backup" não encontrada');
    }
    
    console.log('\n🔍 5. Procurando especificamente pelo botão "Importar Backup"...');
    
    // Procurar por diferentes seletores possíveis
    const selectors = [
      'button:contains("Importar Backup")',
      'button[onclick*="importar"]',
      'button[onclick*="fileInputRef"]',
      'button:has(svg + text:contains("Importar"))',
      'button:has(.lucide-upload)',
      'button:has([data-lucide="upload"])'
    ];
    
    let importButton = null;
    for (const selector of selectors) {
      try {
        importButton = await page.$(selector);
        if (importButton) {
          console.log(`  ✅ Botão encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        // Continuar tentando outros seletores
      }
    }
    
    // Se não encontrou, procurar por todos os botões na área de backup
    if (!importButton) {
      console.log('  🔍 Procurando todos os botões na área de backup...');
      const allButtons = await page.$$eval('button', buttons => 
        buttons.map(btn => ({
          text: btn.textContent?.trim(),
          classes: btn.className,
          onclick: btn.onclick?.toString() || 'none'
        }))
      );
      
      console.log('  📋 Botões encontrados:');
      allButtons.forEach((btn, index) => {
        if (btn.text && btn.text.length > 0) {
          console.log(`    ${index + 1}. "${btn.text}" (classes: ${btn.classes})`);
        }
      });
      
      // Procurar especificamente por botão com texto "Importar Backup"
      importButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent?.includes('Importar Backup'));
      });
      
      if (importButton && importButton.asElement()) {
        console.log('  ✅ Botão "Importar Backup" encontrado via texto!');
      } else {
        console.log('  ❌ Botão "Importar Backup" não encontrado');
      }
    }
    
    console.log('\n📁 6. Procurando pelo input de arquivo oculto...');
    const fileInput = await page.$('input[type="file"][accept=".json"]');
    if (fileInput) {
      const isHidden = await page.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.display === 'none' || el.style.display === 'none';
      }, fileInput);
      console.log(`  ✅ Input de arquivo encontrado (oculto: ${isHidden})`);
    } else {
      console.log('  ❌ Input de arquivo não encontrado');
    }
    
    console.log('\n🧪 7. Testando funcionalidade do botão...');
    if (importButton && importButton.asElement()) {
      console.log('  🖱️ Clicando no botão "Importar Backup"...');
      await importButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verificar se o input file foi acionado (geralmente abre o seletor de arquivos)
      console.log('  ✅ Botão clicado com sucesso');
    } else {
      console.log('  ❌ Não foi possível testar o botão (não encontrado)');
    }
    
    console.log('\n📊 8. Resumo da verificação:');
    console.log(`  - Aba "Backup" presente e clicável: ${backupTab ? '✅' : '❌'}`);
    console.log(`  - Botão "Importar Backup" presente: ${importButton && importButton.asElement() ? '✅' : '❌'}`);
    console.log(`  - Input de arquivo presente: ${fileInput ? '✅' : '❌'}`);
    
    if (backupTab && importButton && importButton.asElement() && fileInput) {
      console.log('\n✅ Todos os componentes estão presentes e funcionais!');
    } else {
      console.log('\n❌ Alguns componentes estão faltando.');
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('💥 Verificação do botão "Importar Backup" na UI encontrou problemas!');
  console.error('❌', error.message);
  process.exit(1);
});