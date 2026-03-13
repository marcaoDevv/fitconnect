import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: usar getUser() e não getSession()
  const { data: { user } } = await supabase.auth.getUser()

console.log('PROXY - pathname:', request.nextUrl.pathname)
console.log('PROXY - user:', user?.email ?? 'null')

  const rotasProtegidas = ['/home', '/dashboard', '/minha-ficha', '/treino', '/visualizar', '/anamnese', '/anamnese-visualizar', '/chat']
  const acessandoRotaProtegida = rotasProtegidas.some(rota =>
    request.nextUrl.pathname.startsWith(rota)
  )

  if (acessandoRotaProtegida && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Remove o redirecionamento automático do login
  // Deixa o próprio page.tsx cuidar disso
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

