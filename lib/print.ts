"use client"

import { fmtCurrency } from "@/lib/format"
import { getConfig } from "@/lib/config"
// Removed empresa imports - system simplified
// Removed company-config imports - system simplified
import type { Orcamento } from "@/lib/orcamentos"
import type { OrcamentoLayoutConfig } from "@/lib/company-config"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

type DistribuicaoRow = { nome: string; total: number; totalBruto: number; totalDespesasIndiv: number; qtdAcertos: number }
type FaturamentoAno = { ano: number; total: number }

function customStyles(layout: any) {
  const cores = layout.cores || {}
  const tipografia = layout.tipografia || {}
  const layoutConfig = layout.layout || {}
  
  const {
    primaria: corPrimaria = "#1e40af",
    secundaria: corSecundaria = "#3b82f6",
    texto: corTexto = "#1f2937",
    textoSecundario: corTextoSecundario = "#6b7280",
    fundo: corFundo = "#ffffff",
    borda: corBorda = "#d1d5db"
  } = cores
  
  const {
    fonteFamilia: fontePrincipal = "Arial, sans-serif",
    tamanhoFonte: tamanhoFonteTexto = 14,
    tamanhoFonteTitulo = 18
  } = tipografia
  
  const {
    bordaRadius = 8,
    espacamento = 15,
    bordaTabela = 1,
    sombra = true
  } = layoutConfig
  
  const estiloHeader = layout.estiloHeader || "moderno"
  const corHeaderTabela = layout.corHeaderTabela || corPrimaria
  const corLinhasAlternadas = layout.corLinhasAlternadas || "#f9fafb"

  const headerStyles = {
    moderno: `
      background: linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%);
      border-radius: ${bordaRadius}px;
      ${sombra ? `box-shadow: 0 4px 20px rgba(30, 64, 175, 0.25);` : ''}
    `,
    classico: `
      background: ${corPrimaria};
      border-radius: 0;
      border-bottom: 4px solid ${corSecundaria};
    `,
    minimalista: `
      background: ${corFundo};
      color: ${corTexto} !important;
      border: 2px solid ${corBorda};
      border-radius: ${bordaRadius}px;
    `
  }

  return `
    <style>
      @page {
        size: A4;
        margin: 25mm 20mm 25mm 20mm;
      }
      * { box-sizing: border-box; }
      html, body { 
        padding: 0; 
        margin: 0; 
        font-family: '${fontePrincipal}', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
        color: ${corTexto};
        line-height: 1.5;
        background: ${corFundo};
      }
      .container { 
        width: 100%; 
        background: ${corFundo};
        padding: ${espacamento + 5}px;
        margin: 0 auto;
      }
      .doc-header {
        display: grid;
        grid-template-columns: 116px 1fr;
        gap: ${espacamento}px;
        align-items: center;
        ${headerStyles[estiloHeader as keyof typeof headerStyles] || headerStyles.moderno}
        color: ${estiloHeader === 'minimalista' ? corTexto : 'white'};
        padding: ${espacamento}px;
        margin-bottom: ${espacamento + 8}px;
        page-break-inside: avoid;
      }
      .logo {
        width: 48px; 
        height: 48px; 
        object-fit: contain; 
        background: ${estiloHeader === 'minimalista' ? corFundo : 'rgba(255, 255, 255, 0.1)'};
      }
      .logo-id {
        width: 80px; 
        height: auto; 
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        color: ${estiloHeader === 'minimalista' ? corTexto : 'white'};
        ${sombra ? 'text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);' : ''}
        padding: 6px 4px;
      }
      .logo-id .id-text {
        font-size: 32px;
        font-weight: 900;
        line-height: 0.9;
        margin-bottom: 4px;
      }
      .logo-id .distribuicao-text {
         font-size: 11px;
         font-weight: 600;
         margin-top: 2px;
         letter-spacing: 0.3px;
         line-height: 0.9;
         text-align: center;
       }
      .muted { color: ${corTextoSecundario}; font-size: 13px; font-weight: 500; }
      h1 { 
        font-size: ${tamanhoFonteTitulo}px; 
        margin: 0 0 6px 0; 
        line-height: 1.2; 
        font-weight: 700;
        ${sombra ? 'text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);' : ''}
      }
      .meta { 
        display: flex; 
        flex-wrap: wrap; 
        gap: 16px; 
        margin-top: 6px; 
        font-size: 13px; 
        color: ${estiloHeader === 'minimalista' ? corTextoSecundario : 'rgba(255, 255, 255, 0.9)'};
        font-weight: 500;
      }
      .section { 
        margin: ${espacamento + 16}px 0 0; 
        page-break-inside: avoid;
        orphans: 3;
        widows: 3;
      }
      .section h2 { 
        font-size: 18px; 
        margin: 0 0 16px 0; 
        color: ${corTexto}; 
        font-weight: 700;
        position: relative;
        padding-bottom: 8px;
        page-break-after: avoid;
      }
      .section h2::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 60px;
        height: 3px;
        background: linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%);
        border-radius: 2px;
      }
      table.list { 
        width: 100%; 
        border-collapse: collapse;
        page-break-inside: auto;
      }
      table.list thead {
        page-break-inside: avoid;
        page-break-after: avoid;
      }
      table.list tbody tr {
        page-break-inside: avoid;
      }
      table.list th, table.list td { 
        padding: 12px 16px; 
        border: 1px solid #cbd5e1;
        font-size: ${tamanhoFonteTexto - 1}px;
        page-break-inside: avoid;
      }
      table.list th:nth-child(1), table.list td:nth-child(1) { width: 5%; }
      table.list th:nth-child(2), table.list td:nth-child(2) { width: 55%; }
      table.list th:nth-child(3), table.list td:nth-child(3) { width: 12%; }
      table.list th:nth-child(4), table.list td:nth-child(4) { width: 8%; }
      table.list th:nth-child(5), table.list td:nth-child(5) { width: 10%; }
      table.list th:nth-child(6), table.list td:nth-child(6) { width: 10%; }
      table.list th { 
        background: #e2e8f0; 
        color: #1f2937 !important;
        text-align: left; 
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: ${tamanhoFonteTexto - 1}px;
        border: 1px solid #cbd5e1;
      }
      table.list tbody tr { background: white; }
      table.list tbody tr:nth-child(even) { background: #f8fafc; }
      table.list tr { page-break-inside: avoid; }
      .right { text-align: center; font-variant-numeric: tabular-nums; }
      .green { color: #059669; font-weight: 600; }
      .red { color: #dc2626; font-weight: 600; }
      .footer {
        margin-top: ${espacamento + 12}px; 
        padding-top: 16px; 
        font-size: 12px; 
        color: ${corTextoSecundario}; 
        display: flex; 
        justify-content: space-between;
        page-break-inside: avoid;
        font-weight: 500;
      }
      .two-cols { 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: ${espacamento}px; 
        margin: ${espacamento}px 0;
        page-break-inside: avoid;
      }
      .card { 
        padding: ${espacamento + 2}px; 
        background: #f8fafc;
        page-break-inside: avoid;
        position: relative;
      }
      .card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%);
      }
      .title-sm { 
        font-size: 13px; 
        color: ${corTextoSecundario}; 
        margin-bottom: 8px; 
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .strong { font-weight: 700; color: ${corTexto}; }
      .totals { 
        margin-top: ${espacamento}px; 
        width: 100%; 
        border-collapse: collapse;
        page-break-inside: avoid;
      }
      .totals td { padding: 16px ${espacamento}px; font-size: ${tamanhoFonteTexto}px; }
      .totals .label { text-align: right; font-weight: 600; color: ${corTexto}; }
      .totals .total-final { 
        font-weight: 700; 
        font-size: ${tamanhoFonteTexto + 6}px; 
        background: linear-gradient(135deg, ${corPrimaria} 0%, ${corSecundaria} 100%);
        color: white;
        ${sombra ? 'text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);' : ''}
      }
      .totals .total-final .label {
        color: rgba(255, 255, 255, 0.9);
      }
    </style>
  `
}

