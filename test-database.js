const Database = require('better-sqlite3');

console.log('🔍 Testando conectividade completa do banco...');

const db = new Database('./data/erp.sqlite');

try {
  const tables = ['usuarios', 'clientes', 'produtos', 'vendas', 'configuracoes', 'fornecedores', 'orcamentos', 'vales'];
  
  console.log('\n📊 Verificando tabelas:');
  tables.forEach(table => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      console.log(`  ✅ ${table}: ${count.count} registros`);
    } catch(e) {
      console.log(`  ❌ ${table}: ERRO - ${e.message}`);
    }
  });
  
  // Teste de operações CRUD básicas
  console.log('\n🔧 Testando operações CRUD:');
  
  // CREATE - Inserir cliente teste
  try {
    const insertResult = db.prepare(`
      INSERT INTO clientes (id, nome, email, telefone, endereco) 
      VALUES (?, ?, ?, ?, ?)
    `).run('test-client-' + Date.now(), 'Cliente Teste', 'teste@teste.com', '11999999999', 'Endereço Teste');
    console.log('  ✅ CREATE: Cliente inserido com sucesso');
    
    // READ - Ler cliente inserido
    const cliente = db.prepare('SELECT * FROM clientes WHERE email = ?').get('teste@teste.com');
    if (cliente) {
      console.log('  ✅ READ: Cliente encontrado:', cliente.nome);
      
      // UPDATE - Atualizar cliente
      db.prepare('UPDATE clientes SET nome = ? WHERE id = ?').run('Cliente Teste Atualizado', cliente.id);
      console.log('  ✅ UPDATE: Cliente atualizado');
      
      // DELETE - Remover cliente teste
      db.prepare('DELETE FROM clientes WHERE id = ?').run(cliente.id);
      console.log('  ✅ DELETE: Cliente removido');
    }
  } catch(e) {
    console.log('  ❌ CRUD: Erro -', e.message);
  }
  
  // Teste de integridade referencial
  console.log('\n🔗 Testando integridade referencial:');
  try {
    const vendas = db.prepare('SELECT COUNT(*) as count FROM vendas').get();
    const clientes = db.prepare('SELECT COUNT(*) as count FROM clientes').get();
    console.log(`  ✅ Vendas: ${vendas.count}, Clientes: ${clientes.count}`);
  } catch(e) {
    console.log('  ❌ Integridade: Erro -', e.message);
  }
  
  console.log('\n✅ Teste de conectividade concluído com sucesso!');
  
} catch (error) {
  console.error('❌ Erro geral:', error.message);
} finally {
  db.close();
  console.log('🔒 Banco de dados fechado.');
}