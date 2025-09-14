const Database = require('better-sqlite3');

console.log('=== Migrando modalidades do banco antigo ===');

try {
  // Conectar aos dois bancos
  const oldDb = new Database('data/erp.sqlite');
  const newDb = new Database('database.db');
  
  // Buscar modalidades do banco antigo
  const modalidades = oldDb.prepare('SELECT * FROM modalidades').all();
  console.log(`Encontradas ${modalidades.length} modalidades no banco antigo`);
  
  // Preparar inserção no novo banco
  const insertStmt = newDb.prepare(`
    INSERT INTO modalidades_compra (codigo, nome, descricao, ativo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  let migrated = 0;
  
  for (const modalidade of modalidades) {
    try {
      insertStmt.run(
        modalidade.codigo,
        modalidade.nome,
        modalidade.descricao,
        modalidade.ativo,
        modalidade.created_at,
        modalidade.updated_at
      );
      migrated++;
      console.log(`✅ Migrada: ${modalidade.codigo} - ${modalidade.nome}`);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        console.log(`⚠️  Já existe: ${modalidade.codigo} - ${modalidade.nome}`);
      } else {
        console.error(`❌ Erro ao migrar ${modalidade.codigo}:`, err.message);
      }
    }
  }
  
  console.log(`\n✅ Migração concluída: ${migrated} modalidades migradas`);
  
  // Verificar resultado
  const total = newDb.prepare('SELECT COUNT(*) as count FROM modalidades_compra').get();
  console.log(`Total de modalidades no novo banco: ${total.count}`);
  
  oldDb.close();
  newDb.close();
  
} catch (error) {
  console.error('❌ Erro na migração:', error.message);
}