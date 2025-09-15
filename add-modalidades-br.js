const Database = require('better-sqlite3');
const path = require('path');

// Conectar ao banco de dados
const dbPath = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');
const db = new Database(dbPath);

console.log('🇧🇷 Adicionando modalidades brasileiras...');

// Modalidades adequadas para o contexto brasileiro
const modalidadesBrasileiras = [
  {
    codigo: 'COMPRA_DIRETA',
    nome: 'Compra Direta',
    descricao: 'Compra direta sem processo licitatório',
    requer_numero_processo: 0
  },
  {
    codigo: 'LICITADO',
    nome: 'Licitado',
    descricao: 'Processo licitatório público',
    requer_numero_processo: 1
  },
  {
    codigo: 'DISPENSA',
    nome: 'Dispensa de Licitação',
    descricao: 'Dispensa de licitação conforme Lei 8.666/93',
    requer_numero_processo: 1
  },
  {
    codigo: 'INEXIGIBILIDADE',
    nome: 'Inexigibilidade',
    descricao: 'Inexigibilidade de licitação',
    requer_numero_processo: 1
  },
  {
    codigo: 'COTACAO',
    nome: 'Cotação',
    descricao: 'Processo de cotação de preços',
    requer_numero_processo: 0
  }
];

try {
  // Preparar statement para inserção
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO modalidades_compra 
    (codigo, nome, descricao, ativo, requer_numero_processo, created_at, updated_at)
    VALUES (?, ?, ?, 1, ?, datetime('now'), datetime('now'))
  `);

  // Inserir cada modalidade
  modalidadesBrasileiras.forEach(modalidade => {
    const result = insertStmt.run(
      modalidade.codigo,
      modalidade.nome,
      modalidade.descricao,
      modalidade.requer_numero_processo
    );
    
    if (result.changes > 0) {
      console.log(`✅ Adicionada: ${modalidade.nome} (${modalidade.codigo})`);
    } else {
      console.log(`ℹ️  Já existe: ${modalidade.nome} (${modalidade.codigo})`);
    }
  });

  // Verificar total de modalidades
  const count = db.prepare('SELECT COUNT(*) as total FROM modalidades_compra WHERE ativo = 1').get();
  console.log(`\n📊 Total de modalidades ativas: ${count.total}`);

  // Listar todas as modalidades
  const modalidades = db.prepare('SELECT * FROM modalidades_compra WHERE ativo = 1 ORDER BY nome').all();
  console.log('\n📋 Modalidades disponíveis:');
  modalidades.forEach(m => {
    const processo = m.requer_numero_processo ? '(requer processo)' : '(sem processo)';
    console.log(`   ${m.codigo} - ${m.nome} ${processo}`);
  });

} catch (error) {
  console.error('❌ Erro ao adicionar modalidades:', error.message);
} finally {
  db.close();
  console.log('\n🔒 Conexão com banco fechada.');
}