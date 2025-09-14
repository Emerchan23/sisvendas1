const Database = require('better-sqlite3');
const db = new Database('./data/erp.sqlite');

console.log('=== VENDAS NO BANCO ===');
const vendas = db.prepare('SELECT id, numeroOF, settlementStatus, acertoId FROM linhas_venda LIMIT 10').all();
vendas.forEach(v => {
    console.log(`OF ${v.numeroOF}: ${v.settlementStatus || 'NULL'} (acerto: ${v.acertoId || 'NULL'})`);
});

console.log('\n=== ACERTOS NO BANCO ===');
const acertos = db.prepare('SELECT id, titulo, status FROM acertos LIMIT 5').all();
acertos.forEach(a => {
    console.log(`${a.id}: ${a.titulo} - ${a.status}`);
});

console.log('\n=== ESTATÍSTICAS ===');
const stats = db.prepare(`
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN settlementStatus = 'ACERTADO' THEN 1 END) as acertadas,
        COUNT(CASE WHEN settlementStatus = 'Pendente' OR settlementStatus IS NULL THEN 1 END) as pendentes
    FROM linhas_venda
`).get();

console.log(`Total de vendas: ${stats.total}`);
console.log(`Vendas acertadas: ${stats.acertadas}`);
console.log(`Vendas pendentes: ${stats.pendentes}`);

db.close();