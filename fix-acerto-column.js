// Script para verificar e corrigir a visibilidade da coluna Acerto
console.log('🔍 Verificando configuração da coluna Acerto...');

// Simular o que acontece na interface
const allColumns = [
  { key: "dataPedido", label: "Data Pedido", essential: true },
  { key: "numeroOF", label: "Nº OF", essential: true },
  { key: "numeroDispensa", label: "Nº Dispensa", essential: false },
  { key: "cliente", label: "Cliente", essential: true },
  { key: "produto", label: "Produto Orçado / Vendido", essential: true },
  { key: "modalidade", label: "Modalidade", essential: true },
  { key: "valorVenda", label: "Valor Venda", essential: true },
  { key: "taxaCapitalPerc", label: "Taxa Capital %" },
  { key: "taxaCapitalVl", label: "Taxa VL Capital" },
  { key: "taxaImpostoPerc", label: "Taxa % Imposto" },
  { key: "taxaImpostoVl", label: "Taxa VL Imposto" },
  { key: "custoMercadoria", label: "Custo da Mercadoria" },
  { key: "somaCustoFinal", label: "Soma Custo Final", essential: true },
  { key: "lucroValor", label: "Lucro (R$)", essential: true },
  { key: "lucroPerc", label: "Lucro (%)", essential: true },
  { key: "dataRecebimento", label: "Data Recebimento", essential: true },
  { key: "paymentStatus", label: "Pagamento", essential: true },
  { key: "settlementStatus", label: "Acerto", essential: false },
];

console.log('\n=== CONFIGURAÇÃO ATUAL DAS COLUNAS ===');
allColumns.forEach(col => {
  console.log(`${col.key}: ${col.label} - Essential: ${col.essential || false}`);
});

// Verificar qual é o estado padrão das preferências
const defaultPrefs = {
  visible: Object.fromEntries(allColumns.map((c) => [c.key, !!c.essential])),
  density: "compact"
};

console.log('\n=== COLUNAS VISÍVEIS POR PADRÃO ===');
Object.entries(defaultPrefs.visible).forEach(([key, visible]) => {
  const column = allColumns.find(c => c.key === key);
  console.log(`${key} (${column?.label}): ${visible ? '✅ VISÍVEL' : '❌ OCULTA'}`);
});

console.log('\n🎯 DIAGNÓSTICO:');
if (!defaultPrefs.visible.settlementStatus) {
  console.log('❌ A coluna "Acerto" (settlementStatus) está OCULTA por padrão!');
  console.log('💡 SOLUÇÃO: O usuário precisa ativar a coluna no menu "Colunas" da interface.');
  console.log('📍 LOCALIZAÇÃO: Botão "Colunas" com ícone de sliders na área de filtros.');
} else {
  console.log('✅ A coluna "Acerto" deveria estar visível por padrão.');
}

console.log('\n📋 INSTRUÇÕES PARA O USUÁRIO:');
console.log('1. Acesse a página de Vendas');
console.log('2. Clique no botão "Colunas" (ícone de sliders)');
console.log('3. Marque a opção "Acerto" na lista de colunas');
console.log('4. A coluna com os status "Acertado" aparecerá na tabela');