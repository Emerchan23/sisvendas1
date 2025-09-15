const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('🚀 Testando botão Importar Backup diretamente...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Interceptar requisições de rede
  await page.setRequestInterception(true);
  
  page.on('request', (request) => {
    console.log(`📤 Requisição: ${request.method()} ${request.url()}`);
    if (request.url().includes('/api/backup')) {
      console.log('📋 Headers:', request.headers());
      console.log('📋 Body:', request.postData());
    }
    request.continue();
  });
  
  page.on('response', async (response) => {
    if (response.url().includes('/api/backup')) {
      console.log(`📥 Resposta API Backup: ${response.status()}`);
      try {
        const responseText = await response.text();
        console.log('📋 Resposta:', responseText);
      } catch (e) {
        console.log('❌ Erro ao ler resposta:', e.message);
      }
    }
  });
  
  // Capturar erros do console
  page.on('console', msg => {
    console.log(`🖥️ Console [${msg.type()}]:`, msg.text());
  });
  
  try {
    // 1. Ir direto para configurações (assumindo login já feito)
    console.log('🔧 Navegando para configurações...');
    await page.goto('http://localhost:3145/configuracoes');
    
    // Aguardar carregamento da página
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 2. Verificar se a página carregou
    const title = await page.title();
    console.log('📄 Título da página:', title);
    
    // 3. Verificar se existe o TabsList
    console.log('🔍 Verificando estrutura de abas...');
    const tabsList = await page.$('[role="tablist"]');
    if (!tabsList) {
      console.log('❌ TabsList não encontrado');
      // Verificar se há algum elemento com data-slot="tabs-list"
      const altTabsList = await page.$('[data-slot="tabs-list"]');
      if (!altTabsList) {
        console.log('❌ Nenhuma estrutura de abas encontrada');
        // Listar todos os elementos com role
        const roleElements = await page.$$eval('[role]', elements => 
          elements.map(el => ({ role: el.getAttribute('role'), tag: el.tagName, text: el.textContent?.substring(0, 50) }))
        );
        console.log('📋 Elementos com role:', roleElements);
        return;
      }
    }
    console.log('✅ Estrutura de abas encontrada');
    
    // 4. Listar todas as abas disponíveis
    console.log('📋 Listando abas disponíveis...');
    const tabs = await page.$$eval('[role="tab"], [data-slot="tabs-trigger"]', tabs => 
      tabs.map(tab => ({ 
        text: tab.textContent, 
        value: tab.getAttribute('value') || tab.getAttribute('data-value'),
        state: tab.getAttribute('data-state')
      }))
    );
    console.log('📋 Abas encontradas:', tabs);
    
    // 5. Tentar clicar na aba Backup
    console.log('📁 Tentando ativar aba Backup...');
    const backupTab = await page.$('[value="backup"], [data-value="backup"]');
    if (!backupTab) {
      console.log('❌ Aba Backup não encontrada');
      return;
    }
    
    await backupTab.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Aba Backup clicada');
    
    // 6. Verificar se o conteúdo da aba Backup está visível
    console.log('🔍 Verificando conteúdo da aba Backup...');
    const backupContent = await page.$('[value="backup"][data-state="active"], [data-value="backup"][data-state="active"]');
    if (!backupContent) {
      console.log('⚠️ Conteúdo da aba Backup pode não estar ativo');
    }
    
    // 7. Procurar pelo botão Importar Backup
    console.log('🔍 Procurando botão Importar Backup...');
    
    // Tentar diferentes seletores
    const selectors = [
      'button:has-text("Importar Backup")',
      'button[class*="border-orange"]:has-text("Importar")',
      'button:contains("Importar Backup")',
      'button:contains("Importar")',
      '[role="button"]:has-text("Importar")',
    ];
    
    let importButton = null;
    for (const selector of selectors) {
      try {
        importButton = await page.$(selector);
        if (importButton) {
          console.log(`✅ Botão encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        // Seletor não suportado, continuar
      }
    }
    
    if (!importButton) {
      // Listar todos os botões na página
      console.log('📋 Listando todos os botões disponíveis...');
      const buttons = await page.$$eval('button', buttons => 
        buttons.map(btn => ({ 
          text: btn.textContent?.trim(), 
          classes: btn.className,
          visible: btn.offsetParent !== null
        }))
      );
      console.log('📋 Botões encontrados:', buttons.filter(btn => btn.visible));
      
      // Tentar encontrar por texto parcial
      const importButtons = buttons.filter(btn => 
        btn.text && btn.text.toLowerCase().includes('import') && btn.visible
      );
      console.log('📋 Botões com "import":', importButtons);
      
      if (importButtons.length === 0) {
        console.log('❌ Nenhum botão de importar encontrado');
        return;
      }
    }
    
    // 8. Verificar se existe input de arquivo
    console.log('📂 Verificando input de arquivo...');
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      console.log('❌ Input de arquivo não encontrado');
      // Listar todos os inputs
      const inputs = await page.$$eval('input', inputs => 
        inputs.map(input => ({ 
          type: input.type, 
          accept: input.accept,
          style: input.style.display,
          hidden: input.hidden
        }))
      );
      console.log('📋 Inputs encontrados:', inputs);
    } else {
      console.log('✅ Input de arquivo encontrado');
      
      // Verificar propriedades do input
      const inputProps = await page.evaluate((input) => {
        return {
          accept: input.accept,
          style: window.getComputedStyle(input).display,
          hidden: input.hidden,
          disabled: input.disabled
        };
      }, fileInput);
      console.log('📋 Propriedades do input:', inputProps);
    }
    
    console.log('✅ Análise do botão Importar Backup concluída');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    console.log('🔍 Navegador mantido aberto para inspeção. Pressione Ctrl+C para fechar.');
    // await browser.close();
  }
})();