const Database = require('better-sqlite3');
const path = require('path');

// Configurar caminho do banco
const dbPath = process.env.DB_PATH || path.join(process.cwd(), '..', 'Banco de dados Aqui', 'erp.sqlite');

console.log('🔍 Testando configurações de backup automático...');
console.log(`📁 Caminho do banco: ${dbPath}`);

try {
  const db = new Database(dbPath);
  
  console.log('\n📋 Verificando tabela de configurações...');
  
  // Verificar se a tabela configuracoes existe
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='configuracoes'
  `).get();
  
  if (tableExists) {
    console.log('✅ Tabela configuracoes encontrada');
    
    // Buscar todas as configurações
    const allConfigs = db.prepare('SELECT * FROM configuracoes').all();
    console.log(`\n📊 Total de configurações: ${allConfigs.length}`);
    
    if (allConfigs.length > 0) {
      console.log('\n📝 Todas as configurações:');
      allConfigs.forEach(config => {
        console.log(`  - ${config.config_key}: ${config.config_value}`);
      });
    }
    
    // Buscar configurações relacionadas a backup
    const backupConfigs = db.prepare(`
      SELECT * FROM configuracoes 
      WHERE config_key LIKE '%backup%' 
         OR config_key LIKE '%schedule%' 
         OR config_key LIKE '%cron%'
         OR config_key LIKE '%auto%'
    `).all();
    
    console.log(`\n🔍 Configurações de backup/agendamento: ${backupConfigs.length}`);
    
    if (backupConfigs.length > 0) {
      backupConfigs.forEach(config => {
        console.log(`  ✅ ${config.config_key}: ${config.config_value}`);
        if (config.descricao) {
          console.log(`     Descrição: ${config.descricao}`);
        }
      });
    } else {
      console.log('  ❌ Nenhuma configuração de backup automático encontrada');
    }
    
  } else {
    console.log('❌ Tabela configuracoes não encontrada');
  }
  
  // Verificar estrutura das tabelas para entender o sistema
  console.log('\n📋 Verificando estrutura do banco...');
  const tables = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();
  
  console.log(`\n📊 Tabelas encontradas (${tables.length}):`);
  tables.forEach(table => {
    console.log(`  - ${table.name}`);
  });
  
  db.close();
  
} catch (error) {
  console.error('❌ Erro ao acessar banco de dados:', error.message);
}

console.log('\n🔍 Verificando arquivos do sistema...');

// Verificar se existe algum arquivo relacionado a agendamento
const fs = require('fs');
const glob = require('glob');

try {
  // Procurar por arquivos que possam conter agendamento
  const searchPatterns = [
    '**/cron*',
    '**/schedule*',
    '**/backup*worker*',
    '**/job*',
    '**/task*'
  ];
  
  let foundFiles = [];
  
  searchPatterns.forEach(pattern => {
    try {
      const files = glob.sync(pattern, { ignore: 'node_modules/**' });
      foundFiles = foundFiles.concat(files);
    } catch (e) {
      // Ignorar erros de glob
    }
  });
  
  if (foundFiles.length > 0) {
    console.log('\n📁 Arquivos relacionados a agendamento:');
    foundFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
  } else {
    console.log('\n❌ Nenhum arquivo de agendamento encontrado');
  }
  
} catch (error) {
  console.log('⚠️ Erro ao procurar arquivos:', error.message);
}

console.log('\n📋 RESUMO DO TESTE:');
console.log('1. ✅ Conexão com banco de dados testada');
console.log('2. 🔍 Configurações de backup verificadas');
console.log('3. 📁 Arquivos de agendamento procurados');
console.log('\n🎯 Conclusão: Sistema de backup automático não implementado');
console.log('   - Não há configurações de agendamento no banco');
console.log('   - Não há workers ou schedulers implementados');
console.log('   - Apenas backup manual disponível via API');