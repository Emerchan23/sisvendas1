const Database = require('better-sqlite3');
const fetch = require('node-fetch');

async function testDetailedEdit() {
  console.log('🔍 Teste detalhado de edição de orçamento...');
  
  const db = new Database('./data/erp.sqlite');
  
  try {
    // 1. Verificar estado inicial
    console.log('\n📋 Estado inicial:');
    const orcamentos = db.prepare('SELECT id, numero FROM orcamentos').all();
    console.log('Orçamentos:', orcamentos);
    
    if (orcamentos.length === 0) {
      console.log('❌ Nenhum orçamento encontrado!');
      return;
    }
    
    const orcamentoId = orcamentos[0].id;
    console.log('🎯 Usando orçamento ID:', orcamentoId);
    
    // 2. Verificar itens antes
    const itensAntes = db.prepare('SELECT * FROM orcamento_itens WHERE orcamento_id = ?').all(orcamentoId);
    console.log('📊 Itens antes:', itensAntes.length);
    
    // 3. Fazer PATCH
    console.log('\n💾 Fazendo PATCH...');
    const patchData = {
      numero: '01/2025',
      valor_total: 500,
      status: 'pendente',
      observacoes: 'Teste detalhado',
      modalidade: 'DISPENSA',
      numero_dispensa: '33/2025',
      itens: [{
        produto_id: null,
        descricao: 'Item Teste Detalhado',
        marca: 'Marca Detalhada',
        quantidade: 2,
        valor_unitario: 100,
        observacoes: 'Teste de inserção detalhada',
        link_ref: '',
        custo_ref: 0
      }]
    };
    
    const response = await fetch(`http://localhost:3145/api/orcamentos/${orcamentoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patchData)
    });
    
    const result = await response.json();
    console.log('📤 Resposta PATCH:', response.status, result);
    
    // 4. Verificar imediatamente no banco
    console.log('\n🔍 Verificação imediata no banco:');
    const itensDepois = db.prepare('SELECT * FROM orcamento_itens WHERE orcamento_id = ?').all(orcamentoId);
    console.log('📊 Itens após PATCH:', itensDepois.length);
    
    if (itensDepois.length > 0) {
      console.log('✅ Itens encontrados:');
      itensDepois.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.descricao} - Qtd: ${item.quantidade} - Valor: ${item.valor_unitario}`);
      });
    } else {
      console.log('❌ Nenhum item encontrado no banco!');
      
      // Verificar se há itens órfãos
      const itensOrfaos = db.prepare('SELECT * FROM orcamento_itens').all();
      console.log('🔍 Total de itens na tabela:', itensOrfaos.length);
      if (itensOrfaos.length > 0) {
        console.log('📋 Itens órfãos encontrados:');
        itensOrfaos.forEach(item => {
          console.log(`  - ID: ${item.id}, Orçamento: ${item.orcamento_id}, Descrição: ${item.descricao}`);
        });
      }
    }
    
    // 5. Verificar via API GET
    console.log('\n🌐 Verificação via API GET:');
    const getResponse = await fetch(`http://localhost:3145/api/orcamentos/${orcamentoId}`);
    const orcamentoCompleto = await getResponse.json();
    console.log('📊 Itens via API:', orcamentoCompleto.itens ? orcamentoCompleto.itens.length : 0);
    
    if (orcamentoCompleto.itens && orcamentoCompleto.itens.length > 0) {
      console.log('✅ Itens via API:');
      orcamentoCompleto.itens.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.descricao} - Qtd: ${item.quantidade}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    db.close();
  }
}

testDetailedEdit();