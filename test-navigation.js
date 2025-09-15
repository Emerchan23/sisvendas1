// Teste de navegação para orçamentos
console.log('🧪 Testando navegação para orçamentos...');

// Simular clique no link de orçamentos
const testNavigation = () => {
  // Verificar se estamos na página correta
  console.log('📍 URL atual:', window.location.href);
  console.log('📍 Pathname atual:', window.location.pathname);
  
  // Procurar pelo link de orçamentos no header
  const orcamentosLink = document.querySelector('a[href="/orcamentos"]');
  console.log('🔗 Link de orçamentos encontrado:', orcamentosLink);
  
  if (orcamentosLink) {
    console.log('✅ Link de orçamentos existe no DOM');
    console.log('🔗 Href do link:', orcamentosLink.getAttribute('href'));
    console.log('📝 Texto do link:', orcamentosLink.textContent);
  } else {
    console.log('❌ Link de orçamentos NÃO encontrado no DOM');
    
    // Procurar por todos os links no header
    const allLinks = document.querySelectorAll('header a');
    console.log('🔗 Todos os links no header:', Array.from(allLinks).map(link => ({
      href: link.getAttribute('href'),
      text: link.textContent?.trim()
    })));
  }
  
  // Verificar se há botões com texto "Orçamentos"
  const orcamentosButtons = document.querySelectorAll('button');
  const orcamentosButtonsWithText = Array.from(orcamentosButtons).filter(btn => 
    btn.textContent?.toLowerCase().includes('orçamento')
  );
  console.log('🔘 Botões com texto "orçamento":', orcamentosButtonsWithText.map(btn => ({
    text: btn.textContent?.trim(),
    parent: btn.parentElement?.tagName
  })));
};

// Executar teste após carregamento da página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testNavigation);
} else {
  testNavigation();
}

// Também executar após um pequeno delay para garantir que o React renderizou
setTimeout(testNavigation, 2000);

console.log('🧪 Teste de navegação configurado. Verifique os logs acima.');