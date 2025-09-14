// Script para verificar exatamente os valores de status no banco
const Database = require('better-sqlite3');
const path = require('path');

console.log('=== DEBUG DOS STATUS NO BANCO ===\n');

const dbPath = path.join(process.cwd(), 'data', 'erp.sqlite');
const db = new Database(dbPath);

// Buscar todas as linhas e mostrar os status exatos
const linhas = db.prepare('SELECT id, cliente, paymentStatus, settlementStatus, dataPedido FROM linhas_venda').all();

console.log(`Total de linhas no banco: ${linhas.length}\n`);

linhas.forEach((linha, index) => {
  console.log(`${index + 1}. ${linha.cliente} (${linha.id})`);
  console.log(`   paymentStatus: '${linha.paymentStatus}' (tipo: ${typeof linha.paymentStatus})`);
  console.log(`   settlementStatus: '${linha.settlementStatus}' (tipo: ${typeof linha.settlementStatus})`);
  console.log(`   dataPedido: '${linha.dataPedido}'`);
  
  // Testar os filtros
  const filtro1 = linha.paymentStatus === "Pago";
  const filtro2 = linha.paymentStatus === 'Pago';
  const filtro3 = !linha.settlementStatus || linha.settlementStatus === "Pendente";
  const filtro4 = !linha.settlementStatus || linha.settlementStatus === 'Pendente';
  
  console.log(`   Filtros:`);
  console.log(`     paymentStatus === "Pago": ${filtro1}`);
  console.log(`     paymentStatus === 'Pago': ${filtro2}`);
  console.log(`     settlementStatus vazio ou "Pendente": ${filtro3}`);
  console.log(`     settlementStatus vazio ou 'Pendente': ${filtro4}`);
  
  const deveAparecerNaAbaAcertos = (filtro1 || filtro2) && (filtro3 || filtro4);
  console.log(`   DEVE APARECER NA ABA ACERTOS: ${deveAparecerNaAbaAcertos}`);
  console.log('');
});

db.close();
console.log('=== FIM DO DEBUG ===');