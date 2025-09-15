const puppeteer = require('puppeteer');
const fs = require('fs');

async function debugLogin() {
  console.log('🔍 Debugando página de login...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  try {
    // Navegar para a página de login
    console.log('📍 Navegando para http://localhost:3145/login');
    await page.goto('http://localhost:3145/login', { waitUntil: 'networkidle2' });
    
    // Aguardar um pouco para a página carregar
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Capturar screenshot
    await page.screenshot({ path: 'debug-login.png', fullPage: true });
    console.log('📸 Screenshot salvo como debug-login.png');
    
    // Buscar todos os inputs
    console.log('🔍 Buscando todos os inputs na página...');
    const inputs = await page.evaluate(() => {
      const allInputs = document.querySelectorAll('input');
      return Array.from(allInputs).map(input => ({
        id: input.id,
        name: input.name,
        type: input.type,
        placeholder: input.placeholder,
        className: input.className,
        outerHTML: input.outerHTML.substring(0, 200)
      }));
    });
    
    console.log('📋 Inputs encontrados:');
    inputs.forEach((input, index) => {
      console.log(`${index + 1}. ID: '${input.id}', Name: '${input.name}', Type: '${input.type}', Placeholder: '${input.placeholder}'`);
      console.log(`   Class: '${input.className}'`);
      console.log(`   HTML: ${input.outerHTML}`);
      console.log('---');
    });
    
    // Buscar todos os botões
    console.log('🔍 Buscando todos os botões na página...');
    const buttons = await page.evaluate(() => {
      const allButtons = document.querySelectorAll('button');
      return Array.from(allButtons).map(button => ({
        id: button.id,
        className: button.className,
        textContent: button.textContent.trim(),
        type: button.type,
        outerHTML: button.outerHTML.substring(0, 200)
      }));
    });
    
    console.log('🔘 Botões encontrados:');
    buttons.forEach((button, index) => {
      console.log(`${index + 1}. ID: '${button.id}', Text: '${button.textContent}', Type: '${button.type}'`);
      console.log(`   Class: '${button.className}'`);
      console.log(`   HTML: ${button.outerHTML}`);
      console.log('---');
    });
    
    // Aguardar 10 segundos para inspeção manual
    console.log('⏳ Aguardando 10 segundos para inspeção manual...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  } finally {
    await browser.close();
    console.log('✅ Debug concluído!');
  }
}

debugLogin().catch(console.error);