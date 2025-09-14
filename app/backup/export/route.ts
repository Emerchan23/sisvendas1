import { NextResponse } from 'next/server'
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

export async function GET() {
  try {
    const companyId = getCurrentCompanyId()
    console.log('📤 Iniciando exportação de backup para empresa:', companyId || 'TODAS')
    
    // Buscar todos os dados do sistema
    const empresas = db.prepare("SELECT * FROM empresas ORDER BY created_at DESC").all()
    const clientes = companyId 
      ? db.prepare("SELECT * FROM clientes WHERE empresa_id = ? ORDER BY created_at DESC").all(companyId)
      : db.prepare("SELECT * FROM clientes ORDER BY created_at DESC").all()
    const produtos = companyId
      ? db.prepare("SELECT * FROM produtos WHERE empresa_id = ? ORDER BY created_at DESC").all(companyId)
      : db.prepare("SELECT * FROM produtos ORDER BY created_at DESC").all()
    const orcamentos = companyId
      ? db.prepare("SELECT * FROM orcamentos WHERE empresa_id = ? ORDER BY created_at DESC").all(companyId)
      : db.prepare("SELECT * FROM orcamentos ORDER BY created_at DESC").all()
    const orcamentoItens = companyId
      ? db.prepare("SELECT oi.* FROM orcamento_itens oi INNER JOIN orcamentos o ON oi.orcamento_id = o.id WHERE o.empresa_id = ? ORDER BY oi.created_at DESC").all(companyId)
      : db.prepare("SELECT * FROM orcamento_itens ORDER BY created_at DESC").all()
    // Buscar dados das tabelas que existem, com tratamento de erro para tabelas que podem não existir
    let linhasVenda: Record<string, unknown>[] = []
    try {
      // Tentar primeiro com empresa_id (padrão), depois com companyId (legado)
      linhasVenda = companyId
        ? (() => {
            try {
              return db.prepare("SELECT * FROM linhas_venda WHERE empresa_id = ? ORDER BY created_at DESC").all(companyId) as Record<string, unknown>[]
            } catch {
              return db.prepare("SELECT * FROM linhas_venda WHERE companyId = ? ORDER BY createdAt DESC").all(companyId) as Record<string, unknown>[]
            }
          })()
        : (() => {
            try {
              return db.prepare("SELECT * FROM linhas_venda ORDER BY created_at DESC").all() as Record<string, unknown>[]
            } catch {
              return db.prepare("SELECT * FROM linhas_venda ORDER BY createdAt DESC").all() as Record<string, unknown>[]
            }
          })()
    } catch (e) {
      console.warn('Tabela linhas_venda não existe:', e)
    }
    
    let acertos: Record<string, unknown>[] = []
    try {
      acertos = db.prepare("SELECT * FROM acertos ORDER BY created_at DESC").all() as Record<string, unknown>[]
    } catch (e) {
      console.warn('Tabela acertos não existe:', e)
    }
    
    let participantes: Record<string, unknown>[] = []
    try {
      participantes = db.prepare("SELECT * FROM participantes ORDER BY created_at DESC").all() as Record<string, unknown>[]
    } catch (e) {
      console.warn('Tabela participantes não existe:', e)
    }
    
    let despesasPendentes: Record<string, unknown>[] = []
    try {
      despesasPendentes = db.prepare("SELECT * FROM despesas_pendentes ORDER BY created_at DESC").all() as Record<string, unknown>[]
    } catch (e) {
      console.warn('Tabela despesas_pendentes não existe:', e)
    }
    
    let modalidades: Record<string, unknown>[] = []
    try {
      modalidades = db.prepare("SELECT * FROM modalidades ORDER BY created_at DESC").all() as Record<string, unknown>[]
    } catch (e) {
      console.warn('Tabela modalidades não existe:', e)
    }
    
    let taxas: Record<string, unknown>[] = []
    try {
      taxas = db.prepare("SELECT * FROM taxas ORDER BY created_at DESC").all() as Record<string, unknown>[]
    } catch (e) {
      console.warn('Tabela taxas não existe:', e)
    }
    
    let outrosNegocios: Record<string, unknown>[] = []
    try {
      outrosNegocios = db.prepare("SELECT * FROM outros_negocios ORDER BY created_at DESC").all() as Record<string, unknown>[]
    } catch (e) {
      console.warn('Tabela outros_negocios não existe:', e)
    }
    
    let pagamentosParciais: Record<string, unknown>[] = []
    try {
      pagamentosParciais = db.prepare("SELECT * FROM pagamentos_parciais ORDER by created_at DESC").all() as Record<string, unknown>[]
    } catch (e) {
      console.warn('Tabela pagamentos_parciais não existe:', e)
    }
    
    let valeMovimentos: Record<string, unknown>[] = []
    try {
      valeMovimentos = db.prepare("SELECT * FROM vale_movimentos ORDER BY created_at DESC").all() as Record<string, unknown>[]
    } catch (e) {
      console.warn('Tabela vale_movimentos não existe:', e)
    }
    const userPrefs = db.prepare("SELECT * FROM user_prefs").all()
    
    // Log dos dados coletados
    console.log('📊 Dados coletados para backup:')
    console.log(`  - Empresas: ${empresas.length}`)
    console.log(`  - Clientes: ${clientes.length}`)
    console.log(`  - Produtos: ${produtos.length}`)
    console.log(`  - Orçamentos: ${orcamentos.length}`)
    console.log(`  - Itens de Orçamento: ${orcamentoItens.length}`)
    
    // Debug específico para orçamentos
    if (orcamentos.length > 0) {
      console.log('🔍 Debug Orçamentos:')
      orcamentos.slice(0, 3).forEach((orc: any, idx: number) => {
        console.log(`  Orçamento ${idx + 1}: ID=${orc.id}, Empresa=${orc.empresa_id}, Total=${orc.total}`)
      })
    }
    
    if (orcamentoItens.length > 0) {
      console.log('🔍 Debug Itens de Orçamento:')
      orcamentoItens.slice(0, 5).forEach((item: any, idx: number) => {
        console.log(`  Item ${idx + 1}: ID=${item.id}, Orçamento=${item.orcamento_id}, Produto=${item.produto_nome}, Qtd=${item.quantidade}, Valor=${item.valor_unitario}`)
      })
    }
    console.log(`  - Linhas de Venda: ${linhasVenda.length}`)
    console.log(`  - Acertos: ${acertos.length}`)
    console.log(`  - Participantes: ${participantes.length}`)
    console.log(`  - Despesas Pendentes: ${despesasPendentes.length}`)
    console.log(`  - Modalidades: ${modalidades.length}`)
    console.log(`  - Taxas: ${taxas.length}`)
    console.log(`  - Outros Negócios: ${outrosNegocios.length}`)
    console.log(`  - Pagamentos Parciais: ${pagamentosParciais.length}`)
    console.log(`  - Vale Movimentos: ${valeMovimentos.length}`)
    console.log(`  - Preferências: ${userPrefs.length}`)
    
    // Criar payload de backup
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      companyId,
      data: {
        empresas,
        clientes,
        produtos,
        orcamentos,
        orcamentoItens,
        linhasVenda,
        acertos,
        participantes,
        despesasPendentes,
        modalidades,
        taxas,
        outrosNegocios,
        pagamentosParciais,
        valeMovimentos,
        userPrefs,
        // Configurações da empresa atual
        config: companyId ? {
          currentEmpresaId: companyId
        } : {},
        // Sequência de orçamentos (se existir)
        seqOrcamento: orcamentos.length > 0 ? Math.max(...(orcamentos as Record<string, unknown>[]).map((o: Record<string, unknown>) => (o.numero as number) || 0)) : 0
      }
    }
    
    return NextResponse.json(backup)
  } catch (error) {
    console.error('Error exporting backup:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}