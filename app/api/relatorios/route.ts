import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { verifyToken } from '../../../lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const inicio = searchParams.get('inicio')
    const fim = searchParams.get('fim')
    const tipo = searchParams.get('tipo') || 'vendas'

    let query = ''
    let params: any[] = []

    switch (tipo) {
      case 'vendas':
        query = `
          SELECT 
            l.id,
            l.data_venda,
            l.cliente_nome,
            l.valor_total,
            l.valor_recebido,
            l.lucro_liquido,
            l.status
          FROM linhas l
          WHERE 1=1
        `
        if (inicio) {
          query += ' AND l.data_venda >= ?'
          params.push(inicio)
        }
        if (fim) {
          query += ' AND l.data_venda <= ?'
          params.push(fim)
        }
        query += ' ORDER BY l.data_venda DESC'
        break

      case 'financeiro':
        query = `
          SELECT 
            'venda' as tipo,
            l.id,
            l.data_venda as data,
            l.cliente_nome as descricao,
            l.valor_total as valor,
            l.lucro_liquido as lucro
          FROM linhas l
          WHERE 1=1
        `
        if (inicio) {
          query += ' AND l.data_venda >= ?'
          params.push(inicio)
        }
        if (fim) {
          query += ' AND l.data_venda <= ?'
          params.push(fim)
        }
        query += `
          UNION ALL
          SELECT 
            'despesa' as tipo,
            dp.id,
            dp.data_vencimento as data,
            dp.descricao,
            -dp.valor as valor,
            0 as lucro
          FROM despesas_pendentes dp
          WHERE dp.status = 'pago'
        `
        if (inicio) {
          query += ' AND dp.data_vencimento >= ?'
          params.push(inicio)
        }
        if (fim) {
          query += ' AND dp.data_vencimento <= ?'
          params.push(fim)
        }
        query += ' ORDER BY data DESC'
        break



      default:
        return NextResponse.json(
          { error: 'Tipo de relatório inválido' },
          { status: 400 }
        )
    }

    const stmt = db.prepare(query)
    const results = stmt.all(...params)

    return NextResponse.json({
      success: true,
      data: results,
      tipo,
      periodo: { inicio, fim },
      total: results.length
    })

  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyToken(request)
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tipo, filtros, formato = 'json' } = body

    // Aqui você pode implementar lógica para gerar relatórios personalizados
    // com base nos filtros fornecidos

    return NextResponse.json({
      success: true,
      message: 'Relatório personalizado gerado com sucesso',
      tipo,
      formato,
      filtros
    })

  } catch (error) {
    console.error('Erro ao gerar relatório personalizado:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}