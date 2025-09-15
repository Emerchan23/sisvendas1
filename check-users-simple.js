const Database = require('better-sqlite3');
const { join } = require('path');

// Usar o caminho correto do banco
const dbPath = join(process.cwd(), '..', 'Banco de dados Aqui', 'erp.sqlite');

console.log('🔍 Verificando usuários no banco:', dbPath);

try {
  const db = new Database(dbPath);
  
  // Verificar se a tabela usuarios existe
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'").all();
  
  if (tables.length === 0) {
    console.log('❌ Tabela "usuarios" não existe!');
    return;
  }
  
  console.log('✅ Tabela "usuarios" existe!');
  
  // Buscar todos os usuários
  const usuarios = db.prepare('SELECT * FROM usuarios').all();
  
  console.log(`\n📊 Total de usuários: ${usuarios.length}`);
  
  if (usuarios.length === 0) {
    console.log('❌ Nenhum usuário encontrado no banco!');
    console.log('💡 Precisa criar o usuário administrador padrão.');
  } else {
    console.log('\n👥 Usuários encontrados:');
    usuarios.forEach((usuario, index) => {
      console.log(`\n${index + 1}. ${usuario.nome}`);
      console.log(`   ID: ${usuario.id}`);
      console.log(`   Email: ${usuario.email}`);
      console.log(`   Role: ${usuario.role}`);
      console.log(`   Ativo: ${usuario.ativo ? 'SIM' : 'NÃO'}`);
      
      // Parsear permissões se existirem
      if (usuario.permissoes) {
        try {
          const permissoes = JSON.parse(usuario.permissoes);
          console.log('   Permissões:');
          Object.entries(permissoes).forEach(([key, value]) => {
            console.log(`     ${key}: ${value ? 'SIM' : 'NÃO'}`);
          });
        } catch (error) {
          console.log('   Permissões: Erro ao parsear');
        }
      }
    });
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Erro ao verificar usuários:', error.message);
}