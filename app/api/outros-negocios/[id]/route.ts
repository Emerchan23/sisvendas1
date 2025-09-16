import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let id: string | undefined;
  let body: any;
  try {
    body = await request.json();
    const resolvedParams = await params;
    id = resolvedParams.id;
    
    console.log('PUT /api/outros-negocios/[id] - ID:', id);
    console.log('PUT /api/outros-negocios/[id] - Body recebido:', JSON.stringify(body, null, 2));
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório para atualização' },
        { status: 400 }
      );
    }

    // Remove id from body to avoid conflicts and filter valid fields
    const { id: bodyId, pagamentos, ...rawData } = body;
    
    // Only allow valid database columns (based on actual table schema)
    const validFields = ['tipo', 'descricao', 'valor', 'data_transacao', 'cliente_id', 'status', 'observacoes', 'juros_ativo', 'juros_mes_percent', 'multa_ativa', 'multa_percent'];
    const updateData = Object.fromEntries(
      Object.entries(rawData).filter(([key]) => validFields.includes(key))
    );
    
    console.log('PUT /api/outros-negocios/[id] - Dados filtrados:', JSON.stringify(updateData, null, 2));
    
    // Validate foreign key constraints before update
    if (updateData.cliente_id) {
      const clienteExists = db.prepare('SELECT id FROM clientes WHERE id = ?').get(updateData.cliente_id);
      if (!clienteExists) {
        return NextResponse.json(
          { error: 'Cliente não encontrado', details: `Cliente com ID ${updateData.cliente_id} não existe` },
          { status: 400 }
        );
      }
    }
    
    if (updateData.empresa_id) {
      const empresaExists = db.prepare('SELECT id FROM empresas WHERE id = ?').get(updateData.empresa_id);
      if (!empresaExists) {
        return NextResponse.json(
          { error: 'Empresa não encontrada', details: `Empresa com ID ${updateData.empresa_id} não existe` },
          { status: 400 }
        );
      }
    }
    
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    
    if (fields.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }
    
    console.log('PUT /api/outros-negocios/[id] - Query fields:', fields);
    console.log('PUT /api/outros-negocios/[id] - Query values:', values);
    
    const result = db.prepare(
      `UPDATE outros_negocios SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(...values, id);
    
    console.log('PUT /api/outros-negocios/[id] - Result changes:', result.changes);
    
    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Registro não encontrado' },
        { status: 404 }
      );
    }
    
    const negocioAtualizado = db.prepare('SELECT * FROM outros_negocios WHERE id = ?').get(id);
    console.log('PUT /api/outros-negocios/[id] - Negócio atualizado:', JSON.stringify(negocioAtualizado, null, 2));
    
    return NextResponse.json(negocioAtualizado);
  } catch (error) {
    console.error('PUT /api/outros-negocios/[id] - Erro ao atualizar outro negócio:', error);
    console.error('PUT /api/outros-negocios/[id] - ID:', id);
    console.error('PUT /api/outros-negocios/[id] - Body original:', body);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let id: string | undefined;
  try {
    const resolvedParams = await params;
    id = resolvedParams.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório para exclusão' },
        { status: 400 }
      );
    }
    
    // Note: Removed acertos dependency check as the acertos table doesn't have outro_negocio_id column
    
    // Primeiro, excluir os pagamentos relacionados
    db.prepare('DELETE FROM pagamentos_parciais WHERE outro_negocio_id = ?').run(id);
    
    // Depois, excluir o outro negócio
    const result = db.prepare('DELETE FROM outros_negocios WHERE id = ?').run(id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Registro não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir outro negócio:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      id: id || 'undefined'
    });
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}