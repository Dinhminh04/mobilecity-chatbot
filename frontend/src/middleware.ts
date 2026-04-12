import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('mc_token')?.value

  // Đang ở trang public thì bỏ qua
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    // Nếu đã login rồi thì redirect về dashboard
    if (token === 'mc_admin_authenticated') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Chưa login thì redirect về login
  if (!token || token !== 'mc_admin_authenticated') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
