const Database = require('better-sqlite3');
const path = require('path');

// Configurar o caminho do banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

try {
  console.log('Conectado ao banco de dados SQLite.');
  
  // Primeiro, inserir alguns clientes de teste
  const insertCliente = db.prepare(`
    INSERT OR IGNORE INTO clientes (id, nome, created_at, updated_at)
    VALUES (?, ?, datetime('now'), datetime('now'))
  `);
  
  const clientesTeste = [
    ['cliente1', 'Cliente Teste 1'],
    ['cliente2', 'Cliente Teste 2'],
    ['cliente3', 'Cliente Teste 3']
  ];
  
  console.log('Inserindo clientes de teste...');
  for (const cliente of clientesTeste) {
    try {
      insertCliente.run(...cliente);
      console.log(`Cliente inserido: ${cliente[1]}`);
    } catch (error) {
      console.log(`Erro ao inserir cliente: ${error.message}`);
    }
  }
  
  // Inserir dados de teste na tabela vendas
  const insertVenda = db.prepare(`
    INSERT INTO vendas (cliente_id, data, valor, status, observacoes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  
  // Dados de teste para vendas
  const vendasTeste = [
    ['cliente1', '2024-01-15', 150.50, 'concluida', 'Venda teste 1'],
    ['cliente2', '2024-01-16', 275.80, 'concluida', 'Venda teste 2'],
    ['cliente3', '2024-01-17', 89.90, 'pendente', 'Venda teste 3']
  ];
  
  console.log('Inserindo dados de teste na tabela vendas...');
  for (const venda of vendasTeste) {
    try {
      insertVenda.run(...venda);
      console.log(`Venda inserida: Cliente ${venda[0]}, Valor: R$ ${venda[2]}`);
    } catch (error) {
      console.log(`Erro ao inserir venda: ${error.message}`);
    }
  }
  
  // Inserir dados de teste na tabela vales
  const insertVale = db.prepare(`
    INSERT INTO vales (cliente_id, tipo, valor, data, status, observacoes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);
  
  // Dados de teste para vales
  const valesTeste = [
    ['cliente1', 'credito', 50.00, '2024-01-15', 'ativo', 'Vale teste 1'],
    ['cliente2', 'credito', 100.00, '2024-01-16', 'ativo', 'Vale teste 2'],
    ['cliente3', 'debito', 25.50, '2024-01-17', 'usado', 'Vale teste 3']
  ];
  
  console.log('Inserindo dados de teste na tabela vales...');
  for (const vale of valesTeste) {
    try {
      insertVale.run(...vale);
      console.log(`Vale inserido: Cliente ${vale[0]}, Valor: R$ ${vale[1]}`);
    } catch (error) {
      console.log(`Erro ao inserir vale: ${error.message}`);
    }
  }
  
  // Verificar os dados inseridos
  console.log('\n=== VERIFICAÇÃO DOS DADOS INSERIDOS ===');
  
  const vendasCount = db.prepare('SELECT COUNT(*) as count FROM vendas').get();
  console.log(`Total de vendas: ${vendasCount.count}`);
  
  const valesCount = db.prepare('SELECT COUNT(*) as count FROM vales').get();
  console.log(`Total de vales: ${valesCount.count}`);
  
  // Mostrar algumas amostras
  const sampleVendas = db.prepare('SELECT * FROM vendas LIMIT 3').all();
  console.log('\nAmostras de vendas:');
  sampleVendas.forEach(venda => {
    console.log(`ID: ${venda.id}, Cliente: ${venda.cliente_id}, Valor: R$ ${venda.valor_total}, Status: ${venda.status}`);
  });
  
  const sampleVales = db.prepare('SELECT * FROM vales LIMIT 3').all();
  console.log('\nAmostras de vales:');
  sampleVales.forEach(vale => {
    console.log(`ID: ${vale.id}, Cliente: ${vale.cliente_id}, Valor: R$ ${vale.valor}, Status: ${vale.status}`);
  });
  
  console.log('\n✅ Dados de teste inseridos com sucesso!');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
} finally {
  db.close();
  console.log('Conexão com o banco de dados fechada.');
}