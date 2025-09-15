// Teste para verificar diretamente no banco de dados se os campos estão sendo salvos
// Execute com: node test-database-check.js

const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '../Banco de dados Aqui/database.db');
console.log('🔍 Conectando ao banco:', dbPath);

try {
  const db = new Database(dbPath);
  
  console.log('\n=== VERIFICAÇÃO DO BANCO DE DADOS ===\n');
  
  // 1. Verificar estrutura da tabela orcamento_itens
  console.log('📋 1. ESTRUTURA DA TABELA orcamento_itens:');
  const tableInfo = db.prepare("PRAGMA table_info(orcamento_itens)").all();
  tableInfo.forEach(column => {
    console.log(`  - ${column.name}: ${column.type} ${column.notnull ? '(NOT NULL)' : '(NULL)'}`);
  });
  
  // 2. Verificar se existem orçamentos
  console.log('\n📊 2. ORÇAMENTOS NO BANCO:');
  const orcamentos = db.prepare('SELECT id, numero, created_at FROM orcamentos ORDER BY created_at DESC LIMIT 5').all();
  console.log(`  Total de orçamentos: ${orcamentos.length}`);
  orcamentos.forEach((orc, index) => {
    console.log(`  ${index + 1}. ID: ${orc.id}, Número: ${orc.numero}, Criado: ${orc.created_at}`);
  });
  
  // 3. Verificar itens com detalhes internos
  console.log('\n🔍 3. ITENS COM DETALHES INTERNOS:');
  const itensComDetalhes = db.prepare(`
    SELECT 
      oi.id,
      oi.orcamento_id,
      oi.descricao,
      oi.valor_unitario,
      oi.link_ref,
      oi.custo_ref,
      o.numero as orcamento_numero
    FROM orcamento_itens oi
    JOIN orcamentos o ON oi.orcamento_id = o.id
    WHERE (oi.link_ref IS NOT NULL AND oi.link_ref != '') 
       OR (oi.custo_ref IS NOT NULL AND oi.custo_ref != 0)
    ORDER BY oi.id DESC
    LIMIT 10
  `).all();
  
  if (itensComDetalhes.length === 0) {
    console.log('  ❌ NENHUM item encontrado com detalhes internos!');
    console.log('  💡 Isso indica que os campos link_ref e custo_ref não estão sendo salvos.');
  } else {
    console.log(`  ✅ Encontrados ${itensComDetalhes.length} itens com detalhes internos:`);
    itensComDetalhes.forEach((item, index) => {
      console.log(`\n  📦 Item ${index + 1}:`);
      console.log(`    - Orçamento: ${item.orcamento_numero} (ID: ${item.orcamento_id})`);
      console.log(`    - Descrição: ${item.descricao}`);
      console.log(`    - Valor unitário: R$ ${item.valor_unitario}`);
      console.log(`    - Link ref: ${item.link_ref || 'VAZIO'}`);
      console.log(`    - Custo ref: R$ ${item.custo_ref || 'VAZIO'}`);
    });
  }
  
  // 4. Verificar todos os itens recentes (últimos 10)
  console.log('\n📋 4. ÚLTIMOS 10 ITENS CRIADOS:');
  const ultimosItens = db.prepare(`
    SELECT 
      oi.id,
      oi.orcamento_id,
      oi.descricao,
      oi.valor_unitario,
      oi.link_ref,
      oi.custo_ref,
      o.numero as orcamento_numero
    FROM orcamento_itens oi
    JOIN orcamentos o ON oi.orcamento_id = o.id
    ORDER BY oi.rowid DESC
    LIMIT 10
  `).all();
  
  ultimosItens.forEach((item, index) => {
    console.log(`\n  📦 Item ${index + 1}:`);
    console.log(`    - Orçamento: ${item.orcamento_numero}`);
    console.log(`    - Descrição: ${item.descricao}`);
    console.log(`    - Valor unitário: R$ ${item.valor_unitario}`);
    console.log(`    - Link ref: ${item.link_ref || 'VAZIO'}`);
    console.log(`    - Custo ref: R$ ${item.custo_ref || 'VAZIO'}`);
    
    // Análise dos problemas
    const problemas = [];
    if (!item.valor_unitario || item.valor_unitario === 0) {
      problemas.push('Valor unitário é 0 ou null');
    }
    if (!item.link_ref || item.link_ref === '') {
      problemas.push('Link ref está vazio');
    }
    if (!item.custo_ref || item.custo_ref === 0) {
      problemas.push('Custo ref é 0 ou null');
    }
    
    if (problemas.length > 0) {
      console.log(`    🚨 PROBLEMAS: ${problemas.join(', ')}`);
    } else {
      console.log(`    ✅ Todos os campos preenchidos corretamente`);
    }
  });
  
  // 5. Estatísticas gerais
  console.log('\n📊 5. ESTATÍSTICAS GERAIS:');
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_itens,
      COUNT(CASE WHEN valor_unitario > 0 THEN 1 END) as com_valor_unitario,
      COUNT(CASE WHEN link_ref IS NOT NULL AND link_ref != '' THEN 1 END) as com_link_ref,
      COUNT(CASE WHEN custo_ref IS NOT NULL AND custo_ref > 0 THEN 1 END) as com_custo_ref
    FROM orcamento_itens
  `).get();
  
  console.log(`  - Total de itens: ${stats.total_itens}`);
  console.log(`  - Com valor unitário > 0: ${stats.com_valor_unitario} (${((stats.com_valor_unitario/stats.total_itens)*100).toFixed(1)}%)`);
  console.log(`  - Com link ref preenchido: ${stats.com_link_ref} (${((stats.com_link_ref/stats.total_itens)*100).toFixed(1)}%)`);
  console.log(`  - Com custo ref > 0: ${stats.com_custo_ref} (${((stats.com_custo_ref/stats.total_itens)*100).toFixed(1)}%)`);
  
  db.close();
  
  console.log('\n✅ VERIFICAÇÃO CONCLUÍDA!');
  console.log('\n💡 INTERPRETAÇÃO DOS RESULTADOS:');
  console.log('  - Se "Com link ref preenchido" e "Com custo ref > 0" forem 0%, o problema está no salvamento');
  console.log('  - Se houver itens com detalhes, o problema pode estar na interface do usuário');
  console.log('  - Se "Com valor unitário > 0" for baixo, há problema no salvamento do valor unitário também');
  
} catch (error) {
  console.error('❌ Erro ao acessar o banco de dados:', error.message);
  console.log('\n💡 Possíveis soluções:');
  console.log('  1. Verifique se o arquivo database.db existe');
  console.log('  2. Instale better-sqlite3: npm install better-sqlite3');
  console.log('  3. Execute este script na pasta raiz do projeto');
}