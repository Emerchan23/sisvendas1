import { NextResponse } from 'next/server'
import { db } from '../../../lib/db'

export async function POST() {
  try {
    // Buscar a taxa de imposto padrão configurada no sistema
    const taxaImpostoConfig = db.prepare(`
      SELECT percentual 
      FROM taxas 
      WHERE tipo = 'imposto' AND ativo = 1 
      ORDER BY id DESC 
      LIMIT 1
    `).get() as { percentual: number } | undefined

    if (!taxaImpostoConfig) {
      return NextResponse.json({ error: 'Nenhuma taxa de imposto configurada' }, { status: 400 })
    }

    const taxaPadrao = taxaImpostoConfig.percentual

    // Buscar todas as vendas que têm taxaImpostoVl = 0 ou taxaImpostoPerc = 0
    const vendasParaAtualizar = db.prepare(`
      SELECT id, valorVenda, taxaImpostoPerc, taxaImpostoVl
      FROM linhas_venda 
      WHERE (taxaImpostoVl = 0 OR taxaImpostoVl IS NULL) 
         OR (taxaImpostoPerc = 0 OR taxaImpostoPerc IS NULL)
    `).all() as Array<{
      id: string
      valorVenda: number
      taxaImpostoPerc: number
      taxaImpostoVl: number
    }>

    let atualizadas = 0

    // Atualizar cada venda
    const updateStmt = db.prepare(`
      UPDATE linhas_venda 
      SET taxaImpostoPerc = ?, taxaImpostoVl = ?
      WHERE id = ?
    `)

    for (const venda of vendasParaAtualizar) {
      // Usar a taxa configurada se não houver taxa específica
      const taxaPerc = venda.taxaImpostoPerc > 0 ? venda.taxaImpostoPerc : taxaPadrao
      const taxaVl = (venda.valorVenda * taxaPerc) / 100

      updateStmt.run(taxaPerc, taxaVl, venda.id)
      atualizadas++
    }

    return NextResponse.json({
      message: `${atualizadas} vendas foram atualizadas com as taxas de imposto`,
      taxaAplicada: taxaPadrao,
      vendasAtualizadas: atualizadas
    })

  } catch (error) {
    console.error('Erro ao recalcular impostos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}