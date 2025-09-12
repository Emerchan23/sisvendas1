export interface OrcamentoLayoutConfig {
  cores?: {
    primaria?: string
    secundaria?: string
    texto?: string
    textoSecundario?: string
    fundo?: string
    borda?: string
    headerTabela?: string
    linhasAlternadas?: string
  }
  tipografia?: {
    fontePrincipal?: string
    fonteFamilia?: string
    tamanhoFonteTitulo?: number
    tamanhoFonteTexto?: number
    tamanhoFonte?: number
  }
  layout?: {
    bordaRadius?: number
    espacamento?: number
    sombra?: boolean
    estiloHeader?: string
    bordaTabela?: number
  }
  configuracoes?: {
    mostrarLogo?: boolean
    mostrarAssinatura?: boolean
    mostrarObservacoes?: boolean
    validadeDias?: number
  }
}

export interface EmpresaConfig {
  layoutOrcamento?: OrcamentoLayoutConfig
}

// Funções de compatibilidade (podem ser implementadas posteriormente)
export function getActiveEmpresaConfig(): EmpresaConfig {
  return {}
}

export function saveEmpresaConfig(config: EmpresaConfig): void {
  // Implementação futura
}