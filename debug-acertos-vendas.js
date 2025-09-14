const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco de dados correto
const dbPath = path.join(__dirname, 'data', 'erp.sqlite');
console.log('Conectando ao banco:', dbPath);
const db = new Database(dbPath);

console.log('=== INVESTIGAÇÃO: ACERTOS FECHADOS E VENDAS VINCULADAS ===\n');

// 1. Verificar estrutura da tabela linhas_venda
console.log('1. ESTRUTURA DA TABELA LINHAS_VENDA:');
try {
  const estruturaLinhas = db.prepare('PRAGMA table_info(linhas_venda)').all();
  console.log('  Colunas da tabela linhas_venda:');
  estruturaLinhas.forEach(col => {
    console.log(`    - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  
  // Mostrar algumas linhas de exemplo
  console.log('\n  Primeiras 3 linhas de venda:');
  const linhasExemplo = db.prepare('SELECT * FROM linhas_venda LIMIT 3').all();
  linhasExemplo.forEach((linha, index) => {
    console.log(`    ${index + 1}. ID: ${linha.id}`);
    Object.keys(linha).forEach(key => {
      if (key !== 'id') {
        console.log(`       ${key}: ${linha[key] || 'NULL'}`);
      }
    });
  });
  
} catch (error) {
  console.log(`  ❌ Erro ao ler linhas_venda: ${error.message}`);
}

// 2. Verificar acertos fechados e suas linhas
console.log('\n2. ACERTOS FECHADOS E SUAS LINHAS:');
try {
  const acertosFechados = db.prepare(`
    SELECT id, titulo, status, linhaIds, created_at, updated_at
    FROM acertos 
    WHERE status = 'fechado'
  `).all();
  
  console.log(`  Encontrados ${acertosFechados.length} acertos fechados:`);
  
  acertosFechados.forEach(acerto => {
    console.log(`\n  --- ACERTO: ${acerto.titulo} (${acerto.id}) ---`);
    console.log(`    Status: ${acerto.status}`);
    console.log(`    Atualizado: ${acerto.updated_at}`);
    
    if (acerto.linhaIds) {
      try {
        const linhaIds = JSON.parse(acerto.linhaIds);
        console.log(`    Linhas vinculadas: ${linhaIds.length}`);
        
        linhaIds.forEach((linhaId, index) => {
          const linha = db.prepare('SELECT * FROM linhas_venda WHERE id = ?').get(linhaId);
          if (linha) {
            console.log(`      ${index + 1}. Linha ${linhaId}:`);
            console.log(`         Settlement Status: ${linha.settlementStatus || 'NULL'}`);
            console.log(`         Acerto ID: ${linha.acertoId || 'NULL'}`);
            console.log(`         Produto: ${linha.produto || 'N/A'}`);
            console.log(`         Quantidade: ${linha.quantidade || 'N/A'}`);
            console.log(`         Valor: ${linha.valor || 'N/A'}`);
            
            // Verificar se o status está correto
            const statusCorreto = linha.settlementStatus === 'ACERTADO';
            const acertoCorreto = linha.acertoId === acerto.id;
            console.log(`         ✅ Status: ${statusCorreto ? 'OK' : 'INCORRETO'}`);
            console.log(`         ✅ Acerto: ${acertoCorreto ? 'OK' : 'INCORRETO'}`);
          } else {
            console.log(`      ${index + 1}. ❌ Linha ${linhaId} não encontrada`);
          }
        });
      } catch (error) {
        console.log(`    ❌ Erro ao processar linhas: ${error.message}`);
      }
    }
  });
  
} catch (error) {
  console.log(`  ❌ Erro ao verificar acertos: ${error.message}`);
}

// 3. Verificar se há problemas de sincronização
console.log('\n3. VERIFICANDO PROBLEMAS DE SINCRONIZAÇÃO:');
try {
  // Verificar linhas que têm acertoId mas o acerto não está fechado
  const linhasDesatualizadas = db.prepare(`
    SELECT lv.id, lv.settlementStatus, lv.acertoId, a.status as acerto_status, a.titulo
    FROM linhas_venda lv
    JOIN acertos a ON lv.acertoId = a.id
    WHERE a.status = 'fechado' AND lv.settlementStatus != 'ACERTADO'
  `).all();
  
  if (linhasDesatualizadas.length === 0) {
    console.log('  ✅ Todas as linhas de acertos fechados estão com status ACERTADO');
  } else {
    console.log(`  ❌ ${linhasDesatualizadas.length} linhas com status incorreto:`);
    linhasDesatualizadas.forEach(linha => {
      console.log(`    - Linha ${linha.id}: status "${linha.settlementStatus}" (deveria ser ACERTADO)`);
      console.log(`      Acerto: ${linha.titulo} (${linha.acertoId}) - Status: ${linha.acerto_status}`);
    });
  }
  
  // Verificar linhas órfãs (com acertoId mas acerto não existe)
  const linhasOrfas = db.prepare(`
    SELECT lv.id, lv.settlementStatus, lv.acertoId
    FROM linhas_venda lv
    LEFT JOIN acertos a ON lv.acertoId = a.id
    WHERE lv.acertoId IS NOT NULL AND a.id IS NULL
  `).all();
  
  if (linhasOrfas.length > 0) {
    console.log(`\n  ⚠️  ${linhasOrfas.length} linhas órfãs (acerto não existe):`);
    linhasOrfas.forEach(linha => {
      console.log(`    - Linha ${linha.id}: acertoId ${linha.acertoId} não encontrado`);
    });
  }
  
} catch (error) {
  console.log(`  ❌ Erro ao verificar sincronização: ${error.message}`);
}

// 4. Estatísticas finais
console.log('\n4. ESTATÍSTICAS FINAIS:');
try {
  const totalLinhas = db.prepare('SELECT COUNT(*) as count FROM linhas_venda').get().count;
  const linhasComAcerto = db.prepare('SELECT COUNT(*) as count FROM linhas_venda WHERE acertoId IS NOT NULL').get().count;
  const linhasAcertadas = db.prepare("SELECT COUNT(*) as count FROM linhas_venda WHERE settlementStatus = 'ACERTADO'").get().count;
  const totalAcertos = db.prepare('SELECT COUNT(*) as count FROM acertos').get().count;
  const acertosFechados = db.prepare("SELECT COUNT(*) as count FROM acertos WHERE status = 'fechado'").get().count;
  
  console.log(`  - Total de linhas de venda: ${totalLinhas}`);
  console.log(`  - Linhas com acertoId: ${linhasComAcerto}`);
  console.log(`  - Linhas com status ACERTADO: ${linhasAcertadas}`);
  console.log(`  - Total de acertos: ${totalAcertos}`);
  console.log(`  - Acertos fechados: ${acertosFechados}`);
  
} catch (error) {
  console.log(`  ❌ Erro ao calcular estatísticas: ${error.message}`);
}

// 5. Conclusão
console.log('\n5. CONCLUSÃO:');
console.log('  Se os dados no banco estão corretos mas a interface não mostra,');
console.log('  o problema pode estar na consulta da interface ou no cache do navegador.');
console.log('  Verifique se a página está fazendo a consulta correta aos dados.');

db.close();
console.log('\n=== FIM DA INVESTIGAÇÃO ===');