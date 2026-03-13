'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function MinhaFicha() {
  const [aluno, setAluno] = useState<any>(null)
  const [treinos, setTreinos] = useState<any>({})
  const [activeTab, setActiveTab] = useState('A') // Inicia no Treino A
  const [loading, setLoading] = useState(true)
  const [concluidos, setConcluidos] = useState<string[]>([]) 
  const router = useRouter()

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      // 1. Busca perfil
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setAluno(profile)

      // 2. Busca exercícios
      const { data: exs } = await supabase
        .from('exercicios')
        .select('*')
        .eq('aluno_id', user.id)
        .order('ordem', { ascending: true })

      if (exs) {
        const agrupados = exs.reduce((acc: any, curr: any) => {
          const cat = curr.divisao.toUpperCase().replace('TREINO ', '') // Normaliza para 'A', 'B', etc.
          if (!acc[cat]) acc[cat] = []
          acc[cat].push(curr)
          return acc
        }, {})
        setTreinos(agrupados)
      }

      // 3. Persistência: Carrega progresso do localStorage
      const salvo = localStorage.getItem(`progresso_${user.id}`)
      if (salvo) setConcluidos(JSON.parse(salvo))

      setLoading(false)
    }
    fetchDados()
  }, [router])

  // Salva no localStorage toda vez que marcar um exercício
  useEffect(() => {
    if (aluno?.id) {
      localStorage.setItem(`progresso_${aluno.id}`, JSON.stringify(concluidos))
    }
  }, [concluidos, aluno])

  const toggleConcluido = (id: string) => {
    setConcluidos(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }

  const finalizarTreino = () => {
    const confirmacao = window.confirm("Deseja finalizar o treino e limpar o progresso?")
    if (confirmacao) {
      alert(`Parabéns pelo treino de hoje! 🔥`)
      setConcluidos([])
      localStorage.removeItem(`progresso_${aluno.id}`)
    }
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-black italic">SINCRONIZANDO...</div>

  // Opções de abas fixas para o seletor
  const abasDisponiveis = ['A', 'B', 'C', 'D', 'E']

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans pb-24">
      
      <header className="py-8 text-center">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">MEU<span className="text-blue-600">TREINO</span></h1>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mt-2">
          {aluno?.full_name?.split(' ')[0] || 'Atleta'}
        </p>
      </header>

      {/* FILTRO DE ESTADO (Tab Switching) */}
      <div className="flex justify-between gap-2 mb-8 bg-gray-900/50 p-2 rounded-3xl border border-gray-800">
        {abasDisponiveis.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 rounded-2xl font-black transition-all ${
              activeTab === tab 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 scale-105' 
                : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* LISTA DE EXERCÍCIOS OU MENSAGEM DINÂMICA */}
      <main className="space-y-4">
        {treinos[activeTab] && treinos[activeTab].length > 0 ? (
          treinos[activeTab].map((ex: any) => (
            <div 
              key={ex.id}
              onClick={() => toggleConcluido(ex.id)}
              className={`p-6 rounded-[32px] border-2 transition-all active:scale-[0.97] cursor-pointer ${
                concluidos.includes(ex.id) ? 'bg-green-900/10 border-green-500/30' : 'bg-gray-900 border-gray-800'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className={`font-bold text-lg ${concluidos.includes(ex.id) ? 'text-green-500 line-through opacity-50' : 'text-white'}`}>
                    {ex.nome}
                  </h3>
                  <div className="flex gap-4 mt-2">
                    <span className="text-[10px] font-black uppercase text-blue-500">{ex.series} Séries</span>
                    <span className="text-[10px] font-black uppercase text-gray-500">{ex.repeticoes} Reps</span>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  concluidos.includes(ex.id) ? 'bg-green-500 border-green-500' : 'border-gray-700'
                }`}>
                  {concluidos.includes(ex.id) && <span className="text-black font-bold">✓</span>}
                </div>
              </div>
            </div>
          ))
        ) : (
          /* MENSAGEM DE ESTADO VAZIO DINÂMICA */
          <div className="text-center py-20 px-6 bg-gray-900/20 border-2 border-dashed border-gray-800 rounded-[40px] animate-in fade-in duration-700">
            <div className="text-4xl mb-4">😴</div>
            <h2 className="text-xl font-black uppercase italic text-gray-500">
              Treino {activeTab} não cadastrado
            </h2>
            <p className="text-gray-600 text-sm mt-2">
              Parece que hoje é seu dia de descanso. Aproveite para recuperar as fibras! 🍗
            </p>
          </div>
        )}
      </main>

      {/* BOTÃO FINALIZAR FIXO */}
      {treinos[activeTab] && (
        <div className="fixed bottom-6 left-0 right-0 px-6">
          <button 
            onClick={finalizarTreino}
            className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[4px] text-xs shadow-2xl active:scale-95 transition-all"
          >
            Finalizar Treino {activeTab}
          </button>
        </div>
      )}
    </div>
  )
}