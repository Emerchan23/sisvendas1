/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Configurar variáveis de ambiente para URLs dinâmicas
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 
                        (process.env.NODE_ENV === 'production' 
                          ? `/api`  // Usar caminho relativo em produção
                          : 'http://localhost:3145/api')
  },
  // Configurar pacotes externos para server components
  serverExternalPackages: ['better-sqlite3'],
  // Configurações experimentais removidas (não necessárias)
  // Configurar raiz do projeto para resolver warning de múltiplos lockfiles
  outputFileTracingRoot: process.cwd(),
  // Configurar headers para CORS
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

export default nextConfig
