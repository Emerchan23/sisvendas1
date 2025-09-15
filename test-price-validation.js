const { chromium } = require('playwright');

async function testPriceValidation() {
  console.log('🧪 Testando validação de preços negativos...');
  
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
    
    // Navegar para produtos
    console.log('🔍 Navegando para produtos...');
    const produtosLink = await page.locator('a[href="/produtos"]').first();
    await produtosLink.click();
    await page.waitForURL('http://localhost:3145/produtos', { timeout: 10000 });
    console.log('✅ Navegação para produtos bem-sucedida');
    
    // Clicar no botão "Adicionar produto"
    console.log('➕ Clicando em Adicionar produto...');
    const novoProdutoBtn = await page.locator('button:has-text("Adicionar produto")').first();
    await novoProdutoBtn.click();
    await page.waitForTimeout(2000);
    console.log('✅ Modal de novo produto aberto');
    
    // Preencher dados básicos do produto
    console.log('📝 Preenchendo dados do produto...');
    await page.fill('input[placeholder="Ex.: Vela aromática"]', 'Produto Teste Preço');
    await page.fill('input[placeholder="Unitário, Caixa, etc."]', 'Unitário');
    
    // Tentar inserir preço negativo
    console.log('💰 Tentando inserir preço negativo (-50)...');
    const precoInput = await page.locator('input').nth(4); // Campo de preço de venda
    await precoInput.click();
    await precoInput.fill('-50');
    
    // Verificar se o valor foi aceito
    await page.waitForTimeout(1000);
    const precoValue = await precoInput.inputValue();
    console.log('💰 Valor no campo de preço:', precoValue);
    
    if (precoValue === '' || precoValue === '0,00' || !precoValue.includes('-')) {
      console.log('✅ TESTE PASSOU - Preço negativo foi rejeitado');
      
      // Testar com valor positivo para confirmar que funciona
      console.log('💰 Testando com preço positivo (50)...');
      await precoInput.fill('50');
      await page.waitForTimeout(1000);
      const precoPositivo = await precoInput.inputValue();
      console.log('💰 Valor positivo no campo:', precoPositivo);
      
      if (precoPositivo && precoPositivo !== '0,00') {
        console.log('✅ Preço positivo aceito corretamente');
        
        // Testar campo de custo também
        console.log('💰 Testando custo negativo...');
        const custoInput = await page.locator('input').nth(5); // Campo de custo
        await custoInput.click();
        await custoInput.fill('-30');
        await page.waitForTimeout(1000);
        const custoValue = await custoInput.inputValue();
        console.log('💰 Valor no campo de custo:', custoValue);
        
        if (custoValue === '' || custoValue === '0,00' || !custoValue.includes('-')) {
          console.log('✅ TESTE PASSOU COMPLETAMENTE - Validação de preços negativos funcionando');
        } else {
          console.log('❌ TESTE FALHOU - Custo negativo foi aceito:', custoValue);
        }
      } else {
        console.log('❌ TESTE FALHOU - Preço positivo não foi aceito');
      }
    } else {
      console.log('❌ TESTE FALHOU - Preço negativo foi aceito:', precoValue);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.log('❌ TESTE FALHOU - Erro de execução');
  } finally {
    await browser.close();
  }
}

testPriceValidation();