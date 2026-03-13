'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function getSaudacao(nome: string) {
  const hora = new Date().getHours()
  const primeiro = nome.split(' ')[0]
  if (hora < 12) return `Bom dia, ${primeiro}`
  if (hora < 18) return `Boa tarde, ${primeiro}`
  return `Boa noite, ${primeiro}`
}

const IconTreino = () => (
  <svg style={{width:24,height:24,flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
)
const IconChat = () => (
  <svg style={{width:24,height:24,flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)
const IconAvaliacao = () => (
  <svg style={{width:24,height:24,flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
)
const IconHistorico = () => (
  <svg style={{width:24,height:24,flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

export default function HomeAluno() {
  const [aluno, setAluno] = useState<any>(null)
  const [personal, setPersonal] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchDados = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (profile?.role === 'personal') { router.push('/dashboard'); return }
      setAluno(profile)

      if (profile?.personal_id) {
        const { data: p } = await supabase
          .from('profiles').select('full_name, email').eq('id', profile.personal_id).single()
        setPersonal(p)
      }
      setLoading(false)
    }
    fetchDados()
  }, [router])

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-blue-500 font-black animate-pulse uppercase tracking-widest">
      Carregando...
    </div>
  )

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div style={{maxWidth: 900, margin: '0 auto', padding: '24px 24px'}}>

        {/* HEADER */}
        <header style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 32, paddingTop: 16}}>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter">
              FIT<span className="text-blue-600">CONNECT</span>
            </h1>
            <p className="text-white font-bold mt-1">{getSaudacao(aluno?.full_name ?? '')}</p>
            <p className="text-gray-500 text-xs font-medium">Pronto para treinar hoje?</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            style={{padding: '10px 16px'}}
            className="bg-gray-900 border border-gray-800 rounded-2xl hover:bg-red-900/20 hover:border-red-900/50 transition-all text-gray-400 hover:text-red-400 text-xs font-black uppercase tracking-widest"
          >
            Sair
          </button>
        </header>

        {/* CARD PERSONAL */}
        {personal && (
          <div style={{display:'flex', alignItems:'center', gap:12, padding:'14px 16px', marginBottom:24, background:'rgb(17,24,39)', border:'1px solid rgb(31,41,55)', borderRadius:20}}>
            <div style={{width:40, height:40, minWidth:40, background:'rgb(37,99,235)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14}}>
              {personal.full_name[0].toUpperCase()}
            </div>
            <div style={{minWidth:0, flex:1}}>
              <p style={{fontSize:10, color:'rgb(107,114,128)', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em'}}>Seu Personal</p>
              <p style={{fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{personal.full_name}</p>
            </div>
            <span style={{fontSize:10, background:'rgba(20,83,45,0.3)', color:'rgb(74,222,128)', border:'1px solid rgba(20,83,45,0.5)', padding:'4px 10px', borderRadius:999, fontWeight:900, textTransform:'uppercase', whiteSpace:'nowrap'}}>
              Ativo
            </span>
          </div>
        )}

        {/* CARD DESTAQUE — MEUS TREINOS */}
        <button
          onClick={() => router.push('/minha-ficha')}
          style={{width:'100%', background:'rgb(37,99,235)', padding:'20px 24px', borderRadius:24, marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center', border:'none', cursor:'pointer'}}
          className="hover:bg-blue-500 active:scale-95 transition-all"
        >
          <div style={{textAlign:'left'}}>
            <p style={{fontWeight:900, fontSize:16, textTransform:'uppercase', letterSpacing:'-0.02em', color:'white'}}>Meus Treinos</p>
            <p style={{color:'rgb(191,219,254)', fontSize:12, marginTop:4, fontWeight:500}}>Ver fichas de treino</p>
          </div>
          <div style={{width:44, height:44, minWidth:44, background:'rgba(59,130,246,0.4)', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', color:'white'}}>
            <IconTreino />
          </div>
        </button>

        {/* GRID 2 COLUNAS */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:12}}>
          {[
            { titulo:'Falar com Personal', descricao:'Chat com treinador', rota:'/chat', Icone: IconChat },
            { titulo:'Solicitar Avaliação', descricao:'Avaliação física', rota:'/avaliacao', Icone: IconAvaliacao },
            { titulo:'Histórico', descricao:'Seu progresso', rota:'/historico', Icone: IconHistorico },
          ].map(({ titulo, descricao, rota, Icone }) => (
            <button
              key={rota}
              onClick={() => router.push(rota)}
              style={{background:'rgb(17,24,39)', border:'1px solid rgb(31,41,55)', borderRadius:20, padding:'20px 16px', textAlign:'left', cursor:'pointer', display:'flex', flexDirection:'column', gap:16}}
              className="hover:bg-gray-800 active:scale-95 transition-all"
            >
              <div style={{width:40, height:40, minWidth:40, background:'rgb(31,41,55)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:'rgb(96,165,250)'}}>
                <Icone />
              </div>
              <div>
                <p style={{fontWeight:900, fontSize:13, textTransform:'uppercase', letterSpacing:'-0.01em', color:'white', lineHeight:1.2}}>{titulo}</p>
                <p style={{color:'rgb(107,114,128)', fontSize:10, marginTop:4, fontWeight:500}}>{descricao}</p>
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}