const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '../Banco de dados Aqui/database.db');
const db = new sqlite3.Database(dbPath);

console.log('🔧 Aplicando migração para adicionar coluna requer_numero_processo...');

// Ler o arquivo de migração
const migrationPath = path.join(__dirname, 'supabase', 'migrations', 'add_requer_numero_processo_column.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Dividir as queries por ponto e vírgula
const queries = migrationSQL.split(';').filter(query => query.trim().length > 0);

let completedQueries = 0;

queries.forEach((query, index) => {
  const trimmedQuery = query.trim();
  if (trimmedQuery) {
    db.run(trimmedQuery, function(err) {
      if (err) {
        console.error(`❌ Erro na query ${index + 1}:`, err.message);
        console.error('Query:', trimmedQuery);
      } else {
        console.log(`✅ Query ${index + 1} executada com sucesso`);
      }
      
      completedQueries++;
      if (completedQueries === queries.length) {
        // Verificar se a migração foi aplicada corretamente
        db.all('SELECT codigo, nome, requer_numero_processo FROM modalidades_compra ORDER BY nome', (err, rows) => {
          if (err) {
            console.error('❌ Erro ao verificar resultado:', err);
          } else {
            console.log('\n📋 Modalidades após migração:');
            rows.forEach(row => {
              console.log(`- ${row.nome} (${row.codigo}): requer_numero_processo = ${row.requer_numero_processo}`);
            });
          }
          
          db.close();
          console.log('\n✅ Migração concluída!');
        });
      }
    });
  }
});