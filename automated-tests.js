const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('🚀 Iniciando testes automáticos do sistema ERP');
console.log('📂 Banco de dados:', dbPath);

// Função para criar todas as tabelas necessárias
function createTables() {
  console.log('\n📋 Criando tabelas necessárias...');
  
  // Tabela vendas
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS vendas (
        id TEXT PRIMARY KEY,
        cliente_id TEXT,
        valor REAL NOT NULL,
        data TEXT NOT NULL,
        status TEXT DEFAULT 'pendente',
        observacoes TEXT,
        empresa_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      )
    `);
    console.log('✅ Tabela vendas criada');
  } catch (e) {
    console.log('⚠️ Erro ao criar tabela vendas:', e.message);
  }

  // Tabela orcamentos
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS orcamentos (
        id TEXT PRIMARY KEY,
        cliente_id TEXT,
        valor REAL NOT NULL,
        data TEXT NOT NULL,
        status TEXT DEFAULT 'pendente',
        observacoes TEXT,
        empresa_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      )
    `);
    console.log('✅ Tabela orcamentos criada');
  } catch (e) {
    console.log('⚠️ Erro ao criar tabela orcamentos:', e.message);
  }

  // Tabela acertos
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS acertos (
        id TEXT PRIMARY KEY,
        cliente_id TEXT,
        tipo TEXT NOT NULL,
        valor REAL NOT NULL,
        data TEXT NOT NULL,
        status TEXT DEFAULT 'pendente',
        observacoes TEXT,
        empresa_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      )
    `);
    console.log('✅ Tabela acertos criada');
  } catch (e) {
    console.log('⚠️ Erro ao criar tabela acertos:', e.message);
  }

  // Tabela vales
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS vales (
        id TEXT PRIMARY KEY,
        cliente_id TEXT,
        tipo TEXT NOT NULL,
        valor REAL NOT NULL,
        data TEXT NOT NULL,
        status TEXT DEFAULT 'ativo',
        observacoes TEXT,
        empresa_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      )
    `);
    console.log('✅ Tabela vales criada');
  } catch (e) {
    console.log('⚠️ Erro ao criar tabela vales:', e.message);
  }

  // Tabela recebimentos
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS recebimentos (
        id TEXT PRIMARY KEY,
        cliente_id TEXT,
        valor REAL NOT NULL,
        data TEXT NOT NULL,
        tipo TEXT DEFAULT 'dinheiro',
        observacoes TEXT,
        empresa_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (cliente_id) REFERENCES clientes(id),
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      )
    `);
    console.log('✅ Tabela recebimentos criada');
  } catch (e) {
    console.log('⚠️ Erro ao criar tabela recebimentos:', e.message);
  }

  // Tabela fornecedores
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS fornecedores (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        cnpj TEXT,
        endereco TEXT,
        telefone TEXT,
        email TEXT,
        empresa_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      )
    `);
    console.log('✅ Tabela fornecedores criada');
  } catch (e) {
    console.log('⚠️ Erro ao criar tabela fornecedores:', e.message);
  }

  // Tabela amigos (participantes)
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS amigos (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        telefone TEXT,
        email TEXT,
        observacoes TEXT,
        empresa_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      )
    `);
    console.log('✅ Tabela amigos criada');
  } catch (e) {
    console.log('⚠️ Erro ao criar tabela amigos:', e.message);
  }
}

// Função para testar CRUD em uma tabela
function testCRUD(tableName, testData, updateData) {
  console.log(`\n🧪 Testando CRUD na tabela: ${tableName}`);
  let testId = null;
  
  try {
    // CREATE - Criar registro
    testId = uuidv4();
    const insertData = { id: testId, ...testData };
    const columns = Object.keys(insertData).join(', ');
    const placeholders = Object.keys(insertData).map(() => '?').join(', ');
    const values = Object.values(insertData);
    
    const insertStmt = db.prepare(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`);
    insertStmt.run(...values);
    console.log(`  ✅ CREATE: Registro criado com ID ${testId}`);
    
    // READ - Ler registro
    const selectStmt = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`);
    const record = selectStmt.get(testId);
    if (record) {
      console.log(`  ✅ READ: Registro encontrado`);
      // Verificar se todos os campos foram salvos corretamente
      let allFieldsCorrect = true;
      for (const [key, value] of Object.entries(testData)) {
        if (record[key] !== value) {
          console.log(`  ❌ Campo ${key}: esperado '${value}', encontrado '${record[key]}'`);
          allFieldsCorrect = false;
        }
      }
      if (allFieldsCorrect) {
        console.log(`  ✅ Todos os campos foram salvos corretamente`);
      }
    } else {
      throw new Error('Registro não encontrado após criação');
    }
    
    // UPDATE - Atualizar registro
    if (updateData && Object.keys(updateData).length > 0) {
      const updateColumns = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
      const updateValues = [...Object.values(updateData), testId];
      
      const updateStmt = db.prepare(`UPDATE ${tableName} SET ${updateColumns}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`);
      updateStmt.run(...updateValues);
      console.log(`  ✅ UPDATE: Registro atualizado`);
      
      // Verificar se a atualização foi salva
      const updatedRecord = selectStmt.get(testId);
      let updateCorrect = true;
      for (const [key, value] of Object.entries(updateData)) {
        if (updatedRecord[key] !== value) {
          console.log(`  ❌ Atualização do campo ${key}: esperado '${value}', encontrado '${updatedRecord[key]}'`);
          updateCorrect = false;
        }
      }
      if (updateCorrect) {
        console.log(`  ✅ Atualização salva corretamente no banco`);
      }
    }
    
    // DELETE - Excluir registro
    const deleteStmt = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
    deleteStmt.run(testId);
    console.log(`  ✅ DELETE: Registro excluído`);
    
    // Verificar se foi realmente excluído
    const deletedRecord = selectStmt.get(testId);
    if (!deletedRecord) {
      console.log(`  ✅ Exclusão confirmada no banco`);
    } else {
      console.log(`  ❌ Erro: Registro ainda existe após exclusão`);
    }
    
    console.log(`  🎉 CRUD completo para ${tableName}: SUCESSO`);
    return true;
    
  } catch (error) {
    console.log(`  ❌ ERRO no teste CRUD para ${tableName}:`, error.message);
    
    // Tentar limpar o registro de teste se existir
    if (testId) {
      try {
        const deleteStmt = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);
        deleteStmt.run(testId);
      } catch (e) {
        // Ignorar erro de limpeza
      }
    }
    return false;
  }
}

// Função principal de teste
function runAllTests() {
  console.log('\n🔧 Configurando ambiente de teste...');
  
  // Criar tabelas
  createTables();
  
  // Verificar se empresa padrão existe
  let empresaId = 'default-company';
  const empresa = db.prepare('SELECT * FROM empresas WHERE id = ?').get(empresaId);
  if (!empresa) {
    db.prepare(`
      INSERT INTO empresas (id, nome, razao_social, nome_do_sistema) 
      VALUES (?, ?, ?, ?)
    `).run(empresaId, 'Empresa Teste', 'Empresa Teste LTDA', 'LP IND');
    console.log('✅ Empresa padrão criada para testes');
  }
  
  const results = {};
  
  // Teste 1: Clientes
  results.clientes = testCRUD('clientes', {
    nome: 'Cliente Teste Automático',
    cpf_cnpj: '12345678901',
    endereco: 'Rua Teste, 123',
    telefone: '(11) 99999-9999',
    email: 'teste@email.com',
    empresa_id: empresaId
  }, {
    nome: 'Cliente Teste Atualizado',
    telefone: '(11) 88888-8888'
  });
  
  // Teste 2: Vendas
  results.vendas = testCRUD('vendas', {
    valor: 1500.50,
    data: '2025-01-15',
    status: 'pendente',
    observacoes: 'Venda teste automática',
    empresa_id: empresaId
  }, {
    valor: 1800.75,
    status: 'concluida'
  });
  
  // Teste 3: Orçamentos
  results.orcamentos = testCRUD('orcamentos', {
    valor: 2500.00,
    data: '2025-01-15',
    status: 'pendente',
    observacoes: 'Orçamento teste automático',
    empresa_id: empresaId
  }, {
    valor: 2800.00,
    status: 'aprovado'
  });
  
  // Teste 4: Acertos
  results.acertos = testCRUD('acertos', {
    tipo: 'credito',
    valor: 500.00,
    data: '2025-01-15',
    status: 'pendente',
    observacoes: 'Acerto teste automático',
    empresa_id: empresaId
  }, {
    valor: 600.00,
    status: 'concluido'
  });
  
  // Teste 5: Outros Negócios
  results.outros_negocios = testCRUD('outros_negocios', {
    tipo: 'receita',
    valor: 800.00,
    data: '2025-01-15',
    status: 'pendente',
    descricao: 'Outro negócio teste automático',
    empresa_id: empresaId
  }, {
    valor: 900.00,
    status: 'concluido'
  });
  
  // Teste 6: Vales
  results.vales = testCRUD('vales', {
    tipo: 'credito',
    valor: 200.00,
    data: '2025-01-15',
    status: 'ativo',
    observacoes: 'Vale teste automático',
    empresa_id: empresaId
  }, {
    valor: 250.00,
    status: 'usado'
  });
  
  // Teste 7: Recebimentos
  results.recebimentos = testCRUD('recebimentos', {
    valor: 1200.00,
    data: '2025-01-15',
    tipo: 'dinheiro',
    observacoes: 'Recebimento teste automático',
    empresa_id: empresaId
  }, {
    valor: 1300.00,
    tipo: 'cartao'
  });
  
  // Teste 8: Fornecedores
  results.fornecedores = testCRUD('fornecedores', {
    nome: 'Fornecedor Teste Automático',
    cnpj: '12.345.678/0001-90',
    endereco: 'Av. Fornecedor, 456',
    telefone: '(11) 77777-7777',
    email: 'fornecedor@teste.com',
    empresa_id: empresaId
  }, {
    nome: 'Fornecedor Teste Atualizado',
    telefone: '(11) 66666-6666'
  });
  
  // Teste 9: Amigos
  results.amigos = testCRUD('amigos', {
    nome: 'Amigo Teste Automático',
    telefone: '(11) 55555-5555',
    email: 'amigo@teste.com',
    observacoes: 'Amigo teste automático',
    empresa_id: empresaId
  }, {
    nome: 'Amigo Teste Atualizado',
    telefone: '(11) 44444-4444'
  });
  
  // Relatório final
  console.log('\n📊 RELATÓRIO FINAL DOS TESTES');
  console.log('=' .repeat(50));
  
  let totalTests = 0;
  let passedTests = 0;
  
  for (const [table, result] of Object.entries(results)) {
    totalTests++;
    if (result) {
      passedTests++;
      console.log(`✅ ${table.toUpperCase()}: PASSOU`);
    } else {
      console.log(`❌ ${table.toUpperCase()}: FALHOU`);
    }
  }
  
  console.log('=' .repeat(50));
  console.log(`📈 RESULTADO: ${passedTests}/${totalTests} testes passaram`);
  
  if (passedTests === totalTests) {
    console.log('🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente.');
  } else {
    console.log('⚠️ Alguns testes falharam. Verifique os erros acima.');
  }
  
  // Verificar tabelas no banco
  console.log('\n📋 Tabelas existentes no banco:');
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all();
  tables.forEach(table => console.log(`  - ${table.name}`));
}

// Executar todos os testes
try {
  runAllTests();
} catch (error) {
  console.error('❌ Erro fatal durante os testes:', error);
} finally {
  db.close();
  console.log('\n🔒 Conexão com banco de dados fechada.');
}