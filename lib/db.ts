import Database from 'better-sqlite3'
import * as path from 'path'
import * as fs from 'fs'

const { join, dirname } = path

// Configurar caminho do banco para fora do container
const dbPath = process.env.DB_PATH || join(process.cwd(), '..', 'Banco de dados Aqui', 'erp.sqlite')

// Função para validar acesso ao banco de dados
function validateDatabaseAccess(path: string): boolean {
  try {
    const dir = dirname(path)
    
    // Verificar se diretório existe ou pode ser criado
    if (!fs.existsSync(dir)) {
      console.log(`📁 Criando diretório do banco: ${dir}`)
      fs.mkdirSync(dir, { recursive: true })
    }
    
    // Testar permissões de escrita
    const testFile = join(dir, '.write-test')
    fs.writeFileSync(testFile, 'test')
    fs.unlinkSync(testFile)
    
    return true
  } catch (error) {
    console.error(`❌ Erro de acesso ao banco de dados: ${path}`)
    console.error(`❌ Detalhes do erro:`, error)
    return false
  }
}

// Validar acesso antes de criar conexão (apenas em runtime, não durante build)
if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  if (!validateDatabaseAccess(dbPath)) {
    throw new Error(`❌ Sem permissão para acessar banco de dados: ${dbPath}. Verifique as permissões do diretório.`)
  }
}

// Criar conexão com o banco (apenas em runtime, não durante build)
let db: Database.Database

if (process.env.NEXT_PHASE === 'phase-production-build') {
  // Durante o build, criar uma instância mock para evitar erros
  db = {} as Database.Database
} else {
  try {
    db = new Database(dbPath)
    console.log(`✅ Conexão com banco estabelecida: ${dbPath}`)
  } catch (error) {
    console.error(`❌ Erro ao conectar com banco:`, error)
    throw new Error(`❌ Falha na conexão com banco de dados: ${dbPath}`)
  }
}

export { db }

// Configurar WAL mode para melhor performance (apenas em runtime)
if (process.env.NEXT_PHASE !== 'phase-production-build' && db.pragma) {
  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('cache_size = 1000')
  db.pragma('foreign_keys = ON')
  db.pragma('temp_store = memory')
}

