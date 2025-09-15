import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    
    switch (tipo) {
      case 'dashboard':
        // Dados consolidados para o dashboard
        const totalVendas = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as total FROM vendas').get() as { count: number; total: number }
        const totalClientes = db.prepare('SELECT COUNT(*) as count FROM clientes').get() as { count: number }
        // Produtos removidos do sistema
        const totalProdutos = { count: 0 }
        
        // Vendas por mês (últimos 6 meses)
        const vendasMensais = db.prepare(`
          SELECT 
            strftime('%Y-%m', data_venda) as mes,
            COUNT(*) as quantidade,
            COALESCE(SUM(total), 0) as valor
          FROM vendas 
          WHERE data_venda >= date('now', '-6 months')
          GROUP BY strftime('%Y-%m', data_venda)
          ORDER BY mes
        `).all()
        
        return NextResponse.json({
          totais: {
            vendas: totalVendas.count,
            valorVendas: totalVendas.total,
            clientes: totalClientes.count,
            // produtos: totalProdutos.count // Removido
          },
          vendasMensais
        })
        
      case 'relatorios':
        // Dados para relatórios
        // Produtos removidos do sistema
        const produtosMaisVendidos = []
        
        const clientesAtivos = db.prepare(`
          SELECT 
            c.nome,
            COUNT(v.id) as total_compras,
            COALESCE(SUM(v.total), 0) as valor_total
          FROM clientes c
          LEFT JOIN vendas v ON c.id = v.cliente_id
          GROUP BY c.id, c.nome
          HAVING total_compras > 0
          ORDER BY valor_total DESC
          LIMIT 10
        `).all()
        
        return NextResponse.json({
          // produtosMaisVendidos, // Removido
          clientesAtivos
        })
        
      default:
        // Dados gerais
        const empresas = db.prepare('SELECT * FROM empresas ORDER BY nome').all()
        const clientes = db.prepare('SELECT * FROM clientes ORDER BY nome').all()

        
        return NextResponse.json({
          empresas,
          clientes
        })
    }
  } catch (error) {
    console.error('Error fetching dados:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}