console.log('Verificando dados de vendas e acertos...');
const Database = require('better-sqlite3');
const { join } = require('path');

// Conectar ao banco
const dbPath = join(process.cwd(), '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

try {
  // Buscar vendas
  const vendas = db.prepare('SELECT id, numeroOF, settlementStatus, acertoId FROM linhas_venda ORDER BY id').all();
  
  console.log('\n=== VENDAS ===');
  vendas.forEach(v => {
    console.log(`ID: ${v.id}, OF: ${v.numeroOF}, Status: ${v.settlementStatus}, AcertoID: ${v.acertoId}`);
  });
  
  // Buscar acertos
  const acertos = db.prepare('SELECT id, titulo, status FROM acertos ORDER BY id').all();
  
  console.log('\n=== ACERTOS ===');
  acertos.forEach(a => {
    console.log(`ID: ${a.id}, Título: ${a.titulo}, Status: ${a.status}`);
  });
  
  // Verificar vendas que deveriam estar como ACERTADO
  console.log('\n=== ANÁLISE ===');
  const acertosFechados = acertos.filter(a => a.status === 'fechado');
  console.log(`Acertos fechados: ${acertosFechados.length}`);
  
  const vendasAcertadas = vendas.filter(v => v.settlementStatus === 'ACERTADO');
  console.log(`Vendas com status ACERTADO: ${vendasAcertadas.length}`);
  
  const vendasComAcerto = vendas.filter(v => v.acertoId);
  console.log(`Vendas vinculadas a acertos: ${vendasComAcerto.length}`);
  
  // Verificar inconsistências
  console.log('\n=== INCONSISTÊNCIAS ===');
  acertosFechados.forEach(acerto => {
    const vendasDoAcerto = vendas.filter(v => v.acertoId === acerto.id);
    const vendasNaoAcertadas = vendasDoAcerto.filter(v => v.settlementStatus !== 'ACERTADO');
    
    if (vendasNaoAcertadas.length > 0) {
      console.log(`⚠️  Acerto ${acerto.id} (${acerto.titulo}) está fechado mas tem ${vendasNaoAcertadas.length} vendas não acertadas:`);
      vendasNaoAcertadas.forEach(v => {
        console.log(`   - Venda ${v.id} (OF: ${v.numeroOF}) - Status: ${v.settlementStatus}`);
      });
    }
  });
  
} catch (error) {
  console.error('Erro:', error);
} finally {
  db.close();
}