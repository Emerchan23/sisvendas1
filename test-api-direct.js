const puppeteer = require('puppeteer');

async function testOrcamentoAPI() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Testando API de orçamentos diretamente...');
    
    // Primeiro, vamos listar orçamentos existentes
    console.log('\n1. Listando orçamentos existentes...');
    const response1 = await page.evaluate(async () => {
      const response = await fetch('http://localhost:3145/api/orcamentos?incluir_itens=true');
      const data = await response.json();
      return { status: response.status, data };
    });
    
    console.log('Status:', response1.status);
    console.log('Orçamentos existentes:', response1.data.length);
    if (response1.data.length > 0) {
      console.log('Primeiro orçamento:', JSON.stringify(response1.data[0], null, 2));
    }
    
    // Agora vamos criar um novo orçamento com dados corretos
    console.log('\n2. Criando novo orçamento...');
    
    const novoOrcamento = {
      numero: `TEST-${Date.now()}`,
      cliente_id: 'cliente-test-123',
      data_orcamento: new Date().toISOString().split('T')[0],
      data_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      observacoes: 'Teste de orçamento via API',
      modalidade: 'normal',
      itens: [
        {
          descricao: 'Produto Teste A',
          marca: 'Marca Teste',
          quantidade: 5,
          valor_unitario: 25.50,
          link_ref: 'https://exemplo.com/produto-a',
          custo_ref: 20.00
        },
        {
          descricao: 'Produto Teste B',
          marca: 'Marca Teste 2',
          quantidade: 3,
          valor_unitario: 15.75,
          link_ref: 'https://exemplo.com/produto-b',
          custo_ref: 12.00
        }
      ]
    };
    
    console.log('Dados enviados:', JSON.stringify(novoOrcamento, null, 2));
    
    const response2 = await page.evaluate(async (orcamentoData) => {
      const response = await fetch('http://localhost:3145/api/orcamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orcamentoData)
      });
      
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { error: 'Invalid JSON response', responseText };
      }
      
      return { 
        status: response.status, 
        statusText: response.statusText,
        data 
      };
    }, novoOrcamento);
    
    console.log('\nResposta da criação:');
    console.log('Status:', response2.status, response2.statusText);
    console.log('Dados retornados:', JSON.stringify(response2.data, null, 2));
    
    if (response2.status === 201 && response2.data.id) {
      console.log('\n✅ Orçamento criado com sucesso!');
      console.log('ID:', response2.data.id);
      console.log('Número:', response2.data.numero);
      console.log('Valor total:', response2.data.valor_total);
      console.log('Itens salvos:', response2.data.itens?.length || 0);
      
      if (response2.data.itens && response2.data.itens.length > 0) {
        console.log('\nDetalhes dos itens salvos:');
        response2.data.itens.forEach((item, index) => {
          console.log(`Item ${index + 1}:`);
          console.log(`  - Descrição: ${item.descricao}`);
          console.log(`  - Marca: ${item.marca}`);
          console.log(`  - Quantidade: ${item.quantidade}`);
          console.log(`  - Valor Unitário: ${item.valor_unitario}`);
          console.log(`  - Valor Total: ${item.valor_total}`);
          console.log(`  - Link Ref: ${item.link_ref}`);
          console.log(`  - Custo Ref: ${item.custo_ref}`);
        });
      }
      
      // Verificar se conseguimos buscar o orçamento criado
      console.log('\n3. Verificando orçamento criado...');
      const response3 = await page.evaluate(async (orcamentoId) => {
        const response = await fetch(`http://localhost:3145/api/orcamentos?incluir_itens=true`);
        const data = await response.json();
        const orcamentoEncontrado = data.find(o => o.id === orcamentoId);
        return { status: response.status, orcamento: orcamentoEncontrado };
      }, response2.data.id);
      
      if (response3.orcamento) {
        console.log('✅ Orçamento encontrado na listagem!');
        console.log('Itens no orçamento encontrado:', response3.orcamento.itens?.length || 0);
        
        if (response3.orcamento.itens && response3.orcamento.itens.length > 0) {
          console.log('\nItens recuperados da listagem:');
          response3.orcamento.itens.forEach((item, index) => {
            console.log(`Item ${index + 1}:`);
            console.log(`  - Descrição: ${item.descricao}`);
            console.log(`  - Valor Unitário: ${item.valorUnitario}`);
            console.log(`  - Link Ref: ${item.linkRef}`);
            console.log(`  - Custo Ref: ${item.custoRef}`);
          });
        }
      } else {
        console.log('❌ Orçamento não encontrado na listagem!');
      }
    } else {
      console.log('❌ Falha ao criar orçamento');
      if (response2.data.error) {
        console.log('Erro:', response2.data.error);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
}

testOrcamentoAPI();