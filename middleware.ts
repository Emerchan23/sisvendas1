import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas que não precisam de autenticação
const publicRoutes = ['/login', '/api/auth/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir acesso a arquivos estáticos
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/icons/')
  ) {
    return NextResponse.next()
  }

  // Verificar se é uma rota pública
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Para todas as outras rotas, deixar a API fazer a verificação de autenticação
  // O middleware apenas passa a requisição adiante
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes should not be processed by middleware)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
}