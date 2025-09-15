const Database = require('better-sqlite3');
const db = new Database('../Banco de dados Aqui/erp.sqlite');

console.log('=== SIMULANDO REQUISIÇÃO PUT ===');

// Dados que podem estar sendo enviados na requisição
const testData = {
  tipo: 'emprestimo',
  descricao: 'Teste atualizado',
  valor: 150,
  data_transacao: '2025-01-15',
  cliente_id: 'cliente-inexistente', // Testando com ID inválido
  status: 'pendente',
  observacoes: 'Teste',
  multa_ativa: 0,
  multa_percent: 0
};

const id = '551b62a7-7346-4b1f-b935-932db239d06b';

console.log('\n=== DADOS DE TESTE ===');
console.log(JSON.stringify(testData, null, 2));

// Verificar se o cliente_id existe (se fornecido)
if (testData.cliente_id) {
  console.log('\n=== VERIFICANDO CLIENTE_ID ===');
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(testData.cliente_id);
  console.log('Cliente existe:', cliente ? 'SIM' : 'NÃO');
  if (!cliente) {
    console.log('❌ PROBLEMA ENCONTRADO: cliente_id não existe na tabela clientes');
  }
}

// Verificar se o empresa_id existe (se fornecido)
if (testData.empresa_id) {
  console.log('\n=== VERIFICANDO EMPRESA_ID ===');
  const empresa = db.prepare('SELECT * FROM empresas WHERE id = ?').get(testData.empresa_id);
  console.log('Empresa existe:', empresa ? 'SIM' : 'NÃO');
  if (!empresa) {
    console.log('❌ PROBLEMA ENCONTRADO: empresa_id não existe na tabela empresas');
  }
}

// Tentar executar o UPDATE com os dados de teste
console.log('\n=== TENTANDO UPDATE ===');
try {
  const validFields = ['tipo', 'descricao', 'valor', 'data_transacao', 'cliente_id', 'status', 'observacoes', 'multa_ativa', 'multa_percent'];
  const updateData = Object.fromEntries(
    Object.entries(testData).filter(([key]) => validFields.includes(key))
  );
  
  const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updateData);
  
  console.log('SQL:', `UPDATE outros_negocios SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
  console.log('Values:', [...values, id]);
  
  const result = db.prepare(
    `UPDATE outros_negocios SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(...values, id);
  
  console.log('✅ UPDATE executado com sucesso');
  console.log('Linhas afetadas:', result.changes);
  
} catch (error) {
  console.log('❌ ERRO NO UPDATE:', error.message);
  if (error.message.includes('FOREIGN KEY constraint failed')) {
    console.log('\n🔍 DIAGNÓSTICO:');
    console.log('- O erro indica violação de foreign key');
    console.log('- Verifique se cliente_id ou empresa_id são válidos');
    console.log('- Campos com foreign key: cliente_id, empresa_id');
  }
}

// Testar com dados válidos (sem cliente_id)
console.log('\n=== TESTE COM DADOS VÁLIDOS (SEM CLIENTE_ID) ===');
const validTestData = {
  tipo: 'emprestimo',
  descricao: 'Teste atualizado sem cliente',
  valor: 200,
  data_transacao: '2025-01-15',
  status: 'pendente',
  multa_ativa: 0,
  multa_percent: 0
};

try {
  const validFields = ['tipo', 'descricao', 'valor', 'data_transacao', 'cliente_id', 'status', 'observacoes', 'multa_ativa', 'multa_percent'];
  const updateData = Object.fromEntries(
    Object.entries(validTestData).filter(([key]) => validFields.includes(key))
  );
  
  const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updateData);
  
  const result = db.prepare(
    `UPDATE outros_negocios SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(...values, id);
  
  console.log('✅ UPDATE com dados válidos executado com sucesso');
  console.log('Linhas afetadas:', result.changes);
  
} catch (error) {
  console.log('❌ ERRO NO UPDATE VÁLIDO:', error.message);
}

db.close();