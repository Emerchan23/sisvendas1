// Script para inicializar o banco de dados e verificar as tabelas
console.log('=== Inicializando banco de dados ===');

// Importar o módulo db que já tem todas as definições de tabelas
try {
  // Forçar a inicialização do banco importando o módulo
  const dbModule = require('./lib/db.ts');
  console.log('✅ Módulo db.ts importado com sucesso');
  
  // Aguardar um pouco para garantir que as tabelas foram criadas
  setTimeout(() => {
    // Agora verificar as tabelas usando better-sqlite3 diretamente
    const Database = require('better-sqlite3');
    const path = require('path');
    
    const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
    console.log('Caminho do banco:', dbPath);
    
    const db = new Database(dbPath);
    
    console.log('\n=== Verificando tabelas ===');
    
    // Verificar tabela outros_negocios
    const outrosNegociosTable = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='outros_negocios'`).all();
    console.log('Tabela outros_negocios existe:', outrosNegociosTable.length > 0);
    
    if (outrosNegociosTable.length > 0) {
      // Verificar estrutura da tabela
      const schema = db.prepare(`PRAGMA table_info(outros_negocios)`).all();
      console.log('Estrutura da tabela outros_negocios:');
      schema.forEach(col => console.log(`  - ${col.name}: ${col.type}`));
      
      // Verificar se existe o registro específico
      const specificRecord = db.prepare(`SELECT * FROM outros_negocios WHERE id = ?`).get('1db994f9-3337-4100-a29d-180a81a691cc');
      console.log('\nRegistro específico (1db994f9-3337-4100-a29d-180a81a691cc):', specificRecord ? 'EXISTE' : 'NÃO EXISTE');
      if (specificRecord) {
        console.log('Dados do registro:', JSON.stringify(specificRecord, null, 2));
      }
    }
    
    // Verificar tabela pagamentos_parciais
    const pagamentosTable = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='pagamentos_parciais'`).all();
    console.log('\nTabela pagamentos_parciais existe:', pagamentosTable.length > 0);
    
    if (pagamentosTable.length > 0) {
      const schema = db.prepare(`PRAGMA table_info(pagamentos_parciais)`).all();
      console.log('Estrutura da tabela pagamentos_parciais:');
      schema.forEach(col => console.log(`  - ${col.name}: ${col.type}`));
    }
    
    // Listar todas as tabelas
    const allTables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all();
    console.log('\nTodas as tabelas no banco:');
    allTables.forEach(table => console.log(`  - ${table.name}`));
    
    db.close();
    console.log('\n✅ Verificação concluída');
  }, 1000);
  
} catch (error) {
  console.error('❌ Erro ao importar módulo db:', error);
  console.log('\nTentando inicializar banco manualmente...');
  
  // Fallback: tentar criar o banco manualmente
  const Database = require('better-sqlite3');
  const path = require('path');
  const fs = require('fs');
  
  const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
  const db = new Database(dbPath);
  
  console.log('✅ Banco criado em:', dbPath);
  db.close();
}