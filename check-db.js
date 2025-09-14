const Database = require('better-sqlite3');

try {
  const db = new Database('./data/erp.sqlite');
  
  console.log('🔍 Verificando tabelas existentes:');
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tabelas encontradas:', tables.map(t => t.name));
  
  console.log('\n🔍 Verificando estrutura da tabela orcamentos:');
  try {
    const orcamentosInfo = db.prepare("PRAGMA table_info(orcamentos)").all();
    console.log('Colunas da tabela orcamentos:', orcamentosInfo);
  } catch(e) {
    console.log('Erro ao verificar orcamentos:', e.message);
  }
  
  console.log('\n🔍 Verificando estrutura da tabela orcamento_itens:');
  try {
    const itensInfo = db.prepare("PRAGMA table_info(orcamento_itens)").all();
    console.log('Colunas da tabela orcamento_itens:', itensInfo);
  } catch(e) {
    console.log('Erro ao verificar orcamento_itens:', e.message);
  }
  
  console.log('\n🔍 Contando registros:');
  try {
    const countOrcamentos = db.prepare("SELECT COUNT(*) as count FROM orcamentos").get();
    console.log('Total de orçamentos:', countOrcamentos.count);
    
    const countItens = db.prepare("SELECT COUNT(*) as count FROM orcamento_itens").get();
    console.log('Total de itens:', countItens.count);
  } catch(e) {
    console.log('Erro ao contar registros:', e.message);
  }
  
  console.log('\n🔍 Verificando orçamento específico (01/2025):');
  try {
    const orcamento = db.prepare("SELECT * FROM orcamentos WHERE numero = ?").get('01/2025');
    console.log('Orçamento 01/2025:', orcamento);
    
    if (orcamento) {
      const itens = db.prepare("SELECT * FROM orcamento_itens WHERE orcamento_id = ?").all(orcamento.id);
      console.log('Itens do orçamento 01/2025:', itens);
    }
  } catch(e) {
    console.log('Erro ao verificar orçamento específico:', e.message);
  }
  
  db.close();
  console.log('\n✅ Verificação concluída');
} catch (error) {
  console.error('❌ Erro ao conectar com o banco:', error.message);
}