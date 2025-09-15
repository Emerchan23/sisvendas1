import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    console.log('Iniciando GET /api/outros-negocios');
    
    // Verificar se o banco está conectado
    if (!db || !db.prepare) {
      console.error('Banco de dados não está conectado');
      return NextResponse.json(
        { error: 'Erro de conexão com banco de dados' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Teste simples primeiro
    console.log('Testando query simples...');
    
    try {
      // Primeiro, vamos testar se a tabela existe
      const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='outros_negocios'").get();
      console.log('Tabela existe:', tableCheck);
      
      // Verificar colunas da tabela
      const columns = db.prepare("PRAGMA table_info(outros_negocios)").all();
      console.log('Colunas da tabela:', columns);
      
      // Query simples sem filtros
      const testData = db.prepare('SELECT * FROM outros_negocios LIMIT 10').all();
      console.log('Dados encontrados:', testData.length);
    } catch (error) {
      console.error('Erro na query:', error);
      return NextResponse.json(
        { error: 'Erro na consulta: ' + error.message },
        { status: 500 }
      );
    }
    
    // Build query with filters
    let query = 'SELECT * FROM outros_negocios WHERE 1=1';
    const params: any[] = [];

    if (searchParams.get('tipo')) {
      query += ' AND tipo = ?';
      params.push(searchParams.get('tipo'));
    }

    if (searchParams.get('status')) {
      query += ' AND status = ?';
      params.push(searchParams.get('status'));
    }

    if (searchParams.get('cliente_id')) {
      query += ' AND cliente_id = ?';
      params.push(searchParams.get('cliente_id'));
    }

    if (searchParams.get('data_inicio')) {
      query += ' AND data >= ?';
      params.push(searchParams.get('data_inicio'));
    }

    if (searchParams.get('data_fim')) {
      query += ' AND data <= ?';
      params.push(searchParams.get('data_fim'));
    }

    query += ' ORDER BY created_at DESC';

    const outrosNegocios = db.prepare(query).all(...params);
    
    // Map database fields to frontend format
    const mappedNegocios = outrosNegocios.map((negocio: any) => ({
      ...negocio,
      pessoa: negocio.cliente_id,
      data: negocio.data_transacao,
      jurosAtivo: Boolean(negocio.juros_ativo),
      jurosMesPercent: negocio.juros_mes_percent || 0,
      multaAtiva: Boolean(negocio.multa_ativa),
      multaPercent: negocio.multa_percent || 0
    }));
    
    return NextResponse.json(mappedNegocios);
  } catch (error) {
    console.error('Erro ao buscar outros negócios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {      tipo,      descricao,      valor,      data,      cliente_id,      observacoes,      juros_ativo,      juros_mes_percent,      multa_ativa,      multa_percent    } = body;
    
    // Validation
    if (!tipo || !valor || !data) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: tipo, valor, data' },
        { status: 400 }
      );
    }
    
    // Validate tipo field
    if (tipo !== 'emprestimo' && tipo !== 'venda') {
      return NextResponse.json(
        { error: 'Campo tipo deve ser "emprestimo" ou "venda"' },
        { status: 400 }
      );
    }
    
    // Validate foreign key constraints
    if (cliente_id) {
      const clienteExists = db.prepare('SELECT id FROM clientes WHERE id = ?').get(cliente_id);
      if (!clienteExists) {
        return NextResponse.json(
          { error: 'Cliente não encontrado', details: `Cliente com ID ${cliente_id} não existe` },
          { status: 400 }
        );
      }
    }
    
    const id = uuidv4();
    
    db.prepare(
      `INSERT INTO outros_negocios (
        id, tipo, valor, cliente_id, descricao, data, observacoes, juros_ativo, juros_mes_percent, multa_ativa, multa_percent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, tipo, valor, cliente_id || null, descricao || null, data, observacoes || null, juros_ativo || 0, juros_mes_percent || 0, multa_ativa || 0, multa_percent || 0);
    
    const novoNegocio = db.prepare('SELECT * FROM outros_negocios WHERE id = ?').get(id);
    
    return NextResponse.json(novoNegocio, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar outro negócio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório para atualização' },
        { status: 400 }
      );
    }
    
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    
    db.prepare(
      `UPDATE outros_negocios SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(...values, id);
    
    const negocioAtualizado = db.prepare('SELECT * FROM outros_negocios WHERE id = ?').get(id);
    
    return NextResponse.json(negocioAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar outro negócio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório para exclusão' },
        { status: 400 }
      );
    }
    
    db.prepare('DELETE FROM outros_negocios WHERE id = ?').run(id);
    
    return NextResponse.json({ message: 'Outro negócio excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir outro negócio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}