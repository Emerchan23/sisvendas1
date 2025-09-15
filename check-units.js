const Database = require('better-sqlite3');

try {
  const db = new Database('../Banco de dados Aqui/erp.sqlite');
  
  console.log('=== UNIDADES DE MEDIDA EXISTENTES ===');
  const units = db.prepare('SELECT * FROM unidades_medida ORDER BY codigo').all();
  
  if (units.length === 0) {
    console.log('Nenhuma unidade encontrada.');
  } else {
    console.log(`Total: ${units.length} unidades`);
    console.log('\nLista:');
    units.forEach((u, index) => {
      console.log(`${index + 1}. Código: "${u.codigo}" | Descrição: "${u.descricao}" | ID: ${u.id} | Ativo: ${u.ativo}`);
    });
  }
  
  db.close();
  console.log('\n=== FIM DA CONSULTA ===');
} catch (error) {
  console.error('Erro ao consultar banco:', error.message);
}