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
    let whereConditions = [];
    const params: any[] = [];

    if (searchParams.get('tipo')) {
      whereConditions.push('neg.tipo = ?');
      params.push(searchParams.get('tipo'));
    }

    if (searchParams.get('status')) {
      whereConditions.push('neg.status = ?');
      params.push(searchParams.get('status'));
    }

    if (searchParams.get('cliente_id')) {
      whereConditions.push('neg.cliente_id = ?');
      params.push(searchParams.get('cliente_id'));
    }

    if (searchParams.get('data_inicio')) {
      whereConditions.push('neg.data_transacao >= ?');
      params.push(searchParams.get('data_inicio'));
    }

    if (searchParams.get('data_fim')) {
      whereConditions.push('neg.data_transacao <= ?');
      params.push(searchParams.get('data_fim'));
    }

    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const outrosNegocios = db.prepare(`
      SELECT 
        neg.*,
        c.nome as cliente_nome
      FROM outros_negocios neg
      LEFT JOIN clientes c ON neg.cliente_id = c.id
      ${whereClause}
      ORDER BY neg.data_transacao DESC, neg.created_at DESC
    `).all(...params) as (OutroNegocio & { cliente_nome: string | null })[]
    
    // Map database fields to frontend format
    const mappedNegocios = outrosNegocios.map((negocio: any) => ({
      ...negocio,
      pessoa: negocio.cliente_nome || negocio.cliente_id || 'N/A',
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

export async function POST(request: Request) {
  try {
    console.log('POST /api/outros-negocios - Iniciando processamento...');
    console.log('POST /api/outros-negocios - Headers:', Object.fromEntries(request.headers.entries()));
    const body = await request.json();
    console.log('POST /api/outros-negocios - Body recebido:', JSON.stringify(body, null, 2));
    console.log('POST /api/outros-negocios - Tipo do body:', typeof body);
    
    const { tipo, descricao, valor, data_transacao, cliente_id, observacoes, juros_ativo, juros_mes_percent, multa_ativa, multa_percent } = body;
    
    // Log detalhado dos campos extraídos
    console.log('POST - Campos extraídos:', {
      tipo: tipo,
      valor: valor,
      data_transacao: data_transacao,
      cliente_id: cliente_id,
      descricao: descricao,
      observacoes: observacoes,
      juros_ativo: juros_ativo,
      juros_mes_percent: juros_mes_percent,
      multa_ativa: multa_ativa,
      multa_percent: multa_percent
    });
    
    // Validação básica com logs mais detalhados
    if (!tipo || !valor || !data_transacao) {
      console.log('POST - Erro de validação: campos obrigatórios ausentes');
      console.log('POST - Valores recebidos:', { tipo, valor, data_transacao });
      console.log('POST - Verificação booleana:', {
        tipoValido: !!tipo,
        valorValido: !!valor,
        dataValida: !!data_transacao
      });
      return NextResponse.json({ error: 'Campos obrigatórios: tipo, valor, data' }, { status: 400 });
    }
    
    // Debug DETALHADO da data recebida
    console.log('POST - Debug DETALHADO da data:', {
      data_transacao_original: data_transacao,
      tipo_data: typeof data_transacao,
      comprimento: data_transacao?.length,
      caracteres: data_transacao?.split('').map((c, i) => `${i}: '${c}' (${c.charCodeAt(0)})`),
      regex_dd_mm_yyyy: /^\d{2}\/\d{2}\/\d{4}$/.test(data_transacao),
      regex_yyyy_mm_dd: /^\d{4}-\d{2}-\d{2}$/.test(data_transacao)
    });
    
    // Limpar e normalizar a data recebida
    let dataNormalizada = String(data_transacao || '').trim();
    
    // Função para converter diferentes formatos de data para DD/MM/AAAA - VERSÃO CORRIGIDA
    const normalizarData = (dataStr: string): string => {
      console.log('POST - normalizarData - entrada:', { dataStr, tipo: typeof dataStr });
      
      // Remove espaços e caracteres invisíveis
      const cleaned = String(dataStr).trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
      console.log('POST - normalizarData - após limpeza:', { cleaned });
      
      // Testes de regex detalhados
      const regexTests = {
        'DD/MM/AAAA': /^\d{2}\/\d{2}\/\d{4}$/.test(cleaned),
        'YYYY-MM-DD': /^\d{4}-\d{2}-\d{2}$/.test(cleaned),
        'DD-MM-AAAA': /^\d{2}-\d{2}-\d{4}$/.test(cleaned),
        'DD.MM.AAAA': /^\d{2}\.\d{2}\.\d{4}$/.test(cleaned)
      };
      console.log('POST - normalizarData - testes regex:', regexTests);
      
      // Se já está no formato DD/MM/AAAA
      if (regexTests['DD/MM/AAAA']) {
        console.log('POST - normalizarData - formato DD/MM/AAAA detectado');
        return cleaned;
      }
      
      // Se está no formato ISO (YYYY-MM-DD)
      if (regexTests['YYYY-MM-DD']) {
        console.log('POST - normalizarData - formato ISO detectado');
        const [year, month, day] = cleaned.split('-');
        const converted = `${day}/${month}/${year}`;
        console.log('POST - normalizarData - convertido para:', { converted });
        return converted;
      }
      
      // Formato DD-MM-AAAA
      if (regexTests['DD-MM-AAAA']) {
        console.log('POST - normalizarData - formato DD-MM-AAAA detectado');
        const [day, month, year] = cleaned.split('-');
        const converted = `${day}/${month}/${year}`;
        console.log('POST - normalizarData - convertido para:', { converted });
        return converted;
      }
      
      // Formato DD.MM.AAAA
      if (regexTests['DD.MM.AAAA']) {
        console.log('POST - normalizarData - formato DD.MM.AAAA detectado');
        const [day, month, year] = cleaned.split('.');
        const converted = `${day}/${month}/${year}`;
        console.log('POST - normalizarData - convertido para:', { converted });
        return converted;
      }
      
      console.log('POST - normalizarData - ERRO: formato não reconhecido, retornando como está');
      console.log('POST - normalizarData - String original:', JSON.stringify(dataStr));
      console.log('POST - normalizarData - String limpa:', JSON.stringify(cleaned));
      return cleaned;
    };
    
    const dataAntesNormalizacao = dataNormalizada;
    dataNormalizada = normalizarData(dataNormalizada);
    console.log('POST - COMPARAÇÃO:', {
      antes: dataAntesNormalizacao,
      depois: dataNormalizada,
      mudou: dataAntesNormalizacao !== dataNormalizada
    });
    
    // Validar formato da data normalizada
    const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
    const regexResult = dateRegex.test(dataNormalizada);
    console.log('POST - TESTE REGEX DETALHADO:', {
      data_testada: dataNormalizada,
      data_json: JSON.stringify(dataNormalizada),
      regex_pattern: dateRegex.source,
      regex_result: regexResult,
      data_length: dataNormalizada.length,
      char_codes: Array.from(dataNormalizada).map(c => c.charCodeAt(0))
    });
    
    if (!regexResult) {
      console.log('POST - ERRO DE VALIDAÇÃO DETALHADO:', { 
        data_original: data_transacao,
        data_normalizada: dataNormalizada,
        regex_test: regexResult,
        esperado: 'DD/MM/AAAA',
        data_type: typeof dataNormalizada,
        data_constructor: dataNormalizada.constructor.name
      });
      return NextResponse.json({ error: 'Formato de data inválido. Use DD/MM/AAAA' }, { status: 400 });
    }
    
    // Validar se a data é válida (não apenas o formato)
    const [dia, mes, ano] = dataNormalizada.split('/');
    const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    if (dataObj.getDate() !== parseInt(dia) || 
        dataObj.getMonth() !== parseInt(mes) - 1 || 
        dataObj.getFullYear() !== parseInt(ano)) {
      console.log('POST - Erro: data inválida', { dataNormalizada, dia, mes, ano });
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
    }
    
    console.log('POST - Data passou na validação:', { data_final: dataNormalizada });
    
    // Usar a data normalizada para o resto do processamento
    const data_transacao_final = dataNormalizada;
    
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
    
    // Inserir o novo registro
    console.log('POST - Dados para inserção:', { tipo, descricao, valor, data_transacao, cliente_id, observacoes, juros_ativo, juros_mes_percent, multa_ativa, multa_percent });
    
    // Converter valores para os tipos corretos
    const jurosAtivoValue = juros_ativo ? 1 : 0;
    const jurosPercentValue = Number(juros_mes_percent) || 0;
    const multaAtivaValue = multa_ativa ? 1 : 0;
    const multaPercentValue = Number(multa_percent) || 0;
    
    console.log('POST - Valores convertidos:', {
      juros_ativo: jurosAtivoValue,
      juros_mes_percent: jurosPercentValue,
      multa_ativa: multaAtivaValue,
      multa_percent: multaPercentValue
    });
    
    try {
      const result = db.prepare(
        `INSERT INTO outros_negocios (
          id, tipo, valor, cliente_id, descricao, data, data_transacao, observacoes, juros_ativo, juros_mes_percent, multa_ativa, multa_percent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(id, tipo, valor, cliente_id || null, descricao || null, data_transacao_final, data_transacao_final, observacoes || null, jurosAtivoValue, jurosPercentValue, multaAtivaValue, multaPercentValue);
      
      console.log('POST - Resultado da inserção:', { changes: result.changes, lastInsertRowid: result.lastInsertRowid });

      return NextResponse.json({ 
        id, 
        tipo, 
        valor, 
        cliente_id, 
        descricao, 
        data_transacao, 
        observacoes,
        juros_ativo: jurosAtivoValue,
        juros_mes_percent: jurosPercentValue,
        multa_ativa: multaAtivaValue,
        multa_percent: multaPercentValue
      }, { status: 201 });
    } catch (dbError) {
      console.error('POST - Erro na inserção no banco:', dbError);
      return NextResponse.json({ error: 'Erro interno do servidor ao salvar' }, { status: 500 });
    }
  } catch (error) {
    console.error('POST /api/outros-negocios - Erro ao criar outro negócio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
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
    
    // Se há data_transacao nos dados de atualização, normalizar
    if (updateData.data_transacao) {
      console.log('PUT - Debug da data:', {
        data_transacao_original: updateData.data_transacao,
        tipo_data: typeof updateData.data_transacao
      });
      
      // Função para normalizar data - VERSÃO CORRIGIDA
      const normalizarData = (dataStr: string): string => {
        console.log('PUT - normalizarData - entrada:', { dataStr, tipo: typeof dataStr });
        
        // Remove espaços e caracteres invisíveis
        const cleaned = String(dataStr).trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
        console.log('PUT - normalizarData - após limpeza:', { cleaned });
        
        // Se já está no formato DD/MM/AAAA, retorna como está
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
          console.log('PUT - normalizarData - formato DD/MM/AAAA detectado');
          return cleaned;
        }
        
        // Se está no formato ISO (YYYY-MM-DD), converte para DD/MM/AAAA
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
          console.log('PUT - normalizarData - formato ISO detectado');
          const [year, month, day] = cleaned.split('-');
          const converted = `${day}/${month}/${year}`;
          console.log('PUT - normalizarData - convertido para:', { converted });
          return converted;
        }
        
        // Tentar outros formatos comuns
        // Formato DD-MM-AAAA
        if (/^\d{2}-\d{2}-\d{4}$/.test(cleaned)) {
          console.log('PUT - normalizarData - formato DD-MM-AAAA detectado');
          const [day, month, year] = cleaned.split('-');
          const converted = `${day}/${month}/${year}`;
          console.log('PUT - normalizarData - convertido para:', { converted });
          return converted;
        }
        
        // Formato DD.MM.AAAA
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(cleaned)) {
          console.log('PUT - normalizarData - formato DD.MM.AAAA detectado');
          const [day, month, year] = cleaned.split('.');
          const converted = `${day}/${month}/${year}`;
          console.log('PUT - normalizarData - convertido para:', { converted });
          return converted;
        }
        
        console.log('PUT - normalizarData - formato não reconhecido, retornando como está');
        return cleaned;
      };
      
      const dataNormalizada = normalizarData(String(updateData.data_transacao));
      console.log('PUT - Data normalizada:', { dataNormalizada });
      
      // Validar formato
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(dataNormalizada)) {
        console.log('PUT - Erro de validação: formato de data inválido', { 
          data_original: updateData.data_transacao,
          data_normalizada: dataNormalizada
        });
        return NextResponse.json({ error: 'Formato de data inválido. Use DD/MM/AAAA' }, { status: 400 });
      }
      
      // Validar se a data é válida
      const [dia, mes, ano] = dataNormalizada.split('/');
      const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
      if (dataObj.getDate() !== parseInt(dia) || 
          dataObj.getMonth() !== parseInt(mes) - 1 || 
          dataObj.getFullYear() !== parseInt(ano)) {
        console.log('PUT - Erro: data inválida', { dataNormalizada });
        return NextResponse.json({ error: 'Data inválida' }, { status: 400 });
      }
      
      updateData.data_transacao = dataNormalizada;
      updateData.data = dataNormalizada; // Atualizar ambos os campos
      console.log('PUT - Data validada e normalizada:', { data_final: dataNormalizada });
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