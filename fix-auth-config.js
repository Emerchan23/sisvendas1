const Database = require('better-sqlite3');

console.log('🔧 Corrigindo configurações de autenticação...');

const db = new Database('./data/erp.sqlite');

try {
  // Verificar configurações existentes
  console.log('📋 Verificando configurações existentes...');
  const configs = db.prepare(`
    SELECT * FROM configuracoes 
    WHERE config_key IN ('normalExpiryHours', 'rememberMeExpiryDays')
  `).all();
  
  console.log('Configurações encontradas:', configs.length);
  
  if (configs.length === 0) {
    console.log('➕ Inserindo configurações padrão...');
    
    // Inserir configuração de expiração normal
    db.prepare(`
      INSERT INTO configuracoes (id, config_key, config_value, descricao) 
      VALUES (?, ?, ?, ?)
    `).run(
      'auth-normal-expiry', 
      'normalExpiryHours', 
      '2', 
      'Tempo de expiração normal do token (horas)'
    );
    
    // Inserir configuração de lembrar-me
    db.prepare(`
      INSERT INTO configuracoes (id, config_key, config_value, descricao) 
      VALUES (?, ?, ?, ?)
    `).run(
      'auth-remember-expiry', 
      'rememberMeExpiryDays', 
      '7', 
      'Tempo de expiração com lembrar-me (dias)'
    );
    
    console.log('✅ Configurações inseridas com sucesso!');
  } else {
    console.log('ℹ️ Configurações já existem:');
    configs.forEach(config => {
      console.log(`  - ${config.config_key}: ${config.config_value}`);
    });
  }
  
  // Verificar configurações finais
  const finalConfigs = db.prepare(`
    SELECT * FROM configuracoes 
    WHERE config_key IN ('normalExpiryHours', 'rememberMeExpiryDays')
  `).all();
  
  console.log('\n📊 Configurações finais:');
  finalConfigs.forEach(config => {
    console.log(`  ✓ ${config.config_key}: ${config.config_value}`);
  });
  
} catch (error) {
  console.error('❌ Erro:', error.message);
} finally {
  db.close();
  console.log('\n🔒 Banco de dados fechado.');
}