const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();

async function testInterfaceReload() {
  console.log('🔄 Testando reload da interface SMTP...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // 1. Ir direto para a página inicial (pode já estar logado)
    console.log('🌐 Acessando página inicial...');
    await page.goto('http://localhost:3145/');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verificar se já está logado ou precisa fazer login
    const isLoginPage = await page.$('input[type="email"], input[name="email"], input[placeholder*="email"]');
    
    if (isLoginPage) {
      console.log('🔐 Fazendo login...');
      await page.type('input[type="email"], input[name="email"], input[placeholder*="email"]', 'admin@admin.com');
      await page.type('input[type="password"], input[name="password"]', 'admin');
      await page.click('button[type="submit"]');
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('✅ Login realizado');
    } else {
      console.log('✅ Já está logado');
    }
    
    // 2. Ir para configurações
    console.log('📋 Navegando para configurações...');
    await page.goto('http://localhost:3145/configuracoes');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 3. Procurar e clicar na aba de E-mail
    console.log('📧 Procurando aba E-mail...');
    const emailTabSelectors = [
      '[id*="trigger-email"]',
      '[data-value="email"]',
      'button:contains("E-mail")',
      'button:contains("Email")',
      '[role="tab"]:contains("E-mail")',
      '[role="tab"]:contains("Email")'
    ];
    
    let emailTabFound = false;
    for (const selector of emailTabSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`✅ Aba E-mail encontrada com seletor: ${selector}`);
          await element.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          emailTabFound = true;
          break;
        }
      } catch (error) {
        // Continuar tentando outros seletores
      }
    }
    
    if (!emailTabFound) {
      console.log('❌ Aba E-mail não encontrada, tentando buscar por texto...');
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="tab"], div[class*="tab"]'));
        const emailButton = buttons.find(btn => 
          btn.textContent.toLowerCase().includes('email') || 
          btn.textContent.toLowerCase().includes('e-mail')
        );
        if (emailButton) {
          emailButton.click();
        }
      });
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // 4. Verificar se os campos estão carregados com os dados salvos
    console.log('🔍 Verificando dados carregados na interface...');
    
    // Aguardar um pouco para os campos carregarem
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const fieldSelectors = {
      smtpHost: 'input[name="smtpHost"], input[id*="smtp-host"], input[id*="host"], input[placeholder*="smtp"], input[placeholder*="servidor"]',
      smtpPort: 'input[name="smtpPort"], input[id*="smtp-port"], input[id*="port"], input[placeholder*="porta"]',
      smtpUser: 'input[name="smtpUser"], input[id*="smtp-user"], input[id*="user"], input[placeholder*="usuário"], input[placeholder*="email"]',
      smtpPassword: 'input[name="smtpPassword"], input[id*="smtp-password"], input[id*="password"], input[type="password"]',
      smtpFromName: 'input[name="smtpFromName"], input[id*="smtp-from-name"], input[id*="from-name"], input[placeholder*="nome"]',
      smtpFromEmail: 'input[name="smtpFromEmail"], input[id*="smtp-from-email"], input[id*="from-email"], input[placeholder*="remetente"]'
    };
    
    const interfaceData = {};
    
    // Primeiro, vamos listar todos os inputs disponíveis
    console.log('📋 Inputs disponíveis na página:');
    const allInputs = await page.$$eval('input', inputs => 
      inputs.map(input => ({
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        type: input.type,
        value: input.value
      }))
    );
    
    allInputs.forEach((input, index) => {
      console.log(`  ${index + 1}. name="${input.name}" id="${input.id}" placeholder="${input.placeholder}" type="${input.type}" value="${input.value}"`);
    });
    
    for (const [field, selector] of Object.entries(fieldSelectors)) {
      try {
        const element = await page.$(selector);
        if (element) {
          const value = await element.evaluate(el => el.value);
          interfaceData[field] = value;
          console.log(`  ${field}: "${value}"`);
        } else {
          console.log(`  ${field}: [CAMPO NÃO ENCONTRADO]`);
          interfaceData[field] = null;
        }
      } catch (error) {
        console.log(`  ${field}: [ERRO: ${error.message}]`);
        interfaceData[field] = null;
      }
    }
    
    // 5. Verificar dados no banco
    console.log('\n🗄️ Verificando dados no banco...');
    const db = new sqlite3.Database('../Banco de dados Aqui/erp.sqlite');
    
    const bankData = await new Promise((resolve, reject) => {
      db.get('SELECT smtp_host, smtp_port, smtp_user, smtp_password, smtp_from_name, smtp_from_email FROM empresas WHERE id = ?', ['default'], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    console.log('📊 Dados no banco:');
    console.log(`  smtp_host: "${bankData.smtp_host}"`);
    console.log(`  smtp_port: "${bankData.smtp_port}"`);
    console.log(`  smtp_user: "${bankData.smtp_user}"`);
    console.log(`  smtp_from_name: "${bankData.smtp_from_name}"`);
    console.log(`  smtp_from_email: "${bankData.smtp_from_email}"`);
    
    // 6. Comparar dados
    console.log('\n🔍 Comparação Interface vs Banco:');
    const comparisons = {
      smtpHost: interfaceData.smtpHost === bankData.smtp_host,
      smtpPort: interfaceData.smtpPort === String(bankData.smtp_port),
      smtpUser: interfaceData.smtpUser === bankData.smtp_user,
      smtpFromName: interfaceData.smtpFromName === bankData.smtp_from_name,
      smtpFromEmail: interfaceData.smtpFromEmail === bankData.smtp_from_email
    };
    
    Object.entries(comparisons).forEach(([field, match]) => {
      const status = match ? '✅' : '❌';
      const interfaceValue = interfaceData[field] || 'undefined';
      const bankValue = bankData[field.replace(/([A-Z])/g, '_$1').toLowerCase()] || 'undefined';
      console.log(`  ${field}: ${status} Interface: "${interfaceValue}" | Banco: "${bankValue}"`);
    });
    
    const allMatch = Object.values(comparisons).every(m => m);
    console.log(`\n🎯 RESULTADO: ${allMatch ? '✅ INTERFACE CARREGOU DADOS CORRETAMENTE!' : '❌ INTERFACE NÃO CARREGOU DADOS CORRETAMENTE!'}`);
    
    // 7. Screenshot para debug
    await page.screenshot({ path: 'interface-reload-debug.png', fullPage: true });
    console.log('📸 Screenshot salvo como interface-reload-debug.png');
    
    db.close();
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    await page.screenshot({ path: 'interface-reload-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testInterfaceReload();