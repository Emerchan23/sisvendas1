const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Configuração do banco de dados
const DB_PATH = '../../Banco de dados Aqui/database.db'
const dbPath = path.resolve(__dirname, DB_PATH)

console.log('🏗️ CRIANDO TABELA EMPRESAS')
console.log('==========================')
console.log(`📁 Caminho do banco: ${dbPath}`)

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Erro ao conectar com o banco:', err.message)
    process.exit(1)
  }
  console.log('✅ Conectado ao banco de dados')
})

// Verificar se a tabela já existe
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='empresas'", [], (err, row) => {
  if (err) {
    console.error('❌ Erro ao verificar tabela:', err.message)
    db.close()
    process.exit(1)
  }
  
  if (row) {
    console.log('⚠️  Tabela empresas já existe')
    db.close()
    return
  }
  
  console.log('\n🔨 Criando tabela empresas...')
  
  // Criar tabela empresas
  const createTableSQL = `
    CREATE TABLE empresas (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      nome TEXT NOT NULL,
      cnpj TEXT UNIQUE,
      razao_social TEXT,
      logo_url TEXT,
      configuracoes TEXT DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `
  
  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('❌ Erro ao criar tabela empresas:', err.message)
      db.close()
      process.exit(1)
    }
    
    console.log('✅ Tabela empresas criada com sucesso')
    
    // Criar índice
    db.run('CREATE INDEX idx_empresas_cnpj ON empresas(cnpj)', (err) => {
      if (err) {
        console.error('❌ Erro ao criar índice:', err.message)
      } else {
        console.log('✅ Índice criado com sucesso')
      }
      
      // Inserir empresa padrão
      const insertSQL = `
        INSERT INTO empresas (id, nome, cnpj, razao_social) 
        VALUES ('empresa-padrao', 'Empresa Padrão', '00.000.000/0001-00', 'Empresa Padrão LTDA')
      `
      
      db.run(insertSQL, (err) => {
        if (err) {
          console.error('❌ Erro ao inserir empresa padrão:', err.message)
        } else {
          console.log('✅ Empresa padrão inserida com sucesso')
        }
        
        // Aplicar migração de backup
        console.log('\n🔧 Aplicando colunas de configuração de backup...')
        
        const backupColumns = [
          'ALTER TABLE empresas ADD COLUMN auto_backup_enabled INTEGER DEFAULT 0',
          'ALTER TABLE empresas ADD COLUMN backup_frequency TEXT DEFAULT "daily"',
          'ALTER TABLE empresas ADD COLUMN backup_time TEXT DEFAULT "02:00"',
          'ALTER TABLE empresas ADD COLUMN keep_local_backup INTEGER DEFAULT 1',
          'ALTER TABLE empresas ADD COLUMN max_backups INTEGER DEFAULT 5',
          'ALTER TABLE empresas ADD COLUMN last_backup DATETIME'
        ]
        
        let completed = 0
        const total = backupColumns.length
        
        backupColumns.forEach((sql, index) => {
          db.run(sql, (err) => {
            completed++
            if (err) {
              console.error(`❌ Erro na coluna ${index + 1}:`, err.message)
            } else {
              console.log(`✅ Coluna ${index + 1}/${total} adicionada`)
            }
            
            if (completed === total) {
              // Habilitar backup automático na empresa padrão
              const updateSQL = `
                UPDATE empresas 
                SET auto_backup_enabled = 1,
                    backup_frequency = 'daily',
                    backup_time = '02:00',
                    keep_local_backup = 1,
                    max_backups = 7
                WHERE id = 'empresa-padrao'
              `
              
              db.run(updateSQL, (err) => {
                if (err) {
                  console.error('❌ Erro ao configurar backup:', err.message)
                } else {
                  console.log('✅ Configurações de backup aplicadas')
                }
                
                console.log('\n🎉 SETUP COMPLETO!')
                console.log('===================')
                console.log('✅ Tabela empresas criada')
                console.log('✅ Empresa padrão inserida')
                console.log('✅ Colunas de backup adicionadas')
                console.log('✅ Backup automático habilitado')
                
                db.close((err) => {
                  if (err) {
                    console.error('❌ Erro ao fechar conexão:', err.message)
                  } else {
                    console.log('\n✅ Conexão fechada com sucesso')
                  }
                })
              })
            }
          })
        })
      })
    })
  })
})