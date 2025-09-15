const Database = require('better-sqlite3');

try {
  const db = new Database('../Banco de dados Aqui/erp.sqlite');
  
  console.log('📋 Estrutura da tabela empresas:');
  const schema = db.prepare('PRAGMA table_info(empresas)').all();
  
  schema.forEach(col => {
    console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? 'DEFAULT ' + col.dflt_value : ''}`);
  });
  
  const backupColumns = [
    'auto_backup_enabled', 
    'backup_frequency', 
    'backup_time', 
    'keep_local_backup', 
    'max_backups', 
    'last_backup'
  ];
  
  console.log('\n🔍 Verificando colunas de backup:');
  backupColumns.forEach(col => {
    const exists = schema.find(s => s.name === col);
    console.log(`  ${exists ? '✅' : '❌'} ${col} - ${exists ? 'EXISTE' : 'NÃO EXISTE'}`);
  });
  
  // Verificar se há dados de configuração de backup
  console.log('\n📊 Dados atuais de configuração de backup:');
  try {
    const config = db.prepare('SELECT auto_backup_enabled, backup_frequency, backup_time, keep_local_backup, max_backups, last_backup FROM empresas LIMIT 1').get();
    if (config) {
      console.log('  📝 Configuração encontrada:');
      console.log(`    - Backup automático: ${config.auto_backup_enabled ? 'ATIVADO' : 'DESATIVADO'}`);
      console.log(`    - Frequência: ${config.backup_frequency || 'NÃO DEFINIDA'}`);
      console.log(`    - Horário: ${config.backup_time || 'NÃO DEFINIDO'}`);
      console.log(`    - Manter local: ${config.keep_local_backup ? 'SIM' : 'NÃO'}`);
      console.log(`    - Máx. backups: ${config.max_backups || 'NÃO DEFINIDO'}`);
      console.log(`    - Último backup: ${config.last_backup || 'NUNCA'}`);
    } else {
      console.log('  ⚠️ Nenhuma configuração encontrada');
    }
  } catch (error) {
    console.log(`  ❌ Erro ao buscar configuração: ${error.message}`);
  }
  
  db.close();
  console.log('\n✅ Verificação concluída');
  
} catch (error) {
  console.error('❌ Erro ao conectar com o banco:', error.message);
}