// Criar tabelas se não existirem (apenas em runtime)
if (process.env.NEXT_PHASE !== 'phase-production-build' && db.exec) {
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
    imposto_padrao REAL,
    capital_padrao REAL,
    layout_orcamento TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

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
  );



  CREATE TABLE IF NOT EXISTS vendas (
    id TEXT PRIMARY KEY,
    cliente_id TEXT,

    quantidade INTEGER NOT NULL,
    preco_unitario REAL NOT NULL,
    total REAL NOT NULL,
    data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
    empresa_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),

    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
  );

  CREATE TABLE IF NOT EXISTS orcamentos (
    id TEXT PRIMARY KEY,
    numero TEXT NOT NULL UNIQUE,
    cliente_id TEXT NOT NULL,
    data_orcamento TEXT NOT NULL,
    data_validade TEXT,
    valor_total REAL NOT NULL DEFAULT 0,
    descricao TEXT,
    status TEXT DEFAULT 'pendente',
    observacoes TEXT,
    condicoes_pagamento TEXT,
    prazo_entrega TEXT,
    vendedor_id TEXT,
    desconto REAL DEFAULT 0,
    modalidade TEXT DEFAULT 'compra_direta',
    numero_pregao TEXT,
    numero_dispensa TEXT,
    empresa_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
  );

  CREATE TABLE IF NOT EXISTS orcamento_itens (
    id TEXT PRIMARY KEY,
    orcamento_id TEXT NOT NULL,
    produto_id TEXT,
    descricao TEXT NOT NULL,
    marca TEXT,
    quantidade REAL NOT NULL,
    valor_unitario REAL NOT NULL,
    valor_total REAL NOT NULL,
    observacoes TEXT,
    link_ref TEXT,
    custo_ref REAL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orcamento_id) REFERENCES orcamentos (id)
  );

  CREATE TABLE IF NOT EXISTS user_prefs (
    userId TEXT PRIMARY KEY,
    json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS linhas_venda (
    id TEXT PRIMARY KEY,
    companyId TEXT,
    dataPedido TEXT NOT NULL,
    numeroOF TEXT,
    numeroDispensa TEXT,
    cliente TEXT,

    modalidade TEXT,
    valorVenda REAL NOT NULL DEFAULT 0,
    taxaCapitalPerc REAL NOT NULL DEFAULT 0,
    taxaCapitalVl REAL NOT NULL DEFAULT 0,
    taxaImpostoPerc REAL NOT NULL DEFAULT 0,
    taxaImpostoVl REAL NOT NULL DEFAULT 0,
    custoMercadoria REAL NOT NULL DEFAULT 0,
    somaCustoFinal REAL NOT NULL DEFAULT 0,
    lucroValor REAL NOT NULL DEFAULT 0,
    lucroPerc REAL NOT NULL DEFAULT 0,
    dataRecebimento TEXT,
    paymentStatus TEXT NOT NULL DEFAULT 'pendente',
    settlementStatus TEXT,
    acertoId TEXT,
    cor TEXT,
    createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS outros_negocios (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL CHECK (tipo IN ('emprestimo', 'venda', 'receita', 'despesa')),
    valor REAL NOT NULL,
    descricao TEXT,
    categoria TEXT,
    cliente_id TEXT,
    data_transacao TEXT NOT NULL,
    forma_pagamento TEXT,
    observacoes TEXT,
    anexos TEXT,
    status TEXT DEFAULT 'ativo',
    juros_ativo BOOLEAN DEFAULT 0,
    juros_mes_percent REAL DEFAULT 0,
    multa_ativa BOOLEAN DEFAULT 0,
    multa_percent REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS acertos (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    titulo TEXT,
    observacoes TEXT,
    linhaIds TEXT,
    totalLucro REAL DEFAULT 0,
    totalDespesasRateio REAL DEFAULT 0,
    totalDespesasIndividuais REAL DEFAULT 0,
    totalLiquidoDistribuivel REAL DEFAULT 0,
    distribuicoes TEXT,
    despesas TEXT,
    ultimoRecebimentoBanco TEXT,
    status TEXT DEFAULT 'aberto',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vale_movimentos (
    id TEXT PRIMARY KEY,
    cliente_id TEXT NOT NULL,
    data TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('credito', 'debito')),
    valor REAL NOT NULL,
    descricao TEXT,
    referencia_id TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    ativo BOOLEAN DEFAULT 1,
    permissoes TEXT DEFAULT '{}',
    ultimo_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS configuracoes (
    id TEXT PRIMARY KEY,
    config_key TEXT NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    descricao TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fornecedores (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    categoria TEXT,
    produtos_servicos TEXT,
    telefone TEXT,
    site_url TEXT,
    usuario_login TEXT,
    senha_login TEXT,
    tags_busca TEXT,
    observacoes TEXT,
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS unidades_medida (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    descricao TEXT NOT NULL,
    ativo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
}

// Ignorar erros se as colunas já existirem (apenas em runtime)
if (process.env.NEXT_PHASE !== 'phase-production-build' && db.exec) {
try {
  db.exec(`
    ALTER TABLE empresas ADD COLUMN imposto_padrao REAL;
    ALTER TABLE empresas ADD COLUMN capital_padrao REAL;
  `);
} catch (error) {
  // Colunas já existem, ignorar erro
}

// Tentar adicionar colunas que podem não existir em bancos antigos
try {
  db.exec(`ALTER TABLE orcamentos ADD COLUMN vendedor_id TEXT;`)
} catch (error) {
  // Coluna já existe ou outro erro - ignorar
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN layout_orcamento TEXT;`)
} catch (error) {
  // Coluna já existe ou outro erro - ignorar
}

// Adicionar colunas SMTP
try {
  db.exec(`ALTER TABLE empresas ADD COLUMN smtp_host TEXT`)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN smtp_port INTEGER DEFAULT 587`)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN smtp_secure BOOLEAN DEFAULT 0`)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN smtp_user TEXT`)
} catch (error) {
  // Coluna já existe
}

// Adicionar colunas de modalidade aos orçamentos
try {
  db.exec(`
    ALTER TABLE orcamentos ADD COLUMN modalidade TEXT DEFAULT 'compra_direta';
    ALTER TABLE orcamentos ADD COLUMN numero_pregao TEXT;
    ALTER TABLE orcamentos ADD COLUMN numero_dispensa TEXT;
    ALTER TABLE orcamentos ADD COLUMN numero_processo TEXT;
  `)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN smtp_password TEXT`)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN smtp_from_name TEXT`)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN smtp_from_email TEXT`)
} catch (error) {
  // Coluna já existe
}

// Adicionar colunas para templates de e-mail
try {
  db.exec(`ALTER TABLE empresas ADD COLUMN email_template_orcamento TEXT`)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN email_template_vale TEXT`)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN email_template_relatorio TEXT`)
} catch (error) {
  // Coluna já existe
}

// Adicionar colunas de personalização de documentos
try {
  db.exec(`ALTER TABLE empresas ADD COLUMN cor_primaria TEXT DEFAULT '#3b82f6'`)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN cor_secundaria TEXT DEFAULT '#64748b'`)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN cor_texto TEXT DEFAULT '#1f2937'`)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN fonte_titulo TEXT DEFAULT 'Inter'`)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN fonte_texto TEXT DEFAULT 'Inter'`)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN tamanho_titulo INTEGER DEFAULT 24`)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN tamanho_texto INTEGER DEFAULT 14`)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN logo_personalizada TEXT`)
} catch (error) {
  // Coluna já existe
}

