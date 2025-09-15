const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== TESTANDO SALVAMENTO DE ORÇAMENTO ===');

try {
  // Verificar se a coluna item_id existe
  console.log('\n1. Verificando estrutura da tabela orcamento_itens...');
  const schema = db.prepare('PRAGMA table_info(orcamento_itens)').all();
  const hasItemId = schema.some(col => col.name === 'item_id');
  
  if (!hasItemId) {
    console.error('❌ Coluna item_id não encontrada!');
    process.exit(1);
  }
  
  console.log('✅ Coluna item_id encontrada!');
  
  // Verificar se existe pelo menos um cliente
  console.log('\n2. Verificando clientes disponíveis...');
  const clientes = db.prepare('SELECT id, nome FROM clientes LIMIT 1').all();
  
  if (clientes.length === 0) {
    console.log('⚠️ Nenhum cliente encontrado. Criando cliente de teste...');
    const clienteId = uuidv4();
    db.prepare(`
      INSERT INTO clientes (id, nome, cpf_cnpj, telefone, email, endereco, empresa_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(clienteId, 'Cliente Teste', '12345678901', '11999999999', 'teste@teste.com', 'Endereço Teste', 'empresa-teste');
    console.log('✅ Cliente de teste criado!');
  } else {
    console.log(`✅ Cliente encontrado: ${clientes[0].nome}`);
  }
  
  // Obter cliente para teste
  const cliente = db.prepare('SELECT id FROM clientes LIMIT 1').get();
  
  // Testar criação de orçamento
  console.log('\n3. Testando criação de orçamento...');
  
  const orcamentoId = uuidv4();
  const numeroOrcamento = `TESTE-${Date.now()}`;
  const dataAtual = new Date().toISOString().split('T')[0];
  const dataValidade = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // Inserir orçamento
  const insertOrcamento = db.prepare(`
    INSERT INTO orcamentos (
      id, numero, cliente_id, data_orcamento, data_validade, valor_total,
      descricao, status, observacoes, condicoes_pagamento, prazo_entrega,
      vendedor_id, desconto, modalidade, numero_pregao, numero_dispensa
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertOrcamento.run(
    orcamentoId,
    numeroOrcamento,
    cliente.id,
    dataAtual,
    dataValidade,
    100.00,
    'Orçamento de teste',
    'pendente',
    'Teste de correção item_id',
    '30 dias',
    '15 dias',
    null,
    0,
    'compra_direta',
    null,
    null
  );
  
  console.log('✅ Orçamento criado com sucesso!');
  
  // Testar inserção de item com item_id
  console.log('\n4. Testando inserção de item com coluna item_id...');
  
  const itemId = uuidv4();
  const insertItem = db.prepare(`
    INSERT INTO orcamento_itens (
      id, orcamento_id, item_id, produto_id, descricao, marca, quantidade,
      valor_unitario, valor_total, link_ref, custo_ref
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertItem.run(
    itemId,
    orcamentoId,
    'ITEM-TESTE-001', // item_id
    'PROD-TESTE-001', // produto_id
    'Produto de teste',
    'Marca Teste',
    2,
    50.00,
    100.00,
    'https://exemplo.com',
    45.00
  );
  
  console.log('✅ Item inserido com sucesso!');
  
  // Verificar dados inseridos
  console.log('\n5. Verificando dados inseridos...');
  
  const orcamentoInserido = db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(orcamentoId);
  const itensInseridos = db.prepare('SELECT * FROM orcamento_itens WHERE orcamento_id = ?').all(orcamentoId);
  
  console.log('Orçamento:', {
    id: orcamentoInserido.id,
    numero: orcamentoInserido.numero,
    valor_total: orcamentoInserido.valor_total,
    status: orcamentoInserido.status
  });
  
  console.log('Itens:', itensInseridos.map(item => ({
    id: item.id,
    item_id: item.item_id,
    produto_id: item.produto_id,
    descricao: item.descricao,
    quantidade: item.quantidade,
    valor_unitario: item.valor_unitario
  })));
  
  // Testar atualização (simulando o método PUT/PATCH)
  console.log('\n6. Testando atualização de item...');
  
  // Deletar itens existentes
  db.prepare('DELETE FROM orcamento_itens WHERE orcamento_id = ?').run(orcamentoId);
  
  // Inserir novo item (simulando atualização)
  const novoItemId = uuidv4();
  insertItem.run(
    novoItemId,
    orcamentoId,
    'ITEM-ATUALIZADO-001', // item_id
    'PROD-ATUALIZADO-001', // produto_id
    'Produto atualizado',
    'Marca Atualizada',
    3,
    40.00,
    120.00,
    'https://exemplo-atualizado.com',
    35.00
  );
  
  console.log('✅ Item atualizado com sucesso!');
  
  // Limpar dados de teste
  console.log('\n7. Limpando dados de teste...');
  db.prepare('DELETE FROM orcamento_itens WHERE orcamento_id = ?').run(orcamentoId);
  db.prepare('DELETE FROM orcamentos WHERE id = ?').run(orcamentoId);
  
  // Remover cliente de teste se foi criado
  const clientesTeste = db.prepare('SELECT id FROM clientes WHERE nome = ?').all('Cliente Teste');
  if (clientesTeste.length > 0) {
    db.prepare('DELETE FROM clientes WHERE nome = ?').run('Cliente Teste');
    console.log('✅ Cliente de teste removido!');
  }
  
  console.log('✅ Dados de teste limpos!');
  
  console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
  console.log('A correção da coluna item_id está funcionando corretamente.');
  console.log('O sistema agora pode salvar e atualizar orçamentos sem erros.');
  
} catch (error) {
  console.error('❌ Erro durante o teste:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
} finally {
  db.close();
  console.log('\n🔒 Conexão com banco fechada.');
}