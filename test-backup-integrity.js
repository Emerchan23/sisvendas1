// Importar o banco de dados usando o caminho correto
const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'data', 'erp.sqlite')
const db = new Database(dbPath)

// Script para testar integridade dos dados após backup/restauração
console.log('🔍 Verificando integridade dos dados de orçamento...')

try {
  // Verificar orçamentos
  const orcamentos = db.prepare('SELECT * FROM orcamentos').all()
  console.log(`📊 Total de orçamentos: ${orcamentos.length}`)
  
  if (orcamentos.length > 0) {
    console.log('\n🔍 Primeiros 3 orçamentos:')
    orcamentos.slice(0, 3).forEach((orc, idx) => {
      console.log(`  ${idx + 1}. ID: ${orc.id}, Empresa: ${orc.empresa_id}, Total: ${orc.valor_total}, Cliente: ${orc.cliente_id}`)
    })
  }
  
  // Verificar itens de orçamento
  const orcamentoItens = db.prepare('SELECT * FROM orcamento_itens').all()
  console.log(`\n📊 Total de itens de orçamento: ${orcamentoItens.length}`)
  
  if (orcamentoItens.length > 0) {
    console.log('\n🔍 Primeiros 5 itens de orçamento:')
    orcamentoItens.slice(0, 5).forEach((item, idx) => {
      console.log(`  ${idx + 1}. ID: ${item.id}, Orçamento: ${item.orcamento_id}, Descrição: ${item.descricao}, Qtd: ${item.quantidade}, Valor: ${item.valor_unitario}`)
    })
  }
  
  // Verificar relação entre orçamentos e itens
  const orcamentosComItens = db.prepare(`
    SELECT o.id, o.cliente_id, o.valor_total, COUNT(oi.id) as total_itens
    FROM orcamentos o
    LEFT JOIN orcamento_itens oi ON o.id = oi.orcamento_id
    GROUP BY o.id
    ORDER BY o.created_at DESC
    LIMIT 5
  `).all()
  
  console.log('\n🔗 Relação Orçamentos x Itens:')
  orcamentosComItens.forEach((rel, idx) => {
    console.log(`  ${idx + 1}. Orçamento ${rel.id} (Cliente: ${rel.cliente_id}): ${rel.total_itens} itens, Total: ${rel.valor_total}`)
  })
  
  // Verificar se há orçamentos com dados zerados
  const orcamentosZerados = db.prepare(`
    SELECT COUNT(*) as count FROM orcamentos 
    WHERE valor_total = 0 OR valor_total IS NULL
  `).get()
  
  console.log(`\n⚠️  Orçamentos com total zerado: ${orcamentosZerados.count}`)
  
  // Verificar se há itens órfãos
  const itensOrfaos = db.prepare(`
    SELECT COUNT(*) as count FROM orcamento_itens oi
    LEFT JOIN orcamentos o ON oi.orcamento_id = o.id
    WHERE o.id IS NULL
  `).get()
  
  console.log(`⚠️  Itens órfãos (sem orçamento): ${itensOrfaos.count}`)
  
  console.log('\n✅ Verificação de integridade concluída!')
  
} catch (error) {
  console.error('❌ Erro ao verificar integridade:', error)
}