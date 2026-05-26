import { useState, useEffect, Component } from 'react'
import { supabase } from './supabaseClient'
import RedLetters from './RedLetters.jsx'

const C = {
  bg:'#F7F2EA', red:'#8B1A1A', redL:'#A52020', redF:'rgba(139,26,26,0.08)',
  redB:'rgba(139,26,26,0.22)', gold:'#8B6A2E', goldF:'rgba(139,106,46,0.1)',
  goldB:'rgba(139,106,46,0.25)', cream:'#2A1A0E', text:'#3D2E1A',
  muted:'#7A6248', dim:'#B09A80', border:'rgba(139,26,26,0.12)', green:'#2E6040',
}
const INP = {
  width:'100%', background:'rgba(139,26,26,0.05)',
  border:'1px solid rgba(176,138,78,0.2)', borderRadius:10,
  color:'#3D2E1A', fontSize:16, padding:'14px 16px',
  fontFamily:"'EB Garamond',Georgia,serif", outline:'none',
  boxSizing:'border-box', marginBottom:12,
}
const BTN = (active) => ({
  width:'100%', padding:'16px', borderRadius:12, cursor:'pointer',
  fontSize:14, fontFamily:"'Cinzel',Georgia,serif", letterSpacing:'0.09em',
  transition:'all .25s', touchAction:'manipulation',
  background:active?'linear-gradient(135deg,rgba(155,32,32,0.45),rgba(155,32,32,0.22))':'rgba(155,32,32,0.1)',
  border:active?'1px solid rgba(155,32,32,0.5)':'1px solid rgba(155,32,32,0.3)',
  color:active?C.text:C.muted,
})

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error:null } }
  static getDerivedStateFromError(e) { return { error:e } }
  render() {
    if (this.state.error) return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
        background:C.bg,flexDirection:'column',gap:16,padding:24,textAlign:'center'}}>
        <div style={{fontSize:32}}>✦</div>
        <div style={{fontSize:14,color:C.redL,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.1em'}}>
          Something went wrong
        </div>
        <button onClick={()=>window.location.reload()} style={{background:C.redF,border:`1px solid ${C.redB}`,
          color:C.redL,padding:'10px 20px',borderRadius:10,cursor:'pointer',fontSize:12,
          fontFamily:"'Cinzel',Georgia,serif"}}>Reload</button>
      </div>
    )
    return this.props.children
  }
}

