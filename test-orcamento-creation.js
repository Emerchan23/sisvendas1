const fetch = require('node-fetch');

// Dados de teste para criar um orçamento com itens
const testData = {
  cliente_id: "f72ad049-0c26-4b23-9303-fe73bd8eb03e", // ID do cliente criado no teste anterior
  numero: "TEST/2025",
  data_criacao: new Date().toISOString().split('T')[0],
  data_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  valor_total: 150.00,
  status: "pendente",
  observacoes: "Teste de criação de orçamento com itens",
  itens: [
    {
      descricao: "Produto Teste 1",
      marca: "Marca A",
      unidade: "un",
      quantidade: 2,
      valor_unitario: 50.00,
      valor_total: 100.00
    },
    {
      descricao: "Produto Teste 2", 
      marca: "Marca B",
      unidade: "kg",
      quantidade: 1,
      valor_unitario: 50.00,
      valor_total: 50.00
    }
  ]
};

async function testOrcamentoCreation() {
  try {
    console.log('=== TESTE DE CRIAÇÃO DE ORÇAMENTO ===');
    console.log('Dados enviados:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3145/api/orcamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('\n=== RESPOSTA DA API ===');
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.text();
    console.log('Body:', responseData);
    
    if (response.ok) {
      const result = JSON.parse(responseData);
      console.log('\n=== ORÇAMENTO CRIADO ===');
      console.log('ID:', result.id);
      console.log('Número:', result.numero);
      
      // Verificar se o orçamento foi criado com os itens
      console.log('\n=== VERIFICANDO ORÇAMENTO CRIADO ===');
      const checkResponse = await fetch(`http://localhost:3145/api/orcamentos?incluir_itens=true`);
      const orcamentos = await checkResponse.json();
      
      const orcamentoCriado = orcamentos.find(o => o.id === result.id);
      if (orcamentoCriado) {
        console.log('Orçamento encontrado:', orcamentoCriado.numero);
        console.log('Itens salvos:', orcamentoCriado.itens?.length || 0);
        if (orcamentoCriado.itens && orcamentoCriado.itens.length > 0) {
          console.log('Detalhes dos itens:');
          orcamentoCriado.itens.forEach((item, index) => {
            console.log(`  Item ${index + 1}:`, {
              descricao: item.descricao,
              quantidade: item.quantidade,
              valor_unitario: item.valor_unitario,
              valor_total: item.valor_total
            });
          });
        } else {
          console.log('❌ PROBLEMA: Nenhum item foi salvo!');
        }
      } else {
        console.log('❌ PROBLEMA: Orçamento não encontrado!');
      }
    } else {
      console.log('❌ ERRO na criação:', responseData);
    }
    
  } catch (error) {
    console.error('❌ ERRO no teste:', error.message);
  }
}

testOrcamentoCreation();