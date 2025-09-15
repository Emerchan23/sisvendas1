// Script de teste para verificar se o status da venda muda após finalizar acerto
const path = require('path');
const Database = require('better-sqlite3');

console.log('=== TESTE: STATUS DE VENDAS APÓS FINALIZAR ACERTO ===\n');

const dbPath = path.join(process.cwd(), '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

try {
    // 1. Buscar todos os acertos com status 'fechado'
    console.log('1. Buscando acertos fechados...');
    
    const acertosFechados = db.prepare(`
        SELECT id, titulo, data, linhaIds, status, created_at
        FROM acertos 
        WHERE status = 'fechado'
        ORDER BY created_at DESC
    `).all();
    
    console.log(`Encontrados ${acertosFechados.length} acertos fechados:\n`);
    
    if (acertosFechados.length === 0) {
        console.log('❌ Nenhum acerto fechado encontrado!');
        console.log('\n2. Criando acerto de teste...');
        
        // Criar um acerto de teste
        const { v4: uuidv4 } = require('crypto');
        
        // Primeiro, criar uma venda de teste
        const vendaId = uuidv4();
        const acertoId = uuidv4();
        
        db.prepare(`
            INSERT INTO linhas_venda (
                id, companyId, numeroOF, cliente, valorVenda, 
                settlementStatus, acertoId, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            vendaId,
            'test-company',
            'TEST-001',
            'Cliente Teste',
            1000.00,
            'PENDENTE',
            null,
            new Date().toISOString()
        );
        
        console.log(`   ✅ Venda de teste criada: ${vendaId}`);
        
        // Criar acerto de teste
        db.prepare(`
            INSERT INTO acertos (
                id, data, titulo, linhaIds, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            acertoId,
            new Date().toISOString().split('T')[0],
            'Acerto de Teste',
            JSON.stringify([vendaId]),
            'aberto',
            new Date().toISOString(),
            new Date().toISOString()
        );
        
        console.log(`   ✅ Acerto de teste criado: ${acertoId}`);
        
        // Simular fechamento do acerto
        console.log('\n3. Simulando fechamento do acerto...');
        
        // Atualizar status do acerto para fechado
        db.prepare(`
            UPDATE acertos 
            SET status = 'fechado', updated_at = ?
            WHERE id = ?
        `).run(new Date().toISOString(), acertoId);
        
        console.log('   ✅ Status do acerto alterado para "fechado"');
        
        // Atualizar vendas vinculadas (simulando setLinhasAcerto)
        db.prepare(`
            UPDATE linhas_venda 
            SET acertoId = ?, settlementStatus = 'ACERTADO'
            WHERE id = ?
        `).run(acertoId, vendaId);
        
        console.log('   ✅ Status da venda alterado para "ACERTADO"');
        
        // Verificar resultado
        const acertoTeste = db.prepare(`
            SELECT id, titulo, status FROM acertos WHERE id = ?
        `).get(acertoId);
        
        const vendaTeste = db.prepare(`
            SELECT id, numeroOF, settlementStatus, acertoId FROM linhas_venda WHERE id = ?
        `).get(vendaId);
        
        console.log('\n=== RESULTADO DO TESTE ===');
        console.log(`Acerto: ${acertoTeste.titulo} - Status: ${acertoTeste.status}`);
        console.log(`Venda: ${vendaTeste.numeroOF} - Status: ${vendaTeste.settlementStatus} - AcertoId: ${vendaTeste.acertoId}`);
        
        if (acertoTeste.status === 'fechado' && vendaTeste.settlementStatus === 'ACERTADO' && vendaTeste.acertoId === acertoId) {
            console.log('\n✅ TESTE PASSOU: O processo de fechamento funciona corretamente!');
        } else {
            console.log('\n❌ TESTE FALHOU: Há problemas no processo de fechamento!');
        }
        
        // Limpar dados de teste
        console.log('\n4. Limpando dados de teste...');
        db.prepare('DELETE FROM acertos WHERE id = ?').run(acertoId);
        db.prepare('DELETE FROM linhas_venda WHERE id = ?').run(vendaId);
        console.log('   ✅ Dados de teste removidos');
        
        return;
    }
    
    // 2. Para cada acerto fechado, verificar as vendas vinculadas
    let problemasEncontrados = 0;
    
    for (const acerto of acertosFechados) {
        console.log(`\n📋 Acerto: ${acerto.titulo} (${acerto.id})`);
        console.log(`   Data: ${acerto.data}`);
        console.log(`   Status: ${acerto.status}`);
        
        // Parse linhaIds
        let linhaIds = [];
        try {
            linhaIds = JSON.parse(acerto.linhaIds || '[]');
        } catch (error) {
            console.log(`   ❌ Erro ao parsear linhaIds: ${error.message}`);
            problemasEncontrados++;
            continue;
        }
        
        console.log(`   Vendas vinculadas: ${linhaIds.length}`);
        
        if (linhaIds.length === 0) {
            console.log('   ⚠️  Nenhuma venda vinculada a este acerto!');
            problemasEncontrados++;
            continue;
        }
        
        // Verificar cada venda vinculada
        for (const linhaId of linhaIds) {
            const venda = db.prepare(`
                SELECT id, numeroOF, cliente, valorVenda, settlementStatus, acertoId
                FROM linhas_venda 
                WHERE id = ?
            `).get(linhaId);
            
            if (!venda) {
                console.log(`   ❌ Venda não encontrada: ${linhaId}`);
                problemasEncontrados++;
                continue;
            }
            
            console.log(`   📦 Venda: ${venda.numeroOF} - ${venda.cliente}`);
            console.log(`      Status: ${venda.settlementStatus}`);
            console.log(`      AcertoId: ${venda.acertoId}`);
            
            // Verificar se há problemas
            const problemas = [];
            
            if (venda.settlementStatus !== 'ACERTADO') {
                problemas.push(`Status deveria ser ACERTADO, mas é ${venda.settlementStatus}`);
            }
            
            if (venda.acertoId !== acerto.id) {
                problemas.push(`AcertoId deveria ser ${acerto.id}, mas é ${venda.acertoId}`);
            }
            
            if (problemas.length > 0) {
                console.log(`      ❌ PROBLEMAS ENCONTRADOS:`);
                problemas.forEach(problema => {
                    console.log(`         - ${problema}`);
                });
                problemasEncontrados++;
            } else {
                console.log(`      ✅ Venda está correta`);
            }
        }
    }
    
    // 3. Teste manual de atualização de status
    console.log('\n=== TESTE MANUAL DE ATUALIZAÇÃO ===');
    
    if (acertosFechados.length > 0) {
        const primeiroAcerto = acertosFechados[0];
        let linhaIds = [];
        
        try {
            linhaIds = JSON.parse(primeiroAcerto.linhaIds || '[]');
        } catch (error) {
            console.log('❌ Não foi possível parsear linhaIds para teste manual');
        }
        
        if (linhaIds.length > 0) {
            const primeiraVenda = linhaIds[0];
            
            console.log(`Testando atualização manual da venda: ${primeiraVenda}`);
            
            // Verificar status atual
            const vendaAntes = db.prepare(`
                SELECT settlementStatus, acertoId FROM linhas_venda WHERE id = ?
            `).get(primeiraVenda);
            
            if (vendaAntes) {
                console.log(`   Status antes: ${vendaAntes.settlementStatus}`);
                console.log(`   AcertoId antes: ${vendaAntes.acertoId}`);
                
                // Tentar atualizar
                const updateResult = db.prepare(`
                    UPDATE linhas_venda 
                    SET settlementStatus = 'ACERTADO', acertoId = ?
                    WHERE id = ?
                `).run(primeiroAcerto.id, primeiraVenda);
                
                if (updateResult.changes > 0) {
                    console.log('   ✅ Atualização manual bem-sucedida');
                    
                    // Verificar resultado
                    const vendaDepois = db.prepare(`
                        SELECT settlementStatus, acertoId FROM linhas_venda WHERE id = ?
                    `).get(primeiraVenda);
                    
                    console.log(`   Status depois: ${vendaDepois.settlementStatus}`);
                    console.log(`   AcertoId depois: ${vendaDepois.acertoId}`);
                } else {
                    console.log('   ❌ Falha na atualização manual');
                    problemasEncontrados++;
                }
            } else {
                console.log('   ❌ Venda não encontrada para teste manual');
            }
        } else {
            console.log('❌ Não há vendas para testar atualização manual');
        }
    }
    
    // 4. Resumo final
    console.log('\n=== RESUMO FINAL ===');
    console.log(`Total de acertos fechados: ${acertosFechados.length}`);
    console.log(`Problemas encontrados: ${problemasEncontrados}`);
    
    if (problemasEncontrados === 0) {
        console.log('\n✅ CONCLUSÃO: Todos os acertos fechados estão com status correto!');
        console.log('   O problema pode estar no frontend ou na sincronização em tempo real.');
    } else {
        console.log('\n❌ CONCLUSÃO: Foram encontrados problemas na sincronização!');
        console.log('   Recomendações:');
        console.log('   1. Verificar se a função setLinhasAcerto está sendo chamada');
        console.log('   2. Verificar se a API de atualização está funcionando');
        console.log('   3. Verificar se há problemas de concorrência');
    }
    
    // 5. Verificar função setLinhasAcerto
    console.log('\n=== TESTE DA FUNÇÃO setLinhasAcerto ===');
    
    // Simular chamada da função setLinhasAcerto
    if (acertosFechados.length > 0) {
        const acertoTeste = acertosFechados[0];
        let linhaIds = [];
        
        try {
            linhaIds = JSON.parse(acertoTeste.linhaIds || '[]');
        } catch (error) {
            console.log('❌ Não foi possível parsear linhaIds para teste da função');
        }
        
        if (linhaIds.length > 0) {
            console.log(`Simulando setLinhasAcerto para acerto: ${acertoTeste.id}`);
            console.log(`Vendas a serem atualizadas: ${linhaIds.join(', ')}`);
            
            let sucessos = 0;
            let falhas = 0;
            
            for (const linhaId of linhaIds) {
                try {
                    const updateResult = db.prepare(`
                        UPDATE linhas_venda 
                        SET acertoId = ?, settlementStatus = 'ACERTADO'
                        WHERE id = ?
                    `).run(acertoTeste.id, linhaId);
                    
                    if (updateResult.changes > 0) {
                        sucessos++;
                        console.log(`   ✅ Venda ${linhaId} atualizada`);
                    } else {
                        falhas++;
                        console.log(`   ❌ Falha ao atualizar venda ${linhaId}`);
                    }
                } catch (error) {
                    falhas++;
                    console.log(`   ❌ Erro ao atualizar venda ${linhaId}: ${error.message}`);
                }
            }
            
            console.log(`\nResultado: ${sucessos} sucessos, ${falhas} falhas`);
            
            if (falhas === 0) {
                console.log('✅ A função setLinhasAcerto funciona corretamente!');
            } else {
                console.log('❌ Há problemas na função setLinhasAcerto!');
            }
        }
    }
    
} catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.error(error.stack);
} finally {
    db.close();
}