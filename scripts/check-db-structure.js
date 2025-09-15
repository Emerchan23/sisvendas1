const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Configuração do banco de dados
const DB_PATH = '../../Banco de dados Aqui/database.db'
const dbPath = path.resolve(__dirname, DB_PATH)

console.log('🔍 VERIFICANDO ESTRUTURA DO BANCO DE DADOS')
console.log('========================================')
console.log(`📁 Caminho do banco: ${dbPath}`)

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar com o banco:', err.message)
    process.exit(1)
  }
  console.log('✅ Conectado ao banco de dados')
})

// Listar todas as tabelas
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
  if (err) {
    console.error('❌ Erro ao listar tabelas:', err.message)
    db.close()
    process.exit(1)
  }
  
  console.log('\n📋 TABELAS ENCONTRADAS:')
  console.log('========================')
  
  if (rows.length === 0) {
    console.log('⚠️  Nenhuma tabela encontrada no banco de dados')
  } else {
    rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.name}`)
    })
  }
  
  // Verificar se existe tabela de configurações de backup
  const backupTables = rows.filter(row => 
    row.name.toLowerCase().includes('backup') || 
    row.name.toLowerCase().includes('config') ||
    row.name.toLowerCase().includes('empresa')
  )
  
  if (backupTables.length > 0) {
    console.log('\n🔧 TABELAS RELACIONADAS A BACKUP/CONFIG:')
    console.log('=========================================')
    backupTables.forEach(table => {
      console.log(`- ${table.name}`)
    })
  }
  
  db.close((err) => {
    if (err) {
      console.error('❌ Erro ao fechar conexão:', err.message)
    } else {
      console.log('\n✅ Conexão fechada com sucesso')
    }
  })
})