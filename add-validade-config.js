const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('🔧 Adicionando configuração de validade padrão...');

try {
  // Verificar se a configuração já existe
  const existingConfig = db.prepare('SELECT * FROM configuracoes WHERE config_key = ?').get('validade_orcamento');
  
  if (existingConfig) {
    console.log('✅ Configuração de validade já existe:', existingConfig);
  } else {
    // Inserir configuração de validade padrão
    const { v4: uuidv4 } = require('uuid');
    const insertConfig = db.prepare(`
      INSERT INTO configuracoes (id, config_key, config_value, descricao)
      VALUES (?, ?, ?, ?)
    `);
    
    insertConfig.run(
      uuidv4(),
      'validade_orcamento',
      '30',
      'Validade padrão em dias para orçamentos quando não informada'
    );
    
    console.log('✅ Configuração de validade padrão adicionada com sucesso!');
  }
  
  // Verificar todas as configurações relacionadas a orçamento
  console.log('\n📋 Configurações de orçamento:');
  const configs = db.prepare('SELECT * FROM configuracoes WHERE config_key LIKE ?').all('%orcamento%');
  
  configs.forEach(config => {
    console.log(`  - ${config.config_key}: ${config.config_value} (${config.descricao})`);
  });
  
} catch (error) {
  console.error('❌ Erro ao adicionar configuração:', error);
} finally {
  db.close();
  console.log('\n🔒 Conexão com banco fechada.');
}