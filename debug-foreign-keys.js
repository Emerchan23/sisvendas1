const Database = require('better-sqlite3');
const db = new Database('../Banco de dados Aqui/erp.sqlite');

console.log('=== VERIFICANDO FOREIGN KEYS ===');

// Verificar se existem registros órfãos na tabela outros_negocios
console.log('\n=== REGISTROS ÓRFÃOS - CLIENTE_ID ===');
const orfaosClientes = db.prepare(`
  SELECT outros_negocios.id, outros_negocios.cliente_id, outros_negocios.tipo, outros_negocios.descricao 
  FROM outros_negocios 
  LEFT JOIN clientes ON outros_negocios.cliente_id = clientes.id 
  WHERE outros_negocios.cliente_id IS NOT NULL AND clientes.id IS NULL
`).all();
console.log(JSON.stringify(orfaosClientes, null, 2));

console.log('\n=== REGISTROS ÓRFÃOS - EMPRESA_ID ===');
const orfaosEmpresas = db.prepare(`
  SELECT outros_negocios.id, outros_negocios.empresa_id, outros_negocios.tipo, outros_negocios.descricao 
  FROM outros_negocios 
  LEFT JOIN empresas ON outros_negocios.empresa_id = empresas.id 
  WHERE outros_negocios.empresa_id IS NOT NULL AND empresas.id IS NULL
`).all();
console.log(JSON.stringify(orfaosEmpresas, null, 2));

// Verificar o registro específico que está causando erro
console.log('\n=== REGISTRO ESPECÍFICO ===');
const registroEspecifico = db.prepare(`
  SELECT * FROM outros_negocios WHERE id = ?
`).get('551b62a7-7346-4b1f-b935-932db239d06b');
console.log(JSON.stringify(registroEspecifico, null, 2));

// Verificar se o cliente_id existe
if (registroEspecifico && registroEspecifico.cliente_id) {
  console.log('\n=== VERIFICANDO CLIENTE ===');
  const cliente = db.prepare(`
    SELECT * FROM clientes WHERE id = ?
  `).get(registroEspecifico.cliente_id);
  console.log('Cliente existe:', cliente ? 'SIM' : 'NÃO');
  if (cliente) {
    console.log(JSON.stringify(cliente, null, 2));
  }
}

// Verificar se o empresa_id existe
if (registroEspecifico && registroEspecifico.empresa_id) {
  console.log('\n=== VERIFICANDO EMPRESA ===');
  const empresa = db.prepare(`
    SELECT * FROM empresas WHERE id = ?
  `).get(registroEspecifico.empresa_id);
  console.log('Empresa existe:', empresa ? 'SIM' : 'NÃO');
  if (empresa) {
    console.log(JSON.stringify(empresa, null, 2));
  }
}

db.close();