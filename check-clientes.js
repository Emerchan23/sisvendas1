const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== VERIFICANDO ESTRUTURA DO BANCO ===');

try {
  // Listar todas as tabelas
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tabelas existentes:', tables.map(t => t.name));
  
  // Verificar se a tabela clientes existe
  const clientesTableExists = tables.some(t => t.name === 'clientes');
  
  if (!clientesTableExists) {
    console.log('\n❌ Tabela clientes não existe. Criando...');
    
    // Criar tabela clientes
    db.exec(`
      CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        email TEXT,
        telefone TEXT,
        endereco TEXT,
        cidade TEXT,
        estado TEXT,
        cep TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabela clientes criada com sucesso!');
    
    // Criar um cliente de teste
    console.log('\n=== CRIANDO CLIENTE DE TESTE ===');
    const clienteId = uuidv4();
    const insertCliente = db.prepare(`
      INSERT INTO clientes (id, nome, email, telefone, endereco, cidade, estado, cep)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertCliente.run(
      clienteId,
      'Cliente Teste',
      'teste@email.com',
      '(11) 99999-9999',
      'Rua Teste, 123',
      'São Paulo',
      'SP',
      '01234-567'
    );
    
    console.log('✅ Cliente de teste criado com ID:', clienteId);
  } else {
    // Listar clientes existentes
    const clientes = db.prepare('SELECT id, nome, email FROM clientes ORDER BY id').all();
    
    console.log('\n=== CLIENTES EXISTENTES ===');
    console.log('Total de clientes:', clientes.length);
    
    if (clientes.length > 0) {
      clientes.forEach((cliente, index) => {
        console.log(`${index + 1}. ID: ${cliente.id}, Nome: ${cliente.nome}, Email: ${cliente.email}`);
      });
    } else {
      console.log('❌ Nenhum cliente encontrado!');
      
      // Criar um cliente de teste
      console.log('\n=== CRIANDO CLIENTE DE TESTE ===');
      const clienteId = uuidv4();
      const insertCliente = db.prepare(`
        INSERT INTO clientes (id, nome, email, telefone, endereco, cidade, estado, cep)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertCliente.run(
        clienteId,
        'Cliente Teste',
        'teste@email.com',
        '(11) 99999-9999',
        'Rua Teste, 123',
        'São Paulo',
        'SP',
        '01234-567'
      );
      
      console.log('✅ Cliente de teste criado com ID:', clienteId);
    }
  }
  
} catch (error) {
  console.error('Erro:', error.message);
} finally {
  db.close();
}