function baseStyles() {
  // Função mantida para compatibilidade - usa configuração padrão
  const defaultLayout: OrcamentoLayoutConfig = {
    cores: {
      primaria: "#171717",
      secundaria: "#404040",
      texto: "#1a1a1a",
      textoSecundario: "#64748b",
      fundo: "#ffffff",
      borda: "#e2e8f0",
      headerTabela: "#171717",
      linhasAlternadas: "#f9fafb"
    },
    tipografia: {
      fontePrincipal: "Inter",
      tamanhoFonteTitulo: 22,
      tamanhoFonteTexto: 14
    },
    layout: {
      bordaRadius: 12,
      espacamento: 20,
      sombra: true,
      estiloHeader: "moderno"
    }
  }
  return customStyles(defaultLayout)
}

// Função para gerar estilos com configuração personalizada
function getCustomizedStyles() {
  return `
    <style>
      @page {
        size: A4;
        margin: 20mm 18mm 20mm 18mm;
      }
      * { box-sizing: border-box; }
      html, body { 
        padding: 0; 
        margin: 0; 
        font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
        color: #1a1a1a;
        line-height: 1.5;
        background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      }
      .container {
        width: 100%; 
        max-width: 190mm;
        background: white;
        padding: 15mm;
        margin: 0 auto;
      }
      .doc-header {
        display: grid;
        grid-template-columns: 80px 1fr;
        gap: 15px;
        align-items: center;
        background: linear-gradient(135deg, #171717 0%, #404040 100%);
        color: white;
        padding: 15px;
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      .logo {
        width: 72px; 
        height: 72px; 
        object-fit: contain; 
        background: rgba(255, 255, 255, 0.1);
      }
      .muted { color: #64748b; font-size: 13px; font-weight: 500; }
      h1 { 
        font-size: 22px; 
        margin: 0 0 6px 0; 
        line-height: 1.2; 
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .meta { 
        display: flex; 
        flex-wrap: wrap; 
        gap: 16px; 
        margin-top: 6px; 
        font-size: 13px; 
        color: rgba(255, 255, 255, 0.9);
        font-weight: 500;
      }
      .kpis { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 16px 0 24px; 
        page-break-inside: avoid;
      }
      .kpis th, .kpis td { padding: 20px 24px; font-size: 14px; line-height: 1.6; }
      .kpis th { 
        text-align: left; 
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
        font-weight: 600; 
        color: #334155;
      }
      .kpis td.amount { text-align: right; font-variant-numeric: tabular-nums; }
      .section { 
        margin: 28px 0 0; 
        page-break-inside: avoid;
      }
      .section h2 { 
        font-size: 18px; 
        margin: 0 0 16px 0; 
        color: #1e293b; 
        font-weight: 700;
        position: relative;
        padding-bottom: 8px;
        page-break-after: avoid;
      }
      .section h2::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 60px;
        height: 3px;
        background: linear-gradient(135deg, #171717 0%, #404040 100%);
        border-radius: 2px;
      }
      table.list { 
        width: 100%; 
        border-collapse: collapse;
        page-break-inside: auto;
      }
      table.list th, table.list td { 
        padding: 12px 16px; 
        font-size: 13px;
        page-break-inside: avoid;
      }
      table.list th:nth-child(1), table.list td:nth-child(1) { width: 18%; }
      table.list th:nth-child(2), table.list td:nth-child(2) { width: 16%; }
      table.list th:nth-child(3), table.list td:nth-child(3) { width: 18%; }
      table.list th:nth-child(4), table.list td:nth-child(4) { width: 48%; }
      table.list th:nth-child(5), table.list td:nth-child(5) { width: 12.5%; }
      table.list th:nth-child(6), table.list td:nth-child(6) { width: 15.5%; }
      table.list th { 
        background: linear-gradient(135deg, #171717 0%, #2d2d2d 100%); 
        color: white !important;
        text-align: left; 
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: 12px;
      }
      table.list tbody tr:hover { background: #f8fafc; }
      table.list tbody tr:nth-child(even) { background: #f9fafb; }
      table.list tr { page-break-inside: avoid; }
      .right { text-align: right; font-variant-numeric: tabular-nums; }
      .green { color: #059669; font-weight: 600; }
      .red { color: #dc2626; font-weight: 600; }
      .footer {
        margin-top: 32px; 
        padding-top: 16px; 
        font-size: 12px; 
        color: #64748b; 
        display: flex; 
        justify-content: space-between;
        page-break-inside: avoid;
        font-weight: 500;
      }
      /* Orcamento specific */
      .two-cols { 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 20px; 
        margin: 20px 0;
        page-break-inside: avoid;
      }
      .card { 
        padding: 20px; 
        background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
        page-break-inside: avoid;
        position: relative;
      }
      .card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(135deg, #171717 0%, #404040 100%);
      }
      .title-sm { 
        font-size: 13px; 
        color: #64748b; 
        margin-bottom: 8px; 
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .strong { font-weight: 700; color: #1e293b; }
      .totals { 
        margin-top: 20px; 
        width: 100%; 
        border-collapse: collapse;
        page-break-inside: avoid;
      }
      .totals td { padding: 16px 20px; font-size: 14px; }
      .totals .label { text-align: right; font-weight: 600; color: #334155; }
      .totals .total-final { 
        font-weight: 700; 
        font-size: 16px; 
        background: linear-gradient(135deg, #171717 0%, #404040 100%);
        color: white;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
      .totals .total-final .label {
        color: rgba(255, 255, 255, 0.9);
      }
    </style>
  `
}

export function openPrintWindow(html: string, title = "Documento") {
  const w = window.open("", "_blank", "noopener,noreferrer,width=1024,height=768")
  if (!w) return
  w.document.open()
  w.document.write(`
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
      </head>
      <body>
        ${html}
        <script>
          try {
            setTimeout(() => { window.focus(); window.print(); }, 150);
          } catch (e) {}
        </script>
      </body>
    </html>
  `)
  w.document.close()
}

