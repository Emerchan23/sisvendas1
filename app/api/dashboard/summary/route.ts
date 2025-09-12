import { NextResponse } from 'next/server'
import { db } from '../../../../lib/db'

export async function GET() {
  try {
    // Calcular contadores reais baseado nas tabelas de dados
    
    // Contadores básicos
    const clientesCount = db.prepare("SELECT COUNT(*) as count FROM clientes").get() as { count: number }
    const produtosCount = db.prepare("SELECT COUNT(*) as count FROM produtos").get() as { count: number }
    
    // Contadores de linhas de venda pagas (pedidos concluídos)
    const linhasPagas = db.prepare(`
      SELECT COUNT(*) as count 
      FROM linhas_venda 
      WHERE paymentStatus = 'Pago'
    `).get() as { count: number }
    
    // Contadores de orçamentos
    const orcamentosData = db.prepare(`
      SELECT 
        COUNT(*) as totalOrcamentos,
        COUNT(CASE WHEN status = 'pendente' THEN 1 END) as orcamentosPendentes
      FROM orcamentos
    `).get() as { totalOrcamentos: number; orcamentosPendentes: number }
    
    // Contadores de linhas de venda pendentes
    const linhasPendentes = db.prepare(`
      SELECT COUNT(*) as count 
      FROM linhas_venda 
      WHERE paymentStatus = 'PENDENTE'
    `).get() as { count: number }
    
    // Total de pedidos concluídos = apenas linhas de venda pagas (vendas concluídas)
    // Pedidos pendentes = apenas linhas de venda pendentes (vendas pendentes)
    const totalPedidos = linhasPagas.count
    const pedidosPendentes = linhasPendentes.count
    
    const summary = {
      totalClientes: clientesCount.count,
      totalProdutos: produtosCount.count,
      totalPedidos,
      pedidosPendentes,
      orcamentosAprovados: orcamentosData.totalOrcamentos - orcamentosData.orcamentosPendentes,
      orcamentosPendentes: orcamentosData.orcamentosPendentes,
    }
    
    return NextResponse.json(summary)
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}