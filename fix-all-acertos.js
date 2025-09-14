// Script para corrigir todos os acertos com linhaIds em formato incorreto
const path = require('path');
const Database = require('better-sqlite3');

console.log('=== CORREÇÃO: TODOS OS ACERTOS COM LINHAIDS INCORRETOS ===\n');

const dbPath = path.join(process.cwd(), 'data', 'erp.sqlite');
const db = new Database(dbPath);

try {
    // 1. Buscar todos os acertos
    console.log('1. Buscando todos os acertos...');
    
    const todosAcertos = db.prepare(`
        SELECT id, titulo, data, linhaIds, status, created_at
        FROM acertos 
        ORDER BY created_at DESC
    `).all();
    
    console.log(`Encontrados ${todosAcertos.length} acertos:\n`);
    
    let acertosProblematicos = [];
    let acertosCorretos = [];
    
    // 2. Verificar cada acerto
    for (const acerto of todosAcertos) {
        console.log(`📋 Verificando: ${acerto.titulo} (${acerto.id})`);
        console.log(`   Status: ${acerto.status}`);
        console.log(`   LinhaIds raw: ${acerto.linhaIds}`);
        
        try {
            const linhaIds = JSON.parse(acerto.linhaIds || '[]');
            console.log(`   ✅ LinhaIds parseado: ${JSON.stringify(linhaIds)}`);
            console.log(`   Tipo: ${Array.isArray(linhaIds) ? 'Array' : typeof linhaIds}`);
            
            if (Array.isArray(linhaIds)) {
                acertosCorretos.push({
                    ...acerto,
                    linhaIdsParsed: linhaIds
                });
            } else {
                console.log(`   ❌ LinhaIds não é um array!`);
                acertosProblematicos.push(acerto);
            }
        } catch (error) {
            console.log(`   ❌ Erro ao parsear: ${error.message}`);
            acertosProblematicos.push(acerto);
        }
        
        console.log('');
    }
    
    console.log(`\n=== RESUMO ===`);
    console.log(`Acertos corretos: ${acertosCorretos.length}`);
    console.log(`Acertos problemáticos: ${acertosProblematicos.length}`);
    
    // 3. Corrigir acertos problemáticos
    if (acertosProblematicos.length > 0) {
        console.log('\n3. Corrigindo acertos problemáticos...');
        
        for (const acerto of acertosProblematicos) {
            console.log(`\n🔧 Corrigindo: ${acerto.titulo} (${acerto.id})`);
            
            // Tentar diferentes estratégias de correção
            let linhaIdsCorrigido = null;
            
            // Estratégia 1: Tentar remover caracteres inválidos
            try {
                let linhaIdsLimpo = acerto.linhaIds;
                
                // Remover caracteres não-JSON comuns
                linhaIdsLimpo = linhaIdsLimpo.replace(/[^\[\]\{\}\"\',:\s\w-]/g, '');
                
                const parsed = JSON.parse(linhaIdsLimpo);
                if (Array.isArray(parsed)) {
                    linhaIdsCorrigido = JSON.stringify(parsed);
                    console.log(`   ✅ Estratégia 1 funcionou: ${linhaIdsCorrigido}`);
                }
            } catch (error) {
                console.log(`   ❌ Estratégia 1 falhou: ${error.message}`);
            }
            
            // Estratégia 2: Tentar interpretar como string separada por vírgula
            if (!linhaIdsCorrigido) {
                try {
                    let linhaIdsString = acerto.linhaIds;
                    
                    // Remover colchetes se existirem
                    linhaIdsString = linhaIdsString.replace(/[\[\]]/g, '');
                    
                    // Dividir por vírgula e limpar
                    const ids = linhaIdsString.split(',').map(id => id.trim().replace(/[\"\']/g, ''));
                    
                    // Filtrar IDs válidos (formato UUID)
                    const idsValidos = ids.filter(id => 
                        id.length > 0 && 
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
                    );
                    
                    if (idsValidos.length > 0) {
                        linhaIdsCorrigido = JSON.stringify(idsValidos);
                        console.log(`   ✅ Estratégia 2 funcionou: ${linhaIdsCorrigido}`);
                    }
                } catch (error) {
                    console.log(`   ❌ Estratégia 2 falhou: ${error.message}`);
                }
            }
            
            // Estratégia 3: Definir como array vazio
            if (!linhaIdsCorrigido) {
                linhaIdsCorrigido = '[]';
                console.log(`   ⚠️  Estratégia 3: Definindo como array vazio`);
            }
            
            // Aplicar correção
            try {
                const updateResult = db.prepare(`
                    UPDATE acertos 
                    SET linhaIds = ?, updated_at = ?
                    WHERE id = ?
                `).run(
                    linhaIdsCorrigido,
                    new Date().toISOString(),
                    acerto.id
                );
                
                if (updateResult.changes > 0) {
                    console.log(`   ✅ Acerto corrigido com sucesso!`);
                    
                    // Verificar se há vendas para vincular
                    const linhaIds = JSON.parse(linhaIdsCorrigido);
                    if (linhaIds.length > 0) {
                        console.log(`   🔗 Verificando vendas vinculadas...`);
                        
                        for (const linhaId of linhaIds) {
                            const venda = db.prepare(`
                                SELECT id, numeroOF, settlementStatus, acertoId
                                FROM linhas_venda 
                                WHERE id = ?
                            `).get(linhaId);
                            
                            if (venda) {
                                console.log(`      ✅ Venda encontrada: ${venda.numeroOF}`);
                                
                                // Atualizar venda se necessário
                                if (venda.settlementStatus !== 'ACERTADO' || venda.acertoId !== acerto.id) {
                                    const updateVenda = db.prepare(`
                                        UPDATE linhas_venda 
                                        SET acertoId = ?, settlementStatus = 'ACERTADO'
                                        WHERE id = ?
                                    `).run(acerto.id, linhaId);
                                    
                                    if (updateVenda.changes > 0) {
                                        console.log(`      🔄 Venda atualizada`);
                                    }
                                }
                            } else {
                                console.log(`      ❌ Venda não encontrada: ${linhaId}`);
                            }
                        }
                    }
                } else {
                    console.log(`   ❌ Falha ao corrigir acerto`);
                }
            } catch (error) {
                console.log(`   ❌ Erro ao aplicar correção: ${error.message}`);
            }
        }
    }
    
    // 4. Verificação final
    console.log('\n=== VERIFICAÇÃO FINAL ===');
    
    const acertosFinais = db.prepare(`
        SELECT id, titulo, linhaIds, status
        FROM acertos 
        ORDER BY created_at DESC
    `).all();
    
    let problemasRestantes = 0;
    
    for (const acerto of acertosFinais) {
        try {
            const linhaIds = JSON.parse(acerto.linhaIds || '[]');
            console.log(`✅ ${acerto.titulo}: ${linhaIds.length} vendas vinculadas`);
            
            // Verificar vendas vinculadas
            if (linhaIds.length > 0) {
                for (const linhaId of linhaIds) {
                    const venda = db.prepare(`
                        SELECT numeroOF, settlementStatus, acertoId
                        FROM linhas_venda 
                        WHERE id = ?
                    `).get(linhaId);
                    
                    if (venda) {
                        const statusOk = venda.settlementStatus === 'ACERTADO';
                        const acertoOk = venda.acertoId === acerto.id;
                        
                        if (!statusOk || !acertoOk) {
                            console.log(`   ❌ Problema na venda ${venda.numeroOF}: status=${venda.settlementStatus}, acertoId=${venda.acertoId}`);
                            problemasRestantes++;
                        }
                    } else {
                        console.log(`   ❌ Venda não encontrada: ${linhaId}`);
                        problemasRestantes++;
                    }
                }
            }
        } catch (error) {
            console.log(`❌ ${acerto.titulo}: Ainda com problema - ${error.message}`);
            problemasRestantes++;
        }
    }
    
    console.log(`\n=== RESULTADO FINAL ===`);
    if (problemasRestantes === 0) {
        console.log('🎉 Todos os acertos foram corrigidos com sucesso!');
        console.log('   Todos os linhaIds estão em formato JSON válido');
        console.log('   Todas as vendas vinculadas estão com status correto');
    } else {
        console.log(`❌ Ainda existem ${problemasRestantes} problemas`);
        console.log('   Pode ser necessária intervenção manual');
    }
    
} catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
    console.error(error.stack);
} finally {
    db.close();
}