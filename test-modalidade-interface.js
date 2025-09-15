const { chromium } = require('playwright');
const Database = require('better-sqlite3');
const path = require('path');

async function testModalidadeInterface() {
  console.log('🚀 Iniciando teste de modalidade via interface web...');
  
  // Conectar ao banco de dados
  const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
  const db = new Database(dbPath);
  
  let browser;
  try {
    // Iniciar o navegador
    browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Interceptar logs do console
    page.on('console', msg => {
      if (msg.text().includes('MODALIDADE DEBUG')) {
        console.log('🖥️ [BROWSER]', msg.text());
      }
    });
    
    // Navegar para a página
    console.log('📱 Navegando para http://localhost:3145...');
    await page.goto('http://localhost:3145');
    await page.waitForTimeout(2000);
    
    // Clicar no botão "Novo Orçamento"
    console.log('➕ Clicando em "Novo Orçamento"...');
    await page.click('text=Novo Orçamento');
    await page.waitForTimeout(1000);
    
    // Preencher dados básicos do orçamento
    console.log('📝 Preenchendo dados do orçamento...');
    
    // Selecionar cliente (primeiro da lista)
    await page.click('[data-testid="cliente-select"], .select-trigger, [role="combobox"]');
    await page.waitForTimeout(500);
    await page.click('[role="option"]:first-child, .select-item:first-child');
    await page.waitForTimeout(500);
    
    // Preencher observações
    await page.fill('textarea[placeholder*="observações"], textarea[placeholder*="Observações"]', 'Teste de modalidade');
    
    // Adicionar um item
    console.log('📦 Adicionando item ao orçamento...');
    await page.fill('input[placeholder*="Descrição"], input[placeholder*="descrição"]', 'Item de teste');
    await page.fill('input[placeholder*="Quantidade"], input[type="number"]:first-of-type', '1');
    await page.fill('input[placeholder*="Valor"], input[placeholder*="valor"]', '100');
    
    // Selecionar modalidade PREGÃO
    console.log('🎯 Selecionando modalidade PREGÃO...');
    await page.click('text=Modalidade');
    await page.waitForTimeout(500);
    
    // Procurar pelo select de modalidade
    const modalidadeSelect = await page.locator('select, [role="combobox"]').filter({ hasText: /modalidade|compra/i }).first();
    if (await modalidadeSelect.count() > 0) {
      await modalidadeSelect.click();
      await page.waitForTimeout(500);
      await page.click('text=Pregão');
    } else {
      // Tentar abordagem alternativa
      await page.click('[data-testid="modalidade-select"]');
      await page.waitForTimeout(500);
      await page.click('text=Pregão');
    }
    
    await page.waitForTimeout(500);
    
    // Preencher número do pregão
    console.log('🔢 Preenchendo número do pregão...');
    await page.fill('input[placeholder*="processo"], input[placeholder*="pregão"]', '123456/2024');
    
    // Salvar o orçamento
    console.log('💾 Salvando orçamento...');
    await page.click('button:has-text("Salvar"), button:has-text("Criar")');
    
    // Aguardar o salvamento
    await page.waitForTimeout(3000);
    
    // Verificar se apareceu mensagem de sucesso
    const successMessage = await page.locator('text=sucesso').count();
    if (successMessage > 0) {
      console.log('✅ Mensagem de sucesso encontrada!');
    }
    
    // Verificar no banco de dados
    console.log('🔍 Verificando no banco de dados...');
    const orcamentos = db.prepare(`
      SELECT id, numero, modalidade, numero_pregao 
      FROM orcamentos 
      WHERE modalidade = 'PREGAO' 
      ORDER BY id DESC 
      LIMIT 1
    `).all();
    
    if (orcamentos.length > 0) {
      const orcamento = orcamentos[0];
      console.log('✅ Orçamento encontrado no banco:');
      console.log('  - ID:', orcamento.id);
      console.log('  - Número:', orcamento.numero);
      console.log('  - Modalidade:', orcamento.modalidade);
      console.log('  - Número Pregão:', orcamento.numero_pregao);
      
      if (orcamento.modalidade === 'PREGAO') {
        console.log('🎉 SUCESSO! Modalidade foi salva corretamente!');
      } else {
        console.log('❌ PROBLEMA! Modalidade não foi salva corretamente.');
        console.log('   Esperado: PREGAO');
        console.log('   Encontrado:', orcamento.modalidade);
      }
    } else {
      console.log('❌ PROBLEMA! Nenhum orçamento com modalidade PREGAO foi encontrado.');
      
      // Verificar todos os orçamentos recentes
      const todosOrcamentos = db.prepare(`
        SELECT id, numero, modalidade, numero_pregao 
        FROM orcamentos 
        ORDER BY id DESC 
        LIMIT 5
      `).all();
      
      console.log('📋 Últimos 5 orçamentos no banco:');
      todosOrcamentos.forEach((orc, index) => {
        console.log(`  ${index + 1}. ID: ${orc.id}, Modalidade: ${orc.modalidade}, Pregão: ${orc.numero_pregao}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
    db.close();
  }
}

// Executar o teste
testModalidadeInterface().catch(console.error);