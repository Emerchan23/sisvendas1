import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('DELETE orçamento - ID recebido:', id);
    
    if (!id) {
      console.log('DELETE orçamento - ID não fornecido');
      return NextResponse.json(
        { error: 'ID é obrigatório para exclusão' },
        { status: 400 }
      );
    }
    
    // Check if orcamento exists
    console.log('DELETE orçamento - Verificando se orçamento existe...');
    const orcamento = db.prepare('SELECT id FROM orcamentos WHERE id = ?').get(id);
    console.log('DELETE orçamento - Resultado da busca:', orcamento);
    
    if (!orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o orçamento tem itens associados
    console.log('DELETE orçamento - Verificando itens relacionados...');
    const itensRelacionados = db.prepare(`
      SELECT COUNT(*) as count 
      FROM orcamento_itens 
      WHERE orcamento_id = ?
    `).get(id) as { count: number }
    
    console.log(`DELETE orçamento - ${id}: ${itensRelacionados.count} itens encontrados`);
    
    // Note: As tabelas vendas e acertos não possuem referência direta ao orçamento
    // baseado no esquema atual do banco de dados
    
    // Delete items first (foreign key constraint)
    console.log('DELETE orçamento - Excluindo itens do orçamento...');
    const deleteItensResult = db.prepare('DELETE FROM orcamento_itens WHERE orcamento_id = ?').run(id);
    console.log('DELETE orçamento - Itens excluídos:', deleteItensResult.changes);
    
    // Delete orcamento
    console.log('DELETE orçamento - Excluindo orçamento...');
    const result = db.prepare('DELETE FROM orcamentos WHERE id = ?').run(id);
    console.log('DELETE orçamento - Resultado da exclusão:', result);
    
    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Falha ao excluir orçamento' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Orçamento excluído com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório para atualização' },
        { status: 400 }
      );
    }
    
    // Check if orcamento exists
    const orcamento = db.prepare('SELECT id FROM orcamentos WHERE id = ?').get(id);
    
    if (!orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }
    
    // Build update query dynamically, filtering valid columns
    const validColumns = ['numero', 'cliente_id', 'data_orcamento', 'data_validade', 'valor_total', 'descricao', 'observacoes', 'condicoes_pagamento', 'prazo_entrega', 'vendedor_id', 'desconto', 'status'];
    const filteredBody = Object.fromEntries(
      Object.entries(body).filter(([key]) => validColumns.includes(key))
    );
    
    const fields = Object.keys(filteredBody).map(key => `${key} = ?`).join(', ');
    const values = Object.values(filteredBody);
    values.push(id);
    
    if (fields) {
      db.prepare(
        `UPDATE orcamentos SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(...values);
    }
    
    // Handle itens separately if provided
    if (body.itens && Array.isArray(body.itens)) {
      // Delete existing items
      db.prepare('DELETE FROM orcamento_itens WHERE orcamento_id = ?').run(id);
      
      // Insert new items
      for (const item of body.itens) {
        const itemId = require('uuid').v4();
        const valorTotalItem = item.quantidade * item.valor_unitario;
        
        db.prepare(
          `INSERT INTO orcamento_itens (
            id, orcamento_id, produto_id, descricao, marca, quantidade,
            valor_unitario, valor_total, observacoes, link_ref, custo_ref
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(itemId, id, item.produto_id, item.descricao, item.marca, item.quantidade,
           item.valor_unitario, valorTotalItem, item.observacoes, item.link_ref, item.custo_ref);
      }
    }
    
    return NextResponse.json({ ok: true, message: 'Orçamento atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }
    
    // Get orcamento with items
    const orcamento = db.prepare(`
      SELECT * FROM orcamentos WHERE id = ?
    `).get(id);
    
    if (!orcamento) {
      return NextResponse.json(
        { error: 'Orçamento não encontrado' },
        { status: 404 }
      );
    }
    
    // Get items
    const itens = db.prepare(`
      SELECT * FROM orcamento_itens WHERE orcamento_id = ?
    `).all(id);
    
    return NextResponse.json({
      ...orcamento,
      itens
    });
  } catch (error) {
    console.error('Erro ao buscar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}