'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function MinhaFicha() {
  const [user, setUser] = useState<any>(null)
  const [treinos, setTreinos] = useState<any[]>([])
  const [divisaoAtiva, setDivisaoAtiva] = useState('A')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const carregarTreino = async () => {
      // 1. Pega o aluno logado
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // 2. Busca os exercícios vinculados ao ID deste aluno
        const { data } = await supabase
          .from('exercicios')
          .select('*')
          .eq('aluno_id', user.id)
          .order('created_at', { ascending: true })
        
        if (data) setTreinos(data)
      }
      setLoading(false)
    }
    carregarTreino()
  }, [])

  const exerciciosFiltrados = treinos.filter(ex => ex.divisao === divisaoAtiva)

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-blue-500">Abrindo sua ficha...</div>

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* HEADER ESTILO APP */}
      <header className="p-6 pt-12 bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <h1 className="text-xl font-bold">Olá, {user?.email?.split('@')[0]} 👋</h1>
        <p className="text-gray-400 text-sm">Bom treino hoje!</p>
      </header>

      {/* SELETOR DE TREINO (TABS) */}
      <div className="flex overflow-x-auto p-4 gap-2 sticky top-[105px] bg-black z-10 scrollbar-hide">
        {['A', 'B', 'C', 'D', 'E'].map(letra => (
          <button
            key={letra}
            onClick={() => setDivisaoAtiva(letra)}
            className={`flex-none w-16 py-3 rounded-2xl font-bold transition-all ${
              divisaoAtiva === letra ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-gray-800 text-gray-500'
            }`}
          >
            {letra}
          </button>
        ))}
      </div>

      {/* LISTA DE EXERCÍCIOS */}
      <main className="p-4 space-y-4">
        {exerciciosFiltrados.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 italic">Nenhum exercício para o Treino {divisaoAtiva}.</p>
          </div>
        ) : (
          exerciciosFiltrados.map((ex) => (
            <div key={ex.id} className="bg-gray-900 p-5 rounded-3xl border border-gray-800 flex items-center justify-between group active:bg-gray-800 transition-colors">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-100">{ex.nome}</h3>
                <div className="flex gap-4 mt-1">
                  <span className="text-blue-500 font-mono text-sm">{ex.series} Séries</span>
                  <span className="text-gray-500 font-mono text-sm">{ex.repeticoes} Reps</span>
                </div>
              </div>
              
              {/* CHECKBOX DE CONCLUÍDO */}
              <div className="w-8 h-8 border-2 border-blue-600 rounded-full flex items-center justify-center group-active:bg-blue-600">
                <div className="w-4 h-4 bg-transparent rounded-full"></div>
              </div>
            </div>
          ))
        )}
      </main>

      {/* MENU INFERIOR FIXO */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 p-4 flex justify-around items-center">
         <button className="text-blue-500 flex flex-col items-center">
            <span className="text-xs mt-1">Minha Ficha</span>
         </button>
         <button onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')} className="text-gray-500 flex flex-col items-center">
            <span className="text-xs mt-1">Sair</span>
         </button>
      </nav>
    </div>
  )
}