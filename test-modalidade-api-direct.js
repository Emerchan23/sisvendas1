const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

async function testModalidadeAPIDirect() {
  console.log('🚀 Testando salvamento de modalidade via API direta...');
  
  // Conectar ao banco de dados
  const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
  const db = new Database(dbPath);
  
  try {
    // Verificar se existe cliente para teste
    let cliente = db.prepare('SELECT id FROM clientes LIMIT 1').get();
    if (!cliente) {
      const clienteId = uuidv4();
      db.prepare(`
        INSERT INTO clientes (id, nome, email, telefone, endereco, cidade, estado, cep)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(clienteId, 'Cliente Teste API', 'teste@api.com', '11999999999', 'Rua API', 'São Paulo', 'SP', '01234-567');
      cliente = { id: clienteId };
      console.log('📋 Cliente de teste criado:', clienteId);
    }
    
    // Dados do orçamento para teste
    const testData = {
      numero: `API-TEST-${Date.now()}`,
      cliente_id: cliente.id,
      data_orcamento: new Date().toISOString().split('T')[0],
      data_validade: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      descricao: 'Teste de modalidade via API',
      observacoes: 'Teste automatizado',
      condicoes_pagamento: '30 dias',
      prazo_entrega: '15 dias',
      vendedor_id: null,
      desconto: 0,
      modalidade: 'PREGAO',
      numero_pregao: '123456/2024',
      numero_dispensa: null,
      numero_processo: null,
      itens: [
        {
          descricao: 'Item de teste API',
          marca: 'Marca Teste',
          quantidade: 2,
          valor_unitario: 150.00,
          link_ref: '',
          custo_ref: 0
        }
      ]
    };
    
    console.log('📤 Dados sendo enviados:');
    console.log('  - Modalidade:', testData.modalidade);
    console.log('  - Número Pregão:', testData.numero_pregao);
    console.log('  - Cliente ID:', testData.cliente_id);
    
    // Fazer requisição POST para a API
    const response = await fetch('http://localhost:3145/api/orcamentos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📥 Status da resposta:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Orçamento criado com sucesso!');
      console.log('📋 Resposta da API:');
      console.log('  - ID:', result.id);
      console.log('  - Número:', result.numero);
      console.log('  - Modalidade na resposta:', result.modalidade);
      console.log('  - Número Pregão na resposta:', result.numero_pregao);
      
      // Verificar no banco de dados
      console.log('\n🔍 Verificando no banco de dados...');
      const savedOrcamento = db.prepare(`
        SELECT id, numero, modalidade, numero_pregao, cliente_id
        FROM orcamentos 
        WHERE numero = ?
      `).get(testData.numero);
      
      if (savedOrcamento) {
        console.log('✅ Orçamento encontrado no banco:');
        console.log('  - ID:', savedOrcamento.id);
        console.log('  - Número:', savedOrcamento.numero);
        console.log('  - Modalidade salva:', savedOrcamento.modalidade);
        console.log('  - Número Pregão salvo:', savedOrcamento.numero_pregao);
        console.log('  - Cliente ID:', savedOrcamento.cliente_id);
        
        // Verificar se a modalidade foi salva corretamente
        if (savedOrcamento.modalidade === 'PREGAO') {
          console.log('\n🎉 SUCESSO! Modalidade PREGAO foi salva corretamente!');
        } else {
          console.log('\n❌ PROBLEMA! Modalidade não foi salva corretamente.');
          console.log('   Esperado: PREGAO');
          console.log('   Encontrado:', savedOrcamento.modalidade);
        }
        
        // Verificar se o número do pregão foi salvo
        if (savedOrcamento.numero_pregao === '123456/2024') {
          console.log('✅ Número do pregão foi salvo corretamente!');
        } else {
          console.log('❌ PROBLEMA! Número do pregão não foi salvo corretamente.');
          console.log('   Esperado: 123456/2024');
          console.log('   Encontrado:', savedOrcamento.numero_pregao);
        }
        
        // Limpar dados de teste
        console.log('\n🧹 Limpando dados de teste...');
        db.prepare('DELETE FROM orcamento_itens WHERE orcamento_id = ?').run(savedOrcamento.id);
        db.prepare('DELETE FROM orcamentos WHERE id = ?').run(savedOrcamento.id);
        console.log('✅ Dados de teste removidos.');
        
      } else {
        console.log('❌ ERRO! Orçamento não foi encontrado no banco de dados.');
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ Erro na API:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    db.close();
  }
}

// Executar o teste
testModalidadeAPIDirect().catch(console.error);