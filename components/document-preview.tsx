import React, { useState, useEffect } from 'react';

interface DocumentPreviewProps {
  data?: any;
  type?: 'orcamento' | 'vale';
  layoutConfig?: {
    primaryColor?: string;
    secondaryColor?: string;
    titleFont?: string;
    bodyFont?: string;
    titleSize?: number;
    bodySize?: number;
    logoUrl?: string;
    validadeOrcamento?: number;
    textColor?: string;
  };
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ data, type, layoutConfig }) => {
  const [companyData, setCompanyData] = useState<any>(null);
  const [orcamentoConfig, setOrcamentoConfig] = useState<any>({
    tipografia: {
      tamanhoTitulo: 16,
      tamanhoTexto: 12
    }
  });

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const response = await fetch('/api/config');
        if (response.ok) {
          const config = await response.json();
          setCompanyData(config);
        }
      } catch (error) {
        console.error('Erro ao carregar dados da empresa:', error);
      }
    };

    fetchCompanyData();
  }, []);

  // Forçar re-render quando layoutConfig mudar
  useEffect(() => {
    // Este useEffect garante que o componente seja re-renderizado
    // sempre que as configurações de personalização mudarem
  }, [layoutConfig]);

  // Usar configurações de personalização se disponíveis
  const primaryColor = layoutConfig?.primaryColor || '#1e40af';
  const secondaryColor = layoutConfig?.secondaryColor || '#64748b';
  const titleFont = layoutConfig?.titleFont || 'Inter';
  const bodyFont = layoutConfig?.bodyFont || 'Inter';
  const titleSize = layoutConfig?.titleSize || orcamentoConfig.tipografia.tamanhoTitulo;
  const bodySize = layoutConfig?.bodySize || orcamentoConfig.tipografia.tamanhoTexto;
  const textColor = layoutConfig?.textColor || '#374151';

  const titleStyle = {
    fontSize: `${titleSize}px`,
    fontFamily: titleFont,
    fontWeight: 'bold' as const,
    color: primaryColor,
    marginBottom: '8px'
  };

  const textStyle = {
    fontSize: `${bodySize}px`,
    fontFamily: bodyFont,
    color: textColor,
    lineHeight: '1.4'
  };

  const totalStyle = {
    ...titleStyle,
    textAlign: 'right' as const,
    fontSize: `${titleSize + 2}px`,
    marginTop: '16px'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Orcamento Preview */}
      {(type === 'orcamento' || !type) && (
        <div className="bg-white shadow-lg">
          {/* Header com gradiente personalizado */}
          <div className="text-white p-6" style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: titleFont }}>
                  {companyData?.nome || 'Carregando...'}
                </h1>
                <div className="text-sm space-y-1 opacity-90">
                  <p>{companyData?.endereco}</p>
                  <p>CEP: {companyData?.cep} - {companyData?.cidade}/{companyData?.estado}</p>
                  <p>Tel: {companyData?.telefone} | {companyData?.email}</p>
                  <p>CNPJ: {companyData?.cnpj}</p>
                </div>
              </div>
              <div className="text-right bg-white/10 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: titleFont }}>
                  ORÇAMENTO
                </h2>
                <p className="text-sm">Nº {data?.numero || '03/2025'}</p>
                <p className="text-sm">Data: {data?.data || '09/09/2025'}</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Supplier and Client Info */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3 border-b border-blue-200 pb-2" style={{ color: primaryColor, fontFamily: titleFont }}>
                  FORNECEDOR
                </h3>
                <div className="text-sm space-y-1" style={{ color: textColor }}>
                  <p className="font-medium" style={{ color: textColor }}>{data?.fornecedor?.nome || companyData?.nome || 'Carregando...'}</p>
                  {(data?.fornecedor?.razaoSocial || companyData?.razao_social) && <p>Razão Social: {data?.fornecedor?.razaoSocial || companyData?.razao_social}</p>}
                  <p>CNPJ: {data?.fornecedor?.cnpj || companyData?.cnpj}</p>
                  <p>Endereço: {data?.fornecedor?.endereco || companyData?.endereco}</p>
                  <p>Telefone: {data?.fornecedor?.telefone || companyData?.telefone}</p>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3 border-b border-blue-200 pb-2" style={{ color: primaryColor, fontFamily: titleFont }}>
                  CLIENTE
                </h3>
                <div className="text-sm space-y-1" style={{ color: textColor }}>
                  <p className="font-medium" style={{ color: textColor }}>{data?.cliente?.nome || 'Cliente Teste'}</p>
                  <p>CNPJ: {data?.cliente?.cnpj || '12345678901'}</p>
                  <p>Endereço: {data?.cliente?.endereco || 'Rua Teste, 123'}</p>
                  <p>Telefone: {data?.cliente?.telefone || '(11) 99999-9999'}</p>
                  <p>Email: {data?.cliente?.email || 'teste@teste.com'}</p>
                </div>
              </div>
            </div>

            {/* Purchase Modality */}
            <div className="text-center mb-8">
              <div className="inline-block px-8 py-4 rounded-lg bg-gradient-to-r from-gray-100 to-gray-200 border border-gray-300">
                <h3 className="font-semibold text-lg" style={{ color: primaryColor, fontFamily: titleFont }}>
                  MODALIDADE DE COMPRA: {data?.modalidadeCompra || 'LICITAÇÃO'} - {data?.numeroLicitacao || '256255/2025'}
                </h3>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4" style={{ color: primaryColor, fontFamily: titleFont }}>Itens</h3>
              <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: primaryColor, fontFamily: titleFont }}>Item</th>
                    <th className="px-4 py-3 text-left font-semibold" style={{ color: primaryColor, fontFamily: titleFont }}>Descrição</th>
                    <th className="px-4 py-3 text-center font-semibold" style={{ color: primaryColor, fontFamily: titleFont }}>Qtd</th>
                    <th className="px-4 py-3 text-center font-semibold" style={{ color: primaryColor, fontFamily: titleFont }}>Unidade</th>
                    <th className="px-4 py-3 text-right font-semibold" style={{ color: primaryColor, fontFamily: titleFont }}>Valor Unit.</th>
                    <th className="px-4 py-3 text-right font-semibold" style={{ color: primaryColor, fontFamily: titleFont }}>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.itens?.map((item: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border-r border-gray-200 px-4 py-3 text-center font-medium" style={{ color: primaryColor, fontFamily: bodyFont, fontSize: `${bodySize}px` }}>{index + 1}</td>
                      <td className="border-r border-gray-200 px-4 py-3" style={textStyle}>{item.descricao}</td>
                      <td className="border-r border-gray-200 px-4 py-3 text-center" style={textStyle}>{item.quantidade}</td>
                      <td className="border-r border-gray-200 px-4 py-3 text-center" style={textStyle}>{item.unidadeMedida || 'un'}</td>
                      <td className="border-r border-gray-200 px-4 py-3 text-right" style={textStyle}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorUnitario)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium" style={textStyle}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorTotal)}
                      </td>
                    </tr>
                  )) || (
                    <tr className="bg-white">
                      <td className="border-r border-gray-200 px-4 py-3 text-center font-medium" style={{ color: primaryColor, fontFamily: bodyFont, fontSize: `${bodySize}px` }}>1</td>
                      <td className="border-r border-gray-200 px-4 py-3" style={textStyle}>Item de exemplo com descrição mais detalhada para demonstrar o espaço maior</td>
                      <td className="border-r border-gray-200 px-4 py-3 text-center" style={textStyle}>7</td>
                      <td className="border-r border-gray-200 px-4 py-3 text-center" style={textStyle}>pct</td>
                      <td className="border-r border-gray-200 px-4 py-3 text-right" style={textStyle}>R$ 50,00</td>
                      <td className="px-4 py-3 text-right font-medium" style={textStyle}>R$ 350,00</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="mb-8">
              <div className="text-white p-6 rounded-lg shadow-lg" style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}>
                <h3 className="text-2xl font-bold text-center" style={{ fontFamily: titleFont }}>
                  Total do orçamento: {data?.valorTotal ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.valorTotal) : 'R$ 350,00'}
                </h3>
              </div>
            </div>

            {/* Observations */}
            {(data?.observacoes || !data) && (
              <div className="mb-8">
                <h3 className="font-semibold mb-3" style={{ color: primaryColor, fontFamily: titleFont }}>
                  Observações
                </h3>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm" style={textStyle}>{data?.observacoes || 'hgafh'}</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-sm border-t border-gray-200 pt-6 mt-8" style={textStyle}>
              <p className="mb-1">Validade: {layoutConfig?.validadeOrcamento || companyData?.validadeOrcamento || 30} dias</p>
              <p>Página 1</p>
            </div>
          </div>
        </div>
      )}

      {/* Vale Preview */}
      {(type === 'vale' || !type) && (
        <div className="bg-white shadow-lg">
          {/* Header com gradiente personalizado */}
          <div className="text-white p-6" style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: titleFont }}>
                  {companyData?.nome || 'Carregando...'}
                </h1>
                <div className="text-sm space-y-1 opacity-90">
                  <p>{companyData?.endereco}</p>
                  <p>CEP: {companyData?.cep} - {companyData?.cidade}/{companyData?.estado}</p>
                  <p>Tel: {companyData?.telefone} | {companyData?.email}</p>
                  <p>CNPJ: {companyData?.cnpj}</p>
                </div>
              </div>
              <div className="text-right bg-white/10 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-2" style={{ fontFamily: titleFont }}>
                  VALE
                </h2>
                <p className="text-sm">Nº {data?.numero || '03/2025'}</p>
                <p className="text-sm">Data: {data?.data || '09/09/2025'}</p>
              </div>
            </div>
          </div>
          
          <div className="p-8">
            {/* Empresa e Cliente */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3 border-b border-blue-200 pb-2" style={{ color: primaryColor, fontFamily: titleFont }}>
                  EMPRESA
                </h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-medium text-gray-900">{companyData?.nome || 'Carregando...'}</p>
                  {companyData?.razao_social && <p>Razão Social: {companyData.razao_social}</p>}
                  <p>CNPJ: {companyData?.cnpj}</p>
                  <p>Endereço: {companyData?.endereco}</p>
                  <p>Telefone: {companyData?.telefone}</p>
                  <p>Email: {companyData?.email}</p>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-3 border-b border-blue-200 pb-2" style={{ color: primaryColor, fontFamily: titleFont }}>
                  CLIENTE
                </h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-medium text-gray-900">{data?.cliente?.nome || 'Maria Santos'}</p>
                  <p>CPF: {data?.cliente?.cpf || '123.456.789-00'}</p>
                  <p>Telefone: {data?.cliente?.telefone || '(11) 88888-8888'}</p>
                  <p>Email: {data?.cliente?.email || 'maria@teste.com'}</p>
                </div>
              </div>
            </div>

            {/* Informações do Vale */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4" style={{ color: primaryColor }}>Detalhes do Vale</h3>
              <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <thead>
                  <tr style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}>
                    <th className="border-r border-blue-500 px-4 py-3 text-left text-white font-semibold">Descrição</th>
                    <th className="px-4 py-3 text-right text-white font-semibold">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="border-r border-gray-200 px-4 py-3 text-gray-700">{data?.descricao || 'Vale referente ao pagamento antecipado de serviços'}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{data?.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.valor) : 'R$ 200,00'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Valor Total */}
            <div className="mb-8">
              <div className="text-white p-6 rounded-lg shadow-lg" style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}>
                <h3 className="text-2xl font-bold text-center">
                  Valor Total: {data?.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.valor) : 'R$ 200,00'}
                </h3>
              </div>
            </div>

            {/* Observações */}
            {(data?.observacoes || !data) && (
              <div className="mb-8">
                <h3 className="font-semibold mb-3" style={{ color: primaryColor }}>
                  Observações
                </h3>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-sm text-gray-700">{data?.observacoes || 'Vale referente ao pagamento antecipado de serviços a serem prestados conforme acordo estabelecido.'}</p>
                </div>
              </div>
            )}

            {/* Assinatura */}
            <div className="mb-8">
              <h3 className="font-semibold mb-3" style={{ color: primaryColor }}>Assinatura</h3>
              <div className="bg-white border border-gray-200 p-8 rounded-lg text-center">
                <div className="border-b border-gray-300 mb-2 pb-1">
                  <span className="text-gray-400">_________________________________</span>
                </div>
                <p className="text-sm text-gray-600 font-medium">Assinatura do Responsável</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-6 mt-8">
              <p className="mb-1">Vale sem valor fiscal</p>
              <p>Página 1</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentPreview;