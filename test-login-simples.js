const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3145';

async function testLoginSimples() {
    console.log('🚀 Teste simples de login...');
    
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Navegar para login
        console.log('📍 Navegando para login...');
        await page.goto(`${BASE_URL}/login`);
        
        // Aguardar campos aparecerem
        await page.waitForSelector('#email', { timeout: 10000 });
        await page.waitForSelector('#senha', { timeout: 10000 });
        
        console.log('✏️ Preenchendo credenciais...');
        await page.type('#email', 'admin@sistema.com');
        await page.type('#senha', 'admin123');
        
        console.log('🖱️ Clicando em entrar...');
        await page.click('button[type="submit"]');
        
        // Aguardar um tempo para o processamento
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const currentUrl = page.url();
        console.log('🌐 URL atual:', currentUrl);
        
        if (currentUrl.includes('/login')) {
            console.log('❌ Login falhou - ainda na página de login');
            
            // Verificar se há mensagens de erro
            const pageText = await page.evaluate(() => document.body.innerText);
            if (pageText.includes('inválid') || pageText.includes('erro') || pageText.includes('credenciais')) {
                console.log('🔍 Possível erro de credenciais detectado');
            }
            return false;
        } else {
            console.log('✅ Login bem-sucedido!');
            return true;
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

// Executar teste
testLoginSimples().then(success => {
    if (success) {
        console.log('🎉 Teste de login passou!');
    } else {
        console.log('💥 Teste de login falhou!');
    }
    process.exit(success ? 0 : 1);
});