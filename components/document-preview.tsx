import React, { useEffect, useState } from 'react';
import { OrcamentoLayoutConfig } from '@/lib/company-config';
import { getConfig } from '@/lib/config';

interface DocumentPreviewProps {
  layoutConfig: {
    primaryColor: string;
    secondaryColor: string;
    titleFont: string;
    bodyFont: string;
    titleSize: number;
    bodySize: number;
    logoUrl?: string;
  };
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ layoutConfig }) => {
  const [companyData, setCompanyData] = useState<any>(null);

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        const { loadConfig } = await import('@/lib/config');
        const config = await loadConfig();
        setCompanyData(config);
      } catch (error) {
        console.error('Erro ao carregar dados da empresa:', error);
        // Fallback para getConfig se loadConfig falhar
        const config = getConfig();
        setCompanyData(config);
      }
    };
    loadCompanyData();
  }, []);

  // Converter para estrutura OrcamentoLayoutConfig
  const orcamentoConfig: OrcamentoLayoutConfig = {
    cores: {
      primaria: layoutConfig.primaryColor,
      secundaria: layoutConfig.secondaryColor,
      texto: '#1f2937'
    },
    tipografia: {
      fonteFamilia: layoutConfig.bodyFont,
      tamanhoTexto: layoutConfig.bodySize,
      tamanhoTitulo: layoutConfig.titleSize
    },
    layout: {
      logoUrl: layoutConfig.logoUrl || ''
    },
    configuracoes: {
      mostrarLogo: !!layoutConfig.logoUrl
    }
  };

  const titleStyle = {
    fontFamily: layoutConfig.titleFont,
    fontSize: `${orcamentoConfig.tipografia.tamanhoTitulo}px`,
    fontWeight: 'bold' as const,
    color: orcamentoConfig.cores.primaria,
  };

  const textStyle = {
    fontFamily: orcamentoConfig.tipografia.fonteFamilia,
    fontSize: `${orcamentoConfig.tipografia.tamanhoTexto}px`,
    color: orcamentoConfig.cores.texto,
  };

  const documentHeaderStyle = {
    borderBottom: `2px solid ${orcamentoConfig.cores.primaria}`,
    paddingBottom: '12px',
    marginBottom: '16px',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    marginBottom: '20px'
  };

  const cellStyle = {
    ...textStyle,
    padding: '8px',
    borderBottom: `1px solid ${orcamentoConfig.cores.primaria}20`
  };

  const totalStyle = {
    ...titleStyle,
    textAlign: 'right' as const,
    fontSize: `${orcamentoConfig.tipografia.tamanhoTitulo + 2}px`,
    marginTop: '16px'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Preview Orçamento */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Preview Orçamento</h3>
        <div className="bg-gray-50 p-4 rounded border" style={{ minHeight: '400px' }}>
          {/* Header */}
          <div style={documentHeaderStyle}>
            <div className="flex justify-between items-center">
              <div>
                <h1 style={titleStyle}>LP IND - Orçamento #03/2025</h1>
                <p style={textStyle}>Data: 09/09/2025</p>
              </div>
              {orcamentoConfig.layout.logoUrl && (
                <img 
                  src={orcamentoConfig.layout.logoUrl} 
                  alt="Logo" 
                  className="h-12 w-auto object-contain"
                />
              )}
            </div>
          </div>

          {/* Fornecedor e Cliente */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 border rounded">
              <h3 style={{ ...titleStyle, fontSize: `${orcamentoConfig.tipografia.tamanhoTitulo - 4}px`, marginBottom: '8px' }}>FORNECEDOR</h3>
              <div style={textStyle}>
                <div className="font-bold">{companyData?.nome || 'Carregando...'}</div>
                {companyData?.razao_social && <div>Razão Social: {companyData.razao_social}</div>}
                {companyData?.cnpj && <div>CNPJ: {companyData.cnpj}</div>}
                {companyData?.endereco && <div>Endereço: {companyData.endereco}</div>}
                {companyData?.telefone && (
                  <div>
                    Telefone: {companyData.telefone} 
                    <svg style={{ display: 'inline-block', width: '16px', height: '16px', marginLeft: '5px', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.386"/></svg>
                  </div>
                )}
                {companyData?.email && <div>Email: {companyData.email}</div>}
              </div>
            </div>
            <div className="p-3 border rounded">
              <h3 style={{ ...titleStyle, fontSize: `${orcamentoConfig.tipografia.tamanhoTitulo - 4}px`, marginBottom: '8px' }}>CLIENTE</h3>
              <div style={textStyle}>
                <div className="font-bold">Cliente Teste</div>
                <div>CNPJ: 12345678901</div>
                <div>Endereço: Rua Teste, 123</div>
                <div>Telefone: (11) 99999-9999</div>
                <div>Email: teste@teste.com</div>
              </div>
            </div>
          </div>

          {/* Modalidade de Compra */}
          <div className="text-center mb-6" style={{ margin: '20px 0' }}>
            <div style={{ ...textStyle, fontSize: '16px', fontWeight: 'normal' }}>
              MODALIDADE DE COMPRA: LICITAÇÃO - 256255/2025
            </div>
          </div>

          {/* Itens */}
          <div className="mb-4">
            <h2 style={{ ...titleStyle, fontSize: `${orcamentoConfig.tipografia.tamanhoTitulo - 2}px`, marginBottom: '8px' }}>Itens</h2>
            <table style={tableStyle}>
              <thead>
                <tr style={{ backgroundColor: orcamentoConfig.cores.primaria, color: 'white' }}>
                  <th style={{ ...cellStyle, fontWeight: 'bold', color: 'white', width: '5%' }}>#</th>
                  <th style={{ ...cellStyle, fontWeight: 'bold', color: 'white', width: '55%' }}>DESCRIÇÃO</th>
                  <th style={{ ...cellStyle, fontWeight: 'bold', color: 'white', width: '12%' }}>MARCA</th>
                  <th style={{ ...cellStyle, fontWeight: 'bold', color: 'white', width: '8%' }}>QTD.</th>
                  <th style={{ ...cellStyle, fontWeight: 'bold', color: 'white', width: '10%' }}>VALOR UNIT.</th>
                  <th style={{ ...cellStyle, fontWeight: 'bold', color: 'white', width: '10%' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...cellStyle, width: '5%' }}>1</td>
                  <td style={{ ...cellStyle, width: '55%' }}>Produto de exemplo com descrição mais detalhada para demonstrar o espaço maior</td>
                  <td style={{ ...cellStyle, width: '12%' }}>Marca X</td>
                  <td style={{ ...cellStyle, width: '8%', textAlign: 'center' }}>7</td>
                  <td style={{ ...cellStyle, width: '10%', textAlign: 'center' }}>R$ 50,00</td>
                  <td style={{ ...cellStyle, width: '10%', textAlign: 'center' }}>R$ 350,00</td>
                </tr>
              </tbody>
            </table>
            
            {/* Total do Orçamento */}
            <div className="mt-4 p-3" style={{ backgroundColor: orcamentoConfig.cores.primaria, color: 'white', textAlign: 'right' }}>
              <div style={{ ...titleStyle, color: 'white', fontSize: `${orcamentoConfig.tipografia.tamanhoTitulo}px` }}>
                Total do orçamento: R$ 350,00
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="mb-4">
            <h2 style={{ ...titleStyle, fontSize: `${orcamentoConfig.tipografia.tamanhoTitulo - 2}px`, marginBottom: '8px' }}>Observações</h2>
            <div style={{ ...textStyle, padding: '12px', backgroundColor: 'white', border: `1px solid ${orcamentoConfig.cores.primaria}20`, borderRadius: '4px' }}>
              hgafh
            </div>
          </div>

          {/* Rodapé */}
          <div className="mt-6 pt-4 flex justify-between" style={{ borderTop: `1px solid ${orcamentoConfig.cores.primaria}20`, fontSize: '12px', color: '#64748b' }}>
            <div>Orçamento sem valor fiscal • Validade sugerida: 30 dias</div>
            <div>Página 1</div>
          </div>
        </div>
      </div>

      {/* Preview Vale */}
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Preview Vale</h3>
        <div className="bg-gray-50 p-4 rounded border" style={{ minHeight: '400px' }}>
          {/* Header */}
          <div style={documentHeaderStyle}>
            <div className="flex justify-between items-start">
              <div className="company-info">
                {orcamentoConfig.layout.logoUrl ? (
                  <img 
                    src={orcamentoConfig.layout.logoUrl} 
                    alt="Logo" 
                    className="h-12 w-auto object-contain mb-2"
                  />
                ) : (
                  <div className="mb-2">
                    <div style={{ ...titleStyle, fontSize: '14px', lineHeight: '1.2' }}>ID</div>
                    <div style={{ ...textStyle, fontSize: '10px' }}>DISTRIBUIÇÃO</div>
                  </div>
                )}
                <div style={textStyle}>
                  <div className="font-bold">{companyData?.nome || 'Carregando...'}</div>
                  {companyData?.cnpj && <div>CNPJ: {companyData.cnpj}</div>}
                  {companyData?.endereco && <div>{companyData.endereco}</div>}
                  {companyData?.telefone && (
                    <div>
                      Tel: {companyData.telefone} 
                      <svg style={{ display: 'inline-block', width: '14px', height: '14px', marginLeft: '3px', verticalAlign: 'middle' }} viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.386"/></svg>
                    </div>
                  )}
                  {companyData?.email && <div>Email: {companyData.email}</div>}
                </div>
              </div>
              <div className="document-info text-right">
                <h1 style={titleStyle}>Documento de Vale</h1>
                <div style={textStyle}>
                  <div>Cliente: Maria Santos</div>
                  <div>CPF: 123.456.789-00</div>
                  <div>Emitido em: 15/01/2024 14:30</div>
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Vale */}
          <div className="mb-4">
            <h2 style={{ ...titleStyle, fontSize: `${orcamentoConfig.tipografia.tamanhoTitulo - 2}px`, marginBottom: '8px' }}>Informações</h2>
            <table style={tableStyle}>
              <tbody>
                <tr>
                  <td style={{ ...cellStyle, fontWeight: 'bold', width: '30%' }}>Data:</td>
                  <td style={cellStyle}>15/01/2024</td>
                </tr>
                <tr>
                  <td style={{ ...cellStyle, fontWeight: 'bold' }}>Cliente:</td>
                  <td style={cellStyle}>Maria Santos</td>
                </tr>
                <tr>
                  <td style={{ ...cellStyle, fontWeight: 'bold' }}>Telefone:</td>
                  <td style={cellStyle}>(11) 88888-8888</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Descrição */}
          <div className="mb-4">
            <h2 style={{ ...titleStyle, fontSize: `${orcamentoConfig.tipografia.tamanhoTitulo - 2}px`, marginBottom: '8px' }}>Descrição</h2>
            <div style={{ ...textStyle, padding: '12px', backgroundColor: 'white', border: `1px solid ${orcamentoConfig.cores.primaria}20`, borderRadius: '4px' }}>
              Vale referente ao pagamento antecipado de serviços a serem prestados conforme acordo estabelecido.
            </div>
          </div>

          {/* Valor */}
          <div style={totalStyle}>
            Valor: R$ 200,00
          </div>

          {/* Assinatura */}
          <div className="mt-8 pt-4" style={{ borderTop: `1px solid ${orcamentoConfig.cores.primaria}20` }}>
            <div style={textStyle} className="text-center">
              _________________________________<br/>
              Assinatura do Responsável
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;