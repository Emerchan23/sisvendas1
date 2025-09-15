/**
 * Inicialização do scheduler de backup automático
 * Este arquivo é importado no layout principal para garantir que o scheduler seja iniciado
 */

let schedulerInitialized = false

export function initializeBackupScheduler() {
  // Evitar múltiplas inicializações
  if (schedulerInitialized) {
    return
  }

  // Só inicializar no lado do servidor
  if (typeof window !== 'undefined') {
    return
  }

  try {
    console.log('🔧 Inicializando scheduler de backup automático...')
    
    // Importação dinâmica para evitar problemas no cliente
    import('../workers/backup-scheduler').then((module) => {
      // O scheduler já tem auto-start configurado
      console.log('✅ Scheduler de backup inicializado')
    }).catch((error) => {
      console.error('❌ Erro ao inicializar scheduler:', error)
    })
    
    schedulerInitialized = true
    
  } catch (error) {
    console.error('❌ Erro na inicialização do scheduler:', error)
  }
}

// Auto-inicializar quando o módulo é importado
if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'development') {
  initializeBackupScheduler()
}