const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3145';

// Lista de páginas para testar
const UI_PAGES = [
  { path: '/', name: 'Dashboard Principal', description: 'Página inicial com resumos' },
  { path: '/menu', name: 'Menu Principal', description: 'Menu de navegação' },
  { path: '/clientes', name: 'Gestão de Clientes', description: 'CRUD de clientes' },
  { path: '/vendas', name: 'Gestão de Vendas', description: 'CRUD de vendas' },
  { path: '/fornecedores', name: 'Gestão de Fornecedores', description: 'CRUD de fornecedores' },
  { path: '/orcamentos', name: 'Orçamentos', description: 'Gestão de orçamentos' },
  { path: '/acertos', name: 'Acertos', description: 'Gestão de acertos' },
  { path: '/vales', name: 'Vales', description: 'Gestão de vales' },
  { path: '/amigos', name: 'Amigos', description: 'Gestão de amigos' },
  { path: '/outros-negocios', name: 'Outros Negócios', description: 'Outros tipos de negócios' },
  { path: '/relatorios', name: 'Relatórios', description: 'Relatórios do sistema' },
  { path: '/configuracoes', name: 'Configurações', description: 'Configurações do sistema' },
  { path: '/configuracoes/usuarios', name: 'Usuários', description: 'Gestão de usuários' }
];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'UI-Test-Script',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body,
          contentLength: body.length
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

function analyzeHTML(html) {
  const analysis = {
    isHTML: html.includes('<html') || html.includes('<!DOCTYPE'),
    hasReact: html.includes('__NEXT_DATA__') || html.includes('_app'),
    hasContent: html.length > 1000,
    hasErrors: html.includes('Error') || html.includes('404') || html.includes('500'),
    hasTitle: /<title[^>]*>([^<]+)<\/title>/i.test(html)
  };
  
  // Extrair título se existir
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    analysis.title = titleMatch[1].trim();
  }
  
  return analysis;
}

async function testUIInterface() {
  console.log('🖥️  INICIANDO TESTES DA INTERFACE DO USUÁRIO');
  console.log('=' .repeat(60));
  
  const results = [];
  let passedTests = 0;
  let failedTests = 0;
  
  for (const uiPage of UI_PAGES) {
    try {
      console.log(`\n🌐 Testando: ${uiPage.name}`);
      console.log(`   URL: ${BASE_URL}${uiPage.path}`);
      console.log(`   Descrição: ${uiPage.description}`);
      
      const response = await makeRequest(`${BASE_URL}${uiPage.path}`);
      const analysis = analyzeHTML(response.body);
      
      if (response.status >= 200 && response.status < 400) {
        if (analysis.isHTML && analysis.hasContent && !analysis.hasErrors) {
          console.log(`   ✅ SUCESSO - Status: ${response.status}`);
          console.log(`   📄 Conteúdo: ${response.contentLength} chars, React: ${analysis.hasReact}`);
          if (analysis.title) {
            console.log(`   📝 Título: ${analysis.title}`);
          }
          passedTests++;
          
          results.push({
            page: uiPage.name,
            path: uiPage.path,
            status: response.status,
            success: true,
            contentLength: response.contentLength,
            hasReact: analysis.hasReact,
            title: analysis.title
          });
        } else {
          console.log(`   ⚠️  PARCIAL - Status: ${response.status}`);
          console.log(`   📄 HTML: ${analysis.isHTML}, Conteúdo: ${analysis.hasContent}, Erros: ${analysis.hasErrors}`);
          passedTests++;
          
          results.push({
            page: uiPage.name,
            path: uiPage.path,
            status: response.status,
            success: true,
            contentLength: response.contentLength,
            issues: !analysis.isHTML ? 'Não é HTML' : !analysis.hasContent ? 'Pouco conteúdo' : 'Possíveis erros'
          });
        }
      } else {
        console.log(`   ❌ FALHA - Status: ${response.status}`);
        failedTests++;
        
        results.push({
          page: uiPage.name,
          path: uiPage.path,
          status: response.status,
          success: false,
          error: `HTTP ${response.status}`
        });
      }
      
    } catch (error) {
      console.log(`   ❌ ERRO: ${error.message}`);
      failedTests++;
      
      results.push({
        page: uiPage.name,
        path: uiPage.path,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }
    
    // Pequena pausa entre requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Mostrar resumo
  console.log('\n' + '=' .repeat(60));
  console.log('📋 RESUMO DOS TESTES DA INTERFACE');
  console.log('=' .repeat(60));
  console.log(`✅ Páginas funcionando: ${passedTests}`);
  console.log(`❌ Páginas com problemas: ${failedTests}`);
  console.log(`📊 Total de páginas: ${results.length}`);
  
  if (failedTests > 0) {
    console.log('\n❌ PÁGINAS COM PROBLEMAS:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.page} (${r.path}): ${r.error || `Status ${r.status}`}`);
    });
  }
  
  console.log('\n✅ PÁGINAS FUNCIONANDO:');
  results.filter(r => r.success).forEach(r => {
    const info = [];
    if (r.contentLength) info.push(`${Math.round(r.contentLength/1000)}KB`);
    if (r.hasReact) info.push('React');
    if (r.title) info.push(`"${r.title}"`);
    if (r.issues) info.push(`⚠️ ${r.issues}`);
    
    console.log(`   - ${r.page} (${r.path}): Status ${r.status} ${info.length ? `[${info.join(', ')}]` : ''}`);
  });
  
  return {
    total: results.length,
    passed: passedTests,
    failed: failedTests,
    results: results
  };
}

// Executar os testes
testUIInterface()
  .then(summary => {
    console.log('\n🎯 TESTE DE INTERFACE CONCLUÍDO!');
    console.log(`📊 Resultado: ${summary.passed}/${summary.total} páginas funcionando`);
    process.exit(summary.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Erro fatal nos testes:', error);
    process.exit(1);
  });