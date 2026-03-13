'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function MinhaFicha() {
  const [aluno, setAluno] = useState<any>(null)
  const [treinos, setTreinos] = useState<any>({})
  const [activeTab, setActiveTab] = useState('') 
  const [loading, setLoading] = useState(true)
  const [concluidos, setConcluidos] = useState<string[]>([]) 
  const router = useRouter()

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile?.role === 'personal') { router.push('/dashboard'); return }
      setAluno(profile)

      const { data: exs } = await supabase
        .from('exercicios')
        .select('*')
        .eq('aluno_id', user.id)
        .order('ordem', { ascending: true })

      if (exs && exs.length > 0) {
        const agrupados = exs.reduce((acc: any, curr: any) => {
          const cat = curr.divisao.toUpperCase() 
          if (!acc[cat]) acc[cat] = []
          acc[cat].push(curr)
          return acc
        }, {})
        
        setTreinos(agrupados)
        const abasExistentes = Object.keys(agrupados).sort()
        if (abasExistentes.length > 0) setActiveTab(abasExistentes[0])
      }

      const salvo = localStorage.getItem(`progresso_${user.id}`)
      if (salvo) setConcluidos(JSON.parse(salvo))
      setLoading(false)
    }
    fetchDados()
  }, [router])

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
    if (window.confirm("Deseja finalizar o treino e limpar o progresso?")) {
      alert(`Parabéns pelo treino de hoje! 🔥`)
      setConcluidos([])
      localStorage.removeItem(`progresso_${aluno.id}`)
    }
  }

  // --- FUNÇÃO DE MONITORAMENTO DE PROGRESSO (CORRIGIDA) ---
  const exerciciosAtuais = treinos[activeTab] || []
  const totalExercicios = exerciciosAtuais.length
  
  // Filtra apenas os concluídos que pertencem à aba ativa
  const concluidosNesteTreino = exerciciosAtuais.filter((ex: any) => 
    concluidos.includes(ex.id)
  ).length

  const porcentagem = totalExercicios > 0 ? Math.round((concluidosNesteTreino / totalExercicios) * 100) : 0

  // Função para as frases de motivação
  const getMensagem = (p: number) => {
    if (p === 0) return "Bora começar? O shape não vem sozinho! 💪"
    if (p > 0 && p < 50) return "No caminho certo. Mantenha o foco! ⚡"
    if (p >= 50 && p < 100) return "Mais da metade já foi. Não para agora! 🔥"
    if (p === 100) return "Treino Completo! Missão cumprida. 🏆"
    return "Faltam poucos para o descanso"
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-black italic">SINCRONIZANDO...</div>

  const abasDisponiveis = Object.keys(treinos).sort()

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans pb-24">
      
      <header className="py-8 text-center">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase">MEU<span className="text-blue-600">TREINO</span></h1>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mt-2 leading-none">
          {aluno?.full_name}
        </p>

        {/* BARRA DE PROGRESSO ATUALIZADA */}
        <div className="max-w-xs mx-auto mt-6 px-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Progresso</span>
            <span className="text-xs font-black italic text-white">{concluidosNesteTreino} / {totalExercicios}</span>
          </div>
          <div className="w-full bg-gray-900 h-3 rounded-full border border-gray-800 p-0.5 overflow-hidden">
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(37,99,235,0.4)]"
              style={{ width: `${porcentagem}%` }}
            ></div>
          </div>
          {/* FRASE DE MOTIVAÇÃO DINÂMICA */}
          <p className={`text-[9px] font-bold uppercase mt-2 tracking-[2px] transition-colors ${porcentagem === 100 ? 'text-green-500' : 'text-gray-600'}`}>
            {getMensagem(porcentagem)}
          </p>
        </div>
      </header>

      {/* SELETOR DE ABAS */}
      {abasDisponiveis.length > 0 && (
        <div className="flex justify-start gap-2 mb-8 bg-gray-900/50 p-2 rounded-3xl border border-gray-800 overflow-x-auto no-scrollbar">
          {abasDisponiveis.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab) }} // Removi o reset de concluídos aqui para persistir entre abas se necessário
              className={`flex-1 py-4 px-6 rounded-2xl font-black transition-all whitespace-nowrap text-[10px] uppercase tracking-widest ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                  : 'text-gray-600 hover:text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* LISTA DE EXERCÍCIOS */}
      <main className="space-y-4">
        {activeTab && treinos[activeTab]?.map((ex: any) => (
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
                {concluidos.includes(ex.id) && <span className="text-white font-black text-xl">✓</span>}
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* BOTÃO FINALIZAR */}
      {activeTab && (
        <div className="fixed bottom-6 left-0 right-0 px-6">
          <button 
            onClick={finalizarTreino}
            className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[4px] text-xs shadow-2xl active:scale-95 transition-all"
          >
            Finalizar {activeTab}
          </button>
        </div>
      )}
    </div>
  )
}