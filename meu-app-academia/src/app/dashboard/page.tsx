'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [alunos, setAlunos] = useState<any[]>([])
  const [personal, setPersonal] = useState<any>(null)
  const [search, setSearch] = useState('') // Campo de busca
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      // 1. Pega o usuário logado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/')
        return
      }

      // 2. Busca dados do perfil logado
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      // --- AJUSTE SOLICITADO: REDIRECIONAMENTO SE FOR ALUNO ---
      if (profile?.role === 'aluno') {
        router.push('/minha-ficha')
        return
      }

      setPersonal(profile)

      // 3. Busca os alunos vinculados a este Personal
      const { data: listaAlunos } = await supabase
        .from('profiles')
        .select('*')
        .eq('personal_id', user.id)
        .eq('role', 'aluno')

      setAlunos(listaAlunos || [])
      setLoading(false)
    }

    fetchData()
  }, [router])

  // Lógica de Filtro para a barra de busca
  const alunosFiltrados = alunos.filter(aluno => 
    aluno.full_name.toLowerCase().includes(search.toLowerCase()) ||
    aluno.email.toLowerCase().includes(search.toLowerCase())
  )

  const copiarLink = () => {
    const link = `${window.location.origin}/?personalId=${personal?.id}`
    navigator.clipboard.writeText(link)
    alert('Link de convite copiado! Envie para seu novo aluno.')
  }

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-black animate-pulse uppercase tracking-widest">
      Sincronizando Ecossistema...
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans">
      
      {/* HEADER */}
      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter">FIT<span className="text-blue-600">CONNECT</span></h1>
          <p className="text-gray-500 font-medium tracking-tight">
            Olá, Treinador <span className="text-white font-bold">{personal?.full_name}</span>
          </p>
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <button 
            onClick={copiarLink}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-blue-900/20 active:scale-95"
          >
            🔗 Copiar Convite
          </button>
          <button 
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:bg-red-900/20 hover:border-red-900/50 transition-all group"
          >
            <span className="group-hover:scale-125 block transition-transform">🚪</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        
        {/* BARRA DE BUSCA (Aparece se houver alunos) */}
        {alunos.length > 0 && (
          <div className="mb-8 relative group">
            <input 
              type="text" 
              placeholder="Pesquisar aluno por nome ou e-mail..."
              className="w-full p-5 pl-14 bg-gray-900 border border-gray-800 rounded-3xl focus:border-blue-600 outline-none transition-all placeholder:text-gray-600 font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors">
              🔍
            </div>
          </div>
        )}

        {/* LOGICA DE ESTADO VAZIO / LISTA */}
        {alunos.length === 0 ? (
          /* EMPTY STATE (Quando não tem nenhum aluno) */
          <div className="bg-gray-900/30 border-2 border-dashed border-gray-800 rounded-[40px] p-20 text-center animate-in fade-in zoom-in duration-500">
              <div className="text-6xl mb-6">🏋️‍♂️</div>
              <h2 className="text-2xl font-black mb-2 italic uppercase">Sua academia está vazia</h2>
              <p className="text-gray-500 max-w-sm mx-auto mb-10 font-medium">
                Você ainda não tem alunos vinculados. Clique abaixo para copiar seu link e começar a cadastrar.
              </p>
              <button onClick={copiarLink} className="bg-white text-black px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95">
                Copiar meu Link agora
              </button>
          </div>
        ) : alunosFiltrados.length === 0 ? (
          /* BUSCA SEM RESULTADO */
          <div className="text-center py-20 bg-gray-900/20 rounded-[40px] border border-gray-800">
            <p className="text-gray-600 italic">Nenhum aluno encontrado para "{search}"</p>
          </div>
        ) : (
          /* GRID DE ALUNOS (Com os 3 botões) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alunosFiltrados.map((aluno) => (
              <div 
                key={aluno.id} 
                className="bg-gray-900 p-6 rounded-[32px] border border-gray-800 hover:border-gray-700 transition-all group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/20 group-hover:rotate-3 transition-transform">
                    {aluno.full_name[0].toUpperCase()}
                  </div>
                  <span className="text-[10px] bg-blue-900/20 text-blue-400 px-3 py-1 rounded-full font-black uppercase tracking-tighter">
                    {aluno.anamnese_completa ? 'Saúde OK' : 'Saúde Pendente'}
                  </span>
                </div>

                <h3 className="font-bold text-xl mb-1 truncate group-hover:text-blue-400 transition-colors">
                  {aluno.full_name}
                </h3>
                <p className="text-gray-500 text-xs mb-8 truncate font-mono">{aluno.email}</p>
                
                {/* BOTÕES DE AÇÃO */}
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => router.push(`/treino/${aluno.id}`)} 
                    className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                  >
                    Montar Treino
                  </button>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => router.push(`/visualizar/${aluno.id}`)} 
                      className="flex-1 border border-gray-800 hover:border-gray-500 py-3 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95"
                    >
                      Visualizar
                    </button>
                    
                    <button 
                      onClick={() => router.push(`/anamnese-visualizar/${aluno.id}`)}
                      className="flex-1 bg-red-900/10 border border-red-900/30 text-red-500 hover:bg-red-900/20 py-3 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95"
                    >
                      Anamnese
                    </button>
                    <button
  onClick={() => router.push(`/chat/${aluno.id}`)}
  className="flex-1 bg-blue-900/10 border border-blue-900/30 text-blue-400 hover:bg-blue-900/20 py-3 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95"
>
  Chat
</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto mt-20 text-center opacity-10">
        <p className="text-[10px] font-black uppercase tracking-[15px]">FitConnect System</p>
      </footer>
    </div>
  )
}