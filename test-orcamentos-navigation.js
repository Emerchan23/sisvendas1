const { chromium } = require('playwright');

async function testOrcamentosNavigation() {
  console.log('🧪 Testando navegação para orçamentos...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navegar para a página inicial
    console.log('📍 Navegando para http://localhost:3145');
    await page.goto('http://localhost:3145', { waitUntil: 'networkidle' });
    
    // Fazer login
    console.log('🔐 Fazendo login...');
    await page.fill('input[type="email"]', 'admin@sistema.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento após login
    await page.waitForURL('http://localhost:3145/', { timeout: 10000 });
    console.log('✅ Login realizado com sucesso');
    
    // Procurar pelo link de orçamentos
    console.log('🔍 Procurando pelo link de orçamentos...');
    const orcamentosLink = await page.locator('a[href="/orcamentos"]').first();
    
    if (await orcamentosLink.count() > 0) {
      console.log('✅ Link de orçamentos encontrado');
      console.log('📝 Texto do link:', await orcamentosLink.textContent());
      
      // Clicar no link
      console.log('🖱️ Clicando no link de orçamentos...');
      await orcamentosLink.click();
      
      // Aguardar navegação
      await page.waitForURL('http://localhost:3145/orcamentos', { timeout: 10000 });
      console.log('✅ Navegação para orçamentos bem-sucedida');
      
      // Verificar se a página carregou corretamente
      const pageTitle = await page.locator('h1, [role="heading"]').first().textContent();
      console.log('📄 Título da página:', pageTitle);
      
      // Verificar se existem as abas esperadas
      const criarTab = await page.locator('text="Criar Orçamento"').count();
      const salvosTab = await page.locator('text="Orçamentos Salvos"').count();
      
      if (criarTab > 0 && salvosTab > 0) {
        console.log('✅ Página de orçamentos carregada corretamente com todas as abas');
        console.log('✅ TESTE PASSOU - Navegação para orçamentos funcionando');
      } else {
        console.log('❌ Página de orçamentos não carregou completamente');
        console.log('❌ TESTE FALHOU - Conteúdo da página incompleto');
      }
      
    } else {
      console.log('❌ Link de orçamentos não encontrado');
      console.log('❌ TESTE FALHOU - Link não existe no DOM');
      
      // Listar todos os links disponíveis para debug
      const allLinks = await page.locator('a').all();
      console.log('🔍 Links disponíveis:');
      for (const link of allLinks) {
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        if (href && text) {
          console.log(`  - ${text.trim()}: ${href}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.log('❌ TESTE FALHOU - Erro de execução');
  } finally {
    await browser.close();
  }
}

testOrcamentosNavigation();