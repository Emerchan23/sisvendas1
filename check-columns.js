const Database = require('better-sqlite3')
const db = new Database('../Banco de dados Aqui/erp.sqlite')

console.log('Colunas da tabela orcamentos:')
db.prepare('PRAGMA table_info(orcamentos)').all().forEach(col => {
  console.log(`- ${col.name}`)
})

console.log('\nDados do orçamento existente:')
const orcamento = db.prepare('SELECT * FROM orcamentos LIMIT 1').get()
console.log(orcamento)

db.close()