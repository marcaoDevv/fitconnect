'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function VerAnamnese() {
  const { alunoId } = useParams()
  const router = useRouter()
  const [aluno, setAluno] = useState<any>(null)
  const [dados, setDados] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnamnese() {
      // Busca nome do aluno
      const { data: p } = await supabase.from('profiles').select('full_name').eq('id', alunoId).single()
      setAluno(p)

      // Busca os dados de saúde
      const { data: a } = await supabase.from('anamnese').select('*').eq('aluno_id', alunoId).single()
      setDados(a)
      setLoading(false)
    }
    fetchAnamnese()
  }, [alunoId])

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-red-500 font-black">CARREGANDO FICHA MÉDICA...</div>

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      <header className="max-w-2xl mx-auto mb-10">
        <button onClick={() => router.back()} className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">← Voltar</button>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Ficha de Saúde</h1>
        <p className="text-blue-500 font-bold">{aluno?.full_name}</p>
      </header>

      <main className="max-w-2xl mx-auto space-y-6">
        {!dados ? (
          <div className="bg-gray-900 p-10 rounded-[32px] border border-dashed border-gray-800 text-center">
            <p className="text-gray-500 italic">O aluno ainda não preencheu a anamnese.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {/* INFORMAÇÕES BÁSICAS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800">
                <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Idade</p>
                <p className="text-2xl font-bold">{dados.idade} anos</p>
              </div>
              <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800">
                <p className="text-[10px] text-gray-500 font-black uppercase mb-1">Peso</p>
                <p className="text-2xl font-bold">{dados.peso} kg</p>
              </div>
            </div>

            {/* OBJETIVO */}
            <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800">
              <p className="text-[10px] text-blue-500 font-black uppercase mb-2">Objetivo Principal</p>
              <p className="text-lg font-medium text-gray-200">{dados.objetivo}</p>
            </div>

            {/* EXPERIÊNCIA */}
            <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800">
              <p className="text-[10px] text-gray-500 font-black uppercase mb-2">Nível de Experiência</p>
              <span className="bg-blue-600 text-[10px] px-3 py-1 rounded-full font-black uppercase">
                {dados.nivel_experiencia}
              </span>
            </div>

            {/* LESÕES E RESTRIÇÕES */}
            <div className="bg-red-900/10 p-6 rounded-3xl border border-red-900/30">
              <p className="text-[10px] text-red-500 font-black uppercase mb-2 tracking-widest">⚠️ Lesões ou Dores</p>
              <p className="text-gray-300 leading-relaxed">
                {dados.lesoes || "Nenhuma restrição informada."}
              </p>
            </div>

            {/* MEDICAMENTOS */}
            <div className="bg-gray-900 p-6 rounded-3xl border border-gray-800">
              <p className="text-[10px] text-gray-500 font-black uppercase mb-2">Medicamentos em uso</p>
              <p className="text-gray-300">
                {dados.medicamentos || "Nenhum informado."}
              </p>
            </div>
            
            <button 
              onClick={() => router.push(`/treino/${alunoId}`)}
              className="w-full bg-blue-600 p-5 rounded-3xl font-black uppercase tracking-widest mt-6 hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
            >
              Montar Treino com base nestes dados
            </button>
          </div>
        )}
      </main>
    </div>
  )
}