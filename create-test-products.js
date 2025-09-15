const { saveProduto } = require('./lib/data-store.ts');

async function createTestProducts() {
  try {
    await saveProduto({ nome: 'Produto Teste A', preco: 100.50, categoria: 'Categoria A' });
    await saveProduto({ nome: 'Produto Teste B', preco: 250.75, categoria: 'Categoria B' });
    await saveProduto({ nome: 'Produto Teste C', preco: 75.25, categoria: 'Categoria A' });
    console.log('Produtos de teste criados com sucesso!');
  } catch (error) {
    console.error('Erro ao criar produtos:', error);
  }
}

createTestProducts();