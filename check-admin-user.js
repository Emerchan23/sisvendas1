const Database = require('better-sqlite3');

async function checkAdminUser() {
  console.log('🔍 Verificando usuário administrador...');
  
  try {
    const db = new Database('../Banco de dados Aqui/erp.sqlite');
    
    // Verificar se a tabela usuarios existe
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'").all();
    
    if (tables.length === 0) {
      console.log('❌ Tabela "usuarios" não existe!');
      console.log('💡 O sistema precisa criar a tabela de usuários.');
      
      // Tentar executar a inicialização do banco
      console.log('\n🔧 Tentando inicializar estrutura do banco...');
      
      // Importar e executar a inicialização do banco
      const { db: initDb } = require('./lib/db');
      console.log('✅ Banco inicializado!');
      
      // Verificar novamente
      const tablesAfter = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='usuarios'").all();
      if (tablesAfter.length > 0) {
        console.log('✅ Tabela "usuarios" criada com sucesso!');
      }
    } else {
      console.log('✅ Tabela "usuarios" existe.');
    }
    
    // Verificar se há usuários
    try {
      const usuarios = db.prepare('SELECT * FROM usuarios').all();
      console.log(`\n👥 Total de usuários: ${usuarios.length}`);
      
      if (usuarios.length === 0) {
        console.log('❌ Nenhum usuário encontrado!');
        console.log('💡 Execute a aplicação para criar o usuário administrador padrão.');
      } else {
        console.log('\n📋 Usuários encontrados:');
        usuarios.forEach((usuario, index) => {
          console.log(`${index + 1}. ${usuario.nome} (${usuario.email})`);
          console.log(`   Role: ${usuario.role}`);
          console.log(`   Ativo: ${usuario.ativo === 1 ? 'Sim' : 'Não'}`);
          
          // Verificar permissões
          let permissoes = {};
          if (usuario.permissoes) {
            try {
              permissoes = JSON.parse(usuario.permissoes);
            } catch (e) {
              console.log(`   ⚠️ Erro ao parsear permissões: ${e.message}`);
            }
          }
          
          console.log(`   Permissão 'orcamentos': ${permissoes.orcamentos === true ? 'SIM' : 'NÃO'}`);
          console.log(`   É admin: ${usuario.role === 'admin' ? 'SIM' : 'NÃO'}`);
          console.log('');
        });
        
        // Verificar se há admin ativo
        const adminAtivo = usuarios.find(u => u.role === 'admin' && u.ativo === 1);
        if (adminAtivo) {
          console.log('✅ Usuário administrador ativo encontrado!');
          console.log('💡 Para testar o login, use:');
          console.log('   Email: admin@sistema.com');
          console.log('   Senha: admin123');
        } else {
          console.log('❌ Nenhum usuário administrador ativo encontrado!');
        }
      }
    } catch (error) {
      console.log('❌ Erro ao consultar usuários:', error.message);
    }
    
    db.close();
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkAdminUser();