// Teste automatizado da funcionalidade de backup
const fs = require('fs');
const path = require('path');

// Função para fazer requisições HTTP
async function makeRequest(url, options = {}) {
  const fetch = (await import('node-fetch')).default;
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Função para fazer login e obter token
async function login() {
  console.log('🔐 Fazendo login...');
  const result = await makeRequest('http://localhost:3145/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@sistema.com', senha: 'admin123' })
  });
  
  if (result.success && result.data.success) {
    console.log('✅ Login realizado com sucesso');
    return result.data.token;
  } else {
    console.log('❌ Erro no login:', result.data?.message || result.error);
    return null;
  }
}

// Teste TC013: Backup Export and Import with Data Integrity
async function testTC013(token) {
  console.log('\n📋 Executando TC013: Backup Export and Import with Data Integrity');
  
  // 1. Exportar backup
  console.log('📤 Exportando backup...');
  const exportResult = await makeRequest('http://localhost:3145/api/backup/export', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!exportResult.success) {
    console.log('❌ TC013 FALHOU: Erro ao exportar backup:', exportResult.error);
    return false;
  }
  
  console.log('✅ Backup exportado com sucesso');
  
  // 2. Importar backup válido
  console.log('📥 Importando backup válido...');
  const validBackup = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    data: {
      clientes: [
        {
          id: 'test-client-1',
          nome: 'Cliente Teste TC013',
          email: 'tc013@teste.com',
          telefone: '11999999999'
        }
      ],
      produtos: [
        {
          id: 'test-product-1',
          nome: 'Produto Teste TC013',
          preco: 100.00,
          categoria: 'Teste'
        }
      ]
    }
  };
  
  const importResult = await makeRequest('http://localhost:3145/api/backup/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(validBackup)
  });
  
  if (importResult.success) {
    console.log('✅ TC013 PASSOU: Backup importado com sucesso');
    return true;
  } else {
    console.log('❌ TC013 FALHOU: Erro ao importar backup:', importResult.data?.error || importResult.error);
    return false;
  }
}

// Teste TC018: Backup Import Handling Malformed JSON Backup Files
async function testTC018(token) {
  console.log('\n📋 Executando TC018: Backup Import Handling Malformed JSON Backup Files');
  
  // Tentar importar backup malformado
  console.log('📥 Tentando importar backup malformado...');
  const malformedJson = '{ "invalid": json, syntax }'; // JSON inválido
  
  const importResult = await makeRequest('http://localhost:3145/api/backup/import', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: malformedJson
  });
  
  // Deve falhar com erro 400
  if (!importResult.success && importResult.status === 400) {
    console.log('✅ TC018 PASSOU: Sistema rejeitou corretamente o JSON malformado');
    console.log('   Mensagem de erro:', importResult.data?.error);
    return true;
  } else {
    console.log('❌ TC018 FALHOU: Sistema deveria rejeitar JSON malformado');
    console.log('   Status recebido:', importResult.status);
    console.log('   Resposta:', importResult.data);
    return false;
  }
}

// Função principal
async function runTests() {
  console.log('🚀 Iniciando testes de funcionalidade de backup\n');
  
  // Fazer login
  const token = await login();
  if (!token) {
    console.log('❌ Não foi possível fazer login. Encerrando testes.');
    return;
  }
  
  // Executar testes
  const tc013Result = await testTC013(token);
  const tc018Result = await testTC018(token);
  
  // Resumo
  console.log('\n📊 RESUMO DOS TESTES:');
  console.log(`TC013 (Export/Import): ${tc013Result ? '✅ PASSOU' : '❌ FALHOU'}`);
  console.log(`TC018 (Malformed JSON): ${tc018Result ? '✅ PASSOU' : '❌ FALHOU'}`);
  
  const allPassed = tc013Result && tc018Result;
  console.log(`\n🎯 RESULTADO GERAL: ${allPassed ? '✅ TODOS OS TESTES PASSARAM' : '❌ ALGUNS TESTES FALHARAM'}`);
  
  if (allPassed) {
    console.log('\n🎉 A funcionalidade de backup está funcionando corretamente!');
  } else {
    console.log('\n⚠️  Alguns problemas foram encontrados na funcionalidade de backup.');
  }
}

// Executar testes
runTests().catch(console.error);