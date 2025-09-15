// Debug específico para CNPJ 12345678000195

function debugCNPJ(cnpj) {
  console.log(`\n=== Debug CNPJ: ${cnpj} ===`);
  
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  console.log('CNPJ limpo:', cleanCNPJ);
  console.log('Comprimento:', cleanCNPJ.length);
  
  // Verifica se tem 14 dígitos
  if (cleanCNPJ.length !== 14) {
    console.log('❌ Falhou: não tem 14 dígitos');
    return false;
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
    console.log('❌ Falhou: todos os dígitos são iguais');
    return false;
  }
  
  console.log('✅ Passou: verificações básicas');
  
  // Validação do primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  let sum = 0
  console.log('\n--- Primeiro dígito verificador ---');
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(cleanCNPJ.charAt(i));
    const weight = weights1[i];
    const product = digit * weight;
    sum += product;
    console.log(`Posição ${i}: ${digit} × ${weight} = ${product} (soma: ${sum})`);
  }
  
  let remainder = sum % 11
  let digit1 = (remainder === 0 || remainder === 1) ? 0 : 11 - remainder
  const actualDigit1 = parseInt(cleanCNPJ.charAt(12));
  
  console.log(`Soma total: ${sum}`);
  console.log(`Resto da divisão por 11: ${remainder}`);
  console.log(`Dígito calculado: ${digit1}`);
  console.log(`Dígito atual: ${actualDigit1}`);
  
  if (actualDigit1 !== digit1) {
    console.log('❌ Falhou: primeiro dígito verificador incorreto');
    return false;
  }
  
  console.log('✅ Passou: primeiro dígito verificador');
  
  // Validação do segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  sum = 0
  console.log('\n--- Segundo dígito verificador ---');
  for (let i = 0; i < 13; i++) {
    const digit = parseInt(cleanCNPJ.charAt(i));
    const weight = weights2[i];
    const product = digit * weight;
    sum += product;
    console.log(`Posição ${i}: ${digit} × ${weight} = ${product} (soma: ${sum})`);
  }
  
  remainder = sum % 11
  let digit2 = (remainder === 0 || remainder === 1) ? 0 : 11 - remainder
  const actualDigit2 = parseInt(cleanCNPJ.charAt(13));
  
  console.log(`Soma total: ${sum}`);
  console.log(`Resto da divisão por 11: ${remainder}`);
  console.log(`Dígito calculado: ${digit2}`);
  console.log(`Dígito atual: ${actualDigit2}`);
  
  if (actualDigit2 !== digit2) {
    console.log('❌ Falhou: segundo dígito verificador incorreto');
    return false;
  }
  
  console.log('✅ Passou: segundo dígito verificador');
  console.log('\n🎉 CNPJ VÁLIDO!');
  return true;
}

// Testando CNPJs
debugCNPJ('12345678000195'); // Deveria ser inválido
debugCNPJ('11222333000181'); // Deveria ser válido