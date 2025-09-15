declare global {
  interface Window {
    sonner?: {
      success: (message: string) => void
      error: (message: string) => void
      info: (message: string) => void
      warning: (message: string) => void
      message: (message: string) => void
    }
  }
}

export {}