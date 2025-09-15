const Database = require('better-sqlite3');
const path = require('path');

async function checkTableStructure() {
  console.log('🔍 Verificando estrutura da tabela orcamentos...');
  
  // Conectar ao banco de dados
  const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
  const db = new Database(dbPath);
  
  try {
    // Verificar estrutura da tabela orcamentos
    const tableInfo = db.prepare("PRAGMA table_info(orcamentos)").all();
    
    console.log('📋 Colunas da tabela orcamentos:');
    tableInfo.forEach(column => {
      console.log(`   - ${column.name} (${column.type}) ${column.notnull ? 'NOT NULL' : ''} ${column.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    console.log('');
    console.log('🔍 Verificando orçamentos recentes (últimos 5 minutos)...');
    
    // Buscar orçamentos recentes com apenas as colunas que existem
    const recentOrcamentos = db.prepare(`
      SELECT 
        id, numero, modalidade, numero_pregao, numero_dispensa,
        data_orcamento, descricao, created_at
      FROM orcamentos 
      WHERE created_at > datetime('now', '-5 minutes')
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
    
    console.log(`📊 Encontrados ${recentOrcamentos.length} orçamentos criados nos últimos 5 minutos:`);
    console.log('');
    
    if (recentOrcamentos.length === 0) {
      console.log('❌ Nenhum orçamento encontrado nos últimos 5 minutos.');
      
      // Mostrar os últimos 3 orçamentos de qualquer data
      console.log('\n📋 Mostrando os últimos 3 orçamentos de qualquer data:');
      const lastOrcamentos = db.prepare(`
        SELECT 
          id, numero, modalidade, numero_pregao, numero_dispensa,
          data_orcamento, descricao, created_at
        FROM orcamentos 
        ORDER BY created_at DESC
        LIMIT 3
      `).all();
      
      lastOrcamentos.forEach((orc, index) => {
        console.log(`\n📋 Orçamento ${index + 1}:`);
        console.log(`   - ID: ${orc.id}`);
        console.log(`   - Número: ${orc.numero}`);
        console.log(`   - Modalidade: ${orc.modalidade || 'NULL/VAZIO'}`);
        console.log(`   - Número Pregão: ${orc.numero_pregao || 'NULL/VAZIO'}`);
        console.log(`   - Número Dispensa: ${orc.numero_dispensa || 'NULL/VAZIO'}`);
        console.log(`   - Data: ${orc.data_orcamento}`);
        console.log(`   - Criado em: ${orc.created_at}`);
        console.log(`   - Descrição: ${orc.descricao}`);
      });
      
      return;
    }
    
    recentOrcamentos.forEach((orc, index) => {
      console.log(`📋 Orçamento ${index + 1}:`);
      console.log(`   - ID: ${orc.id}`);
      console.log(`   - Número: ${orc.numero}`);
      console.log(`   - Modalidade: ${orc.modalidade || 'NULL/VAZIO'}`);
      console.log(`   - Número Pregão: ${orc.numero_pregao || 'NULL/VAZIO'}`);
      console.log(`   - Número Dispensa: ${orc.numero_dispensa || 'NULL/VAZIO'}`);
      console.log(`   - Data: ${orc.data_orcamento}`);
      console.log(`   - Criado em: ${orc.created_at}`);
      console.log(`   - Descrição: ${orc.descricao}`);
      
      // Verificar se a modalidade foi salva corretamente
      if (orc.modalidade === 'PREGAO') {
        console.log('   ✅ MODALIDADE PREGAO SALVA CORRETAMENTE!');
      } else if (orc.modalidade) {
        console.log(`   ⚠️  Modalidade salva: ${orc.modalidade} (diferente de PREGAO)`);
      } else {
        console.log('   ❌ MODALIDADE NÃO FOI SALVA (NULL/VAZIO)');
      }
      
      console.log('');
    });
    
    // Resumo dos resultados
    const comModalidade = recentOrcamentos.filter(o => o.modalidade);
    const comModalidadePregao = recentOrcamentos.filter(o => o.modalidade === 'PREGAO');
    
    console.log('📊 RESUMO DOS RESULTADOS:');
    console.log(`   - Total de orçamentos recentes: ${recentOrcamentos.length}`);
    console.log(`   - Com modalidade preenchida: ${comModalidade.length}`);
    console.log(`   - Com modalidade PREGAO: ${comModalidadePregao.length}`);
    
    if (comModalidadePregao.length > 0) {
      console.log('');
      console.log('🎉 SUCESSO! Pelo menos um orçamento foi salvo com modalidade PREGAO!');
    } else if (comModalidade.length > 0) {
      console.log('');
      console.log('⚠️  ATENÇÃO! Orçamentos foram salvos com modalidade, mas não PREGAO.');
    } else {
      console.log('');
      console.log('❌ PROBLEMA! Nenhum orçamento foi salvo com modalidade.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error);
  } finally {
    db.close();
  }
}

// Executar a verificação
checkTableStructure().catch(console.error);