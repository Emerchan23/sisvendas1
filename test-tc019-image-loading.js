const puppeteer = require('puppeteer');

async function testImageLoading() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Testando carregamento de imagem do TC019');
    
    // Interceptar erros de rede
    page.on('response', response => {
      if (!response.ok() && response.url().includes('usera.com')) {
        console.log(`❌ Erro de rede: ${response.status()} - ${response.url()}`);
      }
    });
    
    page.on('pageerror', error => {
      console.log(`❌ Erro de página: ${error.message}`);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console error: ${msg.text()}`);
      }
    });

    // Navegar para login
    await page.goto('http://localhost:3145/login', { waitUntil: 'networkidle2' });
    console.log('📄 Página de login carregada');

    // Fazer login
    await page.type('#email', 'admin@sistema.com');
    await page.type('#senha', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Login realizado');

    // Navegar para configurações
    await page.goto('http://localhost:3145/configuracoes', { waitUntil: 'networkidle2' });
    console.log('📄 Página de configurações carregada');

    // Aguardar um pouco para a página carregar completamente
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔍 Procurando campo de URL do logo...');
    
    try {
      await page.waitForSelector('#logoUrl', { timeout: 10000 });
      console.log('✅ Campo de logo encontrado!');
    } catch (error) {
      console.log('❌ Campo de logo não encontrado após 10 segundos');
      await browser.close();
      return;
    }
    
    const logoField = await page.$('#logoUrl');
    
    // Inserir URL do logo problemática
    if (logoField) {
      await logoField.click({ clickCount: 3 });
      await logoField.type('https://usera.com/logo.png');
      console.log('📝 URL inserida: https://usera.com/logo.png');
      
      // Aguardar um pouco para validação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se há erros de validação
      const errorMessages = await page.evaluate(() => {
        const selectors = ['[class*="error"]', '[class*="invalid"]', '.text-red-500', '.text-destructive'];
        const messages = [];
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            const text = el.textContent?.trim();
            if (text) {
              messages.push(text);
            }
          });
        });
        return messages;
      });
      
      if (errorMessages.length > 0) {
        console.log('❌ Erros de validação encontrados:');
        errorMessages.forEach(msg => {
          console.log(`   - ${msg}`);
        });
      } else {
        console.log('✅ Nenhum erro de validação encontrado');
      }
      
      // Tentar salvar
      const saveButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => 
          btn.type === 'submit' || 
          btn.textContent.toLowerCase().includes('salvar')
        );
      });
      
      if (saveButton.asElement()) {
        console.log('💾 Clicando em salvar...');
        await saveButton.asElement().click();
        
        // Aguardar resposta
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verificar mensagens de erro ou sucesso
        const messages = await page.evaluate(() => {
          const selectors = [
            '[class*="toast"]',
            '[class*="alert"]',
            '[class*="error"]',
            '[class*="success"]',
            '.text-red-500',
            '.text-green-500',
            '.text-destructive'
          ];
          
          const messages = [];
          selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              const text = el.textContent?.trim();
              if (text) {
                messages.push({ selector, text });
              }
            });
          });
          
          return messages;
        });
        
        if (messages.length > 0) {
          console.log('📢 Mensagens após salvar:');
          messages.forEach(msg => {
            console.log(`   - ${msg.selector}: ${msg.text}`);
          });
        } else {
          console.log('ℹ️ Nenhuma mensagem encontrada após salvar');
        }
        
        // Verificar se a imagem está sendo carregada no header
        console.log('🖼️ Verificando carregamento da imagem no header...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const imageStatus = await page.evaluate(() => {
          const img = document.querySelector('header img[alt="Logo da empresa"]');
          if (img) {
            return {
              found: true,
              src: img.src,
              complete: img.complete,
              naturalWidth: img.naturalWidth,
              naturalHeight: img.naturalHeight
            };
          }
          return { found: false };
        });
        
        if (imageStatus.found) {
          console.log(`🖼️ Imagem encontrada: ${imageStatus.src}`);
          console.log(`   - Carregada: ${imageStatus.complete}`);
          console.log(`   - Dimensões: ${imageStatus.naturalWidth}x${imageStatus.naturalHeight}`);
          
          if (!imageStatus.complete || imageStatus.naturalWidth === 0) {
            console.log('❌ PROBLEMA: Imagem não carregou corretamente!');
            console.log('   Isso pode ser o erro crítico de hostname do TC019');
          } else {
            console.log('✅ Imagem carregou corretamente');
          }
        } else {
          console.log('❌ Imagem não encontrada no header');
        }
      } else {
        console.log('❌ Botão de salvar não encontrado');
      }
    } else {
      console.log('❌ Campo de logo não encontrado');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  } finally {
    await browser.close();
  }
}

testImageLoading();