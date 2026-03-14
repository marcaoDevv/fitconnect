'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function ExercicioDetalhe({ nome }: { nome: string }) {
  const [gifUrl, setGifUrl] = useState<string | null>(null)
  const [loadingGif, setLoadingGif] = useState(true)

  useEffect(() => {
    const buscarGif = async () => {
      try {
        const nomeBusca = encodeURIComponent(nome.toLowerCase())
        const res = await fetch(
          `https://exercisedb.p.rapidapi.com/exercises/name/${nomeBusca}?limit=1`,
          {
            headers: {
              'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
              'x-rapidapi-key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY!,
            }
          }
        )
        const data = await res.json()
        if (data && data[0]?.gifUrl) {
          setGifUrl(data[0].gifUrl)
        }
      } catch {
        // silencia erro
      } finally {
        setLoadingGif(false)
      }
    }
    buscarGif()
  }, [nome])

  return (
    <div className="flex flex-col items-center gap-4">
      {loadingGif ? (
        <div className="w-full h-48 bg-gray-800 rounded-2xl animate-pulse flex items-center justify-center">
          <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">Buscando...</p>
        </div>
      ) : gifUrl ? (
        <img src={gifUrl} alt={nome} className="w-full max-w-xs rounded-2xl" />
      ) : (
        <div className="w-full h-32 bg-gray-800 rounded-2xl flex items-center justify-center">
          <p className="text-gray-600 text-xs font-bold uppercase tracking-widest">Gif não encontrado</p>
        </div>
      )}
    </div>
  )
}