try {
  db.exec(`ALTER TABLE empresas ADD COLUMN validade_orcamento INTEGER DEFAULT 30`)
} catch (error) {
  // Coluna já existe
}

// Adicionar coluna produtos_servicos à tabela fornecedores se não existir
try {
  db.exec(`ALTER TABLE fornecedores ADD COLUMN produtos_servicos TEXT`)
} catch (error) {
  // Coluna já existe
}

// Verificar se a coluna total existe na tabela vendas
try {
  db.exec(`
    ALTER TABLE vendas ADD COLUMN total REAL NOT NULL DEFAULT 0;
  `);
} catch (error) {
  // Coluna já existe, ignorar erro
}

// Adicionar coluna data_transacao à tabela outros_negocios se não existir
try {
  db.exec(`ALTER TABLE outros_negocios ADD COLUMN data_transacao TEXT NOT NULL DEFAULT ''`)
} catch (error) {
  // Coluna já existe
}



// Criar usuário administrador padrão se não existir
try {
  const adminExists = db.prepare('SELECT COUNT(*) as count FROM usuarios WHERE email = ?').get('admin@sistema.com') as { count: number }
  
  if (adminExists.count === 0) {
    // Senha padrão: admin123 (hash bcrypt)
    const bcrypt = require('bcryptjs')
    const hashedPassword = bcrypt.hashSync('admin123', 10)
    
    db.prepare(`
      INSERT INTO usuarios (id, nome, email, senha, role, ativo, permissoes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'admin-' + Date.now(),
      'Administrador',
      'admin@sistema.com',
      hashedPassword,
      'admin',
      1,
      JSON.stringify({
        vendas: true,
        orcamentos: true,
        clientes: true,

        relatorios: true,
        configuracoes: true,
        usuarios: true,
        backup: true
      })
    )
    
    console.log('✅ Usuário administrador padrão criado: admin@sistema.com / admin123')
  }
} catch (error) {
  console.log('ℹ️ Usuário administrador já existe ou erro ao criar:', error)
}

// Inserir dados iniciais se necessário
try {
  const empresaCount = db.prepare('SELECT COUNT(*) as count FROM empresas').get() as { count: number }
  
  if (empresaCount.count === 0) {
    console.log('Inserindo empresa padrão...')
    db.prepare(`
      INSERT INTO empresas (id, nome, razao_social, nome_do_sistema)
      VALUES (?, ?, ?, ?)
    `).run('default', 'Empresa Padrão', 'Empresa Padrão LTDA', 'LP IND')
  }
} catch (error) {
  console.log('ℹ️ Empresa padrão já existe ou erro ao criar:', error)
}

// Inserir configurações padrão de autenticação se não existirem
try {
  const authConfigCount = db.prepare('SELECT COUNT(*) as count FROM configuracoes WHERE config_key = ?').get('auth_settings') as { count: number }
  
  if (authConfigCount.count === 0) {
    console.log('Inserindo configurações padrão de autenticação...')
    const defaultAuthSettings = JSON.stringify({
      normalExpiryHours: 2,
      rememberMeExpiryDays: 7,
      sessionCheckInterval: 5,
      warningTime: 5
    })
    
    db.prepare(`
      INSERT INTO configuracoes (id, config_key, config_value, descricao)
      VALUES (?, ?, ?, ?)
    `).run('auth-settings-1', 'auth_settings', defaultAuthSettings, 'Configurações de autenticação do sistema')
  }
} catch (error) {
  console.log('ℹ️ Configurações de autenticação já existem ou erro ao criar:', error)
}

// Inserir unidades de medida padrão se não existirem
try {
  const unidadesCount = db.prepare('SELECT COUNT(*) as count FROM unidades_medida WHERE ativo = 1').get() as { count: number }
  
  if (unidadesCount.count === 0) {
    const unidadesPadrao = [
      { codigo: 'un', descricao: 'Unidade' },
      { codigo: 'cx', descricao: 'Caixa' },
      { codigo: 'pct', descricao: 'Pacote' },
      { codigo: 'kit', descricao: 'Kit' },
      { codigo: 'kg', descricao: 'Quilograma' },
      { codigo: 'm', descricao: 'Metro' },
      { codigo: 'm²', descricao: 'Metro Quadrado' },
      { codigo: 'm³', descricao: 'Metro Cúbico' },
      { codigo: 'l', descricao: 'Litro' }
    ]
    
    const insertStmt = db.prepare(`
      INSERT INTO unidades_medida (id, codigo, descricao, ativo)
      VALUES (?, ?, ?, 1)
    `)
    
    unidadesPadrao.forEach((unidade, index) => {
      insertStmt.run(`unidade-${index + 1}`, unidade.codigo, unidade.descricao)
    })
    
    console.log('✅ Unidades de medida padrão inseridas no banco de dados')
  }
} catch (error) {
  console.log('ℹ️ Unidades de medida já existem ou erro ao criar:', error)
}
}

export default db