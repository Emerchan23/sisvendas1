const { chromium } = require('playwright');

async function testValidUrl() {
  console.log('🚀 Testando carregamento com URL válida');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Interceptar erros do console
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console error:', msg.text());
    }
  });
  
  try {
    // Fazer login
    await page.goto('http://localhost:3000/login');
    console.log('📄 Página de login carregada');
    
    await page.fill('#email', 'admin@admin.com');
    await page.fill('#senha', 'admin123');
    await page.click('button[type="submit"]');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Login realizado');
    
    // Navegar para configurações
    await page.goto('http://localhost:3000/configuracoes');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('📄 Página de configurações carregada');
    
    // Aguardar campo de logo
    try {
      await page.waitForSelector('#logoUrl', { timeout: 10000 });
      console.log('✅ Campo de logo encontrado!');
    } catch (error) {
      console.log('❌ Campo de logo não encontrado após 10 segundos');
      await browser.close();
      return;
    }
    
    const logoField = await page.$('#logoUrl');
    
    // Testar com URL válida (exemplo: logo do GitHub)
    if (logoField) {
      await logoField.click({ clickCount: 3 });
      await logoField.type('https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png');
      console.log('📝 URL válida inserida: https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png');
      
      // Aguardar validação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se há erros de validação
      const errorMessages = await page.evaluate(() => {
        const selectors = ['.text-red-500'];
        const messages = [];
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.includes('URL') && text.includes('inválida')) {
              messages.push(text);
            }
          });
        });
        return messages;
      });
      
      if (errorMessages.length > 0) {
        console.log('❌ Erros de validação encontrados:');
        errorMessages.forEach(msg => console.log('   -', msg));
      } else {
        console.log('✅ Nenhum erro de validação - URL aceita como válida');
      }
      
      // Salvar configurações
      console.log('💾 Clicando em salvar...');
      const saveButton = await page.$('button:has-text("Salvar Configurações Gerais")');
      if (saveButton) {
        await saveButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verificar mensagens de sucesso/erro
        const messages = await page.evaluate(() => {
          const toasts = document.querySelectorAll('[data-sonner-toast]');
          return Array.from(toasts).map(toast => toast.textContent?.trim()).filter(Boolean);
        });
        
        if (messages.length > 0) {
          console.log('📢 Mensagens após salvar:');
          messages.forEach(msg => console.log('   -', msg));
        } else {
          console.log('ℹ️ Nenhuma mensagem encontrada após salvar');
        }
      }
      
      // Verificar se a imagem carrega no header
      console.log('🖼️ Verificando carregamento da imagem no header...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const headerImage = await page.$('header img, .header img, [data-testid="logo"] img');
      if (headerImage) {
        const dimensions = await headerImage.evaluate(img => ({
          width: img.naturalWidth,
          height: img.naturalHeight,
          src: img.src
        }));
        
        console.log('🖼️ Imagem encontrada no header:');
        console.log('   - Src:', dimensions.src);
        console.log('   - Dimensões:', `${dimensions.width}x${dimensions.height}`);
        
        if (dimensions.width > 0 && dimensions.height > 0) {
          console.log('✅ Imagem carregou corretamente!');
        } else {
          console.log('❌ Imagem não carregou (dimensões 0x0)');
        }
      } else {
        console.log('❌ Imagem não encontrada no header');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    await browser.close();
  }
}

testValidUrl();