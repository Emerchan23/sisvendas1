const fs = require('fs');
const path = require('path');

// Ler o arquivo de backup de teste
const backupPath = path.join(__dirname, 'test-backup.json');
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('Dados do backup:', JSON.stringify(backupData, null, 2));

// Testar a estrutura do backup
if (!backupData.data) {
  console.error('❌ Erro: Backup não tem propriedade "data"');
  process.exit(1);
}

if (!backupData.data.clientes || !Array.isArray(backupData.data.clientes)) {
  console.error('❌ Erro: Backup não tem dados de clientes válidos');
  process.exit(1);
}

if (!backupData.data.produtos || !Array.isArray(backupData.data.produtos)) {
  console.error('❌ Erro: Backup não tem dados de produtos válidos');
  process.exit(1);
}

console.log('✅ Estrutura do backup está válida');
console.log('📊 Clientes no backup:', backupData.data.clientes.length);
console.log('📦 Produtos no backup:', backupData.data.produtos.length);

// Verificar se os dados têm as propriedades necessárias
const cliente = backupData.data.clientes[0];
const produto = backupData.data.produtos[0];

console.log('\n🔍 Verificando estrutura do cliente:');
console.log('- ID:', cliente.id);
console.log('- Nome:', cliente.nome);
console.log('- Documento:', cliente.documento);
console.log('- Email:', cliente.email);

console.log('\n🔍 Verificando estrutura do produto:');
console.log('- ID:', produto.id);
console.log('- Nome:', produto.nome);
console.log('- Preço:', produto.preco);
console.log('- Categoria:', produto.categoria);

console.log('\n✅ Arquivo de backup de teste está pronto para importação!');