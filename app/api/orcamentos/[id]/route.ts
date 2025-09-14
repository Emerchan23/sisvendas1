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
    
    console.log('🔍 [API] PATCH recebido para ID:', id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório para atualização' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('🔍 [API] Body da requisição:', JSON.stringify(body, null, 2));
    console.log('🔍 [API] Tipo do body:', typeof body);
    console.log('🔍 [API] Keys do body:', Object.keys(body));
    
    // Check if orcamento exists
    const orcamento = db.prepare('SELECT id FROM orcamentos WHERE id = ?').get(id);
    
    console.log('🔍 [API] Orçamento encontrado no banco:', !!orcamento);
    console.log('🔍 [API] Dados do orçamento existente:', orcamento);
    
    if (!orcamento) {
      console.log('❌ [API] Orçamento não encontrado para ID:', id);
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
      console.log('🔍 [API] Processando', body.itens.length, 'itens');
      
      // Delete existing items
      console.log('🔍 [API] Deletando itens existentes...');
      const deleteResult = db.prepare('DELETE FROM orcamento_itens WHERE orcamento_id = ?').run(id);
      console.log('🔍 [API] Itens deletados:', deleteResult.changes);
      
      // Insert new items
      console.log('🔍 [API] Inserindo novos itens...');
      for (let i = 0; i < body.itens.length; i++) {
        const item = body.itens[i];
        console.log(`🔍 [API] Processando item ${i + 1}:`, JSON.stringify(item, null, 2));
        
        try {
          const itemId = require('uuid').v4();
          const valorTotalItem = (item.quantidade || 0) * (item.valor_unitario || 0);
          
          console.log('🔍 [API] Dados para inserção:', {
            itemId,
            orcamento_id: id,
            produto_id: item.produto_id || null,
            descricao: item.descricao || '',
            marca: item.marca || '',
            quantidade: item.quantidade || 0,
            valor_unitario: item.valor_unitario || 0,
            valor_total: valorTotalItem,
            observacoes: item.observacoes || '',
            link_ref: item.link_ref || '',
            custo_ref: item.custo_ref || 0
          });
          
          const insertResult = db.prepare(
            `INSERT INTO orcamento_itens (
              id, orcamento_id, produto_id, descricao, marca, quantidade,
              valor_unitario, valor_total, observacoes, link_ref, custo_ref
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).run(
            itemId, 
            id, 
            item.produto_id || null, 
            item.descricao || '', 
            item.marca || '', 
            item.quantidade || 0,
            item.valor_unitario || 0, 
            valorTotalItem, 
            item.observacoes || '', 
            item.link_ref || '', 
            item.custo_ref || 0
          );
          
          console.log(`✅ [API] Item ${i + 1} inserido com sucesso:`, insertResult.changes);
        } catch (itemError) {
          console.error(`❌ [API] Erro ao inserir item ${i + 1}:`, itemError);
          console.error('❌ [API] Stack trace do item:', itemError instanceof Error ? itemError.stack : 'N/A');
          throw itemError; // Re-throw para ser capturado pelo catch principal
        }
      }
      console.log('✅ [API] Todos os itens processados com sucesso');
    }
    
    console.log('✅ [API] Orçamento atualizado com sucesso');
    return NextResponse.json({ ok: true, message: 'Orçamento atualizado com sucesso' });
  } catch (error) {
    console.error('❌ [API] Erro ao atualizar orçamento:', error);
    console.error('❌ [API] Stack trace completo:', error instanceof Error ? error.stack : 'N/A');
    console.error('❌ [API] Mensagem do erro:', error instanceof Error ? error.message : String(error));
    console.error('❌ [API] Tipo do erro:', typeof error);
    
    // Log adicional para debugging
    if (error instanceof Error) {
      console.error('❌ [API] Nome do erro:', error.name);
      console.error('❌ [API] Causa do erro:', error.cause);
    }
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.name : typeof error
      },
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
    
    console.log('🔍 [API] GET recebido para ID:', id);
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório' },
        { status: 400 }
      );
    }
    
    // Primeiro, vamos ver todos os orçamentos no banco
    const allOrcamentos = db.prepare('SELECT id, numero FROM orcamentos LIMIT 10').all();
    console.log('🔍 [API] Orçamentos no banco:', allOrcamentos);
    
    // Get orcamento with items
    const orcamento = db.prepare(`
      SELECT * FROM orcamentos WHERE id = ?
    `).get(id);
    
    console.log('🔍 [API] Orçamento encontrado:', !!orcamento);
    
    if (!orcamento) {
      console.log('❌ [API] Orçamento não encontrado para ID:', id);
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