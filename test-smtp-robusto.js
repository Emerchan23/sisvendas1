const puppeteer = require('puppeteer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const BASE_URL = 'http://localhost:3145';
const DB_PATH = path.join(__dirname, '../Banco de dados Aqui/erp.sqlite');

// Dados de teste SMTP fornecidos pelo usuário
const smtpTestData = {
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'emerson.lpsantos@gmail.com',
    smtpPassword: 'mkdxjwjstnqmluvl',
    smtpFromName: 'Sistema Gestão',
    smtpFromEmail: 'emerson.lpsantos@gmail.com'
};

(async () => {
    console.log('🚀 Iniciando teste SMTP robusto com dados reais...');
    
    // Conectar ao banco de dados
    const db = new sqlite3.Database(DB_PATH);
    console.log('✅ Conectado ao banco de dados');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        devtools: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
        // 1. FAZER LOGIN
        console.log('\n🔐 Fazendo login...');
        await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await page.type('#email', 'admin@admin.com');
        await page.type('#senha', 'admin');
        await page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('✅ Login realizado');
        
        // 2. NAVEGAR PARA CONFIGURAÇÕES
        console.log('\n📋 Navegando para configurações...');
        await page.goto(`${BASE_URL}/configuracoes`, { waitUntil: 'networkidle2' });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 3. AGUARDAR CARREGAMENTO COMPLETO DAS ABAS
        console.log('\n⏳ Aguardando carregamento das abas...');
        await page.waitForSelector('button[value="email"]', { timeout: 30000 });
        
        // 4. CLICAR NA ABA E-MAIL
        console.log('\n📧 Ativando aba E-mail...');
        const emailTabClicked = await page.evaluate(() => {
            const emailTab = document.querySelector('button[value="email"]');
            if (emailTab) {
                emailTab.click();
                return true;
            }
            return false;
        });
        
        if (!emailTabClicked) {
            throw new Error('❌ Não foi possível encontrar a aba E-mail');
        }
        
        console.log('✅ Aba E-mail ativada');
        
        // 5. AGUARDAR CAMPOS SMTP CARREGAREM
        console.log('\n⏳ Aguardando campos SMTP carregarem...');
        await page.waitForSelector('#smtpHost', { timeout: 15000 });
        await page.waitForSelector('#smtpPort', { timeout: 5000 });
        await page.waitForSelector('#smtpUser', { timeout: 5000 });
        await page.waitForSelector('#smtpPassword', { timeout: 5000 });
        
        // 6. VERIFICAR SE OS CAMPOS SMTP ESTÃO VISÍVEIS
        console.log('\n🔍 Verificando campos SMTP...');
        const camposEncontrados = await page.evaluate(() => {
            const campos = {
                host: document.querySelector('#smtpHost'),
                port: document.querySelector('#smtpPort'),
                user: document.querySelector('#smtpUser'),
                password: document.querySelector('#smtpPassword')
            };
            return {
                host: !!campos.host,
                port: !!campos.port,
                user: !!campos.user,
                password: !!campos.password
            };
        });
        
        const camposSmtp = [
            { id: 'smtpHost', nome: 'Servidor SMTP' },
            { id: 'smtpPort', nome: 'Porta SMTP' },
            { id: 'smtpUser', nome: 'Usuário SMTP' },
            { id: 'smtpPassword', nome: 'Senha SMTP' },
            { id: 'smtpFromName', nome: 'Nome do Remetente' },
            { id: 'smtpFromEmail', nome: 'E-mail do Remetente' }
        ];
        
        let camposEncontradosCount = 0;
        const resultadosCampos = [];
        
        for (const campo of camposSmtp) {
            try {
                const elemento = await page.$(`#${campo.id}`);
                if (elemento) {
                    const isVisible = await page.evaluate(el => {
                        const rect = el.getBoundingClientRect();
                        return rect.width > 0 && rect.height > 0;
                    }, elemento);
                    
                    if (isVisible) {
                        console.log(`  ✅ ${campo.nome} (${campo.id}) - ENCONTRADO E VISÍVEL`);
                        camposEncontradosCount++;
                        resultadosCampos.push({ campo: campo.nome, status: 'ENCONTRADO' });
                    } else {
                        console.log(`  ⚠️ ${campo.nome} (${campo.id}) - ENCONTRADO MAS NÃO VISÍVEL`);
                        resultadosCampos.push({ campo: campo.nome, status: 'NÃO VISÍVEL' });
                    }
                } else {
                    console.log(`  ❌ ${campo.nome} (${campo.id}) - NÃO ENCONTRADO`);
                    resultadosCampos.push({ campo: campo.nome, status: 'NÃO ENCONTRADO' });
                }
            } catch (error) {
                console.log(`  ❌ ${campo.nome} (${campo.id}) - ERRO: ${error.message}`);
                resultadosCampos.push({ campo: campo.nome, status: 'ERRO' });
            }
        }
        
        console.log(`\n📊 Resumo: ${camposEncontradosCount}/${camposSmtp.length} campos encontrados e visíveis`);
        
        // 7. SE CAMPOS ENCONTRADOS, PREENCHER
        if (camposEncontradosCount > 0) {
            console.log('\n✏️ Preenchendo campos SMTP...');
            
            const preenchimentos = [
                { id: 'smtpHost', valor: smtpTestData.smtpHost },
                { id: 'smtpPort', valor: smtpTestData.smtpPort },
                { id: 'smtpUser', valor: smtpTestData.smtpUser },
                { id: 'smtpPassword', valor: smtpTestData.smtpPassword },
                { id: 'smtpFromName', valor: smtpTestData.smtpFromName },
                { id: 'smtpFromEmail', valor: smtpTestData.smtpFromEmail }
            ];
            
            let camposPreenchidos = 0;
            
            for (const preenchimento of preenchimentos) {
                try {
                    const elemento = await page.$(`#${preenchimento.id}`);
                    if (elemento) {
                        await page.evaluate((el) => {
                            el.value = '';
                            el.dispatchEvent(new Event('input', { bubbles: true }));
                        }, elemento);
                        
                        await page.type(`#${preenchimento.id}`, preenchimento.valor);
                        console.log(`  ✅ ${preenchimento.id}: ${preenchimento.valor}`);
                        camposPreenchidos++;
                    }
                } catch (error) {
                    console.log(`  ❌ Erro ao preencher ${preenchimento.id}: ${error.message}`);
                }
            }
            
            console.log(`\n📝 ${camposPreenchidos}/${preenchimentos.length} campos preenchidos`);
            
            // 8. SALVAR CONFIGURAÇÕES
            console.log('\n💾 Salvando configurações...');
            try {
                const saveButtonClicked = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const saveButton = buttons.find(btn => 
                        btn.textContent?.includes('Salvar') && 
                        btn.textContent?.includes('SMTP')
                    );
                    
                    if (saveButton) {
                        saveButton.click();
                        return true;
                    }
                    return false;
                });
                
                if (saveButtonClicked) {
                    console.log('✅ Botão salvar clicado');
                } else {
                    console.log('❌ Botão salvar não encontrado');
                }
                
                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch (error) {
                console.log(`❌ Erro ao salvar: ${error.message}`);
            }
            
            // 9. VERIFICAR PERSISTÊNCIA NO BANCO
            console.log('\n🔍 Verificando persistência no banco de dados...');
            
            const empresaData = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM empresas LIMIT 1', (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            let camposCorretos = 0;
            
            if (empresaData) {
                console.log('\n📊 Dados no banco:');
                console.log(`  🏠 SMTP Host: ${empresaData.smtp_host || 'NULL'}`);
                console.log(`  🔌 SMTP Port: ${empresaData.smtp_port || 'NULL'}`);
                console.log(`  👤 SMTP User: ${empresaData.smtp_user || 'NULL'}`);
                console.log(`  🔑 SMTP Password: ${empresaData.smtp_password ? '***DEFINIDA***' : 'NULL'}`);
                console.log(`  📝 From Name: ${empresaData.smtp_from_name || 'NULL'}`);
                console.log(`  📧 From Email: ${empresaData.smtp_from_email || 'NULL'}`);
                
                // Verificar correspondência
                const expectedValues = {
                    smtp_host: smtpTestData.smtpHost,
                    smtp_port: parseInt(smtpTestData.smtpPort),
                    smtp_user: smtpTestData.smtpUser,
                    smtp_password: smtpTestData.smtpPassword,
                    smtp_from_name: smtpTestData.smtpFromName,
                    smtp_from_email: smtpTestData.smtpFromEmail
                };
                
                console.log('\n✅ Verificação de correspondência:');
                
                for (const [campo, valorEsperado] of Object.entries(expectedValues)) {
                    const valorAtual = empresaData[campo];
                    const match = valorAtual == valorEsperado;
                    
                    if (match) {
                        console.log(`  ✅ ${campo}: ${valorAtual} (CORRETO)`);
                        camposCorretos++;
                    } else {
                        console.log(`  ❌ ${campo}: ${valorAtual} (esperado: ${valorEsperado})`);
                    }
                }
                
                console.log(`\n📊 Persistência: ${camposCorretos}/${Object.keys(expectedValues).length} campos corretos`);
            }
            
            // 10. ATUALIZAR PÁGINA E VERIFICAR INTERFACE
            console.log('\n🔄 Atualizando página para verificar persistência na interface...');
            await page.reload({ waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Ativar aba E-mail novamente
            await page.evaluate(() => {
                const emailTab = document.querySelector('button[value="email"]');
                if (emailTab) emailTab.click();
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verificar valores na interface
            console.log('\n🔍 Verificando valores na interface após reload...');
            let camposInterfaceCorretos = 0;
            
            for (const [campo, valorEsperado] of Object.entries({
                smtpHost: smtpTestData.smtpHost,
                smtpPort: smtpTestData.smtpPort,
                smtpUser: smtpTestData.smtpUser,
                smtpPassword: smtpTestData.smtpPassword,
                smtpFromName: smtpTestData.smtpFromName,
                smtpFromEmail: smtpTestData.smtpFromEmail
            })) {
                try {
                    const valorAtual = await page.$eval(`#${campo}`, el => el.value);
                    const match = valorAtual === valorEsperado;
                    
                    if (match) {
                        console.log(`  ✅ ${campo}: ${valorAtual} (CORRETO)`);
                        camposInterfaceCorretos++;
                    } else {
                        console.log(`  ❌ ${campo}: "${valorAtual}" (esperado: "${valorEsperado}")`);
                    }
                } catch (error) {
                    console.log(`  ❌ ${campo}: ERRO ao ler valor - ${error.message}`);
                }
            }
            
            console.log(`\n📊 Interface: ${camposInterfaceCorretos}/6 campos corretos após reload`);
            
            // 11. TESTAR CONEXÃO SMTP
            console.log('\n🧪 Testando conexão SMTP...');
            try {
                const testButtonClicked = await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const testButton = buttons.find(btn => 
                        btn.textContent?.includes('Testar') && 
                        btn.textContent?.includes('Conexão')
                    );
                    
                    if (testButton && !testButton.disabled) {
                        testButton.click();
                        return true;
                    }
                    return false;
                });
                
                if (testButtonClicked) {
                    console.log('✅ Botão testar conexão clicado');
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Aguardar teste
                    
                    // Verificar se apareceu alguma mensagem de sucesso/erro
                    const mensagem = await page.evaluate(() => {
                        const toasts = document.querySelectorAll('[data-sonner-toast]');
                        if (toasts.length > 0) {
                            const lastToast = toasts[toasts.length - 1];
                            return lastToast.textContent;
                        }
                        return null;
                    });
                    
                    if (mensagem) {
                        console.log(`📨 Resultado do teste: ${mensagem}`);
                    } else {
                        console.log('⚠️ Nenhuma mensagem de resultado encontrada');
                    }
                } else {
                    console.log('❌ Botão testar conexão não encontrado ou desabilitado');
                }
            } catch (error) {
                console.log(`❌ Erro ao testar conexão: ${error.message}`);
            }
        }
        
        // PONTUAÇÃO FINAL
        const pontuacaoTotal = Math.round(
            (camposEncontrados * 5) + // 5 pontos por campo encontrado
            (camposCorretos * 3) + // 3 pontos por campo salvo corretamente
            (camposInterfaceCorretos * 2) // 2 pontos por campo persistente na interface
        );
        
        console.log('\n🏆 RESULTADO FINAL:');
        console.log(`📋 Campos encontrados: ${camposEncontrados}/6`);
        console.log(`💾 Persistência banco: ${camposCorretos}/6`);
        console.log(`🔄 Persistência interface: ${camposInterfaceCorretos}/6`);
        console.log(`🎯 PONTUAÇÃO TOTAL: ${pontuacaoTotal}/60`);
        
        if (pontuacaoTotal >= 50) {
            console.log('🎉 TESTE PASSOU! Configuração SMTP funcionando corretamente.');
        } else if (pontuacaoTotal >= 30) {
            console.log('⚠️ TESTE PARCIAL. Algumas funcionalidades precisam de correção.');
        } else {
            console.log('❌ TESTE FALHOU. Configuração SMTP não está funcionando.');
        }
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    } finally {
        db.close();
        await browser.close();
    }
})();