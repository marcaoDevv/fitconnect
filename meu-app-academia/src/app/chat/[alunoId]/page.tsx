'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function ChatPersonal() {
  const { alunoId } = useParams()
  const [mensagens, setMensagens] = useState<any[]>([])
  const [novaMsg, setNovaMsg] = useState('')
  const [personal, setPersonal] = useState<any>(null)
  const [aluno, setAluno] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const personalIdRef = useRef<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setPersonal(profile)
      personalIdRef.current = profile.id // <-- salva no ref imediatamente

      const { data: a } = await supabase
        .from('profiles').select('*').eq('id', alunoId).single()
      setAluno(a)

      await carregarMensagens(user.id, alunoId as string)

      await supabase
        .from('mensagens')
        .update({ lida: true })
        .eq('remetente_id', alunoId)
        .eq('destinatario_id', user.id)
        .eq('lida', false)

      const channel = supabase
        .channel(`chat-personal-${alunoId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
        }, (payload) => {
          const msg = payload.new
          console.log('REALTIME recebeu:', msg)
          console.log('personalIdRef:', personalIdRef.current)
          setMensagens(prev => {
            if (prev.find(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        })
        .subscribe((status) => {
          console.log('STATUS canal personal:', status)
        })

      setLoading(false)
      return () => { supabase.removeChannel(channel) }
    }
    init()
  }, [alunoId, router])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  const carregarMensagens = async (personalId: string, alunoId: string) => {
    const { data } = await supabase
      .from('mensagens')
      .select('*')
      .or(`and(remetente_id.eq.${personalId},destinatario_id.eq.${alunoId}),and(remetente_id.eq.${alunoId},destinatario_id.eq.${personalId})`)
      .order('created_at', { ascending: true })
    setMensagens(data || [])
  }

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novaMsg.trim()) return

    await supabase.from('mensagens').insert([{
      remetente_id: personal.id,
      destinatario_id: aluno.id,
      conteudo: novaMsg.trim(),
    }])
    setNovaMsg('')
  }

  const formatarHora = (date: string) => {
    return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-black animate-pulse uppercase tracking-widest">
      Conectando...
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">

      {/* HEADER */}
      <header className="border-b border-gray-800 p-4 flex items-center gap-4 bg-black sticky top-0 z-10">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-white transition-colors">
          <svg style={{width:20,height:20}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-sm shrink-0">
          {aluno?.full_name[0].toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-sm">{aluno?.full_name}</p>
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Aluno</p>
        </div>
      </header>

      {/* MENSAGENS */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3" style={{maxWidth:700, width:'100%', margin:'0 auto'}}>
        {mensagens.length === 0 && (
          <div className="text-center py-20 text-gray-600">
            <p className="text-4xl mb-4">💬</p>
            <p className="font-bold uppercase tracking-widest text-xs">Nenhuma mensagem ainda</p>
            <p className="text-xs mt-2">Inicie a conversa com {aluno?.full_name}!</p>
          </div>
        )}
        {mensagens.map((msg) => {
          const minha = msg.remetente_id === personalIdRef.current
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${minha ? 'justify-end' : 'justify-start'}`}>
              {!minha && (
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xs shrink-0">
                  {aluno?.full_name[0].toUpperCase()}
                </div>
              )}
              <div className={`max-w-xs lg:max-w-md flex flex-col gap-1 ${minha ? 'items-end' : 'items-start'}`}>
                {!minha && (
                  <span className="text-[10px] text-gray-500 font-bold ml-1">{aluno?.full_name}</span>
                )}
                <div className={`px-4 py-3 rounded-2xl text-sm font-medium min-w-[60px] ${
                  minha
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-900 border border-gray-800 text-gray-100 rounded-bl-sm'
                }`}>
                  {msg.conteudo}
                </div>
                <span className="text-[10px] text-gray-600 mx-1">{formatarHora(msg.created_at)}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </main>

      {/* INPUT */}
      <footer className="border-t border-gray-800 p-4 bg-black sticky bottom-0">
        <form onSubmit={enviarMensagem} style={{maxWidth:700, margin:'0 auto', display:'flex', gap:8}}>
          <input
            type="text"
            placeholder="Digite sua mensagem..."
            value={novaMsg}
            onChange={(e) => setNovaMsg(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-sm outline-none focus:border-blue-600 transition-all"
          />
          <button
            type="submit"
            disabled={!novaMsg.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed px-5 py-3 rounded-2xl transition-all active:scale-95"
          >
            <svg style={{width:18,height:18}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  )
}