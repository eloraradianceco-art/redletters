import { useState } from 'react'
import { supabase } from '../supabaseClient'

const C = {
  bg: '#F7F2EA', red: '#8B1A1A', redL: '#A52020',
  redF: 'rgba(139,26,26,0.08)', redB: 'rgba(139,26,26,0.22)',
  gold: '#8B6A2E', goldF: 'rgba(139,106,46,0.1)', goldB: 'rgba(139,106,46,0.28)',
  cream: '#2A1A0E', text: '#3D2E1A', muted: '#7A6248',
  border: 'rgba(139,26,26,0.12)', green: '#2E6040',
}

const INP = {
  width: '100%', background: 'rgba(139,26,26,0.05)',
  border: `1px solid rgba(139,26,26,0.2)`, borderRadius: 10,
  color: '#3D2E1A', fontSize: 16, padding: '14px 16px',
  fontFamily: "'EB Garamond',Georgia,serif", outline: 'none',
  boxSizing: 'border-box', marginBottom: 12,
}

const BTN = (active) => ({
  width: '100%', padding: '16px', borderRadius: 12, cursor: active ? 'pointer' : 'default',
  fontSize: 14, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.09em',
  transition: 'all .25s', touchAction: 'manipulation', border: 'none',
  background: active ? `linear-gradient(135deg,rgba(139,26,26,0.35),rgba(139,26,26,0.18))` : 'rgba(139,26,26,0.08)',
  color: active ? '#2A1A0E' : '#7A6248',
})

export default function Auth({ onComplete }) {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmSent, setConfirmSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async () => {
    setError(null)
    if (mode === 'forgot') {
      if (!email) { setError('Please enter your email address.'); return }
      setLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://redletters.vercel.app',
      })
      setLoading(false)
      if (error) { setError(error.message); return }
      setResetSent(true)
      return
    }
    if (!email || !password) { setError('Please enter your email and password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      if (!data?.session) { setConfirmSent(true); setLoading(false); return }
      onComplete?.(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(
          error.message === 'Email not confirmed'
            ? '✉️ Please confirm your email first — check your inbox, then try again.'
            : error.message === 'Invalid login credentials'
            ? 'Incorrect email or password. Try again or use Forgot Password below.'
            : error.message
        )
        setLoading(false); return
      }
      onComplete?.(false)
    }
    setLoading(false)
  }

  const label = (txt) => (
    <div style={{ fontSize: 10, color: C.muted, letterSpacing: '0.14em',
      textTransform: 'uppercase', fontFamily: "'Cinzel',Georgia,serif", marginBottom: 6 }}>
      {txt}
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      background: `radial-gradient(ellipse at 50% 0%, rgba(139,26,26,0.08) 0%, transparent 60%), ${C.bg}`,
      fontFamily: "'EB Garamond',Georgia,serif",
      overflowY: 'auto', padding: '0 16px 40px',
    }}>
      <div style={{
        background: '#EDE8DC', borderRadius: 20,
        border: '1px solid rgba(139,26,26,0.18)',
        padding: '32px 28px 36px', width: '100%', maxWidth: 420,
        marginTop: '10vh', marginBottom: 40,
        boxShadow: '0 8px 32px rgba(139,26,26,0.08)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/icon.png" alt="" style={{ width: 56, height: 56, borderRadius: 14, marginBottom: 12, display: 'block', margin: '0 auto 12px', boxShadow: '0 4px 16px rgba(139,26,26,0.15)' }} />
          <div style={{ fontSize: 9, color: C.redL, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: "'Cinzel',Georgia,serif", marginBottom: 6 }}>
            Elora Radiance Co.
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: C.cream, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.05em', marginBottom: 6 }}>
            The Red Letters
          </div>
          <div style={{ fontSize: 13, color: C.muted, fontStyle: 'italic' }}>
            {mode === 'signup' ? 'Create your free account' :
             mode === 'forgot' ? 'Reset your password' :
             'Welcome back'}
          </div>
        </div>

        {/* Confirm sent */}
        {confirmSent ? (
          <div style={{ background: C.redF, border: `1px solid ${C.redB}`, borderRadius: 12, padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>✉️</div>
            <div style={{ fontSize: 15, color: C.cream, fontFamily: "'Cinzel',Georgia,serif", marginBottom: 8 }}>Check Your Email</div>
            <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 16 }}>
              Confirmation sent to <strong style={{ color: C.cream }}>{email}</strong>. Click the link then sign in.
            </p>
            <button onClick={() => { setConfirmSent(false); setMode('signin') }} style={{ ...BTN(true), width: 'auto', padding: '10px 24px' }}>
              Back to Sign In
            </button>
          </div>
        ) : resetSent ? (
          <div style={{ background: C.redF, border: `1px solid ${C.redB}`, borderRadius: 12, padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🔐</div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.7 }}>
              Check <strong style={{ color: C.cream }}>{email}</strong> for a reset link.
            </div>
            <button onClick={() => { setResetSent(false); setMode('signin') }} style={{ ...BTN(true), marginTop: 14, width: 'auto', padding: '10px 24px' }}>
              Back to Sign In
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div style={{ background: C.redF, border: `1px solid ${C.redB}`, borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 14, color: C.red, lineHeight: 1.6 }}>
                {error}
              </div>
            )}

            {label('Email')}
            <input type="email" placeholder="you@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={INP} autoCapitalize="none" autoCorrect="off" />

            {mode !== 'forgot' && (
              <>
                {label('Password')}
                <input type="password" placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={{ ...INP, marginBottom: 20 }} />
              </>
            )}

            <button onClick={handleSubmit} disabled={loading} style={{ ...BTN(!loading), marginBottom: 12 }}>
              {loading ? 'Please wait...' :
               mode === 'signup' ? 'Create Account' :
               mode === 'forgot' ? 'Send Reset Link' :
               'Sign In'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              {mode === 'signin' && (
                <>
                  <button onClick={() => { setMode('signup'); setError(null) }} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, fontFamily: "'EB Garamond',Georgia,serif" }}>
                    No account? Sign up
                  </button>
                  <button onClick={() => { setMode('forgot'); setError(null) }} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, fontFamily: "'EB Garamond',Georgia,serif" }}>
                    Forgot password?
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <button onClick={() => { setMode('signin'); setError(null) }} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, fontFamily: "'EB Garamond',Georgia,serif" }}>
                  Already have an account? Sign in
                </button>
              )}
              {mode === 'forgot' && (
                <button onClick={() => { setMode('signin'); setError(null) }} style={{ background: 'transparent', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 13, fontFamily: "'EB Garamond',Georgia,serif" }}>
                  Back to sign in
                </button>
              )}
            </div>
          </>
        )}

        {/* Free badge */}
        <div style={{ marginTop: 24, background: C.redF, border: `1px solid ${C.redB}`, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
            The words of Jesus — completely free.
          </div>
        </div>
      </div>
    </div>
  )
}
