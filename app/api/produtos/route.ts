import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../lib/db'
import { uid } from '../../../lib/util'

export async function GET() {
  try {
    const produtos = db.prepare(`
      SELECT 
        id,
        nome,
        descricao,
        marca,
        preco,
        custo,
        taxa_imposto as taxaImposto,
        modalidade_venda as modalidadeVenda,
        estoque,
        link_ref as linkRef,
        custo_ref as custoRef,
        categoria,
        created_at as createdAt,
        updated_at as updatedAt
      FROM produtos 
      ORDER BY created_at DESC
    `).all()
    return NextResponse.json(produtos)
  } catch (error) {
    console.error('Error fetching produtos:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { 
      nome, 
      descricao, 
      marca, 
      precoVenda, 
      custo, 
      taxaImposto, 
      modalidadeVenda, 
      estoque, 
      linkRef, 
      custoRef, 
      categoria 
    } = await request.json()
    
    const id = uid()
    
    db.prepare(`
      INSERT INTO produtos (
        id, nome, descricao, marca, preco, custo, taxa_imposto, 
        modalidade_venda, estoque, link_ref, custo_ref, categoria, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      nome,
      descricao,
      marca,
      precoVenda,
      custo || 0,
      taxaImposto || 0,
      modalidadeVenda,
      estoque || 0,
      linkRef,
      custoRef,
      categoria || null,
      new Date().toISOString()
    )
    
    return NextResponse.json({ 
      id, nome, descricao, marca, precoVenda, custo, taxaImposto, 
      modalidadeVenda, estoque, linkRef, custoRef, categoria 
    })
  } catch (error) {
    console.error('Error creating produto:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}