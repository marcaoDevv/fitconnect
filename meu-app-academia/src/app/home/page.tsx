'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function HomeAluno() {
  const [aluno, setAluno] = useState<any>(null)
  const [personal, setPersonal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile?.role === 'personal') { router.push('/dashboard'); return }
      setAluno(profile)

      // Busca dados do personal responsável
      if (profile?.personal_id) {
        const { data: p } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', profile.personal_id)
          .single()
        setPersonal(p)
      }

      setLoading(false)
    }
    fetchDados()
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-black animate-pulse uppercase tracking-widest">
      Carregando...
    </div>
  )

  const cards = [
    {
      titulo: 'Meus Treinos',
      descricao: 'Veja suas fichas de treino',
      icone: '🏋️',
      cor: 'bg-blue-600 hover:bg-blue-500',
      sombra: 'shadow-blue-900/40',
      rota: '/minha-ficha',
    },
    {
      titulo: 'Falar com Personal',
      descricao: 'Tire dúvidas com seu treinador',
      icone: '💬',
      cor: 'bg-gray-900 hover:bg-gray-800',
      sombra: 'shadow-gray-900/40',
      rota: '/chat',
      borda: 'border border-gray-800',
    },
    {
      titulo: 'Solicitar Avaliação',
      descricao: 'Peça uma avaliação física',
      icone: '📋',
      cor: 'bg-gray-900 hover:bg-gray-800',
      sombra: 'shadow-gray-900/40',
      rota: '/avaliacao',
      borda: 'border border-gray-800',
    },
    {
      titulo: 'Histórico',
      descricao: 'Veja seu progresso ao longo do tempo',
      icone: '📈',
      cor: 'bg-gray-900 hover:bg-gray-800',
      sombra: 'shadow-gray-900/40',
      rota: '/historico',
      borda: 'border border-gray-800',
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">

      {/* HEADER */}
      <header className="max-w-lg mx-auto flex justify-between items-center mb-12 pt-4">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter">
            FIT<span className="text-blue-600">CONNECT</span>
          </h1>
          <p className="text-gray-500 text-xs font-medium mt-1">
            Olá, <span className="text-white font-bold">{aluno?.full_name}</span> 👋
          </p>
        </div>
        <button
          onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
          className="p-3 bg-gray-900 border border-gray-800 rounded-2xl hover:bg-red-900/20 hover:border-red-900/50 transition-all group"
        >
          <span className="group-hover:scale-125 block transition-transform">🚪</span>
        </button>
      </header>

      <main className="max-w-lg mx-auto space-y-4">

        {/* CARD DO PERSONAL */}
        {personal && (
          <div className="bg-gray-900 border border-gray-800 rounded-[28px] p-5 flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-blue-900/20 shrink-0">
              {personal.full_name[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Seu Personal</p>
              <p className="font-bold text-white">{personal.full_name}</p>
              <p className="text-gray-500 text-xs font-mono">{personal.email}</p>
            </div>
          </div>
        )}

        {/* GRID DE CARDS */}
        <div className="grid grid-cols-2 gap-4">
          {cards.map((card) => (
            <button
              key={card.rota}
              onClick={() => router.push(card.rota)}
              className={`${card.cor} ${card.sombra} ${card.borda || ''} p-6 rounded-[28px] text-left shadow-lg active:scale-95 transition-all`}
            >
              <span className="text-3xl block mb-4">{card.icone}</span>
              <p className="font-black text-sm uppercase tracking-tight leading-tight">{card.titulo}</p>
              <p className="text-[10px] mt-1 opacity-60 font-medium leading-snug">{card.descricao}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}