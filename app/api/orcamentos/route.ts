import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    // Verificar se o banco está disponível
    if (!db || !db.prepare) {
      console.error('Database connection not available');
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }

    // Create table if it doesn't exist (apenas em runtime)
    if (process.env.NEXT_PHASE !== 'phase-production-build' && db.exec) {
      try {
        db.exec(`
        CREATE TABLE IF NOT EXISTS orcamentos (
          id TEXT PRIMARY KEY,
          numero TEXT NOT NULL UNIQUE,
          cliente_id TEXT NOT NULL,
          data_orcamento TEXT NOT NULL,
          data_validade TEXT,
          valor_total REAL NOT NULL DEFAULT 0,
          descricao TEXT,
          status TEXT DEFAULT 'pendente',

          condicoes_pagamento TEXT,
          prazo_entrega TEXT,
          vendedor_id TEXT,
          desconto REAL DEFAULT 0,
          modalidade TEXT,
          numero_pregao TEXT,
          numero_dispensa TEXT,
          numero_processo TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      } catch (tableError) {
        console.error('Error creating orcamentos table:', tableError);
      }
    }

    // Create orcamento_itens table for line items
    if (process.env.NEXT_PHASE !== 'phase-production-build' && db.exec) {
      try {
        db.exec(`
        CREATE TABLE IF NOT EXISTS orcamento_itens (
          id TEXT PRIMARY KEY,
          orcamento_id TEXT NOT NULL,
          produto_id TEXT,
          descricao TEXT NOT NULL,
          marca TEXT,
          quantidade REAL NOT NULL,
          valor_unitario REAL NOT NULL,
          valor_total REAL NOT NULL,

          link_ref TEXT,
          custo_ref REAL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (orcamento_id) REFERENCES orcamentos (id)
        )
      `);
      } catch (tableError) {
        console.error('Error creating orcamento_itens table:', tableError);
      }
    }

    const searchParams = request.nextUrl.searchParams;
    const clienteId = searchParams.get('cliente_id');
    const status = searchParams.get('status');
    const vendedorId = searchParams.get('vendedor_id');
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    const incluirItens = searchParams.get('incluir_itens') === 'true';
    
    let query = `
      SELECT 
        o.*,
        c.nome as cliente_nome,
        c.cpf_cnpj as cliente_documento,
        c.telefone as cliente_telefone,
        c.email as cliente_email,
        c.endereco as cliente_endereco
      FROM orcamentos o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (clienteId) {
      query += ' AND cliente_id = ?';
      params.push(clienteId);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (vendedorId) {
      query += ' AND vendedor_id = ?';
      params.push(vendedorId);
    }
    
    if (dataInicio) {
      query += ' AND data_orcamento >= ?';
      params.push(dataInicio);
    }
    
    if (dataFim) {
      query += ' AND data_orcamento <= ?';
      params.push(dataFim);
    }
    
    query += ' ORDER BY data_orcamento DESC';
    
    let orcamentos: any[];
    try {
      const stmt = db.prepare(query);
      orcamentos = stmt.all(...params) as any[];
    } catch (queryError) {
      console.error('Error executing orcamentos query:', queryError);
      console.error('Query:', query);
      console.error('Params:', params);
      return NextResponse.json(
        { error: 'Database query error' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected frontend format
    const transformedOrcamentos = orcamentos.map(orcamento => {
      const transformed = {
        id: orcamento.id,
        numero: orcamento.numero,
        data: orcamento.data_orcamento,
        data_validade: orcamento.data_validade, // ✅ CORREÇÃO: Incluir data_validade na resposta
        cliente: {
          id: orcamento.cliente_id,
          nome: orcamento.cliente_nome || '',
          documento: orcamento.cliente_documento || null,
          telefone: orcamento.cliente_telefone || null,
          email: orcamento.cliente_email || null,
          endereco: orcamento.cliente_endereco || null
        },
        valor_total: orcamento.valor_total,
        status: orcamento.status,
        observacoes: orcamento.observacoes,
        condicoes_pagamento: orcamento.condicoes_pagamento,
        prazo_entrega: orcamento.prazo_entrega,
        vendedor_id: orcamento.vendedor_id,
        desconto: orcamento.desconto,
        modalidade: orcamento.modalidade,
        numero_pregao: orcamento.numero_pregao,
        numero_dispensa: orcamento.numero_dispensa,
        numero_processo: orcamento.numero_processo,
        createdAt: orcamento.created_at,
        updatedAt: orcamento.updated_at,
        itens: [] // Will be populated below if requested
      };

      return transformed;
    });

    // Include items if requested
    if (incluirItens) {
      for (const orcamento of transformedOrcamentos) {
        try {
          const itens = db.prepare(
            'SELECT * FROM orcamento_itens WHERE orcamento_id = ? ORDER BY created_at'
          ).all(orcamento.id);
          
          // Transform items to match expected format
          (orcamento as any).itens = itens.map((item: any) => ({
            id: item.id,
            item_id: item.produto_id,
            descricao: item.descricao,
            marca: item.marca || '',
            unidade_medida: 'un', // Default value since column doesn't exist in DB
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valor_total: item.valor_total,
            link_ref: item.link_ref,
            custo_ref: item.custo_ref,
            desconto: item.desconto || 0,
            observacoes: item.observacoes || ''
          }));
          
          // Add items count
          (orcamento as any).itens_count = itens.length;
        } catch (itemError) {
          console.error('Error fetching items for orcamento:', orcamento.id, itemError);
          (orcamento as any).itens = [];
        }
      }
    }

    return NextResponse.json(transformedOrcamentos);
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Temporariamente desabilitar foreign keys para debug
    if (db.pragma) {
      db.pragma('foreign_keys = OFF');
    }
    
    const body = await request.json();
    
    console.log('🔍 [BACKEND DEBUG] POST - Dados recebidos:', body);
    console.log('🔍 [BACKEND DEBUG] POST - Itens recebidos:', body.itens);
    console.log('🔍 [MODALIDADE BACKEND DEBUG] Modalidade recebida:', body.modalidade);
    console.log('🔍 [MODALIDADE BACKEND DEBUG] Tipo da modalidade:', typeof body.modalidade);
    
    const {
      numero,
      cliente_id,
      data_orcamento,
      data_validade,
      descricao,
      observacoes,
      condicoes_pagamento,
      prazo_entrega,
      vendedor_id,
      desconto,
      modalidade,
      numero_pregao,
      numero_dispensa,
      numero_processo,
      itens
    } = body;
    
    // Validation
    if (!cliente_id || !itens || itens.length === 0) {
      return NextResponse.json(
        { error: 'Cliente e itens são obrigatórios' },
        { status: 400 }
      );
    }

    // Get system configuration for validade_orcamento
    let validadeDias = 30; // default
    try {
      const config = db.prepare('SELECT config_value FROM configuracoes WHERE config_key = ? LIMIT 1').get('validade_orcamento');
      if (config && config.config_value) {
        validadeDias = parseInt(config.config_value) || 30;
      }
    } catch (configError) {
      console.log('Using default validade_orcamento:', validadeDias);
    }

    // Calculate data_validade based on configuration
    const dataOrcamento = data_orcamento ? new Date(data_orcamento) : new Date();
    const finalDataOrcamento = dataOrcamento.toISOString().split('T')[0];
    const dataValidadeCalculated = new Date(dataOrcamento);
    dataValidadeCalculated.setDate(dataValidadeCalculated.getDate() + validadeDias);
    const finalDataValidade = data_validade || dataValidadeCalculated.toISOString().split('T')[0];
    
    const id = uuidv4();
    
    // Calculate total value from items
    let valorTotal = 0;
    if (itens && Array.isArray(itens)) {
      valorTotal = itens.reduce((total: number, item: any) => {
        const quantidade = Number(item.quantidade) || 0;
        const valorUnitario = Number(item.valor_unitario) || 0;
        return total + (quantidade * valorUnitario);
      }, 0);
    }
    
    // Ensure valorTotal is a valid number
    valorTotal = Number(valorTotal) || 0;
    
    // Apply discount
    if (desconto) {
      valorTotal = valorTotal - (valorTotal * (desconto / 100));
    }
    
    // Gerar número do orçamento se não fornecido ou se já existe
    let finalNumero = numero;
    
    if (!finalNumero || db.prepare('SELECT numero FROM orcamentos WHERE numero = ?').get(finalNumero)) {
      // Gerar um novo número baseado no ano atual
      const currentYear = new Date().getFullYear();
      const orcamentosDoAno = db.prepare(
        'SELECT numero FROM orcamentos WHERE numero LIKE ?'
      ).all(`%/${currentYear}`);
      
      let maiorNumero = 0;
      orcamentosDoAno.forEach((orc: any) => {
        const partes = orc.numero.split('/');
        if (partes.length === 2) {
          const num = parseInt(partes[0]);
          if (!isNaN(num) && num > maiorNumero) {
            maiorNumero = num;
          }
        }
      });
      
      const proximoNumero = maiorNumero + 1;
      const numeroFormatado = proximoNumero.toString().padStart(2, '0');
      finalNumero = `${numeroFormatado}/${currentYear}`;
    }
    
    console.log('🔍 [BACKEND DEBUG] POST - Número do orçamento gerado:', finalNumero);
    
    // Insert the orcamento
    try {
      const insertOrcamento = db.prepare(`
        INSERT INTO orcamentos (
          id, numero, cliente_id, data_orcamento, data_validade, valor_total,
          descricao, status, observacoes, condicoes_pagamento, prazo_entrega,
          vendedor_id, desconto, modalidade, numero_pregao, numero_dispensa, numero_processo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertOrcamento.run(
        id,
        finalNumero,
        cliente_id,
        finalDataOrcamento,
        finalDataValidade,
        valorTotal,
        descricao,
        'pendente',
        observacoes,
        condicoes_pagamento,
        prazo_entrega,
        vendedor_id,
        desconto,
        modalidade,
        numero_pregao,
        numero_dispensa,
        numero_processo
      );
    } catch (insertError) {
      console.error('Error inserting orcamento:', insertError);
      return NextResponse.json(
        { error: 'Failed to create orcamento' },
        { status: 500 }
      );
    }
    
    // Insert items if provided
    if (itens && Array.isArray(itens)) {
      console.log('🔍 [BACKEND DEBUG] POST - Inserindo itens no banco. Total:', itens.length);
      try {
        const insertItem = db.prepare(`
          INSERT INTO orcamento_itens (
            id, orcamento_id, produto_id, descricao, marca, quantidade,
            valor_unitario, valor_total, link_ref, custo_ref
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const item of itens) {
          const itemId = uuidv4();
          const valorTotalItem = item.quantidade * item.valor_unitario;
          
          console.log('🔍 [BACKEND DEBUG] POST - Inserindo item:', {
            itemId,
            orcamento_id: id,
            produto_id: item.item_id || null,
            descricao: item.descricao,
            marca: item.marca || '',
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valorTotalItem,
            link_ref: item.link_ref,
            custo_ref: item.custo_ref
          });
          
          console.log('🚨 [CRITICAL DEBUG] POST - Campos detalhes internos:', {
            'item.link_ref': item.link_ref,
            'item.custo_ref': item.custo_ref,
            'typeof link_ref': typeof item.link_ref,
            'typeof custo_ref': typeof item.custo_ref,
            'link_ref || ""': item.link_ref || '',
            'custo_ref || 0': item.custo_ref || 0
          });
          
          insertItem.run(
            itemId,
            id,
            item.item_id || null,
            item.descricao,
            item.marca || '',
            item.quantidade,
            item.valor_unitario,
            valorTotalItem,
            item.link_ref || '',
            item.custo_ref || 0
          );
        }
        console.log('🔍 [BACKEND DEBUG] POST - Todos os itens inseridos com sucesso');
      } catch (itemsError) {
        console.error('🔍 [BACKEND DEBUG] POST - Erro ao inserir itens:', itemsError);
        // Continue execution - orcamento was created successfully
      }
    } else {
      console.log('🔍 [BACKEND DEBUG] POST - Nenhum item para inserir ou itens inválidos');
    }
    
    // Get the complete orcamento with items
    const novoOrcamento = db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(id) as any;
    const itensOrcamento = db.prepare('SELECT * FROM orcamento_itens WHERE orcamento_id = ?').all(id);
    novoOrcamento.itens = itensOrcamento;
    
    console.log('🔍 [BACKEND DEBUG] POST - Orçamento criado:', novoOrcamento);
    console.log('🔍 [BACKEND DEBUG] POST - Itens retornados do banco:', itensOrcamento);
    console.log('🔍 [BACKEND DEBUG] POST - Quantidade de itens retornados:', itensOrcamento.length);
    
    return NextResponse.json(novoOrcamento, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar orçamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, itens, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID é obrigatório para atualização' },
        { status: 400 }
      );
    }

    // Get system configuration for validade_orcamento
    let validadeDias = 30; // default
    try {
      const config = db.prepare('SELECT config_value FROM configuracoes WHERE config_key = ? LIMIT 1').get('validade_orcamento');
      if (config && config.config_value) {
        validadeDias = parseInt(config.config_value) || 30;
      }
    } catch (configError) {
      console.log('Using default validade_orcamento:', validadeDias);
    }

    // Calculate data_validade based on configuration if not provided
    let dataValidade = updateData.data_validade;
    if (!dataValidade && updateData.data_orcamento) {
      const dataOrcamento = new Date(updateData.data_orcamento);
      const dataValidadeCalculada = new Date(dataOrcamento);
      dataValidadeCalculada.setDate(dataValidadeCalculada.getDate() + validadeDias);
      dataValidade = dataValidadeCalculada.toISOString().split('T')[0];
      updateData.data_validade = dataValidade;
    }
    
    // Update orcamento
    const updateOrcamento = db.prepare(`
      UPDATE orcamentos SET
        cliente_id = ?,
        data_orcamento = ?,
        data_validade = ?,
        observacoes = ?,
        valor_total = ?,
        modalidade = ?,
        numero_pregao = ?,
        numero_dispensa = ?,
        numero_processo = ?
      WHERE id = ?`
    ).run(
      updateData.cliente_id,
      updateData.data_orcamento,
      dataValidade,
      updateData.observacoes || null,
      updateData.valor_total,
      updateData.modalidade || 'normal',
      updateData.numero_pregao || null,
      updateData.numero_dispensa || null,
      updateData.numero_processo || null,
      id
    )
    
    // Update items if provided
    if (itens && Array.isArray(itens)) {
      // Delete existing items
      db.prepare('DELETE FROM orcamento_itens WHERE orcamento_id = ?').run(id);
      
      // Insert new items
      let valorTotal = 0;
      for (const item of itens) {
        const itemId = uuidv4();
        const valorTotalItem = item.quantidade * item.valor_unitario;
        valorTotal += valorTotalItem;
        
        db.prepare(
          `INSERT INTO orcamento_itens (
            id, orcamento_id, produto_id, descricao, marca, quantidade, 
            valor_unitario, valor_total, link_ref, custo_ref
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(itemId, id, item.item_id || null, item.descricao, item.marca || '', 
           item.quantidade, item.valor_unitario, valorTotalItem, item.link_ref || '', item.custo_ref || 0);
      }
      
      // Update total value
      db.prepare('UPDATE orcamentos SET valor_total = ? WHERE id = ?').run(valorTotal, id);
    }
    
    const orcamentoAtualizado = db.prepare('SELECT * FROM orcamentos WHERE id = ?').get(id) as any;
    const itensOrcamento = db.prepare('SELECT * FROM orcamento_itens WHERE orcamento_id = ?').all(id);
    orcamentoAtualizado.itens = itensOrcamento;
    
    return NextResponse.json(orcamentoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error);
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
    
    // Delete items first (foreign key constraint)
    db.prepare('DELETE FROM orcamento_itens WHERE orcamento_id = ?').run(id);
    
    // Delete orcamento
    db.prepare('DELETE FROM orcamentos WHERE id = ?').run(id);
    
    return NextResponse.json({ message: 'Orçamento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir orçamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}