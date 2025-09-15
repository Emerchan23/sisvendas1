// Script de teste para Configurações de Autenticação
const testAuthConfig = async () => {
  console.log('🧪 Iniciando testes das Configurações de Autenticação...');
  
  // Teste 1: Verificar se a API GET está funcionando
  console.log('\n📋 Teste 1: Carregando configurações atuais...');
  try {
    const response = await fetch('http://localhost:3000/api/config/auth');
    const currentConfig = await response.json();
    console.log('✅ Configurações carregadas:', currentConfig);
  } catch (error) {
    console.error('❌ Erro ao carregar configurações:', error.message);
  }
  
  // Teste 2: Testar salvamento com valores válidos
  console.log('\n💾 Teste 2: Salvando configurações válidas...');
  const validConfig = {
    normalExpiryHours: 3,
    rememberMeExpiryDays: 14,
    sessionCheckInterval: 10,
    warningTime: 2
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/config/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validConfig)
    });
    
    const result = await response.json();
    if (response.ok) {
      console.log('✅ Configurações salvas com sucesso:', result);
    } else {
      console.error('❌ Erro ao salvar:', result);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
  
  // Teste 3: Verificar se as configurações foram salvas
  console.log('\n🔍 Teste 3: Verificando se as configurações foram salvas...');
  try {
    const response = await fetch('http://localhost:3000/api/config/auth');
    const savedConfig = await response.json();
    
    const isValid = (
      savedConfig.normalExpiryHours === validConfig.normalExpiryHours &&
      savedConfig.rememberMeExpiryDays === validConfig.rememberMeExpiryDays &&
      savedConfig.sessionCheckInterval === validConfig.sessionCheckInterval &&
      savedConfig.warningTime === validConfig.warningTime
    );
    
    if (isValid) {
      console.log('✅ Configurações verificadas com sucesso!');
    } else {
      console.log('❌ Configurações não foram salvas corretamente');
      console.log('Esperado:', validConfig);
      console.log('Recebido:', savedConfig);
    }
  } catch (error) {
    console.error('❌ Erro ao verificar configurações:', error.message);
  }
  
  // Teste 4: Testar valores extremos
  console.log('\n⚠️ Teste 4: Testando valores extremos...');
  const extremeConfig = {
    normalExpiryHours: 0,
    rememberMeExpiryDays: -1,
    sessionCheckInterval: 999,
    warningTime: 0
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/config/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(extremeConfig)
    });
    
    const result = await response.json();
    console.log('📊 Resultado com valores extremos:', result);
  } catch (error) {
    console.error('❌ Erro com valores extremos:', error.message);
  }
  
  // Teste 5: Restaurar configurações padrão
  console.log('\n🔄 Teste 5: Restaurando configurações padrão...');
  const defaultConfig = {
    normalExpiryHours: 2,
    rememberMeExpiryDays: 7,
    sessionCheckInterval: 5,
    warningTime: 5
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/config/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(defaultConfig)
    });
    
    const result = await response.json();
    if (response.ok) {
      console.log('✅ Configurações padrão restauradas!');
    } else {
      console.error('❌ Erro ao restaurar configurações padrão:', result);
    }
  } catch (error) {
    console.error('❌ Erro ao restaurar configurações:', error.message);
  }
  
  console.log('\n🏁 Testes concluídos!');
};

// Executar os testes
testAuthConfig().catch(console.error);