'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Anamnese() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    idade: '', peso: '', objetivo: '', lesoes: '', medicamentos: '', nivel: 'iniciante'
  })

  const salvarAnamnese = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Salva os dados na tabela de anamnese
    const { error: errorAnamnese } = await supabase.from('anamnese').insert([
      { 
        aluno_id: user.id,
        idade: parseInt(form.idade),
        peso: parseFloat(form.peso),
        objetivo: form.objetivo,
        lesoes: form.lesoes,
        medicamentos: form.medicamentos,
        nivel_experiencia: form.nivel
      }
    ])

    if (!errorAnamnese) {
      // 2. Marca no perfil que a anamnese foi concluída
      await supabase.from('profiles').update({ anamnese_completa: true }).eq('id', user.id)
      
      alert('Perfil de saúde configurado! Vamos ao treino.')
      router.push('/minha-ficha') // Destino final do aluno
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center font-sans">
      <div className="max-w-md w-full bg-gray-900 p-8 rounded-[32px] border border-gray-800 shadow-2xl">
        <header className="text-center mb-8">
          <span className="text-blue-500 text-[10px] font-black uppercase tracking-[5px]">Primeiro Passo</span>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase mt-2">Sua Anamnese</h1>
          <p className="text-gray-500 text-xs mt-2 font-medium">Precisamos conhecer você para garantir sua segurança.</p>
        </header>

        <form onSubmit={salvarAnamnese} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase ml-2">Idade</label>
              <input type="number" required className="w-full p-4 bg-black rounded-2xl border border-gray-800 outline-none focus:border-blue-500" value={form.idade} onChange={e => setForm({...form, idade: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase ml-2">Peso (kg)</label>
              <input type="number" step="0.1" required className="w-full p-4 bg-black rounded-2xl border border-gray-800 outline-none focus:border-blue-500" value={form.peso} onChange={e => setForm({...form, peso: e.target.value})} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-2">Qual seu objetivo?</label>
            <input type="text" placeholder="Ex: Emagrecer, Hipertrofia..." required className="w-full p-4 bg-black rounded-2xl border border-gray-800 outline-none focus:border-blue-500" value={form.objetivo} onChange={e => setForm({...form, objetivo: e.target.value})} />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-500 uppercase ml-2">Possui lesões ou dores?</label>
            <textarea placeholder="Ex: Dor no joelho esquerdo..." className="w-full p-4 bg-black rounded-2xl border border-gray-800 outline-none focus:border-blue-500 h-24" value={form.lesoes} onChange={e => setForm({...form, lesoes: e.target.value})} />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 p-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-blue-900/40 transition-all active:scale-95"
          >
            {loading ? 'Salvando...' : 'Finalizar e Ver Treinos'}
          </button>
        </form>
      </div>
    </div>
  )
}