// Função para converter cores oklch para rgb
function convertOklchToRgb(oklchStr: string): string {
  // Extrair valores oklch
  const match = oklchStr.match(/oklch\(([^)]+)\)/)
  if (!match) return oklchStr
  
  const values = match[1].split(' ').map(v => parseFloat(v.trim()))
  const [l, c, h] = values
  
  // Conversão simplificada oklch para rgb
  // Para cores neutras (c=0), usar apenas lightness
  if (c === 0) {
    const gray = Math.round(l * 255)
    return `rgb(${gray}, ${gray}, ${gray})`
  }
  
  // Para cores com chroma, usar aproximações
  const hueRad = (h || 0) * Math.PI / 180
  const a = c * Math.cos(hueRad)
  const b = c * Math.sin(hueRad)
  
  // Conversão aproximada LAB para RGB
  let r = l + 0.3963377774 * a + 0.2158037573 * b
  let g = l - 0.1055613458 * a - 0.0638541728 * b
  let blue = l - 0.0894841775 * a - 1.2914855480 * b
  
  // Normalizar para 0-255
  r = Math.max(0, Math.min(255, Math.round(r * 255)))
  g = Math.max(0, Math.min(255, Math.round(g * 255)))
  blue = Math.max(0, Math.min(255, Math.round(blue * 255)))
  
  return `rgb(${r}, ${g}, ${blue})`
}

// Função para converter CSS com oklch para rgb
function convertOklchInCSS(cssText: string): string {
  return cssText.replace(/oklch\([^)]+\)/g, (match) => {
    return convertOklchToRgb(match)
  }).replace(/hsl\(var\([^)]+\)\)/g, 'rgb(37, 37, 37)') // Fallback para variáveis CSS
    .replace(/var\(--[^)]+\)/g, 'rgb(37, 37, 37)') // Fallback para todas as variáveis CSS
}

// Função para gerar PDF como blob (para anexos de e-mail)
export async function generatePDFBlob(html: string, title = "Documento"): Promise<Blob> {
  try {
    // Criar um elemento temporário para renderizar o HTML
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '-9999px'
    tempDiv.style.width = '210mm' // A4 width
    tempDiv.style.backgroundColor = 'white'
    
    // Converter oklch para rgb nos estilos base
    const convertedStyles = convertOklchInCSS(baseStyles().replace('<style>', '').replace('</style>', ''))
    
    // Adicionar estilos e conteúdo
    tempDiv.innerHTML = `
      <style>
        ${convertedStyles}
        /* Fallback colors for html2canvas */
        :root {
          --background: rgb(255, 255, 255);
          --foreground: rgb(37, 37, 37);
          --card: rgb(255, 255, 255);
          --card-foreground: rgb(37, 37, 37);
          --primary: rgb(52, 52, 52);
          --primary-foreground: rgb(251, 251, 251);
          --secondary: rgb(247, 247, 247);
          --secondary-foreground: rgb(52, 52, 52);
          --muted: rgb(247, 247, 247);
          --muted-foreground: rgb(142, 142, 142);
          --accent: rgb(247, 247, 247);
          --accent-foreground: rgb(52, 52, 52);
          --destructive: rgb(239, 68, 68);
          --destructive-foreground: rgb(255, 255, 255);
          --border: rgb(235, 235, 235);
          --input: rgb(235, 235, 235);
          --ring: rgb(180, 180, 180);
        }
        /* Forçar cores específicas para evitar problemas com html2canvas */
        .text-green-600 { color: rgb(22, 163, 74) !important; }
        .text-red-600 { color: rgb(220, 38, 38) !important; }
        * { color: rgb(37, 37, 37) !important; }
        .doc-header * { color: white !important; }
        .amount { color: rgb(37, 37, 37) !important; }
        strong { color: rgb(37, 37, 37) !important; }
      </style>
      <div class="container">${html}</div>
    `
    
    document.body.appendChild(tempDiv)
    
    // Aguardar um momento para renderização
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Capturar como canvas com otimizações de tamanho
    const canvas = await html2canvas(tempDiv, {
      scale: 1.5, // Qualidade otimizada (reduzido de 2 para 1.5)
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794, // A4 width in pixels at 96 DPI
      logging: false, // Desabilitar logs para melhor performance
      removeContainer: true // Remover container após captura
    })
    
    // Remover elemento temporário
    document.body.removeChild(tempDiv)
    
    // Criar PDF com compressão
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true // Habilitar compressão do PDF
    })

    // Usar JPEG com qualidade otimizada para reduzir tamanho
    const imgData = canvas.toDataURL('image/jpeg', 0.85)
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 295 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    // Se o conteúdo cabe em uma página, adicionar apenas uma página
    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight)
    } else {
      // Se o conteúdo é maior que uma página, dividir em múltiplas páginas
      let heightLeft = imgHeight
      let position = 0
      
      // Adicionar primeira página
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      // Adicionar páginas adicionais apenas se necessário
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
    }
    
    // Retornar como blob
    return pdf.output('blob')
    
  } catch (error) {
    console.error('Erro ao gerar PDF blob:', error)
    throw new Error('Erro ao gerar PDF')
  }
}

