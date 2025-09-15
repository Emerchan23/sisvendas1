// Teste de Permissões do Usuário - Execute no Console do Navegador
// Copie e cole este código no console do navegador (F12)

console.log('=== TESTE DE PERMISSÕES DO USUÁRIO ===');

// Função para testar permissões
function testUserPermissions() {
    console.log('\n1. Verificando dados de autenticação...');
    
    // Verificar localStorage
    const authToken = localStorage.getItem('auth_token');
    console.log('Token no localStorage:', authToken ? 'Presente' : 'Ausente');
    
    if (authToken) {
        try {
            // Decodificar token
            const payload = JSON.parse(atob(authToken.split('.')[1]));
            console.log('Dados do token:', {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                exp: new Date(payload.exp * 1000).toLocaleString()
            });
        } catch (error) {
            console.error('Erro ao decodificar token:', error);
        }
    }
    
    console.log('\n2. Verificando contexto de autenticação...');
    
    // Verificar se há dados do usuário no contexto React
    const authData = window.localStorage.getItem('auth_user_data');
    if (authData) {
        try {
            const userData = JSON.parse(authData);
            console.log('Dados do usuário:', userData);
        } catch (error) {
            console.error('Erro ao parsear dados do usuário:', error);
        }
    }
    
    console.log('\n3. Verificando elementos da interface...');
    
    // Verificar se o usuário está logado na interface
    const userInfo = document.querySelector('[data-testid="user-info"]') || 
                    document.querySelector('.user-info') ||
                    document.querySelector('[class*="user"]');
    
    if (userInfo) {
        console.log('Informações do usuário na interface:', userInfo.textContent);
    } else {
        console.log('Elemento de informações do usuário não encontrado');
    }
    
    console.log('\n4. Verificando link de orçamentos...');
    
    // Procurar pelo link de orçamentos
    const orcamentosLink = document.querySelector('a[href="/orcamentos"]') ||
                          document.querySelector('a[href*="orcamento"]') ||
                          document.querySelector('[data-testid="orcamentos-link"]');
    
    if (orcamentosLink) {
        console.log('Link de orçamentos encontrado:', {
            href: orcamentosLink.href,
            text: orcamentosLink.textContent,
            visible: orcamentosLink.offsetParent !== null,
            disabled: orcamentosLink.hasAttribute('disabled') || orcamentosLink.classList.contains('disabled')
        });
        
        // Verificar se o link está visível
        const rect = orcamentosLink.getBoundingClientRect();
        console.log('Posição do link:', {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            visibleInViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth
        });
    } else {
        console.log('❌ Link de orçamentos NÃO encontrado');
        
        // Listar todos os links de navegação disponíveis
        const allNavLinks = document.querySelectorAll('nav a, [role="navigation"] a, .navigation a');
        console.log('Links de navegação disponíveis:');
        allNavLinks.forEach((link, index) => {
            console.log(`  ${index + 1}. ${link.textContent.trim()} -> ${link.href}`);
        });
    }
    
    console.log('\n5. Verificando permissões no contexto React...');
    
    // Tentar acessar o contexto React (se disponível)
    try {
        // Procurar por elementos React com dados de permissão
        const reactElements = document.querySelectorAll('[data-reactroot], [data-react-helmet]');
        console.log('Elementos React encontrados:', reactElements.length);
        
        // Verificar se há dados de permissão em atributos data-*
        const elementsWithPermissions = document.querySelectorAll('[data-permission], [data-role], [data-user]');
        if (elementsWithPermissions.length > 0) {
            console.log('Elementos com dados de permissão:');
            elementsWithPermissions.forEach((el, index) => {
                console.log(`  ${index + 1}.`, {
                    tag: el.tagName,
                    permission: el.dataset.permission,
                    role: el.dataset.role,
                    user: el.dataset.user
                });
            });
        }
    } catch (error) {
        console.error('Erro ao verificar contexto React:', error);
    }
    
    console.log('\n6. Fazendo requisição para verificar permissões...');
    
    // Fazer uma requisição para verificar as permissões do usuário atual
    if (authToken) {
        fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Resposta da verificação de autenticação:', data);
            
            if (data.usuario) {
                console.log('Dados do usuário:', {
                    id: data.usuario.id,
                    nome: data.usuario.nome,
                    email: data.usuario.email,
                    role: data.usuario.role,
                    ativo: data.usuario.ativo,
                    permissoes: data.usuario.permissoes
                });
                
                // Verificar especificamente a permissão de orçamentos
                const hasOrcamentosPermission = data.usuario.role === 'admin' || 
                                              (data.usuario.permissoes && data.usuario.permissoes.orcamentos === true);
                
                console.log('\n🔍 ANÁLISE DE PERMISSÕES:');
                console.log('É admin?', data.usuario.role === 'admin');
                console.log('Tem permissão de orçamentos?', data.usuario.permissoes?.orcamentos);
                console.log('Deveria ver o link de orçamentos?', hasOrcamentosPermission);
                
                if (hasOrcamentosPermission && !orcamentosLink) {
                    console.log('❌ PROBLEMA: Usuário tem permissão mas o link não está visível!');
                } else if (!hasOrcamentosPermission && orcamentosLink) {
                    console.log('❌ PROBLEMA: Usuário não tem permissão mas o link está visível!');
                } else if (hasOrcamentosPermission && orcamentosLink) {
                    console.log('✅ OK: Usuário tem permissão e o link está visível');
                } else {
                    console.log('✅ OK: Usuário não tem permissão e o link não está visível');
                }
            }
        })
        .catch(error => {
            console.error('Erro na verificação de autenticação:', error);
        });
    }
    
    console.log('\n=== FIM DO TESTE ===');
}

// Disponibilizar função globalmente
window.testUserPermissions = testUserPermissions;

console.log('Função testUserPermissions() disponível. Execute testUserPermissions() para iniciar o teste.');
console.log('Ou execute automaticamente em 2 segundos...');

// Executar automaticamente após 2 segundos
setTimeout(testUserPermissions, 2000);