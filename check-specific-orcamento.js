const fetch = require('node-fetch');

async function checkSpecificOrcamento() {
    try {
        console.log('=== VERIFICANDO ORÇAMENTO ESPECÍFICO ===');
        
        // Buscar o orçamento criado pelo nosso teste (número 03/2025)
        console.log('\n1. Buscando orçamento 03/2025...');
        const response = await fetch('http://localhost:3145/api/orcamentos?incluir_itens=true');
        const orcamentos = await response.json();
        
        const orcamentoTeste = orcamentos.find(o => o.numero.includes('TEST'));
        
        if (orcamentoTeste) {
            console.log('✅ Orçamento encontrado:');
            console.log('ID:', orcamentoTeste.id);
            console.log('Número:', orcamentoTeste.numero);
            console.log('Cliente:', orcamentoTeste.cliente);
            console.log('Valor Total:', orcamentoTeste.valor_total);
            console.log('Quantidade de itens:', orcamentoTeste.itens_count);
            
            if (orcamentoTeste.itens && orcamentoTeste.itens.length > 0) {
                console.log('\n✅ Itens encontrados:');
                orcamentoTeste.itens.forEach((item, index) => {
                    console.log(`Item ${index + 1}:`);
                    console.log('  - Descrição:', item.descricao);
                    console.log('  - Marca:', item.marca);
                    console.log('  - Quantidade:', item.quantidade);
                    console.log('  - Valor Unitário:', item.valor_unitario);
                    console.log('  - Valor Total:', item.valor_total);
                    console.log('');
                });
            } else {
                console.log('\n❌ Nenhum item encontrado no orçamento!');
            }
        } else {
            console.log('❌ Orçamento TEST não encontrado!');
            console.log('\nOrçamentos disponíveis:');
            orcamentos.forEach(o => {
                console.log(`- ${o.numero}: ${JSON.stringify(o.cliente)} (${o.itens_count || 'undefined'} itens)`);
                console.log(`  Valor total: ${o.valor_total}`);
                if (o.itens && o.itens.length > 0) {
                    console.log(`  Itens: ${o.itens.length}`);
                } else {
                    console.log(`  Itens: nenhum`);
                }
                console.log('');
            });
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

checkSpecificOrcamento();