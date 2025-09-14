// Teste para verificar o problema do título
console.log('🧪 Testando lógica do título...');

// Simular diferentes valores de título
const testCases = [
  { titulo: 'Acerto Janeiro 2025', expected: 'Acerto Janeiro 2025' },
  { titulo: '   Acerto com espaços   ', expected: 'Acerto com espaços' },
  { titulo: '', expected: undefined },
  { titulo: '   ', expected: undefined },
  { titulo: null, expected: undefined },
  { titulo: undefined, expected: undefined }
];

testCases.forEach((testCase, index) => {
  const result = testCase.titulo ? testCase.titulo.trim() || undefined : undefined;
  const passed = result === testCase.expected;
  
  console.log(`\nTeste ${index + 1}:`);
  console.log(`  Input: ${JSON.stringify(testCase.titulo)}`);
  console.log(`  Expected: ${JSON.stringify(testCase.expected)}`);
  console.log(`  Result: ${JSON.stringify(result)}`);
  console.log(`  Status: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);
});

// Testar a lógica atual do código
console.log('\n🔍 Testando lógica atual do código:');
const titulo = ''; // Simular campo vazio
const resultadoAtual = titulo.trim() || undefined;
console.log(`Campo vazio ('') resulta em: ${JSON.stringify(resultadoAtual)}`);

// Testar lógica corrigida
const resultadoCorrigido = titulo.trim() !== '' ? titulo.trim() : undefined;
console.log(`Com lógica corrigida: ${JSON.stringify(resultadoCorrigido)}`);

console.log('\n✅ Teste concluído!');