import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Root language detection
  if (pathname === '/') {
    const cookieLocale = request.cookies.get('pref-locale')?.value

    if (cookieLocale === 'en') {
      return NextResponse.redirect(new URL('/en', request.url))
    }

    if (!cookieLocale) {
      const acceptLang = request.headers.get('accept-language') ?? ''
      const prefersEnglish = acceptLang.toLowerCase().split(',')[0].startsWith('en')

      if (prefersEnglish) {
        const response = NextResponse.redirect(new URL('/en', request.url))
        response.cookies.set('pref-locale', 'en', { maxAge: 31536000, path: '/', sameSite: 'lax' })
        return response
      } else {
        // Default to Japanese, set cookie
        const response = await updateSession(request)
        response.cookies.set('pref-locale', 'ja', { maxAge: 31536000, path: '/', sameSite: 'lax' })
        return response
      }
    }
  }

  // 2. Persist locale preference in cookie when browsing prefixed pages
  if (pathname.startsWith('/en/') || pathname === '/en') {
    const cookieLocale = request.cookies.get('pref-locale')?.value
    const response = await updateSession(request)
    if (cookieLocale !== 'en') {
      response.cookies.set('pref-locale', 'en', { maxAge: 31536000, path: '/', sameSite: 'lax' })
    }
    return response
  }

  // Persist ja preference when browsing explicit Japanese routes
  const explicitJaPaths = ['/posts', '/upload', '/me', '/apps']
  const isExplicitJa = explicitJaPaths.some(p => pathname.startsWith(`${p}/`) || pathname === p)
  if (isExplicitJa) {
    const cookieLocale = request.cookies.get('pref-locale')?.value
    const response = await updateSession(request)
    if (cookieLocale !== 'ja') {
      response.cookies.set('pref-locale', 'ja', { maxAge: 31536000, path: '/', sameSite: 'lax' })
    }
    return response
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * 静的ファイルと _next を除外
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
