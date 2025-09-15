const Database = require('better-sqlite3');
const path = require('path');

async function testModalidadeManual() {
  console.log('🚀 Teste manual de modalidade - Instruções para o usuário...');
  console.log('');
  console.log('📋 INSTRUÇÕES PARA TESTE MANUAL:');
  console.log('1. Abra http://localhost:3145 no navegador');
  console.log('2. Clique em "Novo Orçamento" ou vá para a página de orçamentos');
  console.log('3. Preencha os dados básicos do orçamento');
  console.log('4. Na seção "Modalidade de Compra", selecione "PREGAO"');
  console.log('5. Preencha o "Número do Processo" com: TEST-123456');
  console.log('6. Adicione pelo menos um item');
  console.log('7. Clique em "Salvar Orçamento"');
  console.log('8. Anote o número do orçamento criado');
  console.log('');
  console.log('⏳ Aguardando 30 segundos para você fazer o teste manual...');
  
  // Aguardar 30 segundos
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  console.log('');
  console.log('🔍 Verificando orçamentos recentes no banco de dados...');
  
  // Conectar ao banco de dados
  const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
  const db = new Database(dbPath);
  
  try {
    // Buscar orçamentos criados nos últimos 5 minutos
    const recentOrcamentos = db.prepare(`
      SELECT 
        id, numero, modalidade, numero_pregao, numero_dispensa, numero_processo,
        data_orcamento, descricao, created_at
      FROM orcamentos 
      WHERE created_at > datetime('now', '-5 minutes')
      ORDER BY created_at DESC
      LIMIT 10
    `).all();
    
    console.log(`📊 Encontrados ${recentOrcamentos.length} orçamentos criados nos últimos 5 minutos:`);
    console.log('');
    
    if (recentOrcamentos.length === 0) {
      console.log('❌ Nenhum orçamento encontrado. Certifique-se de ter criado um orçamento.');
      return;
    }
    
    recentOrcamentos.forEach((orc, index) => {
      console.log(`📋 Orçamento ${index + 1}:`);
      console.log(`   - ID: ${orc.id}`);
      console.log(`   - Número: ${orc.numero}`);
      console.log(`   - Modalidade: ${orc.modalidade || 'NULL/VAZIO'}`);
      console.log(`   - Número Pregão: ${orc.numero_pregao || 'NULL/VAZIO'}`);
      console.log(`   - Número Dispensa: ${orc.numero_dispensa || 'NULL/VAZIO'}`);
      console.log(`   - Número Processo: ${orc.numero_processo || 'NULL/VAZIO'}`);
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
      
      // Verificar número do processo
      if (orc.numero_processo === 'TEST-123456') {
        console.log('   ✅ NÚMERO DO PROCESSO SALVO CORRETAMENTE!');
      } else if (orc.numero_processo) {
        console.log(`   ⚠️  Número do processo: ${orc.numero_processo}`);
      } else {
        console.log('   ❌ NÚMERO DO PROCESSO NÃO FOI SALVO');
      }
      
      console.log('');
    });
    
    // Resumo dos resultados
    const comModalidade = recentOrcamentos.filter(o => o.modalidade);
    const comModalidadePregao = recentOrcamentos.filter(o => o.modalidade === 'PREGAO');
    const comNumeroProcesso = recentOrcamentos.filter(o => o.numero_processo);
    
    console.log('📊 RESUMO DOS RESULTADOS:');
    console.log(`   - Total de orçamentos: ${recentOrcamentos.length}`);
    console.log(`   - Com modalidade preenchida: ${comModalidade.length}`);
    console.log(`   - Com modalidade PREGAO: ${comModalidadePregao.length}`);
    console.log(`   - Com número do processo: ${comNumeroProcesso.length}`);
    
    if (comModalidadePregao.length > 0) {
      console.log('');
      console.log('🎉 SUCESSO! Pelo menos um orçamento foi salvo com modalidade PREGAO!');
    } else if (comModalidade.length > 0) {
      console.log('');
      console.log('⚠️  ATENÇÃO! Orçamentos foram salvos com modalidade, mas não PREGAO.');
      console.log('   Verifique se você selecionou PREGAO no formulário.');
    } else {
      console.log('');
      console.log('❌ PROBLEMA! Nenhum orçamento foi salvo com modalidade.');
      console.log('   O campo modalidade não está sendo enviado do frontend para a API.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco de dados:', error);
  } finally {
    db.close();
  }
}

// Executar o teste
testModalidadeManual().catch(console.error);