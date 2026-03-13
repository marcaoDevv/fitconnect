'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function VisualizarFichas() {
  const { alunoId } = useParams()
  const router = useRouter()
  
  const [aluno, setAluno] = useState<any>(null)
  const [exercicios, setExercicios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const carregarDados = async () => {
    setLoading(true)
    // 1. Busca nome do aluno
    const { data: p } = await supabase.from('profiles').select('full_name').eq('id', alunoId).single()
    setAluno(p)

    // 2. Busca todos os exercícios ordenados
    const { data: e } = await supabase
      .from('exercicios')
      .select('*')
      .eq('aluno_id', alunoId)
      .order('ordem', { ascending: true })
    
    setExercicios(e || [])
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [alunoId])

  // MAPEAMENTO: Agrupa os exercícios por nome do treino (divisao)
  const treinosAgrupados = exercicios.reduce((acc: any, curr: any) => {
    if (!acc[curr.divisao]) acc[curr.divisao] = []
    acc[curr.divisao].push(curr)
    return acc
  }, {})

  // LÓGICA DE EXCLUSÃO DE FICHA INTEIRA
  const deletarTreinoInteiro = async (nomeTreino: string) => {
    const confirmacao = window.confirm(`⚠️ CUIDADO! Tem certeza que deseja apagar o "${nomeTreino}" completo? Esta ação não pode ser desfeita.`)
    
    if (confirmacao) {
      const { error } = await supabase
        .from('exercicios')
        .delete()
        .eq('aluno_id', alunoId)
        .eq('divisao', nomeTreino)

      if (error) {
        alert("Erro ao excluir: " + error.message)
      } else {
        // Recarrega a lista após deletar
        carregarDados()
      }
    }
  }

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-black italic animate-pulse">SINCRONIZANDO FICHAS...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-12 font-sans">
      
      {/* HEADER */}
      <header className="max-w-4xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-800 pb-8">
        <div>
          <button 
            onClick={() => router.push('/dashboard')} 
            className="text-gray-500 hover:text-white mb-4 flex items-center gap-2 transition-colors text-xs font-bold uppercase tracking-widest"
          >
            ← Painel Principal
          </button>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">
            Gestão de Treinos: <span className="text-blue-600">{aluno?.full_name}</span>
          </h1>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 px-6 py-3 rounded-2xl">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Divisões Ativas</p>
          <p className="text-2xl font-black text-blue-500">{Object.keys(treinosAgrupados).length}</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        
        {/* ESTADO VAZIO (EMPTY STATE) */}
        {exercicios.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/20 border-2 border-dashed border-gray-800 rounded-[40px] animate-in fade-in zoom-in">
            <div className="text-5xl mb-6 opacity-30">📋</div>
            <h2 className="text-xl font-bold text-gray-400 mb-6 italic uppercase">Este aluno não tem fichas montadas</h2>
            <button 
              onClick={() => router.push(`/treino/${alunoId}`)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-blue-900/40 active:scale-95"
            >
              + Criar Primeira Ficha
            </button>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* MAPEAMENTO DOS TREINOS (Loop Externo) */}
            {Object.keys(treinosAgrupados).map((nomeTreino) => (
              <section key={nomeTreino} className="bg-gray-900 rounded-[32px] border border-gray-800 overflow-hidden shadow-2xl group transition-all hover:border-blue-900/30">
                
                {/* Cabeçalho do Bloco */}
                <div className="bg-gray-800/40 p-6 flex justify-between items-center border-b border-gray-800">
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tight text-white group-hover:text-blue-500 transition-colors">
                      {nomeTreino}
                    </h2>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
                      {treinosAgrupados[nomeTreino].length} Exercícios na sequência
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {/* BOTÃO EDITAR (LÁPIS) */}
                    <button 
                      onClick={() => router.push(`/treino/${alunoId}?edit=${encodeURIComponent(nomeTreino)}`)}
                      className="bg-gray-800 hover:bg-blue-600 p-3 rounded-xl transition-all"
                      title="Editar Treino"
                    >
                      ✏️
                    </button>
                    {/* BOTÃO EXCLUIR (LIXEIRA) */}
                    <button 
                      onClick={() => deletarTreinoInteiro(nomeTreino)}
                      className="bg-gray-800 hover:bg-red-900/50 p-3 rounded-xl transition-all"
                      title="Excluir Treino"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* LISTA DE EXERCÍCIOS (Loop Interno) */}
                <div className="divide-y divide-gray-800/50 p-2">
                  {treinosAgrupados[nomeTreino].map((ex: any, index: number) => (
                    <div key={ex.id} className="flex justify-between items-center p-5 hover:bg-white/5 transition-colors rounded-2xl">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-700 font-black italic text-xl">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <h3 className="font-bold text-lg text-gray-200">{ex.nome}</h3>
                          <div className="flex gap-4 mt-1">
                            <span className="text-blue-500 text-[10px] font-black uppercase tracking-tighter bg-blue-500/10 px-2 py-0.5 rounded">
                              {ex.series} Séries
                            </span>
                            <span className="text-gray-500 text-[10px] font-black uppercase tracking-tighter bg-gray-500/10 px-2 py-0.5 rounded">
                              {ex.repeticoes} Reps
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto mt-20 text-center text-gray-700 text-[10px] font-black uppercase tracking-[12px] pb-10">
        FitConnect - Performance System
      </footer>
    </div>
  )
}