// Teste para interceptar e analisar o payload enviado para a API
// Execute no console do navegador na página de orçamentos

console.log('🔍 INICIANDO TESTE DE PAYLOAD DA API');

// Interceptar todas as requisições fetch
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  
  // Interceptar apenas requisições para orçamentos
  if (url && (url.includes('/api/orcamentos') || url.toString().includes('/api/orcamentos'))) {
    console.log('🌐 REQUISIÇÃO INTERCEPTADA:');
    console.log('📍 URL:', url);
    console.log('⚙️ Method:', options?.method || 'GET');
    
    if (options && options.body) {
      try {
        const bodyData = JSON.parse(options.body);
        console.log('📦 PAYLOAD COMPLETO:');
        console.log(JSON.stringify(bodyData, null, 2));
        
        if (bodyData.itens && bodyData.itens.length > 0) {
          console.log('\n📋 ANÁLISE DOS ITENS:');
          bodyData.itens.forEach((item, index) => {
            console.log(`\n📦 Item ${index + 1}:`);
            console.log(`  📝 Descrição: ${item.descricao}`);
            console.log(`  💰 Valor unitário: ${item.valor_unitario}`);
            console.log(`  🔗 Link ref: ${item.link_ref}`);
            console.log(`  💵 Custo ref: ${item.custo_ref}`);
            
            // Verificar se os campos críticos estão presentes
            const problemas = [];
            if (item.valor_unitario === undefined || item.valor_unitario === null) {
              problemas.push('❌ valor_unitario está undefined/null');
            }
            if (item.link_ref === undefined) {
              problemas.push('❌ link_ref está undefined');
            }
            if (item.custo_ref === undefined) {
              problemas.push('❌ custo_ref está undefined');
            }
            
            if (problemas.length > 0) {
              console.log('  🚨 PROBLEMAS ENCONTRADOS:');
              problemas.forEach(problema => console.log(`    ${problema}`));
            } else {
              console.log('  ✅ Todos os campos estão presentes');
            }
          });
        }
      } catch (e) {
        console.log('❌ Erro ao parsear body:', e);
        console.log('📄 Body raw:', options.body);
      }
    }
  }
  
  // Chamar o fetch original e interceptar a resposta
  return originalFetch.apply(this, args).then(response => {
    if (url && (url.includes('/api/orcamentos') || url.toString().includes('/api/orcamentos'))) {
      console.log('\n📥 RESPOSTA DA API:');
      console.log('📊 Status:', response.status);
      console.log('✅ OK:', response.ok);
      
      // Clonar a resposta para poder ler o body sem consumir o original
      const clonedResponse = response.clone();
      clonedResponse.json().then(data => {
        console.log('📋 Dados da resposta:');
        console.log(JSON.stringify(data, null, 2));
        
        if (data.itens && data.itens.length > 0) {
          console.log('\n🔍 VERIFICAÇÃO DOS DADOS SALVOS:');
          data.itens.forEach((item, index) => {
            console.log(`\n📦 Item ${index + 1} salvo:`);
            console.log(`  📝 Descrição: ${item.descricao}`);
            console.log(`  💰 Valor unitário: ${item.valor_unitario}`);
            console.log(`  🔗 Link ref: ${item.link_ref}`);
            console.log(`  💵 Custo ref: ${item.custo_ref}`);
          });
        }
      }).catch(e => {
        console.log('❌ Erro ao ler resposta JSON:', e);
      });
    }
    
    return response;
  });
};

// Função para testar o salvamento
function testarSalvamento() {
  console.log('\n🧪 INICIANDO TESTE DE SALVAMENTO');
  console.log('📝 Instruções:');
  console.log('1. Preencha um orçamento com pelo menos 1 item');
  console.log('2. Preencha o valor unitário (ex: 100,50)');
  console.log('3. Abra os "Detalhes internos" do item');
  console.log('4. Preencha o Link ref (ex: https://exemplo.com)');
  console.log('5. Preencha o Custo ref (ex: 75,25)');
  console.log('6. Clique em "Salvar Orçamento"');
  console.log('7. Observe os logs abaixo para ver o que está sendo enviado');
  console.log('\n🔍 Aguardando ação do usuário...');
}

// Executar o teste
testarSalvamento();

console.log('\n✅ INTERCEPTADOR DE REQUISIÇÕES ATIVO');
console.log('💡 Agora faça o teste manual e observe os logs!');