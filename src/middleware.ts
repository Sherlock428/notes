import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Verificar se o usuário está acessando diretamente a página de checkout
  const isDirectCheckoutAccess = request.nextUrl.pathname === '/checkout_user';
  
  // Verificar se existem os dados necessários no cookie para acessar o checkout
  const hasPlanData = request.cookies.has('has_checkout_data');
  
  // Se o usuário está tentando acessar o checkout diretamente sem ter os dados
  if (isDirectCheckoutAccess && !hasPlanData) {
    // Redirecionar para a página inicial
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

// Configurar o middleware para ser executado em rotas específicas
export const config = {
  matcher: ['/checkout_user'],
} 