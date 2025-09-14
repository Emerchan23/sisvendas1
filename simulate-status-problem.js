const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'data', 'erp.sqlite');
const db = new Database(dbPath);

console.log('=== SIMULANDO PROBLEMA DE STATUS ===\n');

// 1. Criar vendas de teste com status pendente
console.log('1. Criando vendas de teste...');

const vendasTeste = [];
for (let i = 1; i <= 3; i++) {
    const vendaId = uuidv4();
    const venda = {
        id: vendaId,
        companyId: 'test-company',
        dataPedido: '2025-01-15',
        numeroOF: `OF-TEST-${i}`,
        cliente: `Cliente Teste ${i}`,
        produto: `Produto ${i}`,
        modalidade: 'Teste',
        valorVenda: 1000 + (i * 100),
        paymentStatus: 'Pago',
        settlementStatus: 'Pendente', // Status inicial pendente
        createdAt: new Date().toISOString()
    };
    
    vendasTeste.push(venda);
    
    db.prepare(`
        INSERT INTO linhas_venda (
            id, companyId, dataPedido, numeroOF, cliente, produto, modalidade,
            valorVenda, paymentStatus, settlementStatus, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        venda.id, venda.companyId, venda.dataPedido, venda.numeroOF,
        venda.cliente, venda.produto, venda.modalidade, venda.valorVenda,
        venda.paymentStatus, venda.settlementStatus, venda.createdAt
    );
    
    console.log(`✅ Venda ${venda.numeroOF} criada com status: ${venda.settlementStatus}`);
}

// 2. Criar um acerto de teste
console.log('\n2. Criando acerto de teste...');

const acertoId = uuidv4();
const linhaIds = vendasTeste.map(v => v.id).join(',');

db.prepare(`
    INSERT INTO acertos (
        id, data, titulo, linhaIds, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(
    acertoId,
    '2025-01-15',
    'Acerto de Teste',
    linhaIds,
    'aberto', // Status inicial aberto
    new Date().toISOString(),
    new Date().toISOString()
);

console.log(`✅ Acerto criado com ID: ${acertoId}`);
console.log(`   Vendas vinculadas: ${vendasTeste.length}`);

// 3. Simular o processo de finalização do acerto
console.log('\n3. Simulando finalização do acerto...');

// Primeiro, atualizar o status do acerto para 'fechado'
db.prepare(`
    UPDATE acertos 
    SET status = 'fechado', updated_at = ?
    WHERE id = ?
`).run(new Date().toISOString(), acertoId);

console.log('✅ Status do acerto atualizado para: fechado');

// 4. Verificar se as vendas ainda estão com status pendente (simulando o problema)
console.log('\n4. Verificando status das vendas ANTES da correção...');

vendasTeste.forEach(venda => {
    const vendaAtual = db.prepare(`
        SELECT id, numeroOF, settlementStatus, acertoId
        FROM linhas_venda 
        WHERE id = ?
    `).get(venda.id);
    
    console.log(`- ${vendaAtual.numeroOF}: Status = ${vendaAtual.settlementStatus || 'NULL'}, AcertoId = ${vendaAtual.acertoId || 'NULL'}`);
});

// 5. Simular a função setLinhasAcerto que deveria ser chamada
console.log('\n5. Aplicando correção (simulando setLinhasAcerto)...');

// Atualizar as vendas vinculadas ao acerto
const updateResult = db.prepare(`
    UPDATE linhas_venda 
    SET acertoId = ?, settlementStatus = 'ACERTADO'
    WHERE id IN (${vendasTeste.map(() => '?').join(',')})
`).run(acertoId, ...vendasTeste.map(v => v.id));

console.log(`✅ ${updateResult.changes} vendas atualizadas`);

// 6. Verificar status após correção
console.log('\n6. Verificando status das vendas APÓS a correção...');

vendasTeste.forEach(venda => {
    const vendaAtual = db.prepare(`
        SELECT id, numeroOF, settlementStatus, acertoId
        FROM linhas_venda 
        WHERE id = ?
    `).get(venda.id);
    
    console.log(`- ${vendaAtual.numeroOF}: Status = ${vendaAtual.settlementStatus}, AcertoId = ${vendaAtual.acertoId}`);
});

// 7. Verificar o acerto final
console.log('\n7. Status final do acerto...');

const acertoFinal = db.prepare(`
    SELECT id, status, updated_at
    FROM acertos 
    WHERE id = ?
`).get(acertoId);

console.log(`Acerto ${acertoId}:`);
console.log(`- Status: ${acertoFinal.status}`);
console.log(`- Atualizado: ${acertoFinal.updated_at}`);

// 8. Estatísticas finais
console.log('\n=== ESTATÍSTICAS APÓS SIMULAÇÃO ===');

const stats = {
    totalVendas: db.prepare('SELECT COUNT(*) as count FROM linhas_venda').get().count,
    vendasAcertadas: db.prepare("SELECT COUNT(*) as count FROM linhas_venda WHERE settlementStatus = 'ACERTADO'").get().count,
    vendasPendentes: db.prepare("SELECT COUNT(*) as count FROM linhas_venda WHERE settlementStatus = 'Pendente'").get().count,
    acertosFechados: db.prepare("SELECT COUNT(*) as count FROM acertos WHERE status = 'fechado'").get().count
};

console.log(`Total de vendas: ${stats.totalVendas}`);
console.log(`Vendas acertadas: ${stats.vendasAcertadas}`);
console.log(`Vendas pendentes: ${stats.vendasPendentes}`);
console.log(`Acertos fechados: ${stats.acertosFechados}`);

console.log('\n=== CONCLUSÃO ===');
if (stats.vendasPendentes > 0) {
    console.log('❌ PROBLEMA REPRODUZIDO: Ainda existem vendas pendentes após finalizar acerto');
    console.log('   Isso indica que a função setLinhasAcerto não está sendo chamada corretamente.');
} else {
    console.log('✅ FUNCIONAMENTO CORRETO: Todas as vendas foram acertadas após finalizar o acerto');
}

db.close();
console.log('\n=== SIMULAÇÃO CONCLUÍDA ===');