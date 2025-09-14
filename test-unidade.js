const PORT = 3145;
const BASE_URL = `http://localhost:${PORT}`;

console.log(`Testando API na porta ${PORT}`);

// Teste GET - Listar unidades
console.log('\n=== TESTE GET ===');
fetch(`${BASE_URL}/api/unidades-medida`)
  .then(response => {
    console.log(`Status GET: ${response.status}`);
    return response.json();
  })
  .then(data => {
    console.log(`Unidades encontradas: ${data.length}`);
    if (data.length > 0) {
      console.log('Primeiras 3 unidades:');
      data.slice(0, 3).forEach(u => {
        console.log(`  - ${u.codigo}: ${u.descricao} (Ativo: ${u.ativo})`);
      });
    }
  })
  .catch(error => {
    console.error('Erro GET:', error.message);
  })
  .finally(() => {
    // Teste POST - Criar nova unidade com código único
    console.log('\n=== TESTE POST (Código Único) ===');
    const timestamp = Date.now();
    const novaUnidade = {
      codigo: `NOVO${timestamp}`,
      descricao: `Nova Unidade ${timestamp}`
    };
    
    console.log('Dados a enviar:', novaUnidade);
    
    fetch(`${BASE_URL}/api/unidades-medida`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(novaUnidade)
    })
    .then(response => {
      console.log(`Status POST: ${response.status}`);
      return response.json();
    })
    .then(data => {
      if (data.id) {
        console.log('✅ Unidade criada com sucesso!');
        console.log(`ID: ${data.id}`);
        console.log(`Código: ${data.codigo}`);
        console.log(`Descrição: ${data.descricao}`);
      } else {
        console.log('❌ Erro na resposta:', data);
      }
    })
    .catch(error => {
      console.error('❌ Erro POST:', error.message);
    })
    .finally(() => {
      // Teste POST - Tentar criar unidade com código duplicado
      console.log('\n=== TESTE POST (Código Duplicado) ===');
      const unidadeDuplicada = {
        codigo: 'un', // Código que já existe
        descricao: 'Tentativa de Duplicar'
      };
      
      console.log('Tentando criar unidade com código duplicado:', unidadeDuplicada);
      
      fetch(`${BASE_URL}/api/unidades-medida`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(unidadeDuplicada)
      })
      .then(response => {
        console.log(`Status POST (duplicado): ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (data.message) {
          console.log('✅ Erro capturado corretamente:', data.message);
        } else {
          console.log('❌ Resposta inesperada:', data);
        }
      })
      .catch(error => {
        console.error('❌ Erro POST (duplicado):', error.message);
      });
    });
  });