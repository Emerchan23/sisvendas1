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
    
    // Dados de outros negócios e cálculo de juros pendentes
    let outrosNegociosData = { receitasOutros: 0, despesasOutros: 0 }
    let jurosPendentes = 0
    try {
      outrosNegociosData = db.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN tipo = 'venda' THEN valor ELSE 0 END), 0) as receitasOutros,
      COALESCE(SUM(CASE WHEN tipo = 'emprestimo' THEN valor ELSE 0 END), 0) as despesasOutros
        FROM outros_negocios 
        WHERE status = 'ativo'
      `).get() as { receitasOutros: number; despesasOutros: number }
      
      // Calcular juros pendentes dos outros negócios
      const outrosNegocios = db.prepare(`
        SELECT id, valor, data_transacao, juros_ativo, juros_mes_percent, multa_ativa, multa_percent
        FROM outros_negocios 
        WHERE status = 'ativo' AND juros_ativo = 1
      `).all() as Array<{
        id: string;
        valor: number;
        data_transacao: string;
        juros_ativo: number;
        juros_mes_percent: number;
        multa_ativa: number;
        multa_percent: number;
      }>
      
      const hoje = new Date().toISOString().split('T')[0]
      
      for (const negocio of outrosNegocios) {
        try {
          // Calcular juros compostos simples (sem pagamentos parciais por enquanto)
          const taxaJuros = negocio.juros_mes_percent / 100
          const meses = calcularMesesCompletos(negocio.data_transacao, hoje)
          
          if (meses > 0 && taxaJuros > 0) {
            const jurosCalculados = negocio.valor * Math.pow(1 + taxaJuros, meses) - negocio.valor
            jurosPendentes += jurosCalculados
          }
          
          // Adicionar multa se aplicável
          if (negocio.multa_ativa && negocio.multa_percent > 0 && meses > 0) {
            const multa = negocio.valor * (negocio.multa_percent / 100)
            jurosPendentes += multa
          }
        } catch (err) {
          console.warn(`Erro ao calcular juros para negócio ${negocio.id}:`, err)
        }
      }
    } catch (e) {
      console.warn('Erro ao calcular dados de outros negócios:', e)
    }
    
    // Função auxiliar para calcular meses completos
    function calcularMesesCompletos(dataInicio: string, dataFim: string): number {
      const inicio = new Date(dataInicio)
      const fim = new Date(dataFim)
      if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) return 0
      
      let meses = (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth())
      if (fim.getDate() < inicio.getDate()) meses -= 1
      return Math.max(0, meses)
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
      jurosPendentes: Math.round(jurosPendentes),
      totalVendas: vendasData.totalVendas + linhasVendaData.totalLinhas,
      pendentes: linhasVendaData.pendentes + orcamentosData.orcamentosPendentes,
    }
    
    return NextResponse.json(totals)
  } catch (error) {
    console.error('Error fetching dashboard totals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}