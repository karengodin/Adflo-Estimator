import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from './lib/supabase'

// Routes accessible without auth
const PUBLIC_ROUTES = ['/auth/login', '/auth/callback']
// Routes that only need a share token (no auth required)
const TOKEN_ROUTES = ['/q/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request })
  const supabase = createMiddlewareClient(request, response)

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser()

  // Allow public routes
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) return response

  // Allow share-token questionnaire routes
  if (TOKEN_ROUTES.some(r => pathname.startsWith(r))) return response

  // All other routes require auth → redirect to login
  if (!user) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