export async function downloadPDF(html: string, title = "Documento") {
  try {
    // Criar um elemento temporário para renderizar o HTML
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.left = '-9999px'
    tempDiv.style.top = '-9999px'
    tempDiv.style.width = '210mm' // A4 width
    tempDiv.style.backgroundColor = 'white'
    
    // Converter oklch para rgb nos estilos base
    const convertedStyles = convertOklchInCSS(baseStyles().replace('<style>', '').replace('</style>', ''))
    
    // Adicionar estilos e conteúdo com cores profissionais melhoradas
    tempDiv.innerHTML = `
      <style>
        ${convertedStyles}
        /* Cores profissionais para o documento */
        :root {
          --background: rgb(255, 255, 255);
          --foreground: rgb(30, 41, 59);
          --card: rgb(255, 255, 255);
          --card-foreground: rgb(30, 41, 59);
          --primary: rgb(37, 99, 235);
          --primary-foreground: rgb(255, 255, 255);
          --secondary: rgb(241, 245, 249);
          --secondary-foreground: rgb(30, 41, 59);
          --muted: rgb(248, 250, 252);
          --muted-foreground: rgb(100, 116, 139);
          --accent: rgb(59, 130, 246);
          --accent-foreground: rgb(255, 255, 255);
          --border: rgb(226, 232, 240);
        }
        
        /* Estilos profissionais para o orçamento */
        .doc-header {
          background: linear-gradient(135deg, rgb(37, 99, 235) 0%, rgb(59, 130, 246) 100%) !important;
          color: white !important;
          padding: 20px !important;
          border-radius: 8px !important;
          margin-bottom: 30px !important;
        }
        
        .doc-header * {
          color: white !important;
        }
        
        .doc-title {
          font-size: 24px !important;
          font-weight: 700 !important;
          margin-bottom: 8px !important;
        }
        
        .doc-subtitle {
          font-size: 16px !important;
          opacity: 0.9 !important;
        }
        
        .company-info {
          background: rgb(248, 250, 252) !important;
          padding: 16px !important;
          border-radius: 6px !important;
          border-left: 4px solid rgb(37, 99, 235) !important;
          margin-bottom: 20px !important;
        }
        
        .client-info {
          background: rgb(255, 255, 255) !important;
          border: 1px solid rgb(226, 232, 240) !important;
          padding: 16px !important;
          border-radius: 6px !important;
          margin-bottom: 20px !important;
        }
        
        .items-table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 20px 0 !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
          border-radius: 6px !important;
          overflow: hidden !important;
        }
        
        .items-table th {
          background: rgb(37, 99, 235) !important;
          color: white !important;
          padding: 12px 8px !important;
          text-align: left !important;
          font-weight: 600 !important;
          font-size: 14px !important;
        }
        
        .items-table td {
          padding: 10px 8px !important;
          border-bottom: 1px solid rgb(226, 232, 240) !important;
          color: rgb(30, 41, 59) !important;
          font-size: 13px !important;
        }
        
        .items-table tbody tr:nth-child(even) {
          background: rgb(248, 250, 252) !important;
        }
        
        .total-section {
          background: rgb(37, 99, 235) !important;
          color: white !important;
          padding: 16px !important;
          border-radius: 6px !important;
          margin: 20px 0 !important;
          text-align: right !important;
        }
        
        .total-label {
          font-size: 18px !important;
          font-weight: 600 !important;
        }
        
        .total-value {
          font-size: 24px !important;
          font-weight: 700 !important;
        }
        
        .observations {
          background: rgb(255, 251, 235) !important;
          border: 1px solid rgb(251, 191, 36) !important;
          padding: 16px !important;
          border-radius: 6px !important;
          margin: 20px 0 !important;
        }
        
        .observations h3 {
          color: rgb(146, 64, 14) !important;
          margin-bottom: 8px !important;
          font-size: 16px !important;
        }
        
        .validity {
          background: rgb(240, 253, 244) !important;
          border: 1px solid rgb(34, 197, 94) !important;
          padding: 12px !important;
          border-radius: 6px !important;
          color: rgb(21, 128, 61) !important;
          font-weight: 500 !important;
          text-align: center !important;
        }
        
        /* Forçar cores específicas */
        * { color: rgb(30, 41, 59) !important; }
        .amount { color: rgb(30, 41, 59) !important; }
        strong { color: rgb(30, 41, 59) !important; }
        
        /* Layout melhorado */
        .container {
          max-width: 210mm !important;
          margin: 0 auto !important;
          padding: 20px !important;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
          line-height: 1.5 !important;
        }
      </style>
      <div class="container">${html}</div>
    `
    
    document.body.appendChild(tempDiv)
    
    // Aguardar um momento para renderização
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Usar html2canvas para gerar o PDF diretamente
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      height: tempDiv.scrollHeight,
      logging: false,
      removeContainer: true,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // Garantir que as fontes sejam carregadas no clone
        const clonedDiv = clonedDoc.querySelector('.container') as HTMLElement
        if (clonedDiv) {
          clonedDiv.style.fontFamily = 'Arial, sans-serif'
        }
      }
    })
    
    // Remover elemento temporário
    document.body.removeChild(tempDiv)
    
    // Criar PDF otimizado
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    })

    const imgData = canvas.toDataURL('image/png', 0.95)
    const imgWidth = 210
    const pageHeight = 297 // A4 height
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const margin = 10
    
    if (imgHeight <= pageHeight - (margin * 2)) {
      // Documento cabe em uma página
      pdf.addImage(imgData, 'PNG', 0, margin, imgWidth, imgHeight)
    } else {
      // Dividir em múltiplas páginas
      const pageContentHeight = pageHeight - (margin * 2)
      const totalPages = Math.ceil(imgHeight / pageContentHeight)
      
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage()
        
        const yOffset = -(i * pageContentHeight)
        pdf.addImage(imgData, 'PNG', 0, yOffset + margin, imgWidth, imgHeight)
      }
    }
    
    // Fazer download direto do arquivo PDF
    const fileName = `${title.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_')}.pdf`
    pdf.save(fileName)
    
    console.log('PDF gerado e baixado com sucesso:', fileName)
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    // Em ambiente de navegador, mostrar alert
    if (typeof window !== 'undefined') {
      alert('Erro ao gerar PDF. Tente novamente.')
    }
  }
}

async function currentHeader() {
  // System simplified - using general config instead of empresa
  let cfg = getConfig() || {}
  
  console.log('🔍 [currentHeader] Configuração inicial:', cfg)
  
  // Sempre tentar carregar do backend para garantir dados atualizados
  try {
    const { loadConfig } = await import('./config')
    cfg = await loadConfig()
    console.log('✅ [currentHeader] Configuração carregada do backend:', cfg)
  } catch (error) {
    console.error('❌ [currentHeader] Erro ao carregar configuração:', error)
    cfg = getConfig() || {} // Usar configuração padrão
  }
  
  // Verificar se ainda não temos dados essenciais
  if (!cfg || !cfg.nome) {
    console.warn('⚠️ [currentHeader] Configuração vazia ou sem nome, usando fallback')
    // Tentar fazer uma requisição direta à API como fallback
    try {
      const response = await fetch('/api/config')
      if (response.ok) {
        const apiConfig = await response.json()
        console.log('🔄 [currentHeader] Dados da API direta:', apiConfig)
        cfg = {
          nome: apiConfig.nome || 'LP IND',
          nomeDoSistema: apiConfig.nome_do_sistema || 'LP IND',
          razaoSocial: apiConfig.razao_social || '',
          cnpj: apiConfig.cnpj || '',
          endereco: apiConfig.endereco || '',
          telefone: apiConfig.telefone || '',
          email: apiConfig.email || '',
          logoUrl: apiConfig.logo_url || ''
        }
      }
    } catch (fetchError) {
      console.error('❌ [currentHeader] Erro no fallback da API:', fetchError)
    }
  }

  // Função para verificar e sanitizar URLs de logo
  const sanitizeLogoUrl = (url: string | undefined): string => {
    if (!url || url.trim().length === 0) {
      return "/placeholder.svg?height=64&width=64"
    }
    
    // Verificar se é um link do Google Drive e substituir por placeholder
    if (url.includes('drive.google.com') || url.includes('googleusercontent.com')) {
      console.warn('URL do Google Drive detectada no logo, usando placeholder para evitar erro CORS:', url)
      return "/placeholder.svg?height=64&width=64"
    }
    
    return url
  }

  const logoUrl = cfg.logoUrl && String(cfg.logoUrl).trim().length > 0
      ? cfg.logoUrl
      : "/placeholder.svg?height=64&width=64"

  const headerData = {
    nome: (cfg.nome || "Minha Empresa") as string,
    nomeDoSistema: (cfg.nomeDoSistema || "LP IND") as string,
    razaoSocial: (cfg.razaoSocial || "") as string,
    cnpj: (cfg.cnpj || "") as string,
    endereco: (cfg.endereco || "") as string,
    telefone: (cfg.telefone || "") as string,
    email: (cfg.email || "") as string,
    logoUrl: sanitizeLogoUrl(logoUrl),
  }
  
  console.log('📋 [currentHeader] Dados finais do cabeçalho:', headerData)
  
  return headerData
}

/**
 * Estilos CSS específicos para o relatório financeiro
 */
