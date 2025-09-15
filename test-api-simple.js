const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testOrcamentoAPI() {
  console.log('🔍 Testando API de orçamentos...');
  
  try {
    // 1. Listar orçamentos existentes
    console.log('\n1. Listando orçamentos existentes...');
    const listOptions = {
      hostname: 'localhost',
      port: 3145,
      path: '/api/orcamentos?incluir_itens=true',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const listResponse = await makeRequest(listOptions);
    console.log('Status:', listResponse.status);
    console.log('Orçamentos existentes:', Array.isArray(listResponse.data) ? listResponse.data.length : 'Erro');
    
    if (Array.isArray(listResponse.data) && listResponse.data.length > 0) {
      console.log('Primeiro orçamento:', JSON.stringify(listResponse.data[0], null, 2));
    }
    
    // 2. Criar novo orçamento
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
    
    const createOptions = {
      hostname: 'localhost',
      port: 3145,
      path: '/api/orcamentos',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(novoOrcamento))
      }
    };
    
    const createResponse = await makeRequest(createOptions, novoOrcamento);
    console.log('\nResposta da criação:');
    console.log('Status:', createResponse.status);
    console.log('Dados retornados:', JSON.stringify(createResponse.data, null, 2));
    
    if (createResponse.status === 201 && createResponse.data.id) {
      console.log('\n✅ Orçamento criado com sucesso!');
      console.log('ID:', createResponse.data.id);
      console.log('Número:', createResponse.data.numero);
      console.log('Valor total:', createResponse.data.valor_total);
      console.log('Itens salvos:', createResponse.data.itens?.length || 0);
      
      if (createResponse.data.itens && createResponse.data.itens.length > 0) {
        console.log('\nDetalhes dos itens salvos:');
        createResponse.data.itens.forEach((item, index) => {
          console.log(`Item ${index + 1}:`);
          console.log(`  - ID: ${item.id}`);
          console.log(`  - Descrição: ${item.descricao}`);
          console.log(`  - Marca: ${item.marca}`);
          console.log(`  - Quantidade: ${item.quantidade}`);
          console.log(`  - Valor Unitário: ${item.valor_unitario}`);
          console.log(`  - Valor Total: ${item.valor_total}`);
          console.log(`  - Link Ref: ${item.link_ref}`);
          console.log(`  - Custo Ref: ${item.custo_ref}`);
        });
      }
      
      // 3. Verificar se conseguimos buscar o orçamento criado
      console.log('\n3. Verificando orçamento criado...');
      const getResponse = await makeRequest(listOptions);
      
      if (Array.isArray(getResponse.data)) {
        const orcamentoEncontrado = getResponse.data.find(o => o.id === createResponse.data.id);
        
        if (orcamentoEncontrado) {
          console.log('✅ Orçamento encontrado na listagem!');
          console.log('Itens no orçamento encontrado:', orcamentoEncontrado.itens?.length || 0);
          
          if (orcamentoEncontrado.itens && orcamentoEncontrado.itens.length > 0) {
            console.log('\nItens recuperados da listagem:');
            orcamentoEncontrado.itens.forEach((item, index) => {
              console.log(`Item ${index + 1}:`);
              console.log(`  - Descrição: ${item.descricao}`);
              console.log(`  - Valor Unitário: ${item.valorUnitario}`);
              console.log(`  - Link Ref: ${item.linkRef}`);
              console.log(`  - Custo Ref: ${item.custoRef}`);
            });
            
            // Verificar se os valores estão corretos
            const primeiroItem = orcamentoEncontrado.itens[0];
            if (primeiroItem.valorUnitario === 25.50) {
              console.log('\n✅ VALOR UNITÁRIO SALVO CORRETAMENTE!');
            } else {
              console.log(`\n❌ VALOR UNITÁRIO INCORRETO! Esperado: 25.50, Encontrado: ${primeiroItem.valorUnitario}`);
            }
            
            if (primeiroItem.linkRef === 'https://exemplo.com/produto-a') {
              console.log('✅ LINK REF SALVO CORRETAMENTE!');
            } else {
              console.log(`❌ LINK REF INCORRETO! Esperado: https://exemplo.com/produto-a, Encontrado: ${primeiroItem.linkRef}`);
            }
            
            if (primeiroItem.custoRef === 20.00) {
              console.log('✅ CUSTO REF SALVO CORRETAMENTE!');
            } else {
              console.log(`❌ CUSTO REF INCORRETO! Esperado: 20.00, Encontrado: ${primeiroItem.custoRef}`);
            }
          }
        } else {
          console.log('❌ Orçamento não encontrado na listagem!');
        }
      }
    } else {
      console.log('❌ Falha ao criar orçamento');
      if (createResponse.data.error) {
        console.log('Erro:', createResponse.data.error);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testOrcamentoAPI();