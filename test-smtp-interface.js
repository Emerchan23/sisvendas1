// Script para testar a aba de configurações SMTP via interface web
const puppeteer = require('puppeteer');
const Database = require('better-sqlite3');
const path = require('path');

// Configuração do banco de dados
const dbPath = path.resolve('../Banco de dados Aqui/erp.sqlite');

async function testSMTPInterface() {
    let browser;
    let db;
    
    try {
        console.log('🚀 Iniciando teste da interface SMTP...');
        
        // Conectar ao banco de dados
        db = new Database(dbPath);
        console.log('✅ Conectado ao banco de dados');
        
        // Iniciar o navegador
        browser = await puppeteer.launch({
            headless: false, // Mostrar o navegador para debug
            defaultViewport: { width: 1280, height: 720 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Navegar para o sistema
        console.log('🌐 Navegando para http://localhost:3145...');
        await page.goto('http://localhost:3145', { waitUntil: 'networkidle2' });
        
        // Aguardar a página carregar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🔍 Procurando pela aba de Configurações...');
        
        // Tentar encontrar e clicar na aba de configurações
        const configSelectors = [
            'a[href*="config"]',
            'a[href*="configurac"]',
            'button:contains("Configurações")',
            'a:contains("Configurações")',
            'a:contains("Config")',
            '[data-testid="config"]',
            '.nav-link:contains("Configurações")',
            'li:contains("Configurações") a'
        ];
        
        let configFound = false;
        for (const selector of configSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 1000 });
                await page.click(selector);
                console.log(`✅ Clicou na aba de configurações usando seletor: ${selector}`);
                configFound = true;
                break;
            } catch (error) {
                // Continuar tentando outros seletores
            }
        }
        
        if (!configFound) {
            console.log('⚠️ Não foi possível encontrar a aba de configurações automaticamente');
            console.log('📋 Elementos disponíveis na página:');
            
            // Listar todos os links e botões disponíveis
            const links = await page.evaluate(() => {
                const elements = [];
                document.querySelectorAll('a, button').forEach(el => {
                    if (el.textContent.trim()) {
                        elements.push({
                            tag: el.tagName,
                            text: el.textContent.trim(),
                            href: el.href || '',
                            id: el.id || '',
                            className: el.className || ''
                        });
                    }
                });
                return elements;
            });
            
            console.table(links.slice(0, 20)); // Mostrar apenas os primeiros 20
        }
        
        // Aguardar um pouco para a página de configurações carregar
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('📧 Procurando por campos de configuração SMTP...');
        
        // Procurar por campos de SMTP
        const smtpSelectors = [
            'input[name*="smtp"]',
            'input[name*="email"]',
            'input[name*="host"]',
            'input[name*="port"]',
            'input[name*="user"]',
            'input[name*="password"]',
            'input[placeholder*="smtp"]',
            'input[placeholder*="email"]'
        ];
        
        const smtpFields = [];
        for (const selector of smtpSelectors) {
            try {
                const elements = await page.$$(selector);
                for (const element of elements) {
                    const name = await element.evaluate(el => el.name || el.id || el.placeholder);
                    smtpFields.push({ selector, name, element });
                }
            } catch (error) {
                // Continuar
            }
        }
        
        console.log(`✅ Encontrados ${smtpFields.length} campos relacionados a SMTP/email`);
        
        if (smtpFields.length > 0) {
            console.log('🧪 Testando preenchimento dos campos SMTP...');
            
            // Dados de teste para SMTP
            const testData = {
                host: 'smtp.gmail.com',
                port: '587',
                user: 'teste@gmail.com',
                password: 'senha123',
                from: 'sistema@empresa.com'
            };
            
            // Preencher campos encontrados
            for (const field of smtpFields) {
                try {
                    const fieldName = field.name.toLowerCase();
                    let value = '';
                    
                    if (fieldName.includes('host')) value = testData.host;
                    else if (fieldName.includes('port')) value = testData.port;
                    else if (fieldName.includes('user') || fieldName.includes('email')) value = testData.user;
                    else if (fieldName.includes('password') || fieldName.includes('senha')) value = testData.password;
                    else if (fieldName.includes('from') || fieldName.includes('remetente')) value = testData.from;
                    
                    if (value) {
                        // Limpar o campo primeiro
                        await field.element.click({ clickCount: 3 });
                        await field.element.press('Backspace');
                        // Preencher com o novo valor
                        await field.element.type(value);
                        console.log(`✅ Preenchido campo ${fieldName} com: ${value}`);
                    }
                } catch (error) {
                    console.log(`⚠️ Erro ao preencher campo ${field.name}:`, error.message);
                }
            }
            
            console.log('💾 Procurando botão de salvar...');
            
            // Procurar e clicar no botão de salvar
            const saveSelectors = [
                'button:contains("Salvar")',
                'button:contains("Save")',
                'button[type="submit"]',
                'input[type="submit"]',
                'button:contains("Confirmar")',
                '.btn-primary',
                '.btn-success'
            ];
            
            let saved = false;
            for (const selector of saveSelectors) {
                try {
                    await page.waitForSelector(selector, { timeout: 1000 });
                    await page.click(selector);
                    console.log(`✅ Clicou no botão salvar: ${selector}`);
                    saved = true;
                    break;
                } catch (error) {
                    // Continuar tentando
                }
            }
            
            if (saved) {
                // Aguardar o salvamento
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                console.log('🔄 Atualizando a página para verificar persistência...');
                await page.reload({ waitUntil: 'networkidle2' });
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                console.log('✅ Página recarregada - verificando se os dados persistiram');
                
                // Verificar se os dados persistiram no banco
                const configs = db.prepare('SELECT * FROM configuracoes WHERE config_key LIKE \'%smtp%\' OR config_key LIKE \'%email%\'').all();
                console.log('📊 Configurações SMTP no banco:', configs.length);
                
                if (configs.length > 0) {
                    console.log('📧 Configurações encontradas:');
                    configs.forEach(config => {
                        console.log(`   - ${config.config_key}: ${config.config_value}`);
                    });
                }
            } else {
                console.log('⚠️ Não foi possível encontrar o botão de salvar');
            }
        } else {
            console.log('⚠️ Nenhum campo de SMTP encontrado na página');
        }
        
        console.log('\n🎉 TESTE DA INTERFACE SMTP CONCLUÍDO!');
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (browser) {
            await browser.close();
        }
        if (db) {
            db.close();
        }
    }
}

// Executar o teste
testSMTPInterface().catch(console.error);