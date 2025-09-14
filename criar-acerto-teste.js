const Database = require('better-sqlite3');
const { join } = require('path');
const { v4: uuidv4 } = require('uuid');

// Conectar ao banco
const dbPath = join(process.cwd(), 'data', 'erp.sqlite');
const db = new Database(dbPath);

console.log('🧪 Criando acerto de teste com título...');

// Criar um acerto de teste com título
const acertoTeste = {
  id: uuidv4(),
  data: new Date().toISOString(),
  titulo: 'Acerto de Teste - Janeiro 2025',
  observacoes: 'Este é um acerto criado para testar o título',
  linhaIds: JSON.stringify([]),
  totalLucro: 1000.00,
  totalDespesasRateio: 100.00,
  totalDespesasIndividuais: 50.00,
  totalLiquidoDistribuivel: 850.00,
  distribuicoes: JSON.stringify([]),
  despesas: JSON.stringify([]),
  ultimoRecebimentoBanco: null,
  status: 'aberto',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

try {
  // Inserir o acerto de teste
  const stmt = db.prepare(`
    INSERT INTO acertos (
      id, data, titulo, observacoes, linhaIds, totalLucro, 
      totalDespesasRateio, totalDespesasIndividuais, totalLiquidoDistribuivel,
      distribuicoes, despesas, ultimoRecebimentoBanco, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    acertoTeste.id,
    acertoTeste.data,
    acertoTeste.titulo,
    acertoTeste.observacoes,
    acertoTeste.linhaIds,
    acertoTeste.totalLucro,
    acertoTeste.totalDespesasRateio,
    acertoTeste.totalDespesasIndividuais,
    acertoTeste.totalLiquidoDistribuivel,
    acertoTeste.distribuicoes,
    acertoTeste.despesas,
    acertoTeste.ultimoRecebimentoBanco,
    acertoTeste.status,
    acertoTeste.created_at,
    acertoTeste.updated_at
  );
  
  console.log('✅ Acerto de teste criado com sucesso!');
  console.log(`ID: ${acertoTeste.id}`);
  console.log(`Título: ${acertoTeste.titulo}`);
  
  // Verificar se foi inserido corretamente
  const verificacao = db.prepare('SELECT id, titulo FROM acertos WHERE id = ?').get(acertoTeste.id);
  console.log('\n🔍 Verificação:');
  console.log(`Título no banco: ${JSON.stringify(verificacao.titulo)}`);
  
} catch (error) {
  console.error('❌ Erro ao criar acerto de teste:', error);
}

db.close();
console.log('\n✅ Teste concluído!');