function getReportStyles() {
  return `
    <style>
      .report-container {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 210mm;
        margin: 0 auto;
        padding: 20px;
        background: white;
        color: #333;
        line-height: 1.6;
      }

      .report-header {
        display: flex;
        align-items: flex-start;
        gap: 20px;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 3px solid #2563eb;
      }

      .header-logo img {
        width: 80px;
        height: 80px;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .header-content {
        flex: 1;
      }

      .report-title {
        font-size: 24px;
        font-weight: 700;
        color: #1e40af;
        margin: 0 0 5px 0;
      }

      .report-subtitle {
        font-size: 18px;
        font-weight: 600;
        color: #374151;
        margin: 0 0 15px 0;
      }

      .company-info {
        margin-top: 10px;
      }

      .company-name {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 5px;
      }

      .company-detail {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 3px;
      }

      .header-meta {
        text-align: right;
        min-width: 200px;
      }

      .period-info, .generation-info {
        margin-bottom: 8px;
        font-size: 14px;
      }

      .period-label, .generation-label {
        font-weight: 600;
        color: #374151;
      }

      .period-value, .generation-value {
        color: #6b7280;
        margin-left: 5px;
      }

      .report-section {
        margin-bottom: 35px;
        background: #f8fafc;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }

      .section-header {
        margin-bottom: 20px;
        text-align: center;
      }

      .section-title {
        font-size: 20px;
        font-weight: 700;
        color: #1e40af;
        margin: 0 0 5px 0;
      }

      .section-subtitle {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
      }

      .kpis-grid {
        display: flex;
        justify-content: center;
      }

      .kpis-table {
        width: 100%;
        max-width: 600px;
        border-collapse: collapse;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .kpi-row {
        border-bottom: 1px solid #e5e7eb;
      }

      .kpi-row:last-child {
        border-bottom: none;
      }

      .kpi-label {
        padding: 15px 20px;
        font-weight: 600;
        color: #374151;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .kpi-icon {
        font-size: 18px;
      }

      .kpi-value {
        padding: 15px 20px;
        text-align: right;
        font-weight: 700;
        font-size: 16px;
      }

      .kpi-value.positive {
        color: #059669;
      }

      .kpi-value.negative {
        color: #dc2626;
      }

      .kpi-value.neutral {
        color: #374151;
      }

      .table-container {
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
      }

      .table-header {
        background: #1e40af;
        color: white;
        padding: 15px 12px;
        text-align: left;
        font-weight: 600;
        font-size: 14px;
      }

      .amount-header, .count-header {
        text-align: right;
      }

      .year-cell, .amount-cell, .count-cell {
        padding: 12px;
        border-bottom: 1px solid #e5e7eb;
      }

      .year-cell {
        font-weight: 600;
        color: #374151;
      }

      .amount-cell {
        text-align: right;
        font-weight: 600;
        font-family: 'Courier New', monospace;
      }

      .amount-cell.positive {
        color: #059669;
      }

      .amount-cell.negative {
        color: #dc2626;
      }

      .count-cell {
        text-align: right;
        font-weight: 600;
        color: #374151;
      }

      .participant-row:nth-child(even) {
        background: #f9fafb;
      }

      .participant-name {
        padding: 12px;
        font-weight: 600;
        color: #374151;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .participant-icon {
        font-size: 16px;
      }

      .result-icon {
        margin-right: 5px;
      }

      .no-data {
        padding: 20px;
        text-align: center;
        color: #6b7280;
        font-style: italic;
        background: #f9fafb;
      }

      .report-footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #e5e7eb;
      }

      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 12px;
        color: #6b7280;
      }

      .footer-brand, .footer-page {
        font-weight: 500;
      }

      @media print {
        @page {
          size: A4;
          margin: 15mm 10mm 15mm 10mm;
        }
        
        .report-container {
          max-width: none;
          margin: 0;
          padding: 0;
        }
        
        .report-header {
          page-break-inside: avoid;
          page-break-after: avoid;
        }
        
        .report-section {
          page-break-inside: avoid;
          margin-bottom: 25px;
          orphans: 3;
          widows: 3;
        }
        
        .section-header {
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        
        .section-title {
          page-break-after: avoid;
        }
        
        .kpis-table {
          page-break-inside: avoid;
        }
        
        .data-table {
          page-break-inside: auto;
        }
        
        .data-table thead {
          page-break-inside: avoid;
          page-break-after: avoid;
        }
        
        .data-table tbody tr {
          page-break-inside: avoid;
        }
        
        .kpi-row {
          page-break-inside: avoid;
        }
        
        .participant-row {
          page-break-inside: avoid;
        }
        
        .table-container {
          page-break-inside: avoid;
        }
        
        .report-footer {
          page-break-inside: avoid;
        }
        
        /* Força quebra de página antes de seções específicas se necessário */
        .report-section:nth-child(3) {
          page-break-before: auto;
          margin-top: 40px;
        }
        
        .report-section:nth-child(4) {
          page-break-before: always;
          margin-top: 0;
        }
        
        /* Melhor controle de quebras para tabelas grandes */
        .participants-table {
          page-break-before: auto;
        }
        
        .participants-table thead {
          page-break-after: avoid;
        }
        
        .participants-table tbody tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        
        /* Evita quebras órfãs em tabelas */
        .data-table tbody {
          orphans: 3;
          widows: 3;
        }
        
        /* Garante espaçamento adequado entre seções */
        .report-section + .report-section {
          margin-top: 50px;
        }
        
        /* Força nova página para seção de distribuição se muito conteúdo */
        .report-section:last-child {
          page-break-before: auto;
        }
      }
    </style>
  `
}

/**
 * Monta o HTML de um Relatório com cabeçalho da empresa atual (Configurações Gerais).
 */
