'use client'
import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

function ConteudoMontarTreino() {
  const { alunoId } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editWorkoutName = searchParams.get('edit')
  
  const [aluno, setAluno] = useState<any>(null)
  const [exerciciosSessao, setExerciciosSessao] = useState<any[]>([])
  const [treinosExistentes, setTreinosExistentes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [nomeTreinoAtivo, setNomeTreinoAtivo] = useState('') 
  const [treinoCriado, setTreinoCriado] = useState(false)
  const [modoCriarNovo, setModoCriarNovo] = useState(false)

  const [nomeExs, setNomeExs] = useState('')
  const [series, setSeries] = useState('')
  const [reps, setReps] = useState('')

  useEffect(() => {
    async function inicializar() {
      if (!alunoId) return
      const { data: p } = await supabase.from('profiles').select('full_name').eq('id', alunoId).single()
      setAluno(p)

      const { data: e } = await supabase.from('exercicios').select('divisao').eq('aluno_id', alunoId)
      if (e) {
        const nomes = Array.from(new Set(e.map(item => item.divisao)))
        setTreinosExistentes(nomes)
      }

      if (editWorkoutName) await carregarDadosDoTreino(editWorkoutName)
      setLoading(false)
    }
    inicializar()
  }, [alunoId, editWorkoutName])

  async function carregarDadosDoTreino(nome: string) {
    setNomeTreinoAtivo(nome)
    const { data } = await supabase
      .from('exercicios')
      .select('*')
      .eq('aluno_id', alunoId)
      .eq('divisao', nome)
      .order('ordem', { ascending: true })
    
    if (data) setExerciciosSessao(data)
    setTreinoCriado(true)
  }

  // LÓGICA DO ARRASTAR E SOLTAR
  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const itens = Array.from(exerciciosSessao)
    const [reorderedItem] = itens.splice(result.source.index, 1)
    itens.splice(result.destination.index, 0, reorderedItem)

    // Atualiza o estado visual imediatamente
    setExerciciosSessao(itens)

    // Salva a nova ordem no Supabase
    const updates = itens.map((ex, index) => ({
      id: ex.id,
      ordem: index
    }))

    for (const item of updates) {
      await supabase.from('exercicios').update({ ordem: item.ordem }).eq('id', item.id)
    }
  }

  const salvarExercicio = async (e: React.FormEvent) => {
    e.preventDefault()
    const novaOrdem = exerciciosSessao.length
    const { data, error } = await supabase.from('exercicios').insert([
      { aluno_id: alunoId, nome: nomeExs, series: parseInt(series), repeticoes: reps, divisao: nomeTreinoAtivo, ordem: novaOrdem }
    ]).select()

    if (!error && data) {
      setExerciciosSessao([...exerciciosSessao, data[0]])
      setNomeExs(''); setSeries(''); setReps('')
    }
  }

  const excluirExercicio = async (id: string) => {
    await supabase.from('exercicios').delete().eq('id', id)
    setExerciciosSessao(exerciciosSessao.filter(ex => ex.id !== id))
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-bold">CARREGANDO...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-10">
      <header className="max-w-6xl mx-auto mb-10 flex justify-between items-center border-b border-gray-900 pb-6">
        <div>
           <h1 className="text-2xl font-black italic tracking-tighter uppercase italic">FIT<span className="text-blue-600">EDITOR</span></h1>
           <p className="text-gray-500 text-xs">Personalizando treino de: {aluno?.full_name}</p>
        </div>
        <button onClick={() => router.push(`/visualizar/${alunoId}`)} className="bg-green-600 px-8 py-3 rounded-2xl font-bold text-sm">
          Finalizar
        </button>
      </header>

      <main className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12">
        <section className="space-y-8">
          <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800">
            <h2 className="text-[10px] font-black text-gray-500 uppercase mb-4 tracking-widest italic">Escolher Ficha</h2>
            <div className="flex flex-wrap gap-2 mb-4">
                {treinosExistentes.map(nome => (
                  <button key={nome} onClick={() => carregarDadosDoTreino(nome)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${nomeTreinoAtivo === nome ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-gray-800 border-transparent text-gray-400'}`}>
                    {nome}
                  </button>
                ))}
                <button onClick={() => { setModoCriarNovo(true); setTreinoCriado(false); setNomeTreinoAtivo(''); setExerciciosSessao([]) }} className="px-4 py-2 rounded-xl text-xs font-bold border border-dashed border-gray-700 text-gray-500 hover:text-white">
                  + Novo
                </button>
            </div>
            {modoCriarNovo && (
                <div className="flex gap-2">
                  <input type="text" placeholder="Ex: Treino A" className="flex-1 p-4 bg-black rounded-2xl border border-gray-800 outline-none" value={nomeTreinoAtivo} onChange={(e) => setNomeTreinoAtivo(e.target.value)} />
                  <button onClick={() => { if(nomeTreinoAtivo) setTreinoCriado(true) }} className="bg-blue-600 px-6 rounded-2xl font-bold">OK</button>
                </div>
            )}
          </div>

          <div className={`transition-all duration-500 ${treinoCriado ? 'opacity-100' : 'opacity-10 pointer-events-none'}`}>
            <form onSubmit={salvarExercicio} className="bg-gray-900 p-8 rounded-3xl border border-gray-800">
              <h2 className="text-xl font-black uppercase italic text-blue-500 mb-6">{nomeTreinoAtivo || 'Selecione um Treino'}</h2>
              <div className="space-y-4">
                <input placeholder="Nome do Exercício" className="w-full p-4 bg-black rounded-2xl border border-gray-800 outline-none" value={nomeExs} onChange={e => setNomeExs(e.target.value)} required />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" placeholder="Séries" className="w-full p-4 bg-black rounded-2xl border border-gray-800" value={series} onChange={e => setSeries(e.target.value)} required />
                  <input type="text" placeholder="Repetições" className="w-full p-4 bg-black rounded-2xl border border-gray-800" value={reps} onChange={e => setReps(e.target.value)} required />
                </div>
                <button className="w-full bg-blue-600 py-4 rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-500 transition-all">
                  Adicionar à Ficha
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* LISTA COM DRAG AND DROP */}
        <section>
          <h2 className="text-gray-500 uppercase text-xs font-black mb-6 tracking-widest italic">Ordem de Execução (Arraste para organizar)</h2>
          
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="exercicios">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {exerciciosSessao.map((ex, index) => (
                    <Draggable key={ex.id} draggableId={ex.id.toString()} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${
                            snapshot.isDragging ? 'bg-blue-900/40 border-blue-500 shadow-2xl z-50' : 'bg-gray-900 border-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* ÍCONE DE ALÇA (DRAG HANDLE) */}
                            <div {...provided.dragHandleProps} className="text-gray-700 hover:text-gray-400 cursor-grab active:cursor-grabbing px-2 text-xl">
                              ⠿
                            </div>
                            <div>
                              <p className="font-bold text-gray-100 flex items-center gap-2">
                                <span className="text-blue-600 font-mono text-[10px]">#{index + 1}</span>
                                {ex.nome}
                              </p>
                              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">
                                {ex.series} Séries x {ex.repeticoes} Reps
                              </p>
                            </div>
                          </div>
                          <button onClick={() => excluirExercicio(ex.id)} className="text-gray-600 hover:text-red-500 transition-colors px-2">
                            🗑️
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {treinoCriado && exerciciosSessao.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-[32px] text-gray-700 italic">
                      Arraste exercícios para cá ou adicione ao lado.
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </section>
      </main>
    </div>
  )
}

export default function PaginaMontarTreino() {
  return (
    <Suspense fallback={<div>Carregando Editor...</div>}>
      <ConteudoMontarTreino />
    </Suspense>
  )
}