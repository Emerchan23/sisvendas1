const Database = require('better-sqlite3');
const { join } = require('path');

// Usar o caminho correto do banco
const dbPath = join(process.cwd(), '..', 'Banco de dados Aqui', 'erp.sqlite');

console.log('🔧 Corrigindo permissões do usuário...');

try {
  const db = new Database(dbPath);
  
  // Buscar o usuário 'ds'
  const usuario = db.prepare('SELECT * FROM usuarios WHERE nome = ? OR email LIKE ?').get('ds', '%d123@gmail.com%');
  
  if (!usuario) {
    console.log('❌ Usuário "ds" não encontrado!');
    return;
  }
  
  console.log('✅ Usuário encontrado:', usuario.nome, '(' + usuario.email + ')');
  
  // Parsear permissões atuais
  let permissoes = {};
  if (usuario.permissoes) {
    try {
      permissoes = JSON.parse(usuario.permissoes);
      console.log('📋 Permissões atuais:', permissoes);
    } catch (error) {
      console.log('⚠️ Erro ao parsear permissões, criando novas...');
    }
  }
  
  // Adicionar permissão de orçamentos
  permissoes.orcamentos = true;
  
  console.log('🔄 Atualizando permissões...');
  console.log('📋 Novas permissões:', permissoes);
  
  // Atualizar no banco
  const updateStmt = db.prepare('UPDATE usuarios SET permissoes = ? WHERE id = ?');
  const result = updateStmt.run(JSON.stringify(permissoes), usuario.id);
  
  if (result.changes > 0) {
    console.log('✅ Permissões atualizadas com sucesso!');
    
    // Verificar a atualização
    const usuarioAtualizado = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(usuario.id);
    const novasPermissoes = JSON.parse(usuarioAtualizado.permissoes);
    
    console.log('\n🔍 Verificação:');
    console.log('Usuário:', usuarioAtualizado.nome);
    console.log('Permissão de orçamentos:', novasPermissoes.orcamentos ? 'SIM' : 'NÃO');
    
    if (novasPermissoes.orcamentos) {
      console.log('\n🎉 SUCESSO! O usuário "ds" agora tem acesso aos orçamentos.');
      console.log('💡 Faça logout e login novamente para aplicar as mudanças.');
    }
  } else {
    console.log('❌ Falha ao atualizar permissões!');
  }
  
  db.close();
  
} catch (error) {
  console.error('❌ Erro ao corrigir permissões:', error.message);
}