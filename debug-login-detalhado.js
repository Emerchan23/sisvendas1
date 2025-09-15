const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'http://localhost:3145';

async function debugLogin() {
    console.log('🔍 Iniciando debug detalhado do login...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        slowMo: 1000,
        devtools: true
    });
    
    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        
        // Navegar para a página de login
        console.log('📍 Navegando para:', `${BASE_URL}/login`);
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
        
        // Capturar screenshot inicial
        await page.screenshot({ path: 'login-inicial.png', fullPage: true });
        console.log('📸 Screenshot inicial salvo: login-inicial.png');
        
        // Verificar se há mensagens de erro na página
        const errorMessages = await page.$$eval('[class*="error"], [class*="alert"], .text-red-500, .text-danger', elements => 
            elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
        );
        
        if (errorMessages.length > 0) {
            console.log('⚠️ Mensagens de erro encontradas:', errorMessages);
        }
        
        // Verificar campos de input
        const emailField = await page.$('#email');
        const senhaField = await page.$('#senha');
        const submitButton = await page.$('button[type="submit"]');
        
        console.log('📋 Status dos campos:');
        console.log('- Campo email:', emailField ? '✅ Encontrado' : '❌ Não encontrado');
        console.log('- Campo senha:', senhaField ? '✅ Encontrado' : '❌ Não encontrado');
        console.log('- Botão submit:', submitButton ? '✅ Encontrado' : '❌ Não encontrado');
        
        if (!emailField || !senhaField || !submitButton) {
            console.log('❌ Campos necessários não encontrados!');
            return;
        }
        
        // Preencher campos
        console.log('✏️ Preenchendo campos...');
        await page.type('#email', 'admin@admin.com', { delay: 100 });
        await page.type('#senha', '123456', { delay: 100 });
        
        // Capturar screenshot após preenchimento
        await page.screenshot({ path: 'login-preenchido.png', fullPage: true });
        console.log('📸 Screenshot após preenchimento: login-preenchido.png');
        
        // Aguardar um pouco
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Clicar no botão de submit
        console.log('🖱️ Clicando no botão de login...');
        await page.click('button[type="submit"]');
        
        // Aguardar resposta
        console.log('⏳ Aguardando resposta...');
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        // Verificar URL atual
        const currentUrl = page.url();
        console.log('🌐 URL atual:', currentUrl);
        
        // Capturar screenshot final
        await page.screenshot({ path: 'login-final.png', fullPage: true });
        console.log('📸 Screenshot final: login-final.png');
        
        // Verificar se há mensagens de erro após o submit
        const postSubmitErrors = await page.$$eval('[class*="error"], [class*="alert"], .text-red-500, .text-danger', elements => 
            elements.map(el => el.textContent.trim()).filter(text => text.length > 0)
        );
        
        if (postSubmitErrors.length > 0) {
            console.log('⚠️ Mensagens de erro após submit:', postSubmitErrors);
        }
        
        // Verificar se o login foi bem-sucedido
        if (currentUrl.includes('/login')) {
            console.log('❌ Login falhou - ainda na página de login');
            
            // Verificar se há elementos que indicam erro
            const pageContent = await page.content();
            if (pageContent.includes('credenciais') || pageContent.includes('inválid') || pageContent.includes('erro')) {
                console.log('🔍 Possível erro de credenciais detectado no conteúdo da página');
            }
        } else {
            console.log('✅ Login bem-sucedido! Redirecionado para:', currentUrl);
        }
        
        // Aguardar para inspeção manual
        console.log('⏸️ Aguardando 15 segundos para inspeção manual...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
    } catch (error) {
        console.error('❌ Erro durante o debug:', error.message);
    } finally {
        await browser.close();
        console.log('🏁 Debug concluído!');
    }
}

debugLogin();