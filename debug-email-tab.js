const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'http://localhost:3145';

async function debugEmailTab() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('🔍 Iniciando debug da aba de E-mail...');
    
    // 1. LOGIN
    console.log('🔐 Fazendo login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    
    // Aguardar campos aparecerem
    await page.waitForSelector('#email');
    await page.waitForSelector('#senha');
    
    // Preencher campos
    await page.type('#email', 'admin@sistema.com');
    await page.type('#senha', 'admin123');
    
    // Clicar no botão de login
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    console.log('✅ Login realizado');
    
    // 2. NAVEGAR PARA CONFIGURAÇÕES
    console.log('📋 Navegando para configurações...');
    await page.goto(`${BASE_URL}/configuracoes`, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 3. CLICAR NA ABA DE EMAIL
    console.log('📧 Procurando e clicando na aba de E-mail...');
    
    // Aguardar a aba de email aparecer
    await page.waitForSelector('[data-value="email"], #radix-\\:r0\\:-trigger-email, [id*="trigger-email"]', { timeout: 10000 });
    
    // Tentar diferentes seletores para a aba de email
    const emailTabSelectors = [
      '[data-value="email"]',
      '#radix-\\:r0\\:-trigger-email',
      '[id*="trigger-email"]',
      'button:contains("E-mail")',
      '[role="tab"]:contains("E-mail")'
    ];
    
    let emailTabClicked = false;
    for (const selector of emailTabSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`✅ Encontrou aba de email com seletor: ${selector}`);
          await element.click();
          emailTabClicked = true;
          break;
        }
      } catch (e) {
        console.log(`❌ Seletor ${selector} não funcionou:`, e.message);
      }
    }
    
    if (!emailTabClicked) {
      // Tentar encontrar pelo texto
      const emailTab = await page.evaluateHandle(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.find(el => el.textContent && el.textContent.trim() === 'E-mail' && (el.tagName === 'BUTTON' || el.getAttribute('role') === 'tab'));
      });
      
      if (emailTab) {
        console.log('✅ Encontrou aba de email pelo texto');
        await emailTab.click();
        emailTabClicked = true;
      }
    }
    
    if (!emailTabClicked) {
      console.log('❌ Não conseguiu encontrar a aba de E-mail');
      return;
    }
    
    console.log('🔄 Clicou na aba de E-mail, aguardando carregamento...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 4. ANALISAR CAMPOS SMTP
    console.log('🔍 Analisando campos SMTP na aba E-mail...');
    
    // Buscar por campos SMTP específicos
    const smtpFields = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      const buttons = Array.from(document.querySelectorAll('button'));
      const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      
      return {
        inputs: inputs.map((input, index) => ({
          index,
          id: input.id || '',
          name: input.name || '',
          type: input.type || '',
          placeholder: input.placeholder || '',
          value: input.value || '',
          visible: input.offsetParent !== null
        })),
        buttons: buttons.map((btn, index) => ({
          index,
          text: btn.textContent?.trim() || '',
          id: btn.id || '',
          visible: btn.offsetParent !== null
        })),
        checkboxes: checkboxes.map((cb, index) => ({
          index,
          id: cb.id || '',
          name: cb.name || '',
          checked: cb.checked,
          visible: cb.offsetParent !== null
        }))
      };
    });
    
    console.log('\n📧 CAMPOS SMTP ENCONTRADOS:');
    console.log('\nInputs:');
    smtpFields.inputs.forEach(input => {
      if (input.visible) {
        console.log(`  ${input.index}: id="${input.id}" name="${input.name}" type="${input.type}" placeholder="${input.placeholder}" value="${input.value}"`);
      }
    });
    
    console.log('\nCheckboxes:');
    smtpFields.checkboxes.forEach(cb => {
      if (cb.visible) {
        console.log(`  ${cb.index}: id="${cb.id}" name="${cb.name}" checked=${cb.checked}`);
      }
    });
    
    console.log('\nBotões:');
    smtpFields.buttons.forEach(btn => {
      if (btn.visible && (btn.text.toLowerCase().includes('salvar') || btn.text.toLowerCase().includes('testar'))) {
        console.log(`  ${btn.index}: "${btn.text}" id="${btn.id}"`);
      }
    });
    
    console.log('\n🔍 Debug da aba E-mail concluído! Pressione Enter para fechar...');
    
    // Aguardar input do usuário
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  }
}

debugEmailTab();