export async function makeReportHTML(args: {
  title?: string
  periodLabel: string
  resumo: { label: string; amount: number; highlight?: "green" | "red" }[]
  faturamentoAnual: FaturamentoAno[]
  distribuicao: DistribuicaoRow[]
}) {
  const hdr = await currentHeader()
  const now = new Date()
  const title = args.title ?? "Relatório Financeiro"

  const resumoRows = args.resumo
    .map((r) => {
      const cls = r.highlight === "green" ? "positive" : r.highlight === "red" ? "negative" : "neutral"
      const icon = r.highlight === "green" ? "📈" : r.highlight === "red" ? "📉" : "📊"
      return `
        <tr class="kpi-row ${cls}">
          <td class="kpi-label">
            <span class="kpi-icon">${icon}</span>
            ${r.label}
          </td>
          <td class="kpi-value ${cls}">${fmtCurrency(r.amount)}</td>
        </tr>`
    })
    .join("")

  const faturamentoRows =
    args.faturamentoAnual
      .map((r) => `
        <tr>
          <td class="year-cell">${r.ano}</td>
          <td class="amount-cell">${fmtCurrency(r.total)}</td>
        </tr>`)
      .join("") || `<tr><td colspan="2" class="no-data">📊 Sem dados disponíveis para o período</td></tr>`

  const distRows =
    args.distribuicao
      .map(
        (r) => {
          const netColor = r.total >= 0 ? "positive" : "negative"
          const netIcon = r.total >= 0 ? "✅" : "❌"
          return `
            <tr class="participant-row">
              <td class="participant-name">
                <span class="participant-icon">👤</span>
                ${r.nome}
              </td>
              <td class="amount-cell positive">${fmtCurrency(r.totalBruto)}</td>
              <td class="amount-cell negative">${fmtCurrency(r.totalDespesasIndiv)}</td>
              <td class="amount-cell ${netColor}">
                <span class="result-icon">${netIcon}</span>
                ${fmtCurrency(r.total)}
              </td>
              <td class="count-cell">${r.qtdAcertos}</td>
            </tr>`
        }
      )
      .join("") || `<tr><td colspan="5" class="no-data">👥 Nenhuma distribuição registrada no período</td></tr>`

  return `
    ${getReportStyles()}
    <div class="report-container">
      <div class="report-header">
        <div class="header-logo">
          <img src="${hdr.logoUrl}" alt="Logo da Empresa" crossorigin="anonymous" />
        </div>
        <div class="header-content">
          <h1 class="report-title">${hdr.nomeDoSistema}</h1>
          <h2 class="report-subtitle">${title}</h2>
          <div class="company-info">
            <div class="company-name">${hdr.nome}</div>
            ${hdr.razaoSocial ? `<div class="company-detail">Razão Social: ${hdr.razaoSocial}</div>` : ""}
            ${hdr.cnpj ? `<div class="company-detail">CNPJ: ${formatCNPJ(hdr.cnpj)}</div>` : ""}
            ${hdr.endereco ? `<div class="company-detail">📍 ${hdr.endereco}</div>` : ""}
          </div>
        </div>
        <div class="header-meta">
          <div class="period-info">
            <span class="period-label">📅 Período:</span>
            <span class="period-value">${args.periodLabel}</span>
          </div>
          <div class="generation-info">
            <span class="generation-label">🕒 Gerado em:</span>
            <span class="generation-value">${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}</span>
          </div>
        </div>
      </div>

      <div class="report-section">
        <div class="section-header">
          <h3 class="section-title">📊 Resumo Numérico</h3>
          <div class="section-subtitle">Principais indicadores financeiros do período</div>
        </div>
        <div class="kpis-grid">
          <table class="kpis-table">
            <tbody>${resumoRows}</tbody>
          </table>
        </div>
      </div>

      <div class="report-section">
        <div class="section-header">
          <h3 class="section-title">📈 Faturamento Anual</h3>
          <div class="section-subtitle">Evolução do faturamento por ano</div>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th class="table-header">📅 Ano</th>
                <th class="table-header amount-header">💰 Faturamento</th>
              </tr>
            </thead>
            <tbody>${faturamentoRows}</tbody>
          </table>
        </div>
      </div>

      <div class="report-section">
        <div class="section-header">
          <h3 class="section-title">👥 Distribuição por Participante</h3>
          <div class="section-subtitle">Análise detalhada de lucros e despesas por participante</div>
        </div>
        <div class="table-container">
          <table class="data-table participants-table">
            <thead>
              <tr>
                <th class="table-header">👤 Participante</th>
                <th class="table-header amount-header">💚 Lucro Bruto</th>
                <th class="table-header amount-header">💸 Despesas Indiv.</th>
                <th class="table-header amount-header">💰 Lucro Líquido</th>
                <th class="table-header count-header">📋 Qtd. Acertos</th>
              </tr>
            </thead>
            <tbody>${distRows}</tbody>
          </table>
        </div>
      </div>

      <div class="report-footer">
        <div class="footer-content">
          <div class="footer-left">
            <span class="footer-brand">🏢 Documento gerado pelo Sistema ERP</span>
          </div>
          <div class="footer-right">
            <span class="footer-page">📄 Página 1 de 1</span>
          </div>
        </div>
      </div>
    </div>
  `
}

/**
 * Documento do Orçamento: usa a Empresa atual das Configurações Gerais (Empresas).
 */
