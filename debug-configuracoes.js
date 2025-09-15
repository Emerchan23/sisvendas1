const puppeteer = require('puppeteer');
const path = require('path');

const BASE_URL = 'http://localhost:3145';

async function debugConfiguracoes() {
    console.log('🔍 Iniciando debug da página de configurações...');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    try {
        // 1. LOGIN
        console.log('🔐 Fazendo login...');
        await page.goto(`http://localhost:3145/login`, { waitUntil: 'networkidle2' });
        
        // Aguardar campos aparecerem
        await page.waitForSelector('#email');
        await page.waitForSelector('#senha');
        
        // Preencher campos
        await page.type('#email', 'admin@sistema.com');
        await page.type('#senha', 'admin123');
        
        // Clicar no botão de login
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        console.log('✅ Login realizado');
        
        // 2. NAVEGAR PARA CONFIGURAÇÕES
        console.log('📋 Navegando para configurações...');
        await page.goto(`${BASE_URL}/configuracoes`, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 3. LISTAR TODAS AS ABAS DISPONÍVEIS
        console.log('\n📋 Listando abas disponíveis...');
        const tabs = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.map((btn, index) => ({
                index,
                text: btn.textContent?.trim() || '',
                id: btn.id || '',
                className: btn.className || '',
                dataValue: btn.getAttribute('data-value') || ''
            })).filter(btn => btn.text.length > 0);
        });
        
        console.log('Abas encontradas:');
        tabs.forEach(tab => {
            console.log(`  ${tab.index}: "${tab.text}" (id: ${tab.id}, data-value: ${tab.dataValue})`);
        });
        
        // 4. PROCURAR ABA DE EMAIL
        console.log('\n📧 Procurando aba de E-mail...');
        const emailTab = tabs.find(tab => 
            tab.text.toLowerCase().includes('e-mail') || 
            tab.text.toLowerCase().includes('email') ||
            tab.dataValue === 'email'
        );
        
        if (emailTab) {
            console.log(`✅ Aba de E-mail encontrada: "${emailTab.text}" (índice: ${emailTab.index})`);
            
            // 5. CLICAR NA ABA DE EMAIL
            await page.evaluate((index) => {
                const buttons = Array.from(document.querySelectorAll('button'));
                if (buttons[index]) {
                    buttons[index].click();
                }
            }, emailTab.index);
            
            console.log('🔄 Clicou na aba de E-mail, aguardando carregamento...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // 6. ANALISAR CONTEÚDO DA ABA
            console.log('\n🔍 Analisando conteúdo da aba E-mail...');
            
            // Verificar se há inputs
            const inputs = await page.evaluate(() => {
                const allInputs = Array.from(document.querySelectorAll('input'));
                return allInputs.map((input, index) => ({
                    index,
                    id: input.id || '',
                    name: input.name || '',
                    type: input.type || '',
                    placeholder: input.placeholder || '',
                    value: input.value || '',
                    visible: input.offsetParent !== null
                }));
            });
            
            console.log('\nInputs encontrados:');
            inputs.forEach(input => {
                console.log(`  ${input.index}: id="${input.id}" name="${input.name}" type="${input.type}" placeholder="${input.placeholder}" visible=${input.visible}`);
            });
            
            // Verificar se há textareas
            const textareas = await page.evaluate(() => {
                const allTextareas = Array.from(document.querySelectorAll('textarea'));
                return allTextareas.map((textarea, index) => ({
                    index,
                    id: textarea.id || '',
                    name: textarea.name || '',
                    placeholder: textarea.placeholder || '',
                    visible: textarea.offsetParent !== null
                }));
            });
            
            console.log('\nTextareas encontrados:');
            textareas.forEach(textarea => {
                console.log(`  ${textarea.index}: id="${textarea.id}" name="${textarea.name}" placeholder="${textarea.placeholder}" visible=${textarea.visible}`);
            });
            
            // Verificar se há checkboxes
            const checkboxes = await page.evaluate(() => {
                const allCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
                return allCheckboxes.map((checkbox, index) => ({
                    index,
                    id: checkbox.id || '',
                    name: checkbox.name || '',
                    checked: checkbox.checked,
                    visible: checkbox.offsetParent !== null
                }));
            });
            
            console.log('\nCheckboxes encontrados:');
            checkboxes.forEach(checkbox => {
                console.log(`  ${checkbox.index}: id="${checkbox.id}" name="${checkbox.name}" checked=${checkbox.checked} visible=${checkbox.visible}`);
            });
            
            // Verificar se há botões de salvar
            const saveButtons = await page.evaluate(() => {
                const allButtons = Array.from(document.querySelectorAll('button'));
                return allButtons.filter(btn => 
                    btn.textContent?.toLowerCase().includes('salvar') ||
                    btn.textContent?.toLowerCase().includes('save')
                ).map((btn, index) => ({
                    index,
                    text: btn.textContent?.trim() || '',
                    id: btn.id || '',
                    className: btn.className || '',
                    visible: btn.offsetParent !== null
                }));
            });
            
            console.log('\nBotões de salvar encontrados:');
            saveButtons.forEach(btn => {
                console.log(`  ${btn.index}: "${btn.text}" id="${btn.id}" visible=${btn.visible}`);
            });
            
        } else {
            console.log('❌ Aba de E-mail não encontrada!');
        }
        
        console.log('\n🔍 Debug concluído! Pressione Enter para fechar...');
        await new Promise(resolve => {
            process.stdin.once('data', () => resolve());
        });
        
    } catch (error) {
        console.error('❌ Erro durante o debug:', error);
    } finally {
        await browser.close();
    }
}

debugConfiguracoes().catch(console.error);