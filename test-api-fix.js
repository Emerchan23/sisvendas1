// Teste da API corrigida
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3145/api';
const TEST_ID = '551b62a7-7346-4b1f-b935-932db239d06b';

async function testAPI() {
  console.log('=== TESTANDO API CORRIGIDA ===\n');
  
  // Teste 1: PUT com cliente_id inválido (deve retornar erro 400)
  console.log('🧪 Teste 1: PUT com cliente_id inválido');
  try {
    const response = await fetch(`${API_BASE}/outros-negocios/${TEST_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'emprestimo',
        descricao: 'Teste com cliente inválido',
        valor: 100,
        data_transacao: '2025-01-15',
        cliente_id: 'cliente-inexistente',
        status: 'pendente'
      })
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Resposta:', result);
    
    if (response.status === 400 && result.error.includes('Cliente não encontrado')) {
      console.log('✅ Teste 1 PASSOU - Erro de validação correto\n');
    } else {
      console.log('❌ Teste 1 FALHOU - Deveria retornar erro 400\n');
    }
  } catch (error) {
    console.log('❌ Teste 1 ERRO:', error.message, '\n');
  }
  
  // Teste 2: PUT com dados válidos (sem cliente_id)
  console.log('🧪 Teste 2: PUT com dados válidos');
  try {
    const response = await fetch(`${API_BASE}/outros-negocios/${TEST_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'emprestimo',
        descricao: 'Teste com dados válidos',
        valor: 150,
        data_transacao: '2025-01-15',
        status: 'pendente',
        multa_ativa: 0,
        multa_percent: 0
      })
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Resposta:', result);
    
    if (response.status === 200) {
      console.log('✅ Teste 2 PASSOU - Update realizado com sucesso\n');
    } else {
      console.log('❌ Teste 2 FALHOU - Deveria retornar status 200\n');
    }
  } catch (error) {
    console.log('❌ Teste 2 ERRO:', error.message, '\n');
  }
  
  // Teste 3: GET para verificar se o registro foi atualizado
  console.log('🧪 Teste 3: GET para verificar atualização');
  try {
    const response = await fetch(`${API_BASE}/outros-negocios`);
    const result = await response.json();
    
    const registro = result.find(item => item.id === TEST_ID);
    console.log('Status:', response.status);
    console.log('Registro encontrado:', registro ? 'SIM' : 'NÃO');
    
    if (registro) {
      console.log('Descrição atual:', registro.descricao);
      console.log('Valor atual:', registro.valor);
    }
    
    if (response.status === 200 && registro) {
      console.log('✅ Teste 3 PASSOU - Registro encontrado\n');
    } else {
      console.log('❌ Teste 3 FALHOU - Registro não encontrado\n');
    }
  } catch (error) {
    console.log('❌ Teste 3 ERRO:', error.message, '\n');
  }
  
  console.log('=== TESTES CONCLUÍDOS ===');
}

// Verificar se o servidor está rodando
fetch(`${API_BASE}/outros-negocios`)
  .then(() => {
    console.log('✅ Servidor está rodando, iniciando testes...\n');
    testAPI();
  })
  .catch(() => {
    console.log('❌ Servidor não está rodando. Execute "npm run dev" primeiro.');
  });