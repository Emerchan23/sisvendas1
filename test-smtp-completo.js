const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const BASE_URL = 'http://localhost:3145';
const DB_PATH = path.join(__dirname, '..', 'Banco de dados Aqui', 'erp.sqlite');

async function testSmtpCompleto() {
    console.log('🚀 Iniciando teste completo da configuração SMTP...');
    
    // Conectar ao banco
    const db = new sqlite3.Database(DB_PATH);
    console.log('✅ Conectado ao banco de dados');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    try {
        const page = await browser.newPage();
        
        // 1. FAZER LOGIN
        console.log('🔐 Fazendo login...');
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
        await page.type('#email', 'admin@sistema.com');
        await page.type('#senha', 'admin123');
        await page.click('button[type="submit"]');
        
        // Aguardar redirecionamento
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verificar se o login foi bem-sucedido
        const currentUrl = page.url();
        if (currentUrl.includes('/login')) {
            throw new Error('Login falhou - ainda na página de login');
        }
        console.log('✅ Login realizado');
        
        // 2. NAVEGAR PARA CONFIGURAÇÕES
        console.log('📋 Navegando para configurações...');
        await page.goto(`${BASE_URL}/configuracoes`, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 3. CLICAR NA ABA E-MAIL
        console.log('📧 Acessando aba E-mail...');
        const emailTabClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const emailButton = buttons.find(btn => 
                btn.textContent && btn.textContent.toLowerCase().includes('e-mail')
            );
            if (emailButton) {
                emailButton.click();
                return true;
            }
            return false;
        });
        
        if (!emailTabClicked) {
            throw new Error('Aba E-mail não encontrada!');
        }
        
        console.log('⏳ Aguardando conteúdo da aba E-mail...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 4. BUSCAR TODOS OS CAMPOS SMTP
        console.log('🔍 Buscando campos SMTP...');
        const smtpFields = await page.evaluate(() => {
            const fields = [
                { id: 'smtpHost', name: 'Servidor SMTP' },
                { id: 'smtpPort', name: 'Porta' },
                { id: 'smtpUser', name: 'Usuário' },
                { id: 'smtpPassword', name: 'Senha' },
                { id: 'smtpFromName', name: 'Nome do Remetente' },
                { id: 'smtpFromEmail', name: 'E-mail do Remetente' },
                { id: 'smtpSecure', name: 'SSL/TLS' }
            ];
            
            const foundFields = [];
            fields.forEach(field => {
                const element = document.getElementById(field.id);
                if (element) {
                    foundFields.push({
                        id: field.id,
                        name: field.name,
                        type: element.type || element.tagName.toLowerCase(),
                        value: element.type === 'checkbox' ? element.checked : element.value
                    });
                }
            });
            
            return foundFields;
        });
        
        console.log(`📋 Campos SMTP encontrados: ${smtpFields.length}`);
        smtpFields.forEach((field, index) => {
            console.log(`  [${index}] ${field.name} (${field.type}, id: "${field.id}") = "${field.value}"`);
        });
        
        // 4. AGUARDAR CARREGAMENTO DOS CAMPOS
        console.log('⏳ Aguardando carregamento dos campos SMTP...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Clicar na aba de E-mail
        console.log('📧 Clicando na aba de E-mail...');
        await page.waitForSelector('[id*="trigger-email"]', { timeout: 10000 });
        await page.click('[id*="trigger-email"]');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 5. PREENCHER TODOS OS CAMPOS SMTP
        console.log('\n🔧 Preenchendo campos SMTP...');
        
        const smtpData = {
            smtpHost: 'smtp.gmail.com',
            smtpPort: '587',
            smtpUser: 'teste@gmail.com',
            smtpPassword: 'senha123',
            smtpFromName: 'Sistema Teste',
            smtpFromEmail: 'noreply@sistema.com'
        };
        
        let fieldsPreenchidos = 0;
        for (const [fieldId, value] of Object.entries(smtpData)) {
            try {
                await page.waitForSelector(`#${fieldId}`, { timeout: 5000 });
                
                // Limpar campo
                await page.evaluate((id) => {
                    const element = document.getElementById(id);
                    if (element) {
                        element.value = '';
                        element.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }, fieldId);
                
                // Preencher campo
                await page.type(`#${fieldId}`, value);
                fieldsPreenchidos++;
                console.log(`✅ ${fieldId}: ${value}`);
                
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.log(`❌ Erro ao preencher ${fieldId}:`, error.message);
            }
        }
        
        console.log(`📊 Campos preenchidos: ${fieldsPreenchidos}/${Object.keys(smtpData).length}`);
        
        // Marcar checkbox SSL/TLS
        try {
            await page.waitForSelector('#smtpSecure', { timeout: 3000 });
            const isChecked = await page.$eval('#smtpSecure', el => el.checked);
            if (!isChecked) {
                await page.click('#smtpSecure');
                console.log('  ✅ SSL/TLS marcado');
            } else {
                console.log('  ℹ️ SSL/TLS já estava marcado');
            }
        } catch (e) {
            console.log('  ❌ Erro ao marcar SSL/TLS:', e.message);
        }
        
        // 6. SALVAR CONFIGURAÇÕES
        console.log('\n💾 Salvando configurações...');
        const saveButtonClicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const saveButton = buttons.find(btn => 
                btn.textContent && btn.textContent.toLowerCase().includes('salvar') &&
                btn.textContent.toLowerCase().includes('smtp')
            );
            if (saveButton) {
                saveButton.click();
                return true;
            }
            return false;
        });
        
        if (saveButtonClicked) {
            console.log('✅ Botão salvar clicado');
            await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
            console.log('❌ Botão salvar não encontrado');
        }
        
        // 7. ATUALIZAR PÁGINA E VERIFICAR PERSISTÊNCIA
        console.log('\n🔄 Atualizando página para verificar persistência...');
        await page.reload({ waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Clicar na aba E-mail novamente
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const emailButton = buttons.find(btn => 
                btn.textContent && btn.textContent.toLowerCase().includes('e-mail')
            );
            if (emailButton) {
                emailButton.click();
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 8. VERIFICAR PERSISTÊNCIA DOS DADOS
        console.log('🔍 Verificando persistência dos dados...');
        const persistedData = await page.evaluate(() => {
            const fields = [
                'smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword', 
                'smtpFromName', 'smtpFromEmail', 'smtpSecure'
            ];
            
            const data = {};
            fields.forEach(fieldId => {
                const element = document.getElementById(fieldId);
                if (element) {
                    data[fieldId] = element.type === 'checkbox' ? element.checked : element.value;
                }
            });
            
            return data;
        });
        
        console.log('📊 Dados persistidos após reload:');
        let allPersisted = true;
        
        // Verificar campos de texto
        for (const [fieldId, expectedValue] of Object.entries(smtpData)) {
            const actualValue = persistedData[fieldId];
            const persisted = actualValue === expectedValue;
            console.log(`  ${persisted ? '✅' : '❌'} ${fieldId}: "${actualValue}" ${persisted ? '==' : '!='} "${expectedValue}"`);
            if (!persisted) allPersisted = false;
        }
        
        // Verificar checkbox SSL/TLS
        const sslPersisted = persistedData.smtpSecure === true;
        console.log(`  ${sslPersisted ? '✅' : '❌'} smtpSecure: ${persistedData.smtpSecure} ${sslPersisted ? '==' : '!='} true`);
        if (!sslPersisted) allPersisted = false;
        
        // 9. VERIFICAR NO BANCO DE DADOS
        console.log('\n🗄️ Verificando dados no banco...');
        const dbData = () => new Promise((resolve, reject) => {
            db.get("SELECT * FROM configuracoes WHERE config_key LIKE 'smtp%' LIMIT 1", (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        const dbResult = await dbData();
        
        if (dbResult) {
            console.log('✅ Dados SMTP encontrados no banco:', dbResult);
        } else {
            console.log('❌ Nenhum dado SMTP encontrado no banco');
        }
        
        // 10. RESULTADO FINAL
        console.log('\n📋 RESULTADO FINAL:');
        if (allPersisted) {
            console.log('✅ SUCESSO: Todos os dados SMTP persistiram corretamente!');
        } else {
            console.log('❌ ERRO: Alguns dados SMTP não persistiram após reload!');
        }
        
        // Screenshot final
        await page.screenshot({ path: 'test-smtp-final.png', fullPage: true });
        console.log('📸 Screenshot final salvo como test-smtp-final.png');
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    } finally {
        await browser.close();
        db.close();
        console.log('\n✅ Teste SMTP concluído!');
    }
}

testSmtpCompleto();