function AuthScreen({ onComplete }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resetSent, setResetSent] = useState(false)
  const [confirmSent, setConfirmSent] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    if (mode === 'forgot') {
      if (!email) { setError('Enter your email address.'); return }
      setLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo:'https://red-letters.vercel.app'
      })
      setLoading(false)
      if (error) { setError(error.message); return }
      setResetSent(true); return
    }
    if (!email || !password) { setError('Enter your email and password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      if (!data?.session) { setConfirmSent(true); setLoading(false); return }
      onComplete()
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message === 'Invalid login credentials'
          ? 'Incorrect email or password.' : error.message)
        setLoading(false); return
      }
      onComplete()
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',
      justifyContent:'flex-start',
      background:`radial-gradient(ellipse at 50% 0%,rgba(155,32,32,0.12) 0%,transparent 60%),${C.bg}`,
      fontFamily:"'EB Garamond',Georgia,serif",overflowY:'auto',padding:'0 16px 40px'}}>
      <div style={{background:'#EDE8DC',borderRadius:20,
        border:`1px solid rgba(155,32,32,0.2)`,padding:'32px 28px 40px',
        width:'100%',maxWidth:420,marginTop:'8vh'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:32,marginBottom:10,color:C.redL}}>✦</div>
          <div style={{fontSize:20,fontWeight:700,color:C.cream,
            fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.06em',marginBottom:6}}>
            The Red Letters
          </div>
          <div style={{fontSize:13,color:C.muted,fontStyle:'italic'}}>
            {mode === 'forgot' ? 'Reset your password' : 'The words of Jesus'}
          </div>
        </div>

        {/* Tab switcher */}
        {mode !== 'forgot' && (
          <div style={{display:'flex',marginBottom:24,background:'rgba(255,255,255,0.03)',
            borderRadius:10,border:`1px solid ${C.border}`,overflow:'hidden'}}>
            {[['signin','Sign In'],['signup','Create Account']].map(([m,lbl])=>(
              <button key={m} onClick={()=>{ setMode(m); setError(null); setConfirmSent(false) }}
                style={{flex:1,padding:'11px',border:'none',
                  borderRight:m==='signin'?`1px solid ${C.border}`:'none',
                  background:mode===m?`linear-gradient(135deg,rgba(155,32,32,0.3),rgba(155,32,32,0.12))`:'transparent',
                  color:mode===m?C.redL:C.muted,cursor:'pointer',fontSize:12,
                  fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.08em',
                  touchAction:'manipulation'}}>
                {lbl}
              </button>
            ))}
          </div>
        )}

        {confirmSent && (
          <div style={{background:C.goldF,border:`1px solid ${C.goldB}`,borderRadius:10,
            padding:'14px 16px',marginBottom:16}}>
            <div style={{fontSize:13,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",marginBottom:6}}>
              ✉️ Check Your Email
            </div>
            <div style={{fontSize:14,color:C.text,lineHeight:1.6}}>
              Confirmation sent to <strong style={{color:C.cream}}>{email}</strong>. Click it then sign in.
            </div>
            <button onClick={()=>{ setConfirmSent(false); setMode('signin') }}
              style={{marginTop:10,background:'transparent',border:`1px solid ${C.goldB}`,
                color:C.gold,padding:'7px 14px',borderRadius:8,cursor:'pointer',
                fontSize:12,fontFamily:"'Cinzel',Georgia,serif",touchAction:'manipulation'}}>
              Go to Sign In →
            </button>
          </div>
        )}

        {resetSent && (
          <div style={{background:C.goldF,border:`1px solid ${C.goldB}`,borderRadius:10,
            padding:'14px 16px',marginBottom:16}}>
            <div style={{fontSize:13,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",marginBottom:6}}>
              ✓ Reset Email Sent
            </div>
            <div style={{fontSize:14,color:C.text,lineHeight:1.6}}>
              Check <strong style={{color:C.cream}}>{email}</strong> for a reset link.
            </div>
            <button onClick={()=>{ setResetSent(false); setMode('signin') }}
              style={{marginTop:10,background:'transparent',border:`1px solid ${C.border}`,
                color:C.muted,padding:'7px 14px',borderRadius:8,cursor:'pointer',
                fontSize:12,fontFamily:"'Cinzel',Georgia,serif",touchAction:'manipulation'}}>
              Back to Sign In
            </button>
          </div>
        )}

        {error && (
          <div style={{background:'rgba(155,32,32,0.1)',border:'1px solid rgba(155,32,32,0.3)',
            borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:14,color:C.redL,lineHeight:1.6}}>
            {error}
          </div>
        )}

        {!confirmSent && !resetSent && (
          <>
            <div style={{fontSize:10,color:C.muted,letterSpacing:'0.14em',textTransform:'uppercase',
              fontFamily:"'Cinzel',Georgia,serif",marginBottom:6}}>Email Address</div>
            <input type="email" placeholder="you@email.com" value={email}
              onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
              style={INP} autoCapitalize="none" autoCorrect="off"/>
            {mode !== 'forgot' && (
              <>
                <div style={{fontSize:10,color:C.muted,letterSpacing:'0.14em',textTransform:'uppercase',
                  fontFamily:"'Cinzel',Georgia,serif",marginBottom:6}}>Password</div>
                <input type="password"
                  placeholder={mode==='signup'?'Create a password (min 6)':'Your password'}
                  value={password} onChange={e=>setPassword(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&handleSubmit()}
                  style={{...INP,marginBottom:20}}/>
              </>
            )}
            <button onClick={handleSubmit} disabled={loading} style={BTN(!loading)}>
              {loading ? 'Please wait...' :
               mode==='signup' ? '✦ Create Account' :
               mode==='forgot' ? '✉️ Send Reset Email' : '✦ Sign In'}
            </button>
            {mode === 'signin' && (
              <button onClick={()=>{ setMode('forgot'); setError(null) }}
                style={{marginTop:14,background:'none',border:'none',color:C.dim,
                  cursor:'pointer',fontSize:13,fontFamily:"'EB Garamond',Georgia,serif",
                  display:'block',width:'100%',textAlign:'center',touchAction:'manipulation'}}>
                Forgot your password?
              </button>
            )}
            {mode === 'forgot' && (
              <button onClick={()=>{ setMode('signin'); setError(null) }}
                style={{marginTop:14,background:'none',border:'none',color:C.dim,
                  cursor:'pointer',fontSize:13,fontFamily:"'EB Garamond',Georgia,serif",
                  display:'block',width:'100%',textAlign:'center',touchAction:'manipulation'}}>
                ← Back to Sign In
              </button>
            )}
          </>
        )}

        {/* Free access note */}
        <div style={{marginTop:24,background:'rgba(255,255,255,0.03)',border:`1px solid ${C.border}`,
          borderRadius:12,padding:'14px 16px',textAlign:'center'}}>
          <div style={{fontSize:11,color:C.muted,lineHeight:1.6}}>
            The words of Jesus — completely free.
          </div>
        </div>
      </div>
    </div>
  )
}

function PasswordReset({ onDone }) {
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const handleReset = async () => {
    if (pw.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError(null)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(onDone, 1500)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'flex-start',justifyContent:'center',
      flexDirection:'column',background:C.bg,padding:'0 16px',overflowY:'auto',fontFamily:"'EB Garamond',Georgia,serif"}}>
      <div style={{background:'#EDE8DC',borderRadius:20,border:`1px solid rgba(155,32,32,0.2)`,
        padding:'32px 28px',width:'100%',maxWidth:420,marginTop:'10vh'}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{fontSize:28,marginBottom:10}}>🔐</div>
          <div style={{fontSize:18,color:C.cream,fontFamily:"'Cinzel',Georgia,serif",
            letterSpacing:'0.06em'}}>Set New Password</div>
        </div>
        {done ? (
          <div style={{textAlign:'center',color:C.green,fontSize:15}}>✓ Password updated!</div>
        ) : (
          <>
            {error && <div style={{background:'rgba(155,32,32,0.1)',border:'1px solid rgba(155,32,32,0.3)',
              borderRadius:10,padding:'10px 14px',marginBottom:14,fontSize:14,color:C.redL}}>{error}</div>}
            <input type="password" placeholder="New password (min 6 characters)"
              value={pw} onChange={e=>setPw(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleReset()}
              style={{...INP,marginBottom:20}}/>
            <button onClick={handleReset} disabled={loading} style={BTN(!loading)}>
              {loading ? 'Updating...' : '✓ Set New Password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:C.bg,flexDirection:'column',gap:16}}>
      <div style={{fontSize:32,color:C.redL}}>✦</div>
      <div style={{fontSize:12,color:C.dim,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.16em',
        textTransform:'uppercase'}}>The Red Letters</div>
    </div>
  )
}

function AppInner() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordReset, setShowPasswordReset] = useState(false)

  const params = new URLSearchParams(window.location.search)
  const sessionId = params.get('session_id')
  if (sessionId) localStorage.setItem('pending_rl_session', sessionId)

  useEffect(() => {
    supabase.auth.getSession().then(({ data:{ session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })
    const { data:{ subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') { setShowPasswordReset(true); setSession(session); setLoading(false); return }
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    const { data } = await supabase.from('rl_profiles').select('*').eq('id', userId).single()
    setProfile(data)
    setLoading(false)
    if (data?.premium) localStorage.removeItem('pending_rl_session')
    else {
      const pending = localStorage.getItem('pending_rl_session')
      if (pending) {
        const paid = await verifyPayment(pending, userId)
        if (paid) localStorage.removeItem('pending_rl_session')
      }
    }
  }

  const verifyPayment = async (sessionId, userId) => {
    try {
      const res = await fetch(`/api/verify-payment?session_id=${sessionId}&user_id=${userId}`)
      const data = await res.json()
      if (data.paid) {
        window.history.replaceState({}, '', window.location.pathname)
        setProfile(prev => prev ? { ...prev, premium:true } : { id:userId, premium:true })
        return true
      }
    } catch(e) { console.error(e) }
    return false
  }

  if (showPasswordReset) return <PasswordReset onDone={()=>setShowPasswordReset(false)}/>
  if (loading) return <LoadingScreen/>
  if (!session) return <AuthScreen onComplete={()=>{}}/>
  return <RedLetters session={session} profile={profile}/>
}

export default function App() {
  return <ErrorBoundary><AppInner/></ErrorBoundary>
}
