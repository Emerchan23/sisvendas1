const Database = require('better-sqlite3');
const path = require('path');

// Configurar o caminho do banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== CORREÇÃO DE IDs NULL ===');
console.log('Caminho do banco:', dbPath);

try {
  // Função para gerar ID único
  function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
  
  // Desabilitar foreign keys temporariamente
  db.pragma('foreign_keys = OFF');
  
  // Iniciar transação
  const transaction = db.transaction(() => {
    // 1. Corrigir IDs null na tabela vendas
    console.log('\n1. CORRIGINDO IDs NULL NA TABELA VENDAS:');
    const vendasNullIds = db.prepare('SELECT rowid FROM vendas WHERE id IS NULL').all();
    console.log(`Encontrados ${vendasNullIds.length} registros com ID null`);
    
    const updateVendaId = db.prepare('UPDATE vendas SET id = ? WHERE rowid = ?');
    
    for (const row of vendasNullIds) {
      const newId = generateId();
      updateVendaId.run(newId, row.rowid);
      console.log(`- Venda rowid ${row.rowid} → ID: ${newId}`);
    }
    
    // 2. Corrigir IDs null na tabela vales
    console.log('\n2. CORRIGINDO IDs NULL NA TABELA VALES:');
    const valesNullIds = db.prepare('SELECT rowid FROM vales WHERE id IS NULL').all();
    console.log(`Encontrados ${valesNullIds.length} registros com ID null`);
    
    const updateValeId = db.prepare('UPDATE vales SET id = ? WHERE rowid = ?');
    
    for (const row of valesNullIds) {
      const newId = generateId();
      updateValeId.run(newId, row.rowid);
      console.log(`- Vale rowid ${row.rowid} → ID: ${newId}`);
    }
    
    // 3. Verificar se existe uma empresa para usar como padrão
    console.log('\n3. VERIFICANDO EMPRESAS EXISTENTES:');
    const empresas = db.prepare('SELECT id, nome FROM empresas LIMIT 1').all();
    
    let empresaId = null;
    if (empresas.length > 0) {
      empresaId = empresas[0].id;
      console.log(`- Usando empresa existente: ${empresas[0].nome} (ID: ${empresaId})`);
    } else {
      // Criar uma empresa padrão
      empresaId = generateId();
      db.prepare(`INSERT INTO empresas (id, nome, cnpj, created_at) VALUES (?, ?, ?, datetime('now'))`)
        .run(empresaId, 'Empresa Padrão', '00.000.000/0001-00');
      console.log(`- Criada empresa padrão com ID: ${empresaId}`);
    }
    
    // 4. Corrigir empresa_id null
    console.log('\n4. CORRIGINDO EMPRESA_ID NULL:');
    const vendasNullEmpresa = db.prepare('SELECT COUNT(*) as count FROM vendas WHERE empresa_id IS NULL').get();
    const valesNullEmpresa = db.prepare('SELECT COUNT(*) as count FROM vales WHERE empresa_id IS NULL').get();
    
    console.log(`- Vendas com empresa_id null: ${vendasNullEmpresa.count}`);
    console.log(`- Vales com empresa_id null: ${valesNullEmpresa.count}`);
    
    if (vendasNullEmpresa.count > 0) {
      db.prepare('UPDATE vendas SET empresa_id = ? WHERE empresa_id IS NULL').run(empresaId);
      console.log(`- Definido empresa_id para ${vendasNullEmpresa.count} vendas`);
    }
    
    if (valesNullEmpresa.count > 0) {
      db.prepare('UPDATE vales SET empresa_id = ? WHERE empresa_id IS NULL').run(empresaId);
      console.log(`- Definido empresa_id para ${valesNullEmpresa.count} vales`);
    }
  });
  
  // Executar transação
  transaction();
  
  // Reabilitar foreign keys
  db.pragma('foreign_keys = ON');
  
  // 5. Verificar correções
  console.log('\n5. VERIFICAÇÃO APÓS CORREÇÕES:');
  const vendasNullIdsAfter = db.prepare('SELECT COUNT(*) as count FROM vendas WHERE id IS NULL').get();
  const valesNullIdsAfter = db.prepare('SELECT COUNT(*) as count FROM vales WHERE id IS NULL').get();
  const vendasNullEmpresaAfter = db.prepare('SELECT COUNT(*) as count FROM vendas WHERE empresa_id IS NULL').get();
  const valesNullEmpresaAfter = db.prepare('SELECT COUNT(*) as count FROM vales WHERE empresa_id IS NULL').get();
  
  console.log(`- Vendas com ID null: ${vendasNullIdsAfter.count}`);
  console.log(`- Vales com ID null: ${valesNullIdsAfter.count}`);
  console.log(`- Vendas com empresa_id null: ${vendasNullEmpresaAfter.count}`);
  console.log(`- Vales com empresa_id null: ${valesNullEmpresaAfter.count}`);
  
  // Mostrar amostras dos dados corrigidos
  console.log('\n6. AMOSTRAS DOS DADOS CORRIGIDOS:');
  const sampleVendas = db.prepare('SELECT id, cliente_id, valor, empresa_id FROM vendas LIMIT 3').all();
  console.log('Vendas:');
  sampleVendas.forEach(venda => {
    console.log(`- ID: ${venda.id}, Cliente: ${venda.cliente_id}, Valor: R$ ${venda.valor}, Empresa: ${venda.empresa_id}`);
  });
  
  const sampleVales = db.prepare('SELECT id, cliente_id, valor, empresa_id FROM vales LIMIT 3').all();
  console.log('\nVales:');
  sampleVales.forEach(vale => {
    console.log(`- ID: ${vale.id}, Cliente: ${vale.cliente_id}, Valor: R$ ${vale.valor}, Empresa: ${vale.empresa_id}`);
  });
  
  console.log('\n✅ CORREÇÃO CONCLUÍDA COM SUCESSO!');
  
} catch (error) {
  console.error('❌ ERRO:', error.message);
  console.error(error.stack);
} finally {
  db.close();
}