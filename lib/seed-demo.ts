import { db } from './db'
import { uid } from './util'

// Get or create default company for demo data
function getDefaultCompanyId(): string {
  const row = db.prepare(`SELECT id FROM empresas LIMIT 1`).get() as { id: string } | undefined
  if (row?.id) return row.id
  
  // Create a default company if none exists
  const companyId = uid()
  db.prepare(`INSERT INTO empresas (id, nome, created_at) VALUES (?, ?, ?)`).run(
    companyId, 
    "Empresa Demo", 
    new Date().toISOString()
  )
  return companyId
}

const defaultCompanyId = getDefaultCompanyId()

function ensureCliente(nome: string, documento: string) {
  const row = db.prepare(`SELECT id FROM clientes WHERE nome=? AND empresa_id=?`).get(nome, defaultCompanyId) as { id: string } | undefined
  if (row?.id) return row.id
  
  const id = uid()
  db.prepare(`
    INSERT INTO clientes (id, nome, cpf_cnpj, empresa_id, created_at) 
    VALUES (?, ?, ?, ?, ?)
  `).run(
    id,
    nome,
    documento,
    defaultCompanyId,
    new Date().toISOString()
  )
  return id
}



function main() {
  console.log('🌱 Seeding demo data...')
  
  // Create demo clients
  const cliente1 = ensureCliente('João Silva', '123.456.789-00')
  const cliente2 = ensureCliente('Maria Santos', '987.654.321-00')
  const cliente3 = ensureCliente('Pedro Oliveira', '456.789.123-00')
  
  console.log('✅ Demo data seeded successfully!')
  console.log(`📊 Company ID: ${defaultCompanyId}`)
  console.log(`👥 Clients: ${[cliente1, cliente2, cliente3].length}`)
}

if (require.main === module) {
  main()
}