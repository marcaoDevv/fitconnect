import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Rotas protegidas — redireciona para login se não autenticado
  const rotasProtegidas = ['/dashboard', '/minha-ficha', '/treino', '/visualizar', '/anamnese', '/anamnese-visualizar']
  const acessandoRotaProtegida = rotasProtegidas.some(rota =>
    request.nextUrl.pathname.startsWith(rota)
  )

  if (acessandoRotaProtegida && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Se já está logado e tenta acessar a página de login, redireciona
  if (request.nextUrl.pathname === '/' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}