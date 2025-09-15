const puppeteer = require('puppeteer');

(async () => {
  console.log('🚀 Testando presença do botão "Importar Backup" na interface...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    defaultViewport: null
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('\n🌐 1. Navegando diretamente para a página de configurações...');
    await page.goto('http://localhost:3145/configuracoes', { 
      waitUntil: 'domcontentloaded', 
      timeout: 10000 
    });
    
    console.log('\n📋 2. Aguardando carregamento da página...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🔍 3. Procurando pelo código do botão "Importar Backup" no HTML...');
    
    // Verificar se o código do botão existe no HTML
    const hasImportButton = await page.evaluate(() => {
      const pageContent = document.documentElement.innerHTML;
      return {
        hasImportText: pageContent.includes('Importar Backup'),
        hasUploadIcon: pageContent.includes('lucide-upload') || pageContent.includes('Upload'),
        hasFileInput: pageContent.includes('input') && pageContent.includes('type="file"') && pageContent.includes('.json'),
        hasBackupTab: pageContent.includes('backup') || pageContent.includes('Backup')
      };
    });
    
    console.log('\n📊 4. Resultados da verificação:');
    console.log(`  - Texto "Importar Backup" presente no HTML: ${hasImportButton.hasImportText ? '✅' : '❌'}`);
    console.log(`  - Ícone de Upload presente: ${hasImportButton.hasUploadIcon ? '✅' : '❌'}`);
    console.log(`  - Input de arquivo (.json) presente: ${hasImportButton.hasFileInput ? '✅' : '❌'}`);
    console.log(`  - Aba/seção Backup presente: ${hasImportButton.hasBackupTab ? '✅' : '❌'}`);
    
    // Procurar por elementos específicos
    console.log('\n🔍 5. Procurando elementos específicos...');
    
    const elements = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const inputs = Array.from(document.querySelectorAll('input[type="file"]'));
      
      return {
        buttonCount: buttons.length,
        fileInputCount: inputs.length,
        buttonsWithImport: buttons.filter(btn => 
          btn.textContent && btn.textContent.toLowerCase().includes('importar')
        ).length,
        buttonsWithBackup: buttons.filter(btn => 
          btn.textContent && btn.textContent.toLowerCase().includes('backup')
        ).length
      };
    });
    
    console.log(`  - Total de botões na página: ${elements.buttonCount}`);
    console.log(`  - Total de inputs de arquivo: ${elements.fileInputCount}`);
    console.log(`  - Botões com texto "importar": ${elements.buttonsWithImport}`);
    console.log(`  - Botões com texto "backup": ${elements.buttonsWithBackup}`);
    
    const allComponentsPresent = hasImportButton.hasImportText && 
                                hasImportButton.hasFileInput && 
                                hasImportButton.hasBackupTab;
    
    if (allComponentsPresent) {
      console.log('\n✅ Componentes do botão "Importar Backup" estão presentes no código!');
      console.log('✅ A funcionalidade parece estar implementada na interface.');
    } else {
      console.log('\n❌ Alguns componentes estão faltando no código da interface.');
      
      if (!hasImportButton.hasImportText) {
        console.log('  ⚠️  Texto "Importar Backup" não encontrado');
      }
      if (!hasImportButton.hasFileInput) {
        console.log('  ⚠️  Input de arquivo (.json) não encontrado');
      }
      if (!hasImportButton.hasBackupTab) {
        console.log('  ⚠️  Seção/aba Backup não encontrada');
      }
    }
    
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error('💥 Verificação do botão "Importar Backup" encontrou problemas!');
  console.error('❌', error.message);
  process.exit(1);
});