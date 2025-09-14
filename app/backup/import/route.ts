import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'

// Helper function to get current company ID from user preferences
function getCurrentCompanyId(): string | null {
  try {
    const row = db.prepare("SELECT json FROM user_prefs WHERE userId=?").get("default") as { json: string } | undefined
    if (!row) return null
    
    const prefs = JSON.parse(row.json)
    return prefs.currentEmpresaId || null
  } catch {
    return null
  }
}

// Helper function to validate backup data
function validateBackupData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!data) {
    errors.push('Dados de backup não encontrados')
    return { isValid: false, errors }
  }
  
  // Check if backup has any actual data
  const hasData = Object.keys(data).some(key => {
    if (key === 'config' || key === 'seqOrcamento') return false
    return Array.isArray(data[key]) && data[key].length > 0
  })
  
  if (!hasData) {
    errors.push('Backup não contém dados válidos para restaurar')
  }
  
  return { isValid: errors.length === 0, errors }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { merge = false, companySpecific = false } = body
    
    console.log('🔄 Iniciando importação de backup:', { merge, companySpecific, hasData: !!body.data })
    
    // Verificar se o body é um backup válido
    if (!body || !body.data || !body.version) {
      console.error('❌ Dados de backup inválidos')
      return NextResponse.json({ error: 'Dados de backup inválidos' }, { status: 400 })
    }
    
    const { data } = body
    
    // Validar dados do backup
    const validation = validateBackupData(data)
    if (!validation.isValid) {
      console.error('❌ Validação do backup falhou:', validation.errors)
      return NextResponse.json({ 
        error: 'Backup inválido: ' + validation.errors.join(', ') 
      }, { status: 400 })
    }
    
    const currentCompanyId = getCurrentCompanyId()
    console.log('🏢 Empresa atual:', currentCompanyId)
    
    // Iniciar transação para rollback em caso de erro
    const transaction = db.transaction(() => {
      // Se não for merge, limpar dados existentes
      if (!merge) {
        console.log('🗑️ Limpando dados existentes...')
        
        if (companySpecific && currentCompanyId) {
          // Limpeza específica por empresa
          console.log('🏢 Limpeza específica para empresa:', currentCompanyId)
          
          const companyTables = [
            { table: 'orcamento_itens', join: 'orcamentos', condition: 'empresa_id' },
            { table: 'orcamentos', condition: 'empresa_id' },
            { table: 'produtos', condition: 'empresa_id' },
            { table: 'clientes', condition: 'empresa_id' },
            { table: 'linhas_venda', condition: 'companyId' }
          ]
          
          for (const { table, join, condition } of companyTables) {
            try {
              if (join) {
                // Para tabelas que precisam de join
                const query = `DELETE FROM ${table} WHERE EXISTS (SELECT 1 FROM ${join} WHERE ${join}.id = ${table}.orcamento_id AND ${join}.${condition} = ?)`
                const result = db.prepare(query).run(currentCompanyId)
                console.log(`🗑️ ${table}: ${result.changes} registros removidos`)
              } else {
                // Para tabelas com referência direta
                const result = db.prepare(`DELETE FROM ${table} WHERE ${condition} = ?`).run(currentCompanyId)
                console.log(`🗑️ ${table}: ${result.changes} registros removidos`)
              }
            } catch (e) {
              console.warn(`⚠️ Erro ao limpar tabela ${table}:`, e)
            }
          }
        } else {
          // Limpeza completa (comportamento original, mas mais seguro)
          console.log('🗑️ Limpeza completa do sistema')
          
          const tables = [
            'orcamento_itens',
            'orcamentos', 
            'produtos',
            'clientes',
            'linhas_venda',
            'acertos',
            'participantes',
            'despesas_pendentes',
            'modalidades',
            'taxas',
            'outros_negocios'
          ]
          
          for (const table of tables) {
            try {
              const result = db.prepare(`DELETE FROM ${table}`).run()
              console.log(`🗑️ ${table}: ${result.changes} registros removidos`)
            } catch (e) {
              console.warn(`⚠️ Tabela ${table} não existe:`, e)
            }
          }
          
          // Tentar deletar tabelas opcionais que podem não existir
          const optionalTables = ['pagamentos_parciais', 'vale_movimentos']
          for (const table of optionalTables) {
            try {
              const result = db.prepare(`DELETE FROM ${table}`).run()
              console.log(`🗑️ ${table} (opcional): ${result.changes} registros removidos`)
            } catch (e) {
              console.warn(`⚠️ Tabela opcional ${table} não existe:`, e)
            }
          }
          
          // Limpar empresas apenas se houver dados de empresas no backup
          if (data.empresas && data.empresas.length > 0) {
            const result = db.prepare('DELETE FROM empresas').run()
            console.log(`🗑️ empresas: ${result.changes} registros removidos`)
          }
        }
      }
    
      // Função helper para inserir dados com padronização de colunas
      const insertData = (tableName: string, records: Record<string, unknown>[]) => {
        if (!records || records.length === 0) {
          console.log(`📝 ${tableName}: Nenhum dado para inserir`)
          return
        }
        
        console.log(`📝 Inserindo ${records.length} registros na tabela ${tableName}`)
        
        const firstRecord = records[0]
        let columns = Object.keys(firstRecord)
        
        // Padronizar nomes de colunas para compatibilidade
        const columnMapping: Record<string, string> = {
          'createdAt': 'created_at',
          'updatedAt': 'updated_at',
          'companyId': 'empresa_id'
        }
        
        // Mapear dados para usar nomes de colunas padronizados
        const normalizedRecords = records.map(record => {
          const normalized: Record<string, unknown> = {}
          for (const [key, value] of Object.entries(record)) {
            const normalizedKey = columnMapping[key] || key
            normalized[normalizedKey] = value
          }
          return normalized
        })
        
        // Usar colunas do primeiro registro normalizado
        columns = Object.keys(normalizedRecords[0])
        const placeholders = columns.map(() => '?').join(', ')
        const columnNames = columns.join(', ')
        
        const stmt = db.prepare(`INSERT OR REPLACE INTO ${tableName} (${columnNames}) VALUES (${placeholders})`)
        
        let insertedCount = 0
        let errorCount = 0
        
        for (const record of normalizedRecords) {
          const values = columns.map(col => record[col])
          try {
            stmt.run(...values)
            insertedCount++
          } catch (error) {
            errorCount++
            console.warn(`⚠️ Erro ao inserir registro na tabela ${tableName}:`, error)
            console.warn('📄 Dados do registro:', record)
          }
        }
        
        console.log(`✅ ${tableName}: ${insertedCount} inseridos, ${errorCount} erros`)
      }
    
       // Importar dados na ordem correta (respeitando dependências)
       console.log('📥 Iniciando importação de dados...')
       
       if (data.empresas) insertData('empresas', data.empresas)
       if (data.clientes) insertData('clientes', data.clientes)
       if (data.produtos) insertData('produtos', data.produtos)
       if (data.orcamentos) {
         console.log('🔍 Debug Orçamentos antes da importação:')
         data.orcamentos.slice(0, 3).forEach((orc: any, idx: number) => {
           console.log(`  Orçamento ${idx + 1}: ID=${orc.id}, Empresa=${orc.empresa_id}, Total=${orc.total}`)
         })
         insertData('orcamentos', data.orcamentos)
       }
       
       if (data.orcamentoItens) {
         console.log('🔍 Debug Itens de Orçamento antes da importação:')
         data.orcamentoItens.slice(0, 5).forEach((item: any, idx: number) => {
           console.log(`  Item ${idx + 1}: ID=${item.id}, Orçamento=${item.orcamento_id}, Produto=${item.produto_nome}, Qtd=${item.quantidade}, Valor=${item.valor_unitario}`)
         })
         insertData('orcamento_itens', data.orcamentoItens)
       }
       if (data.linhasVenda) insertData('linhas_venda', data.linhasVenda)
       if (data.acertos) insertData('acertos', data.acertos)
       if (data.participantes) insertData('participantes', data.participantes)
       if (data.despesasPendentes) insertData('despesas_pendentes', data.despesasPendentes)
       if (data.modalidades) insertData('modalidades', data.modalidades)
       if (data.taxas) insertData('taxas', data.taxas)
       if (data.outrosNegocios) insertData('outros_negocios', data.outrosNegocios)
       if (data.pagamentosParciais) insertData('pagamentos_parciais', data.pagamentosParciais)
       if (data.valeMovimentos) insertData('vale_movimentos', data.valeMovimentos)
       
       // Importar preferências do usuário
       if (data.userPrefs) {
         console.log(`📝 Importando ${data.userPrefs.length} preferências de usuário`)
         for (const pref of data.userPrefs) {
           try {
             db.prepare('INSERT OR REPLACE INTO user_prefs (userId, json) VALUES (?, ?)').run(
               pref.userId,
               pref.json
             )
           } catch (error) {
             console.warn('⚠️ Erro ao importar preferência:', error)
           }
         }
       }
       
       // Restaurar configuração da empresa atual se disponível
       if (data.config && data.config.currentEmpresaId) {
         console.log('🏢 Restaurando configuração da empresa:', data.config.currentEmpresaId)
         const currentPrefs = {
           currentEmpresaId: data.config.currentEmpresaId
         }
         
         try {
           db.prepare('INSERT OR REPLACE INTO user_prefs (userId, json) VALUES (?, ?)').run(
             'default',
             JSON.stringify(currentPrefs)
           )
         } catch (error) {
           console.warn('⚠️ Erro ao restaurar configuração da empresa:', error)
         }
       }
       
       console.log('✅ Importação concluída com sucesso')
     })
     
     // Executar transação
     try {
       transaction()
       console.log('💾 Transação executada com sucesso')
     } catch (error) {
       console.error('❌ Erro na transação, fazendo rollback:', error)
       throw error
     }
    
    return NextResponse.json({ 
      success: true, 
      message: merge ? 'Dados mesclados com sucesso' : 'Backup restaurado com sucesso'
    })
    
  } catch (error) {
    console.error('Error importing backup:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}