export default function MinhaFicha() {
  const [aluno, setAluno] = useState<any>(null)
  const [treinos, setTreinos] = useState<any>({})
  const [activeTab, setActiveTab] = useState('')
  const [loading, setLoading] = useState(true)
  const [concluidos, setConcluidos] = useState<string[]>([])
  const [exercicioAberto, setExercicioAberto] = useState<any>(null)
  const [timer, setTimer] = useState<number | null>(null)
  const [timerAtivo, setTimerAtivo] = useState(false)
  const intervalRef = useRef<any>(null)
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

  // Timer de descanso
  useEffect(() => {
    if (!timerAtivo) {
      clearInterval(intervalRef.current)
      return
    }

    if (timer !== null && timer > 0) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(intervalRef.current)
            setTimerAtivo(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(intervalRef.current)
  }, [timerAtivo, timer === 0])

  const iniciarDescanso = (segundos: number) => {
    clearInterval(intervalRef.current)
    setTimerAtivo(false)
    setTimeout(() => {
      setTimer(segundos)
      setTimerAtivo(true)
    }, 50)
  }

  const toggleConcluido = (ex: any) => {
    const jaFeito = concluidos.includes(ex.id)
    if (jaFeito) {
      clearInterval(intervalRef.current)
      setTimerAtivo(false)
      setTimer(null)
    } else {
      iniciarDescanso(ex.descanso_segundos || 60)
    }
    setConcluidos(prev =>
      jaFeito ? prev.filter(item => item !== ex.id) : [...prev, ex.id]
    )
  }

  const finalizarTreino = () => {
    if (window.confirm("Deseja finalizar o treino e limpar o progresso?")) {
      alert(`Parabéns pelo treino de hoje! 🔥`)
      setConcluidos([])
      setTimer(null)
      setTimerAtivo(false)
      clearInterval(intervalRef.current)
      localStorage.removeItem(`progresso_${aluno.id}`)
    }
  }

  const exerciciosAtuais = treinos[activeTab] || []
  const totalExercicios = exerciciosAtuais.length
  const concluidosNesteTreino = exerciciosAtuais.filter((ex: any) => concluidos.includes(ex.id)).length
  const porcentagem = totalExercicios > 0 ? Math.round((concluidosNesteTreino / totalExercicios) * 100) : 0

  const getMensagem = (p: number) => {
    if (p === 0) return "Bora começar? O shape não vem sozinho! 💪"
    if (p === 100) return "MISSÃO CUMPRIDA! O treino tá pago. 🏆"
    return "Continua assim, você está indo muito bem! ⚡"
  }

  const formatarTimer = (s: number) => {
    const min = Math.floor(s / 60)
    const seg = s % 60
    return min > 0 ? `${min}:${seg.toString().padStart(2, '0')}` : `${seg}s`
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-black italic">
      SINCRONIZANDO...
    </div>
  )

  const abasDisponiveis = Object.keys(treinos).sort()

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans pb-40">

      {/* HEADER */}
      <header className="py-6 flex items-center justify-between mb-2">
        <button
          onClick={() => router.push('/home')}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <svg style={{width:22,height:22}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <h1 className="text-2xl font-black italic tracking-tighter uppercase">
            MEU<span className="text-blue-600">TREINO</span>
          </h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[4px]">
            {aluno?.full_name}
          </p>
        </div>
        <div className="w-6" />
      </header>

      {/* BARRA DE PROGRESSO */}
      <div className="max-w-xs mx-auto mb-8 px-4">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Progresso</span>
          <span className="text-xs font-black italic">{concluidosNesteTreino} / {totalExercicios}</span>
        </div>
        <div className="w-full bg-gray-900 h-3 rounded-full border border-gray-800 p-0.5 overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${porcentagem}%` }}
          />
        </div>
        <p className={`text-[9px] font-bold uppercase mt-2 tracking-[2px] transition-colors duration-500 text-center ${porcentagem === 100 ? 'text-green-500' : 'text-gray-600'}`}>
          {getMensagem(porcentagem)}
        </p>
      </div>

      {/* TIMER DE DESCANSO */}
      {timer !== null && (
        <div className={`max-w-xs mx-auto mb-6 p-4 rounded-2xl border text-center transition-all ${
          timerAtivo
            ? 'bg-blue-900/20 border-blue-500/40'
            : 'bg-green-900/20 border-green-500/40'
        }`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
            {timerAtivo ? 'Descanso' : 'Pronto!'}
          </p>
          <p className={`text-4xl font-black ${timerAtivo ? 'text-blue-400' : 'text-green-400'}`}>
            {timerAtivo ? formatarTimer(timer) : '✓'}
          </p>
          {!timerAtivo && (
            <p className="text-green-400 text-xs font-bold mt-1">Próximo exercício!</p>
          )}
        </div>
      )}

      {/* ABAS */}
      {abasDisponiveis.length > 0 && (
        <div className="flex justify-start gap-2 mb-6 bg-gray-900/50 p-2 rounded-3xl border border-gray-800 overflow-x-auto no-scrollbar">
          {abasDisponiveis.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-6 rounded-2xl font-black transition-all whitespace-nowrap text-[10px] uppercase tracking-widest ${
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
      <main className="space-y-3">
        {activeTab && treinos[activeTab]?.map((ex: any) => (
          <div key={ex.id}>
            <div
              onClick={() => toggleConcluido(ex)}
              className={`p-5 rounded-[28px] border-2 transition-all active:scale-[0.97] cursor-pointer ${
                concluidos.includes(ex.id)
                  ? 'bg-green-900/10 border-green-500/30'
                  : 'bg-gray-900 border-gray-800'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <h3 className={`font-bold text-lg ${concluidos.includes(ex.id) ? 'text-green-500 line-through opacity-50' : 'text-white'}`}>
                    {ex.nome}
                  </h3>
                  <div className="flex gap-4 mt-1">
                    <span className="text-[10px] font-black uppercase text-blue-500">{ex.series} Séries</span>
                    <span className="text-[10px] font-black uppercase text-gray-500">{ex.repeticoes} Reps</span>
                    <span className="text-[10px] font-black uppercase text-gray-600">{ex.descanso_segundos || 60}s descanso</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setExercicioAberto(exercicioAberto?.id === ex.id ? null : ex)
                    }}
                    className="text-gray-600 hover:text-blue-400 transition-colors"
                  >
                    <svg style={{width:18,height:18}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                    concluidos.includes(ex.id) ? 'bg-green-500 border-green-500' : 'border-gray-700'
                  }`}>
                    {concluidos.includes(ex.id) && (
                      <svg style={{width:16,height:16}} fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CARD DE DETALHES */}
            {exercicioAberto?.id === ex.id && (
              <div className="mt-2 p-5 bg-gray-900 border border-gray-800 rounded-[24px]">
                <ExercicioDetalhe nome={ex.nome} />
              </div>
            )}
          </div>
        ))}
      </main>

      {/* BOTÃO FINALIZAR */}
      {activeTab && (
        <div className="fixed bottom-6 left-0 right-0 px-6">
          <button
            onClick={finalizarTreino}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-[4px] text-xs shadow-2xl active:scale-95 transition-all duration-500 ${
              porcentagem === 100
                ? 'bg-green-500 text-white animate-pulse shadow-green-900/40'
                : 'bg-white text-black'
            }`}
          >
            {porcentagem === 100 ? `Finalizar ${activeTab} 🔥` : `Finalizar ${activeTab}`}
          </button>
        </div>
      )}
    </div>
  )
}