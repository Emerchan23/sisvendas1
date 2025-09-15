const fetch = require('node-fetch');

async function testOrcamentoList() {
  console.log('=== TESTE DE LISTAGEM DE ORÇAMENTOS ===');
  
  try {
    // Testar listagem de orçamentos sem itens
    console.log('\n1. Testando listagem de orçamentos (sem itens)...');
    const response1 = await fetch('http://localhost:3145/api/orcamentos');
    const orcamentos = await response1.json();
    
    console.log('Status:', response1.status);
    console.log('Quantidade de orçamentos:', orcamentos.length);
    
    if (orcamentos.length > 0) {
      console.log('Primeiro orçamento:', {
        id: orcamentos[0].id,
        numero: orcamentos[0].numero,
        cliente: orcamentos[0].cliente?.nome,
        valor_total: orcamentos[0].valor_total,
        itens_count: orcamentos[0].itens?.length || 0
      });
    }
    
    // Testar listagem de orçamentos com itens
    console.log('\n2. Testando listagem de orçamentos (com itens)...');
    const response2 = await fetch('http://localhost:3145/api/orcamentos?incluir_itens=true');
    const orcamentosComItens = await response2.json();
    
    console.log('Status:', response2.status);
    console.log('Quantidade de orçamentos:', orcamentosComItens.length);
    
    if (orcamentosComItens.length > 0) {
      const primeiro = orcamentosComItens[0];
      console.log('Primeiro orçamento com itens:', {
        id: primeiro.id,
        numero: primeiro.numero,
        cliente: primeiro.cliente?.nome,
        valor_total: primeiro.valor_total,
        itens_count: primeiro.itens?.length || 0
      });
      
      if (primeiro.itens && primeiro.itens.length > 0) {
        console.log('\n=== ITENS DO ORÇAMENTO ===');
        primeiro.itens.forEach((item, index) => {
          console.log(`Item ${index + 1}:`, {
            descricao: item.descricao,
            marca: item.marca,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valor_total: item.quantidade * item.valor_unitario
          });
        });
      } else {
        console.log('❌ Nenhum item encontrado no orçamento!');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testOrcamentoList();