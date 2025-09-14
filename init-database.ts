import Database from 'better-sqlite3'
import { join } from 'path'
import fs from 'fs'

console.log('=== Inicializando banco de dados ===')

// Configurar caminho do banco
const dbPath = join(process.cwd(), 'data', 'erp.sqlite')
console.log('Caminho do banco:', dbPath)

// Criar diretório se não existir
const dataDir = join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
  console.log('📁 Diretório data criado')
}

// Criar conexão com o banco
const db = new Database(dbPath)
console.log('✅ Conexão com banco estabelecida')

// Configurar WAL mode
db.pragma('journal_mode = WAL')
db.pragma('synchronous = NORMAL')
db.pragma('cache_size = 1000')
db.pragma('foreign_keys = ON')
db.pragma('temp_store = memory')

console.log('⚙️ Configurações do banco aplicadas')

// Criar tabela outros_negocios
db.exec(`
  CREATE TABLE IF NOT EXISTS outros_negocios (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    valor REAL NOT NULL,
    cliente_id TEXT,
    descricao TEXT,
    data TEXT NOT NULL,
    status TEXT DEFAULT 'pendente',
    observacoes TEXT,
    empresa_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
  )
`)

console.log('✅ Tabela outros_negocios criada')

// Criar tabela pagamentos_parciais
db.exec(`
  CREATE TABLE IF NOT EXISTS pagamentos_parciais (
    id TEXT PRIMARY KEY,
    outro_negocio_id TEXT NOT NULL,
    data TEXT NOT NULL,
    valor REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (outro_negocio_id) REFERENCES outros_negocios (id)
  )
`)

console.log('✅ Tabela pagamentos_parciais criada')

// Criar outras tabelas essenciais
db.exec(`
  CREATE TABLE IF NOT EXISTS empresas (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT,
    endereco TEXT,
    telefone TEXT,
    email TEXT,
    logo_url TEXT,
    nome_do_sistema TEXT DEFAULT 'LP IND',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

db.exec(`
  CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    cpf_cnpj TEXT,
    endereco TEXT,
    telefone TEXT,
    email TEXT,
    empresa_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
  )
`)

console.log('✅ Tabelas essenciais criadas')

// Inserir empresa padrão se não existir
const empresaCount = db.prepare('SELECT COUNT(*) as count FROM empresas').get() as { count: number }
if (empresaCount.count === 0) {
  db.prepare(`
    INSERT INTO empresas (id, nome, razao_social, nome_do_sistema)
    VALUES (?, ?, ?, ?)
  `).run('default', 'Empresa Padrão', 'Empresa Padrão LTDA', 'LP IND')
  console.log('✅ Empresa padrão criada')
}

// Verificar se as tabelas foram criadas
const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table'`).all()
console.log('\n📋 Tabelas no banco:')
tables.forEach((table: any) => console.log(`  - ${table.name}`))

// Verificar estrutura da tabela outros_negocios
const schema = db.prepare(`PRAGMA table_info(outros_negocios)`).all()
console.log('\n🔍 Estrutura da tabela outros_negocios:')
schema.forEach((col: any) => console.log(`  - ${col.name}: ${col.type}`))

// Verificar estrutura da tabela pagamentos_parciais
const paymentSchema = db.prepare(`PRAGMA table_info(pagamentos_parciais)`).all()
console.log('\n🔍 Estrutura da tabela pagamentos_parciais:')
paymentSchema.forEach((col: any) => console.log(`  - ${col.name}: ${col.type}`))

db.close()
console.log('\n✅ Banco de dados inicializado com sucesso!')