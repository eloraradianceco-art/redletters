import { useState, useEffect, Component } from 'react'
import { supabase } from './supabaseClient'
import Auth from './components/Auth'
import Onboarding from './components/Onboarding'
import RedLetters from './RedLetters'

// ── Error Boundary ────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        background:'#F7F2EA', flexDirection:'column', gap:16, padding:24, textAlign:'center' }}>
        <img src="/icon.png" style={{ width:48, height:48, borderRadius:12, marginBottom:4 }} alt="" />
        <div style={{ fontSize:14, color:'#8B1A1A', fontFamily:"'Cinzel',Georgia,serif", letterSpacing:'0.1em' }}>
          Something went wrong
        </div>
        <div style={{ fontSize:12, color:'#7A6248', maxWidth:360, lineHeight:1.6 }}>
          {this.state.error.message}
        </div>
        <button onClick={() => window.location.reload()}
          style={{ marginTop:8, background:'rgba(139,26,26,0.1)', border:'1px solid rgba(139,26,26,0.3)',
            color:'#8B1A1A', padding:'10px 20px', borderRadius:10, cursor:'pointer',
            fontSize:12, fontFamily:"'Cinzel',Georgia,serif" }}>
          Reload
        </button>
      </div>
    )
    return this.props.children
  }
}

// ── Loading Screen ────────────────────────────────────────────────────────
function LoadingScreen({ message }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#F7F2EA', flexDirection:'column', gap:16 }}>
      <img src="/icon.png" style={{ width:56, height:56, borderRadius:14, boxShadow:'0 4px 16px rgba(139,26,26,0.15)' }} alt="" />
      <div style={{ fontSize:10, color:'#7A6248', fontFamily:"'Cinzel',Georgia,serif", letterSpacing:'0.16em', textTransform:'uppercase' }}>
        {message || 'The Red Letters'}
      </div>
    </div>
  )
}

// ── Password Reset Screen ─────────────────────────────────────────────────
function PasswordReset({ onDone }) {
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const handleReset = async () => {
    if (!pw || pw.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError(null)
    const { error } = await supabase.auth.updateUser({ password: pw })
    setLoading(false)
    if (error) { setError(error.message); return }
    setDone(true)
    setTimeout(() => onDone(), 2000)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'flex-start',
      flexDirection:'column', background:'#F7F2EA', padding:'0 16px 40px', overflowY:'auto',
      fontFamily:"'EB Garamond',Georgia,serif" }}>
      <div style={{ background:'#EDE8DC', borderRadius:20, border:'1px solid rgba(139,26,26,0.18)',
        padding:'32px 28px', width:'100%', maxWidth:420, marginTop:'10vh', boxShadow:'0 8px 32px rgba(139,26,26,0.08)' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:28, marginBottom:10 }}>🔐</div>
          <div style={{ fontSize:18, fontWeight:700, color:'#2A1A0E', fontFamily:"'Cinzel',Georgia,serif", letterSpacing:'0.06em' }}>
            Set New Password
          </div>
        </div>
        {done ? (
          <div style={{ background:'rgba(46,96,64,0.1)', border:'1px solid rgba(46,96,64,0.3)',
            borderRadius:10, padding:'14px', textAlign:'center', color:'#2E6040', fontSize:15 }}>
            ✓ Password updated! Signing you in...
          </div>
        ) : (
          <>
            {error && (
              <div style={{ background:'rgba(139,26,26,0.08)', border:'1px solid rgba(139,26,26,0.25)',
                borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:14, color:'#8B1A1A' }}>
                {error}
              </div>
            )}
            <input type="password" placeholder="New password (min 6 characters)"
              value={pw} onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReset()}
              style={{ width:'100%', background:'rgba(139,26,26,0.05)', border:'1px solid rgba(139,26,26,0.2)',
                borderRadius:10, color:'#3D2E1A', fontSize:16, padding:'14px 16px',
                fontFamily:"'EB Garamond',Georgia,serif", outline:'none', boxSizing:'border-box', marginBottom:20 }} />
            <button onClick={handleReset} disabled={loading}
              style={{ width:'100%', padding:'16px', borderRadius:12, cursor:'pointer',
                background:loading?'rgba(139,26,26,0.08)':'linear-gradient(135deg,rgba(139,26,26,0.35),rgba(139,26,26,0.18))',
                border:'1px solid rgba(139,26,26,0.3)', color:'#2A1A0E', fontSize:14,
                fontFamily:"'Cinzel',Georgia,serif", letterSpacing:'0.09em', touchAction:'manipulation' }}>
              {loading ? 'Updating...' : '✓ Set New Password'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── App Inner ─────────────────────────────────────────────────────────────
function AppInner() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboarded, setOnboarded] = useState(() => !!localStorage.getItem('rl_onboarded'))
  const [showPasswordReset, setShowPasswordReset] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowPasswordReset(true)
        setSession(session)
        setLoading(false)
        return
      }
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
  }

  const handleAuthComplete = async (isNewUser) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await loadProfile(session.user.id)
      if (isNewUser) setShowOnboarding(true)
    }
  }

  const handleOnboardingComplete = () => {
    localStorage.setItem('rl_onboarded', 'true')
    setOnboarded(true)
    setShowOnboarding(false)
  }

  if (showPasswordReset) return <PasswordReset onDone={() => setShowPasswordReset(false)} />
  if (loading) return <LoadingScreen />

  // Not signed in
  if (!session) return <Auth onComplete={handleAuthComplete} />

  // Show onboarding for new users
  if (showOnboarding || !onboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  // All good — render app
  return <RedLetters session={session} profile={profile} />
}

export default function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>
}
