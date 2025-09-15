const fetch = require('node-fetch');

// Função para testar a API de configurações
async function testConfigAPI() {
  console.log('=== TESTANDO API DE CONFIGURAÇÕES ===');
  
  try {
    // Dados de teste para salvar configurações
    const testData = {
      nome: 'Empresa Teste',
      email: 'teste@empresa.com',
      telefone: '(11) 99999-9999',
      // Campos de backup que estavam causando o erro
      autoBackupEnabled: true,
      backupFrequency: 'weekly',
      backupTime: '03:00',
      keepLocalBackup: true,
      maxBackups: 10
    };

    console.log('📤 Enviando dados de teste para API...');
    console.log('🔗 URL: http://localhost:3145/api/config');
    console.log('📋 Dados:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3145/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('\n📥 Resposta da API:');
    console.log('🔢 Status:', response.status);
    console.log('📊 Status Text:', response.statusText);

    const responseData = await response.json();
    console.log('📄 Dados da resposta:', JSON.stringify(responseData, null, 2));

    if (response.ok) {
      console.log('\n✅ TESTE PASSOU! API de configurações funcionando corretamente.');
      return true;
    } else {
      console.log('\n❌ TESTE FALHOU! Ainda há erro na API.');
      return false;
    }

  } catch (error) {
    console.error('\n💥 ERRO DURANTE O TESTE:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('🔌 Verifique se o servidor está rodando em http://localhost:3145');
    }
    return false;
  }
}

// Executar o teste
testConfigAPI().then(success => {
  console.log('\n🏁 Teste concluído:', success ? 'SUCESSO' : 'FALHA');
  process.exit(success ? 0 : 1);
});