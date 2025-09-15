const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '../Banco de dados Aqui/database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Atualizando valores de requer_numero_processo...');

// Modalidades que requerem número de processo
const modalidadesComProcesso = ['LICITADO', 'PREGAO', 'CONCORRENCIA', 'TOMADA_PRECOS', 'DISPENSA'];

// Atualizar modalidades que requerem processo
db.run(`UPDATE modalidades_compra SET requer_numero_processo = 1 WHERE codigo IN (${modalidadesComProcesso.map(() => '?').join(',')})`, modalidadesComProcesso, function(err) {
  if (err) {
    console.error('❌ Erro ao atualizar modalidades com processo:', err);
  } else {
    console.log(`✅ ${this.changes} modalidades atualizadas para requerer processo`);
  }
  
  // Verificar resultado final
  db.all('SELECT codigo, nome, requer_numero_processo FROM modalidades_compra ORDER BY nome', (err, rows) => {
    if (err) {
      console.error('❌ Erro ao verificar resultado:', err);
    } else {
      console.log('\n📋 Modalidades finais:');
      rows.forEach(row => {
        const requer = row.requer_numero_processo ? 'SIM' : 'NÃO';
        console.log(`- ${row.nome} (${row.codigo}): ${requer}`);
      });
    }
    
    db.close();
    console.log('\n✅ Atualização concluída!');
  });
});