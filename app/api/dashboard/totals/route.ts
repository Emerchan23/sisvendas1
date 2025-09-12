import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db'

export async function GET() {
  try {
    // Calcular totais reais baseado nas tabelas de dados
    
    // Dados das vendas tradicionais
    const vendasData = db.prepare(`
      SELECT 
        COUNT(*) as totalVendas,
        COALESCE(SUM(total), 0) as valorTotalVendas
      FROM vendas
    `).get() as { totalVendas: number; valorTotalVendas: number }
    
    // Dados das linhas de venda (planilha)
    const linhasVendaData = db.prepare(`
      SELECT 
        COUNT(*) as totalLinhas,
        COALESCE(SUM(valorVenda), 0) as valorTotalLinhas,
        COALESCE(SUM(lucroValor), 0) as lucroTotalLinhas,
        COALESCE(SUM(taxaImpostoVl), 0) as impostosTotalLinhas,
        COUNT(CASE WHEN paymentStatus = 'Pago' THEN 1 END) as recebidas,
        COUNT(CASE WHEN paymentStatus = 'PENDENTE' THEN 1 END) as pendentes,
        COALESCE(SUM(CASE WHEN paymentStatus = 'Pago' THEN valorVenda ELSE 0 END), 0) as valorRecebido
      FROM linhas_venda
    `).get() as { 
      totalLinhas: number; 
      valorTotalLinhas: number; 
      lucroTotalLinhas: number; 
      impostosTotalLinhas: number;
      recebidas: number;
      pendentes: number;
      valorRecebido: number;
    }
    
    // Dados de outros negócios
    let outrosNegociosData = { receitasOutros: 0, despesasOutros: 0 }
    try {
      outrosNegociosData = db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as receitasOutros,
          COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as despesasOutros
        FROM outros_negocios 
        WHERE status = 'ativo'
      `).get() as { receitasOutros: number; despesasOutros: number }
    } catch (e) {
      console.warn('Tabela outros_negocios não existe:', e)
    }
    
    // Dados de orçamentos
    const orcamentosData = db.prepare(`
      SELECT 
        COUNT(*) as totalOrcamentos,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as orcamentosPendentes
      FROM orcamentos
    `).get() as { totalOrcamentos: number; orcamentosPendentes: number }
    
    // Dados de despesas dos acertos para calcular lucro líquido
    let totalDespesasAcertos = 0
    try {
      const despesasAcertosData = db.prepare(`
        SELECT 
          COALESCE(SUM(totalDespesasRateio), 0) + COALESCE(SUM(totalDespesasIndividuais), 0) as totalDespesas
        FROM acertos
      `).get() as { totalDespesas: number }
      totalDespesasAcertos = despesasAcertosData.totalDespesas
    } catch (e) {
      console.warn('Tabela acertos não existe:', e)
    }
    
    // Calcular totais consolidados
    const valorTotalRecebido = linhasVendaData.valorRecebido || 0
    const valorTotalAReceber = linhasVendaData.valorTotalLinhas - valorTotalRecebido
    const lucroLiquido = linhasVendaData.lucroTotalLinhas - totalDespesasAcertos - outrosNegociosData.despesasOutros
    
    const totals = {
      totalRecebido: Math.round(valorTotalRecebido + outrosNegociosData.receitasOutros),
      totalAReceber: Math.round(valorTotalAReceber),
      lucroTotal: Math.round(linhasVendaData.lucroTotalLinhas),
      lucroLiquido: Math.round(lucroLiquido),
      impostosTotais: Math.round(linhasVendaData.impostosTotalLinhas),
      totalVendas: vendasData.totalVendas + linhasVendaData.totalLinhas,
      pendentes: linhasVendaData.pendentes + orcamentosData.orcamentosPendentes,
    }
    
    return NextResponse.json(totals)
  } catch (error) {
    console.error('Error fetching dashboard totals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}