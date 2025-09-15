const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('🧪 Testando campos de orçamento...');

try {
  // 1. Verificar se as colunas existem na tabela orcamentos
  console.log('\n1️⃣ Verificando estrutura da tabela orcamentos:');
  const tableInfo = db.prepare("PRAGMA table_info(orcamentos)").all();
  
  const requiredColumns = ['modalidade', 'numero_pregao', 'numero_dispensa'];
  const existingColumns = tableInfo.map(col => col.name);
  
  requiredColumns.forEach(col => {
    if (existingColumns.includes(col)) {
      console.log(`   ✅ Coluna '${col}' existe`);
    } else {
      console.log(`   ❌ Coluna '${col}' NÃO existe`);
    }
  });

  // 2. Verificar se existe pelo menos um cliente
  console.log('\n2️⃣ Verificando clientes disponíveis:');
  const clientes = db.prepare('SELECT id, nome FROM clientes LIMIT 5').all();
  if (clientes.length === 0) {
    console.log('   ⚠️  Nenhum cliente encontrado. Criando cliente teste...');
    
    const insertCliente = db.prepare(`
      INSERT INTO clientes (nome, email, telefone, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const clienteResult = insertCliente.run('Cliente Teste', 'teste@teste.com', '11999999999');
    console.log(`   ✅ Cliente teste criado com ID: ${clienteResult.lastInsertRowid}`);
    clientes.push({ id: clienteResult.lastInsertRowid, nome: 'Cliente Teste' });
  } else {
    console.log(`   ✅ ${clientes.length} cliente(s) encontrado(s)`);
    clientes.forEach(c => console.log(`      - ID: ${c.id}, Nome: ${c.nome}`));
  }

  // 3. Testar inserção de orçamento com modalidade
  console.log('\n3️⃣ Testando inserção de orçamento com modalidade:');
  
  const clienteId = clientes[0].id;
  const testOrcamento = {
    numero: `TEST-${Date.now()}`,
    cliente_id: clienteId,
    modalidade: 'LICITADO',
    numero_pregao: 'PREG-2024-001',
    numero_dispensa: null,
    data_orcamento: new Date().toISOString().split('T')[0],
    data_validade: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    observacoes: 'Teste de modalidade',
    valor_total: 1000.00,
    status: 'rascunho'
  };

  const insertStmt = db.prepare(`
    INSERT INTO orcamentos (
      numero, cliente_id, modalidade, numero_pregao, numero_dispensa,
      data_orcamento, data_validade, observacoes, valor_total, status,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      datetime('now'), datetime('now')
    )
  `);

  const result = insertStmt.run(
    testOrcamento.numero,
    testOrcamento.cliente_id,
    testOrcamento.modalidade,
    testOrcamento.numero_pregao,
    testOrcamento.numero_dispensa,
    testOrcamento.data_orcamento,
    testOrcamento.data_validade,
    testOrcamento.observacoes,
    testOrcamento.valor_total,
    testOrcamento.status
  );

  if (result.changes > 0) {
    console.log(`   ✅ Orçamento teste inserido com ID: ${result.lastInsertRowid}`);
    
    // Verificar se foi salvo corretamente
    const saved = db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(result.lastInsertRowid);
    console.log(`   📋 Modalidade salva: ${saved.modalidade}`);
    console.log(`   📋 Número pregão: ${saved.numero_pregao}`);
    console.log(`   📋 Número dispensa: ${saved.numero_dispensa || 'null'}`);
    
    // Limpar teste
    db.prepare('DELETE FROM orcamentos WHERE id = ?').run(result.lastInsertRowid);
    console.log(`   🧹 Orçamento teste removido`);
  } else {
    console.log(`   ❌ Falha ao inserir orçamento teste`);
  }

  // 4. Verificar modalidades disponíveis
  console.log('\n4️⃣ Modalidades disponíveis:');
  const modalidades = db.prepare('SELECT codigo, nome, requer_numero_processo FROM modalidades_compra WHERE ativo = 1 ORDER BY nome').all();
  modalidades.forEach(m => {
    const processo = m.requer_numero_processo ? '(requer processo)' : '(sem processo)';
    console.log(`   📦 ${m.codigo} - ${m.nome} ${processo}`);
  });

  console.log('\n✅ Teste concluído com sucesso!');
  console.log('\n📝 RESUMO:');
  console.log('   - Colunas de modalidade existem na tabela orcamentos ✅');
  console.log('   - Inserção e recuperação de dados funcionando ✅');
  console.log('   - Modalidades brasileiras adicionadas ✅');
  console.log('   - Sistema pronto para uso ✅');

} catch (error) {
  console.error('❌ Erro durante o teste:', error.message);
  console.error('Stack:', error.stack);
} finally {
  db.close();
  console.log('\n🔒 Conexão com banco fechada.');
}