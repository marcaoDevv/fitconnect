'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function AuthForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const invitedBy = searchParams.get('personalId')

  // Estados
  const [isLogin, setIsLogin] = useState(true) 
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'personal' | 'aluno'>('personal')
  const [loading, setLoading] = useState(false)

  // Lógica Automática de Cargo
  useEffect(() => {
    if (invitedBy) {
      setIsLogin(false)
      setRole('aluno')
    } else {
      setRole('personal')
    }
  }, [invitedBy])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const cleanEmail = email.toLowerCase().trim()

    if (isLogin) {
      // --- LOGIN ---
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: cleanEmail, 
        password 
      })
      
      if (error) {
        alert("E-mail ou senha incorretos.")
      } else {
        // BUSCA O PERFIL COMPLETO (Incluindo o status da anamnese)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, anamnese_completa')
          .eq('id', data.user.id)
          .single()

        // REDIRECIONAMENTO INTELIGENTE
        if (profile?.role === 'personal') {
          router.push('/dashboard')
        } else {
          // Lógica do Aluno: Já respondeu a saúde?
          if (profile?.anamnese_completa) {
            router.push('/minha-ficha')
          } else {
            router.push('/anamnese') // O "Pedágio"
          }
        }
      }
    } else {
      // --- CADASTRO ---
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email: cleanEmail, 
        password 
      })

      if (authData?.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          { 
            id: authData.user.id, 
            full_name: fullName, 
            email: cleanEmail,
            role: role,
            personal_id: invitedBy,
            anamnese_completa: false // Começa sempre como pendente
          }
        ])

        if (profileError) {
          alert("Erro no perfil: " + profileError.message)
        } else {
          alert('Cadastro realizado! Agora faça seu login para começar.')
          setIsLogin(true)
        }
      } else if (authError) {
        alert("Erro no cadastro: " + authError.message)
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 font-sans">
      <div className="bg-gray-900 p-8 rounded-[40px] border border-gray-800 w-full max-w-md shadow-2xl">
        <h1 className="text-4xl font-black italic mb-2 text-center bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
          FITCONNECT
        </h1>
        
        <p className="text-gray-500 text-center mb-8 uppercase tracking-[8px] text-[10px] font-black">
          {isLogin ? 'Welcome Back' : (invitedBy ? 'Join Trainer' : 'New Trainer')}
        </p>

        {!isLogin && (
          <div className={`p-4 rounded-2xl mb-6 text-center text-xs font-bold border ${
            invitedBy ? 'bg-blue-900/20 border-blue-500/30 text-blue-300' : 'bg-green-900/20 border-green-500/30 text-green-300'
          }`}>
            {invitedBy ? '🔗 Você está entrando como ALUNO' : '🚀 Criando conta de PERSONAL'}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-500 ml-2">Nome Completo</label>
              <input 
                type="text" placeholder="Seu nome" 
                className="w-full p-4 rounded-2xl bg-black border border-gray-800 focus:border-blue-600 outline-none transition-all"
                value={fullName} onChange={(e) => setFullName(e.target.value)} required
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 ml-2">E-mail</label>
            <input 
              type="email" placeholder="seu@email.com" 
              className="w-full p-4 rounded-2xl bg-black border border-gray-800 focus:border-blue-600 outline-none transition-all"
              value={email} onChange={(e) => setEmail(e.target.value)} required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-500 ml-2">Senha</label>
            <input 
              type="password" placeholder="••••••••" 
              className="w-full p-4 rounded-2xl bg-black border border-gray-800 focus:border-blue-600 outline-none transition-all"
              value={password} onChange={(e) => setPassword(e.target.value)} required
            />
          </div>

          <button 
            type="submit" disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 p-5 rounded-2xl font-black uppercase tracking-widest text-sm mt-4 shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
          >
            {loading ? 'Sincronizando...' : isLogin ? 'Entrar no App' : 'Confirmar Cadastro'}
          </button>
        </form>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-8 text-gray-500 text-xs font-bold hover:text-blue-400 transition-colors uppercase tracking-widest"
        >
          {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Clique aqui"}
        </button>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white italic">Carregando FitConnect...</div>}>
      <AuthForm />
    </Suspense>
  )
}