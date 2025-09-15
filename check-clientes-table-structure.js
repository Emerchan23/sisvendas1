const Database = require('better-sqlite3');
const path = require('path');

console.log('🔍 Verificando estrutura da tabela clientes...');

try {
  // Conectar ao banco de dados
  const dbPath = path.join(__dirname, '../Banco de dados Aqui', 'erp.sqlite');
  console.log('📂 Caminho do banco:', dbPath);
  
  const db = new Database(dbPath);
  console.log('✅ Conexão estabelecida com sucesso');
  
  // Verificar se a tabela clientes existe
  const tableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='clientes'
  `).get();
  
  if (tableExists) {
    console.log('\n✅ Tabela "clientes" encontrada');
    
    // Obter informações sobre as colunas da tabela
    const columns = db.pragma('table_info(clientes)');
    
    console.log('\n📋 Estrutura da tabela clientes:');
    console.log('┌─────┬──────────────────┬──────────────┬─────────┬─────────────┬────────┐');
    console.log('│ CID │ Nome             │ Tipo         │ NotNull │ Default     │ PK     │');
    console.log('├─────┼──────────────────┼──────────────┼─────────┼─────────────┼────────┤');
    
    columns.forEach(col => {
      const cid = col.cid.toString().padEnd(3);
      const name = col.name.padEnd(16);
      const type = col.type.padEnd(12);
      const notNull = col.notnull ? 'Sim' : 'Não';
      const defaultVal = col.dflt_value || 'NULL';
      const pk = col.pk ? 'Sim' : 'Não';
      
      console.log(`│ ${cid} │ ${name} │ ${type} │ ${notNull.padEnd(7)} │ ${defaultVal.toString().padEnd(11)} │ ${pk.padEnd(6)} │`);
    });
    
    console.log('└─────┴──────────────────┴──────────────┴─────────┴─────────────┴────────┘');
    
    // Verificar se existe a coluna 'documento'
    const hasDocumento = columns.find(col => col.name === 'documento');
    if (hasDocumento) {
      console.log('\n✅ Coluna "documento" encontrada');
    } else {
      console.log('\n❌ Coluna "documento" NÃO encontrada');
      
      // Verificar se existe coluna similar (cpf_cnpj, cpf, cnpj, etc.)
      const similarColumns = columns.filter(col => 
        col.name.toLowerCase().includes('cpf') || 
        col.name.toLowerCase().includes('cnpj') || 
        col.name.toLowerCase().includes('doc')
      );
      
      if (similarColumns.length > 0) {
        console.log('\n🔍 Colunas similares encontradas:');
        similarColumns.forEach(col => {
          console.log(`  - ${col.name} (${col.type})`);
        });
      }
    }
    
    // Mostrar alguns registros de exemplo
    console.log('\n📊 Primeiros 3 registros da tabela:');
    const sampleData = db.prepare('SELECT * FROM clientes LIMIT 3').all();
    
    if (sampleData.length > 0) {
      console.log(JSON.stringify(sampleData, null, 2));
    } else {
      console.log('  (Nenhum registro encontrado)');
    }
    
  } else {
    console.log('\n❌ Tabela "clientes" NÃO encontrada');
    
    // Listar todas as tabelas disponíveis
    const allTables = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();
    
    console.log('\n📋 Tabelas disponíveis no banco:');
    allTables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
  }
  
  db.close();
  console.log('\n✅ Verificação concluída');
  
} catch (error) {
  console.error('❌ Erro durante a verificação:', error.message);
  console.error('📋 Stack trace:', error.stack);
  process.exit(1);
}

process.exit(0);