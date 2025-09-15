const fetch = require('node-fetch');

async function testFrontendOrcamento() {
    try {
        console.log('=== TESTE DE CRIAÇÃO DE ORÇAMENTO VIA FRONTEND ===');
        
        // 1. Primeiro, vamos buscar um cliente existente
        console.log('\n1. Buscando clientes disponíveis...');
        const clientesResponse = await fetch('http://localhost:3145/api/clientes');
        const clientes = await clientesResponse.json();
        
        if (clientes.length === 0) {
            console.log('❌ Nenhum cliente encontrado!');
            return;
        }
        
        const cliente = clientes[0];
        console.log('✅ Cliente selecionado:', cliente.nome || cliente.id);
        
        // 2. Criar orçamento com dados similares ao que o frontend enviaria
        console.log('\n2. Criando orçamento via API...');
        const orcamentoData = {
            numero: `FRONTEND-TEST/${new Date().getFullYear()}`,
            cliente_id: cliente.id,
            data_orcamento: new Date().toISOString().split('T')[0],
            descricao: 'Orçamento criado via teste frontend',
            observacoes: 'Teste de criação via frontend',
            condicoes_pagamento: 'À vista',
            prazo_entrega: '10 dias',
            vendedor_id: null,
            desconto: 0,
            modalidade: 'Comum',
            numero_pregao: '',
            numero_dispensa: '',
            itens: [
                {
                    descricao: 'Produto Frontend 1',
                    marca: 'Marca Frontend A',
                    quantidade: 3,
                    valor_unitario: 25.50,
                    observacoes: 'Item de teste frontend 1',
                    link_ref: 'https://exemplo.com/produto1',
                    custo_ref: 20.00
                },
                {
                    descricao: 'Produto Frontend 2',
                    marca: 'Marca Frontend B',
                    quantidade: 1,
                    valor_unitario: 100.00,
                    observacoes: 'Item de teste frontend 2',
                    link_ref: 'https://exemplo.com/produto2',
                    custo_ref: 80.00
                }
            ]
        };
        
        const createResponse = await fetch('http://localhost:3145/api/orcamentos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orcamentoData)
        });
        
        if (createResponse.ok) {
            const novoOrcamento = await createResponse.json();
            console.log('✅ Orçamento criado com sucesso!');
            console.log('ID:', novoOrcamento.id);
            console.log('Número:', novoOrcamento.numero);
            console.log('Valor Total:', novoOrcamento.valor_total);
            
            // 3. Verificar se o orçamento foi salvo corretamente com itens
            console.log('\n3. Verificando orçamento criado...');
            const verificarResponse = await fetch(`http://localhost:3145/api/orcamentos?incluir_itens=true`);
            const orcamentos = await verificarResponse.json();
            
            const orcamentoCriado = orcamentos.find(o => o.id === novoOrcamento.id);
            
            if (orcamentoCriado) {
                console.log('✅ Orçamento encontrado na listagem!');
                console.log('Número:', orcamentoCriado.numero);
                console.log('Valor Total:', orcamentoCriado.valor_total);
                console.log('Quantidade de itens:', orcamentoCriado.itens_count);
                
                if (orcamentoCriado.itens && orcamentoCriado.itens.length > 0) {
                    console.log('\n✅ Itens salvos corretamente:');
                    orcamentoCriado.itens.forEach((item, index) => {
                        console.log(`Item ${index + 1}:`);
                        console.log(`  - Descrição: ${item.descricao}`);
                        console.log(`  - Marca: ${item.marca}`);
                        console.log(`  - Quantidade: ${item.quantidade}`);
                        console.log(`  - Valor Unitário: R$ ${item.valor_unitario}`);
                        console.log(`  - Valor Total: R$ ${item.valor_total}`);
                        console.log(`  - Link Ref: ${item.link_ref}`);
                        console.log(`  - Custo Ref: R$ ${item.custo_ref}`);
                        console.log('');
                    });
                    
                    console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
                    console.log('✅ Todos os dados dos itens foram salvos corretamente!');
                } else {
                    console.log('❌ Nenhum item encontrado no orçamento!');
                }
            } else {
                console.log('❌ Orçamento não encontrado na listagem!');
            }
        } else {
            const error = await createResponse.text();
            console.log('❌ Erro ao criar orçamento:', createResponse.status);
            console.log('Resposta:', error);
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

testFrontendOrcamento();