export async function makeOrcamentoHTML(
  orc: Orcamento | (Record<string, any> & { total?: number }),
  customLayoutConfig?: any
) {
  const hdr = await currentHeader()
  
  let layoutConfig: OrcamentoLayoutConfig
  
  if (customLayoutConfig) {
    // Usar configurações personalizadas passadas como parâmetro
    layoutConfig = {
      cores: {
        primaria: customLayoutConfig.cores?.primaria || "#2563eb",
        secundaria: customLayoutConfig.cores?.secundaria || "#64748b",
        texto: customLayoutConfig.cores?.texto || "#1f2937",
        textoSecundario: "#64748b",
        fundo: "#ffffff",
        borda: "#e2e8f0"
      },
      tipografia: {
        fonteFamilia: customLayoutConfig.tipografia?.fonteTexto || customLayoutConfig.tipografia?.fonteFamilia || "Arial, sans-serif",
        tamanhoFonte: customLayoutConfig.tipografia?.tamanhoTexto || 14,
        tamanhoFonteTitulo: customLayoutConfig.tipografia?.tamanhoTitulo || 18
      },
      layout: {
        bordaRadius: 8,
        espacamento: 15,
        sombra: true
      },
      configuracoes: {
        validadeDias: customLayoutConfig.configuracoes?.validadeDias || 30
      }
    }
  } else {
    // Carregar configurações de personalização salvas (fallback)
    const { getConfig } = await import('./config')
    const config = getConfig()
    
    layoutConfig = {
      cores: {
        primaria: config.corPrimaria || "#2563eb",
        secundaria: config.corSecundaria || "#64748b",
        texto: config.corTexto || "#1f2937",
        textoSecundario: "#64748b",
        fundo: "#ffffff",
        borda: "#e2e8f0"
      },
      tipografia: {
        fonteFamilia: config.fonteTexto || "Arial, sans-serif",
        tamanhoFonte: config.tamanhoTexto || 14,
        tamanhoFonteTitulo: config.tamanhoTitulo || 18
      },
      layout: {
        bordaRadius: 8,
        espacamento: 15,
        sombra: true
      },
      configuracoes: {
        validadeDias: config.validadeDias || 30
      }
    }
  }
  const data = new Date((orc as any).data)
  const itens = (orc as any).itens as Array<{
    descricao: string
    marca?: string
    unidade_medida?: string
    quantidade: number
    valor_unitario: number
    valorUnitario?: number
  }>

  const itensRows =
    itens
      ?.map((it, idx) => {
        const precoUnit = Number(it.valor_unitario || it.valorUnitario) || 0
        const total = (Number(it.quantidade) || 0) * precoUnit
        return `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(it.descricao)}</td>
        <td>${escapeHtml(it.marca || "")}</td>
        <td>${escapeHtml(it.unidade_medida || "un")}</td>
        <td class="right">${Number(it.quantidade) || 0}</td>
        <td class="right">${fmtCurrency(precoUnit)}</td>
        <td class="right">${fmtCurrency(total)}</td>
      </tr>
    `
      })
      .join("") || ""

  // Total: se não vier no objeto, calcula
  const totalCalc =
    (itens || []).reduce((acc, it) => {
      const precoUnit = Number(it.valor_unitario || it.valorUnitario) || 0
      return acc + (Number(it.quantidade) || 0) * precoUnit
    }, 0) || 0
  const total = Number((orc as any).total) || totalCalc

  return `
    ${customStyles(layoutConfig)}
    <div class="container">
      <div class="doc-header">
        <div class="logo-id">
          <div class="id-text">ID</div>
          <div class="distribuicao-text">DISTRIBUIÇÃO</div>
        </div>
        <div>
          <h1>${hdr.nomeDoSistema} - Orçamento #${(orc as any).numero}</h1>
          <div class="muted">Data: ${data.toLocaleDateString('pt-BR')}</div>
        </div>
      </div>

    <div class="two-cols">
      <div class="card">
        <div class="title-sm">Fornecedor</div>
        <div class="strong">${escapeHtml(hdr.nome)}</div>
        ${hdr.razaoSocial ? `<div>Razão Social: ${escapeHtml(hdr.razaoSocial)}</div>` : ""}
        ${hdr.cnpj ? `<div>CNPJ: ${formatCNPJ(hdr.cnpj)}</div>` : ""}
        ${hdr.endereco ? `<div>Endereço: ${escapeHtml(hdr.endereco)}</div>` : ""}
        ${hdr.telefone ? `<div style="display: flex; align-items: center; flex-wrap: wrap; gap: 5px;">Telefone: ${escapeHtml(hdr.telefone)} <svg style="display: inline-block; width: 18px; height: 18px; flex-shrink: 0; vertical-align: middle;" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.386"/></svg></div>` : ""}
        ${hdr.email ? `<div>Email: ${escapeHtml(hdr.email)}</div>` : ""}
      </div>
      <div class="card">
        <div class="title-sm">Cliente</div>
        <div class="strong">${escapeHtml((orc as any).cliente?.nome || "")}</div>
        ${(orc as any).cliente?.documento ? `<div>CNPJ: ${escapeHtml((orc as any).cliente.documento)}</div>` : ""}
        ${(orc as any).cliente?.endereco ? `<div>Endereço: ${escapeHtml((orc as any).cliente.endereco)}</div>` : ""}
        ${(orc as any).cliente?.telefone ? `<div>Telefone: ${escapeHtml((orc as any).cliente.telefone)}</div>` : ""}
        ${(orc as any).cliente?.email ? `<div>Email: ${escapeHtml((orc as any).cliente.email)}</div>` : ""}
      </div>
    </div>

    ${(orc as any).modalidade && (orc as any).modalidade !== "COMPRA_DIRETA" ? `
    <div style="text-align: center; font-size: 16px; font-weight: normal; margin: 20px 0; color: ${layoutConfig.cores?.texto || '#1f2937'};">
      MODALIDADE DE COMPRA: ${(orc as any).modalidade === "LICITADO" ? "LICITAÇÃO" : (orc as any).modalidade === "DISPENSA" ? "DISPENSA" : (orc as any).modalidade === "INEXIGIBILIDADE" ? "INEXIGIBILIDADE" : (orc as any).modalidade}${(orc as any).modalidade === "LICITADO" && (orc as any).numero_pregao ? ` - ${escapeHtml((orc as any).numero_pregao)}` : ""}${(orc as any).modalidade === "DISPENSA" && (orc as any).numero_dispensa ? ` - ${escapeHtml((orc as any).numero_dispensa)}` : ""}${(orc as any).numero_processo ? ` - Processo: ${escapeHtml((orc as any).numero_processo)}` : ""}
    </div>` : ""}

    <div class="section">
      <h2>Itens</h2>
      <table class="list">
        <thead>
          <tr>
            <th>#</th>
            <th>Descrição</th>
            <th>Marca</th>
            <th>Unidade</th>
            <th class="right">Qtd.</th>
            <th class="right">Valor unit.</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>${itensRows || `<tr><td colspan="7" class="muted">Nenhum item.</td></tr>`}</tbody>
      </table>

      <table class="totals">
        <tbody>
          <tr class="total-final">
            <td class="label" style="width: 80%;">Total do orçamento</td>
            <td class="right">${fmtCurrency(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${
      (orc as any).observacoes
        ? `
      <div class="section">
        <h2>Observações</h2>
        <div>${escapeHtml((orc as any).observacoes)}</div>
      </div>`
        : ""
    }

      <div class="footer">
        <div>Validade: ${layoutConfig.configuracoes?.validadeDias || 30} dias</div>
        <div>Página 1</div>
      </div>
    </div>
  `
}

function escapeHtml(s?: string) {
  if (!s) return ""
  return s.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&":
        return "&amp;"
      case "<":
        return "&lt;"
      case ">":
        return "&gt;"
      case '"':
        return "&quot;"
      case "'":
        return "&#039;"
      default:
        return m
    }
  })
}

function formatCNPJ(v?: string) {
  if (!v) return ""
  const digits = String(v).replace(/\D/g, "")
  if (digits.length !== 14) return v
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

// Função para gerar documento de vale
export function makeValeDocumentHTML(args: {
  cliente: { nome: string; cnpj?: string; cpf?: string }
  saldo: number
  movimentos: Array<{
    id: string
    data: string
    tipo: "credito" | "debito"
    valor: number
    descricao?: string
  }>
  config?: any
}) {
  const now = new Date()
  const { cliente, saldo, movimentos, config } = args

  // Calcular totais
  const totalCreditos = movimentos
    .filter(m => m.tipo === "credito")
    .reduce((sum, m) => sum + m.valor, 0)
  const totalDebitos = movimentos
    .filter(m => m.tipo === "debito")
    .reduce((sum, m) => sum + m.valor, 0)

  // Gerar linhas da tabela de movimentos
  const movimentoRows = movimentos
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .map(mov => {
      const data = new Date(mov.data).toLocaleDateString()
      const tipo = mov.tipo === "credito" ? "Crédito" : "Débito"
      const valor = fmtCurrency(mov.valor)
      const descricao = escapeHtml(mov.descricao || "-")
      const classe = mov.tipo === "credito" ? "text-green-600" : "text-red-600"
      return `<tr><td>${data}</td><td>${tipo}</td><td class="${classe}">${valor}</td><td>${descricao}</td></tr>`
    })
    .join("")

  return `
    <div class="doc-header">
      <div class="company-info">
        ${config?.logoUrl ? `<img src="${config.logoUrl}" alt="Logo" class="company-logo" />` : `
          <div class="logo-id">
            <div class="id-text">ID</div>
            <div class="distribuicao-text">DISTRIBUIÇÃO</div>
          </div>
        `}
        <div class="company-details">
          <strong>${escapeHtml(config?.nome || config?.razaoSocial || "LP IND")}</strong>
          ${config?.cnpj ? `<div>CNPJ: ${formatCNPJ(config.cnpj)}</div>` : ""}
          ${config?.endereco ? `<div>${escapeHtml(config.endereco)}</div>` : ""}
          ${config?.telefone ? `<div>Tel: ${escapeHtml(config.telefone)}</div>` : ""}
          ${config?.email ? `<div>Email: ${escapeHtml(config.email)}</div>` : ""}
        </div>
      </div>
      <div class="document-info">
        <h1>Documento de Vale</h1>
        <div class="meta">
          <span>Cliente: ${escapeHtml(cliente.nome)}</span>
          ${cliente.cnpj ? `<span>CNPJ: ${formatCNPJ(cliente.cnpj)}</span>` : ""}
          ${cliente.cpf ? `<span>CPF: ${cliente.cpf}</span>` : ""}
          <span>Emitido em: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>

    <table class="kpis">
      <thead><tr><th>Resumo</th><th>Valor</th></tr></thead>
      <tbody>
        <tr><td>Total de Créditos</td><td class="amount">${fmtCurrency(totalCreditos)}</td></tr>
        <tr><td>Total de Débitos</td><td class="amount">${fmtCurrency(totalDebitos)}</td></tr>
        <tr><td><strong>Saldo Atual</strong></td><td class="amount"><strong>${fmtCurrency(saldo)}</strong></td></tr>
      </tbody>
    </table>

    <div class="section">
      <h2>Histórico de Movimentações</h2>
      <table class="list">
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th class="right">Valor</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>${movimentoRows}</tbody>
      </table>
    </div>

    <div class="footer">
      <div>Documento gerado pelo ERP</div>
      <div>Página 1</div>
    </div>
  `
}

// Função para gerar extrato de despesas
export function makeExtratoValeHTML(args: {
  cliente: { nome: string; cnpj?: string; cpf?: string }
  movimentos: Array<{
    id: string
    data: string
    tipo: "credito" | "debito"
    valor: number
    descricao?: string
  }>
  periodo?: { inicio: string; fim: string }
  config?: any
}) {
  const now = new Date()
  const { cliente, movimentos, periodo, config } = args

  // Filtrar apenas débitos (despesas)
  const despesas = movimentos.filter(m => m.tipo === "debito")
  const totalDespesas = despesas.reduce((sum, m) => sum + m.valor, 0)

  // Gerar linhas da tabela de despesas
  const despesaRows = despesas
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .map(mov => {
      const data = new Date(mov.data).toLocaleDateString()
      const valor = fmtCurrency(mov.valor)
      const descricao = escapeHtml(mov.descricao || "-")
      return `<tr><td>${data}</td><td class="right">${valor}</td><td>${descricao}</td></tr>`
    })
    .join("")

  const periodoLabel = periodo 
    ? `${new Date(periodo.inicio).toLocaleDateString()} a ${new Date(periodo.fim).toLocaleDateString()}`
    : "Todos os períodos"

  return `
    <div class="doc-header">
      <div class="company-info">
        ${config?.logoUrl ? `<img src="${config.logoUrl}" alt="Logo" class="company-logo" />` : `
          <div class="logo-id">
            <div class="id-text">ID</div>
            <div class="distribuicao-text">DISTRIBUIÇÃO</div>
          </div>
        `}
        <div class="company-details">
          <strong>${escapeHtml(config?.nome || config?.razaoSocial || "LP IND")}</strong>
          ${config?.cnpj ? `<div>CNPJ: ${formatCNPJ(config.cnpj)}</div>` : ""}
          ${config?.endereco ? `<div>${escapeHtml(config.endereco)}</div>` : ""}
          ${config?.telefone ? `<div>Tel: ${escapeHtml(config.telefone)}</div>` : ""}
          ${config?.email ? `<div>Email: ${escapeHtml(config.email)}</div>` : ""}
        </div>
      </div>
      <div class="document-info">
        <h1>Extrato de Despesas - Vale</h1>
        <div class="meta">
          <span>Cliente: ${escapeHtml(cliente.nome)}</span>
          ${cliente.cnpj ? `<span>CNPJ: ${formatCNPJ(cliente.cnpj)}</span>` : ""}
          ${cliente.cpf ? `<span>CPF: ${cliente.cpf}</span>` : ""}
          <span>Período: ${periodoLabel}</span>
          <span>Emitido em: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>

    <table class="kpis">
      <thead><tr><th>Resumo</th><th>Valor</th></tr></thead>
      <tbody>
        <tr><td>Quantidade de Despesas</td><td class="amount">${despesas.length}</td></tr>
        <tr><td><strong>Total de Despesas</strong></td><td class="amount"><strong>${fmtCurrency(totalDespesas)}</strong></td></tr>
      </tbody>
    </table>

    <div class="section">
      <h2>Detalhamento das Despesas</h2>
      <table class="list">
        <thead>
          <tr>
            <th>Data</th>
            <th class="right">Valor</th>
            <th>Descrição</th>
          </tr>
        </thead>
        <tbody>${despesaRows}</tbody>
      </table>
    </div>

    <div class="footer">
      <div>Documento gerado pelo ERP</div>
      <div>Página 1</div>
    </div>
  `
}

// Função para gerar documento de outros negócios
export function makeOutroNegocioDocumentHTML(args: {
  negocio: {
    id: string
    pessoa: string
    tipo: 'emprestimo' | 'venda'
    descricao: string
    valor: number
    data: string
    jurosAtivo: boolean
    jurosMesPercent?: number
    pagamentos: Array<{ id: string; data: string; valor: number }>
  }
  saldoAtual?: {
    saldoComJuros: number
    jurosAcumulados: number
    saldoPrincipalRestante: number
  }
}) {
  const now = new Date()
  const { negocio, saldoAtual } = args
  const data = new Date(negocio.data)
  const tipoLabel = negocio.tipo === 'emprestimo' ? 'Empréstimo' : 'Venda'
  const totalPagamentos = negocio.pagamentos.reduce((acc, p) => acc + p.valor, 0)

  return `
    <div class="doc-header">
      <div class="logo"></div>
      <div>
        <h1>Documento de ${tipoLabel}</h1>
        <div class="meta">
          <span>ID: ${escapeHtml(negocio.id)}</span>
          <span>Data: ${data.toLocaleDateString('pt-BR')}</span>
          <span>Tipo: ${tipoLabel}</span>
          <span>Emitido em: ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}</span>
        </div>
      </div>
    </div>

    <div class="two-cols">
      <div class="card">
        <div class="title-sm">Detalhes da Operação</div>
        <div class="strong">Pessoa: ${escapeHtml(negocio.pessoa)}</div>
        <div>Descrição: ${escapeHtml(negocio.descricao)}</div>
        <div class="strong">Valor Original: ${fmtCurrency(negocio.valor)}</div>
        ${negocio.jurosAtivo ? `<div>Juros: ${negocio.jurosMesPercent}% ao mês</div>` : '<div>Sem juros</div>'}
      </div>
      <div class="card">
        <div class="title-sm">Situação Atual</div>
        ${saldoAtual ? `
          <div class="strong">Saldo com Juros: ${fmtCurrency(saldoAtual.saldoComJuros)}</div>
          <div>Juros Acumulados: ${fmtCurrency(saldoAtual.jurosAcumulados)}</div>
          <div>Principal Restante: ${fmtCurrency(saldoAtual.saldoPrincipalRestante)}</div>
        ` : `
          <div class="strong">Valor Total: ${fmtCurrency(negocio.valor)}</div>
        `}
        <div>Total Pago: ${fmtCurrency(totalPagamentos)}</div>
      </div>
    </div>

    <table class="kpis">
      <thead><tr><th>Informação</th><th>Valor</th></tr></thead>
      <tbody>
        <tr><td>Pessoa</td><td class="amount">${escapeHtml(negocio.pessoa)}</td></tr>
        <tr><td>Tipo</td><td class="amount">${tipoLabel}</td></tr>
        <tr><td>Valor Original</td><td class="amount">${fmtCurrency(negocio.valor)}</td></tr>
        <tr><td>Total Pago</td><td class="amount">${fmtCurrency(totalPagamentos)}</td></tr>
        ${saldoAtual ? `<tr><td>Saldo Atual</td><td class="amount">${fmtCurrency(saldoAtual.saldoComJuros)}</td></tr>` : ''}
        <tr><td>Data</td><td class="amount">${data.toLocaleDateString('pt-BR')}</td></tr>
      </tbody>
    </table>

    ${negocio.pagamentos.length > 0 ? `
    <div class="section">
      <h2>Histórico de Pagamentos</h2>
      <table class="kpis">
        <thead><tr><th>Data</th><th>Valor</th></tr></thead>
        <tbody>
          ${negocio.pagamentos.map(p => `
            <tr>
              <td>${new Date(p.data).toLocaleDateString('pt-BR')}</td>
              <td class="amount">${fmtCurrency(p.valor)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>` : ''}

    <div class="footer">
      <div>Documento gerado pelo ERP</div>
      <div>Página 1</div>
    </div>
  `
}
