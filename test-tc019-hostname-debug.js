const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Iniciando teste de debug do TC019 - Hostname de imagem');
    
    // Navegar para a página de login
    await page.goto('http://localhost:3145/login', { waitUntil: 'networkidle2' });
    console.log('📄 Página de login carregada');

    // Fazer login
    await page.type('#email', 'admin@sistema.com');
    await page.type('#senha', 'admin123');
    
    const submitButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => 
        btn.type === 'submit' || 
        btn.textContent.toLowerCase().includes('salvar') ||
        btn.textContent.toLowerCase().includes('entrar') ||
        btn.textContent.toLowerCase().includes('login')
      );
    });
    
    if (submitButton) {
      await submitButton.click();
      console.log('🔐 Login realizado');
    }

    // Aguardar redirecionamento
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Navegar para configurações
    await page.goto('http://localhost:3145/configuracoes', { waitUntil: 'networkidle2' });
    console.log('⚙️ Página de configurações carregada');

    // Aguardar carregamento da página
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Testar diferentes URLs problemáticas
    const urlsParaTestar = [
      'https://example.com/logo.png',
      'http://localhost:3000/logo.png',
      'https://cdn.example.com/images/logo.jpg',
      'https://invalid-hostname-test.com/logo.png',
      'https://subdomain.example.com/assets/logo.svg'
    ];

    for (const url of urlsParaTestar) {
      console.log(`\n🧪 Testando URL: ${url}`);
      
      // Limpar campo e inserir nova URL
      const logoField = await page.$('#logoUrl');
      if (logoField) {
        await logoField.click({ clickCount: 3 }); // Selecionar tudo
        await logoField.type(url);
        console.log(`📝 URL inserida: ${url}`);
        
        // Aguardar um pouco para validação
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar se há mensagens de erro na tela
        const errorMessages = await page.evaluate(() => {
          const errors = [];
          
          // Procurar por mensagens de erro comuns
          const errorSelectors = [
            '.text-red-500',
            '.text-destructive',
            '.error',
            '[class*="error"]',
            '[class*="invalid"]'
          ];
          
          errorSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              if (el.textContent.trim()) {
                errors.push({
                  selector,
                  text: el.textContent.trim()
                });
              }
            });
          });
          
          return errors;
        });
        
        if (errorMessages.length > 0) {
          console.log('❌ Erros encontrados:');
          errorMessages.forEach(error => {
            console.log(`   - ${error.selector}: ${error.text}`);
          });
        } else {
          console.log('✅ Nenhum erro de validação encontrado');
        }
        
        // Tentar salvar
        const saveButton = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(btn => 
            btn.textContent.toLowerCase().includes('salvar') ||
            btn.textContent.toLowerCase().includes('save')
          );
        });
        
        if (saveButton) {
          console.log('💾 Clicando em salvar...');
          await saveButton.click();
          
          // Aguardar resposta
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Verificar mensagens de sucesso ou erro após salvar
          const responseMessages = await page.evaluate(() => {
            const messages = [];
            
            // Procurar por toasts ou mensagens de resposta
            const messageSelectors = [
              '[role="alert"]',
              '.toast',
              '.notification',
              '.success',
              '.error',
              '[class*="toast"]',
              '[class*="alert"]'
            ];
            
            messageSelectors.forEach(selector => {
              const elements = document.querySelectorAll(selector);
              elements.forEach(el => {
                if (el.textContent.trim()) {
                  messages.push({
                    selector,
                    text: el.textContent.trim()
                  });
                }
              });
            });
            
            return messages;
          });
          
          if (responseMessages.length > 0) {
            console.log('📢 Mensagens após salvar:');
            responseMessages.forEach(msg => {
              console.log(`   - ${msg.selector}: ${msg.text}`);
            });
          } else {
            console.log('🔇 Nenhuma mensagem de resposta encontrada');
          }
        }
      } else {
        console.log('❌ Campo de logo não encontrado');
      }
    }

    console.log('\n✅ Teste de debug concluído');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
})();