// TESTE DE NAVEGAÇÃO PARA ORÇAMENTOS - EXECUTAR NO CONSOLE DO NAVEGADOR
// Cole este código no console do navegador (F12 > Console)

function testOrcamentosNavigation() {
  console.log('🧪 TESTE: Navegação para Orçamentos');
  console.log('=' .repeat(50));
  
  // 1. Verificar URL atual
  console.log('📍 URL atual:', window.location.href);
  
  // 2. Verificar dados de autenticação
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');
  
  console.log('🔐 Token existe:', !!token);
  console.log('👤 Dados do usuário:', userData ? JSON.parse(userData) : 'Não encontrado');
  
  // 3. Verificar se o usuário tem permissões
  if (userData) {
    const user = JSON.parse(userData);
    console.log('📋 Permissões do usuário:', user.permissoes);
    console.log('✅ Tem permissão de orçamentos:', user.permissoes?.orcamentos || false);
  }
  
  // 4. Procurar pelo link de orçamentos no DOM
  const orcamentosLinks = document.querySelectorAll('a[href*="orcamentos"], a[href*="/orcamentos"]');
  console.log('🔍 Links de orçamentos encontrados:', orcamentosLinks.length);
  
  orcamentosLinks.forEach((link, index) => {
    console.log(`   ${index + 1}. Texto: "${link.textContent.trim()}", Href: "${link.href}", Visível: ${link.offsetParent !== null}`);
  });
  
  // 5. Verificar se existe algum elemento com texto "Orçamentos"
  const allElements = document.querySelectorAll('*');
  const orcamentosElements = Array.from(allElements).filter(el => 
    el.textContent && el.textContent.toLowerCase().includes('orçamento')
  );
  
  console.log('📝 Elementos com texto "orçamento":', orcamentosElements.length);
  orcamentosElements.slice(0, 5).forEach((el, index) => {
    console.log(`   ${index + 1}. Tag: ${el.tagName}, Texto: "${el.textContent.trim().substring(0, 50)}...", Visível: ${el.offsetParent !== null}`);
  });
  
  // 6. Tentar clicar no primeiro link de orçamentos encontrado
  if (orcamentosLinks.length > 0) {
    const firstLink = orcamentosLinks[0];
    console.log('🖱️ Tentando clicar no primeiro link de orçamentos...');
    console.log('   Link:', firstLink.href);
    
    // Simular clique
    firstLink.click();
    
    // Aguardar um pouco e verificar se a navegação funcionou
    setTimeout(() => {
      console.log('🔄 Após clique - URL atual:', window.location.href);
      
      if (window.location.href.includes('orcamentos')) {
        console.log('✅ SUCESSO: Navegação para orçamentos funcionou!');
        
        // Verificar se a página carregou corretamente
        const pageContent = document.body.textContent;
        if (pageContent.toLowerCase().includes('orçamento')) {
          console.log('✅ SUCESSO: Página de orçamentos carregou corretamente!');
        } else {
          console.log('⚠️ AVISO: Navegou para orçamentos mas o conteúdo pode não ter carregado.');
        }
      } else {
        console.log('❌ FALHA: Clique não resultou em navegação para orçamentos.');
      }
    }, 2000);
  } else {
    console.log('❌ FALHA: Nenhum link de orçamentos encontrado!');
    console.log('💡 Possíveis causas:');
    console.log('   - Usuário não tem permissão de orçamentos');
    console.log('   - Link não está sendo renderizado');
    console.log('   - Problema no componente de navegação');
  }
  
  console.log('=' .repeat(50));
  console.log('🏁 Teste concluído!');
}

// Disponibilizar a função globalmente
window.testOrcamentosNavigation = testOrcamentosNavigation;

console.log('🚀 Script carregado! Execute: testOrcamentosNavigation()');
console.log('💡 IMPORTANTE: Se você fez logout/login recentemente, as permissões devem estar atualizadas.');