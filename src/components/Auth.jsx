import { useState } from 'react'
import { supabase } from '../supabaseClient'

// RL is parchment/light theme
const C = {
  bg: '#F7F2EA', bg2: '#EDE8DC', red: '#8B1A1A', redL: '#A52020',
  redF: 'rgba(139,26,26,0.08)', redB: 'rgba(139,26,26,0.22)',
  gold: '#8B6A2E', goldL: '#A8873C', goldF: 'rgba(139,106,46,0.1)',
  goldB: 'rgba(139,106,46,0.28)', ink: '#1C150A', text: '#3D2E1A',
  muted: '#7A6248', dim: '#B09A80', border: 'rgba(139,26,26,0.1)',
  green: '#2E6040',
}

const INP = {
  width: '100%', background: 'rgba(139,26,26,0.05)',
  border: '1px solid rgba(139,26,26,0.18)', borderRadius: 10,
  color: '#1C150A', fontSize: 16, padding: '14px 16px',
  fontFamily: "'EB Garamond',Georgia,serif", outline: 'none',
  boxSizing: 'border-box', marginBottom: 12,
}

const BTN = {
  width: '100%', padding: '16px', borderRadius: 12, minHeight: 52,
  cursor: 'pointer', fontSize: 14,
  fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.09em',
  transition: 'all .25s', touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent', border: 'none',
}

export default function Auth({ onComplete }) {
  const [mode, setMode] = useState('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmSent, setConfirmSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  // Track if just created — triggers A2HS card
  const [justCreated, setJustCreated] = useState(false)

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
      setJustCreated(true)
      // Brief delay so user sees the A2HS card before being taken in
      setTimeout(() => onComplete?.(true), 3200)
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(
          error.message === 'Email not confirmed'
            ? '✉️ Please confirm your email first — check your inbox for the confirmation link, then try again.'
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
      background: `radial-gradient(ellipse at 50% 0%, rgba(139,26,26,0.07) 0%, transparent 55%), ${C.bg}`,
      fontFamily: "'EB Garamond',Georgia,serif",
      overflowY: 'auto', padding: '0 16px 40px',
    }}>
      <div style={{
        background: '#EDE8DC', borderRadius: 20,
        border: '1px solid rgba(139,26,26,0.15)',
        padding: '32px 28px 48px', width: '100%', maxWidth: 420,
        marginTop: '8vh', marginBottom: 40,
        boxShadow: '0 4px 24px rgba(139,26,26,0.08)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>✦</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.ink,
            fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.06em', marginBottom: 6 }}>
            The Red Letters
          </div>
          <div style={{ fontSize: 13, color: C.muted, fontStyle: 'italic' }}>
            {mode === 'signup' ? 'Create your free account to begin' :
             mode === 'forgot' ? 'Reset your password' :
             'Welcome back'}
          </div>
          {mode === 'signup' && (
            <div style={{ marginTop: 8, fontSize: 11, color: C.red,
              fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.1em',
              textTransform: 'uppercase' }}>
              ✦ Completely Free
            </div>
          )}
        </div>

        {/* Tab switcher */}
        {mode !== 'forgot' && !justCreated && (
          <div style={{ display: 'flex', gap: 0, marginBottom: 24,
            background: 'rgba(139,26,26,0.04)', borderRadius: 10,
            border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            {[['signup','Create Account'],['signin','Sign In']].map(([m, lbl]) => (
              <button key={m} onClick={() => { setMode(m); setError(null); setConfirmSent(false) }}
                style={{ flex: 1, padding: '11px',
                  background: mode === m
                    ? 'linear-gradient(135deg,rgba(139,26,26,0.14),rgba(139,26,26,0.06))'
                    : 'transparent',
                  border: 'none', borderRight: m === 'signup' ? `1px solid ${C.border}` : 'none',
                  color: mode === m ? C.red : C.muted, cursor: 'pointer',
                  fontSize: 12, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.08em',
                  transition: 'all .2s', touchAction: 'manipulation' }}>
                {lbl}
              </button>
            ))}
          </div>
        )}

        {/* Just created — show A2HS card */}
        {justCreated && (
          <div style={{ background: 'rgba(139,106,46,0.07)',
            border: '1px solid rgba(139,106,46,0.22)', borderRadius: 14,
            padding: '18px 18px 14px', textAlign: 'left', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: C.red, fontFamily: "'Cinzel',Georgia,serif",
              letterSpacing: '0.06em', marginBottom: 8 }}>✓ Account Created</div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6, marginBottom: 16 }}>
              You're in. Taking you to The Red Letters now.
            </div>
            <div style={{ fontSize: 10, color: C.gold, letterSpacing: '0.16em',
              textTransform: 'uppercase', fontFamily: "'Cinzel',Georgia,serif", marginBottom: 10 }}>
              📱 Add to Your Home Screen
            </div>
            <p style={{ fontSize: 13, color: C.text, lineHeight: 1.65, marginBottom: 14 }}>
              The Red Letters works like a native app — add it to your home screen for instant one-tap access.
            </p>
            {[
              { os: '🍎 iPhone / iPad (Safari)', steps: ['Tap the Share button ⎋ at the bottom of Safari', 'Scroll and tap "Add to Home Screen"', 'Tap "Add" — done ✓'] },
              { os: '🤖 Android (Chrome)', steps: ['Tap the three-dot menu ⋮ at the top right', 'Tap "Add to Home Screen" or "Install App"', 'Tap "Add" — done ✓'] },
            ].map(p => (
              <div key={p.os} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: C.gold, fontFamily: "'Cinzel',Georgia,serif",
                  letterSpacing: '0.06em', marginBottom: 6 }}>{p.os}</div>
                {p.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: C.red, flexShrink: 0, minWidth: 14,
                      fontFamily: "'Cinzel',Georgia,serif" }}>{i + 1}.</span>
                    <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            ))}
            <button onClick={() => onComplete?.(true)} style={{
              ...BTN, marginTop: 6,
              background: 'linear-gradient(135deg,rgba(139,26,26,0.2),rgba(139,26,26,0.08))',
              border: '1px solid rgba(139,26,26,0.3)',
              color: C.ink,
            }}>
              ✦ Enter The Red Letters →
            </button>
          </div>
        )}

        {/* Confirm sent */}
        {confirmSent && !justCreated && (
          <div style={{ background: 'rgba(139,106,46,0.08)', border: '1px solid rgba(139,106,46,0.25)',
            borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: C.gold, fontFamily: "'Cinzel',Georgia,serif",
              letterSpacing: '0.06em', marginBottom: 6 }}>✉️ Check Your Email</div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>
              Confirmation link sent to <strong style={{ color: C.ink }}>{email}</strong>.
              Click it then come back and sign in.
            </div>
            <button onClick={() => { setConfirmSent(false); setMode('signin') }}
              style={{ marginTop: 12, background: 'transparent', border: `1px solid ${C.goldB}`,
                color: C.gold, padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                fontSize: 12, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.06em',
                touchAction: 'manipulation' }}>
              Already confirmed? Sign In →
            </button>
          </div>
        )}

        {/* Reset sent */}
        {resetSent && (
          <div style={{ background: 'rgba(46,96,64,0.08)', border: '1px solid rgba(46,96,64,0.25)',
            borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: C.green, fontFamily: "'Cinzel',Georgia,serif",
              letterSpacing: '0.06em', marginBottom: 6 }}>✓ Reset Email Sent</div>
            <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>
              Check <strong style={{ color: C.ink }}>{email}</strong> for a password reset link.
            </div>
            <button onClick={() => { setResetSent(false); setMode('signin') }}
              style={{ marginTop: 12, background: 'transparent', border: `1px solid ${C.border}`,
                color: C.muted, padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                fontSize: 12, fontFamily: "'Cinzel',Georgia,serif", touchAction: 'manipulation' }}>
              Back to Sign In
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(139,26,26,0.07)', border: '1px solid rgba(139,26,26,0.25)',
            borderRadius: 10, padding: '12px 14px', marginBottom: 14, fontSize: 14,
            color: C.red, lineHeight: 1.6 }}>
            {error}
          </div>
        )}

        {/* Form */}
        {!confirmSent && !resetSent && !justCreated && (
          <>
            {label('Email Address')}
            <input type="email" placeholder="you@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={INP} autoCapitalize="none" autoCorrect="off"/>

            {mode !== 'forgot' && (
              <>
                {label('Password')}
                <div style={{position:'relative', marginBottom:20}}>
                  <input type={showPw?'text':'password'}
                    placeholder={mode === 'signup' ? 'Create a password (min 6 chars)' : 'Your password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    style={{ ...INP, marginBottom: 0, paddingRight: 64 }}/>
                  <button type="button" onClick={()=>setShowPw(s=>!s)} aria-label={showPw?'Hide password':'Show password'} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', color:C.gold, fontSize:10, fontFamily:"'Cinzel',Georgia,serif", letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', padding:'8px 10px', touchAction:'manipulation' }}>{showPw?'Hide':'Show'}</button>
                </div>
              </>
            )}

            <button onClick={handleSubmit} disabled={loading} style={{
              ...BTN,
              background: loading ? 'rgba(139,26,26,0.06)'
                : 'linear-gradient(135deg,rgba(139,26,26,0.22),rgba(139,26,26,0.1))',
              border: '1px solid rgba(139,26,26,0.35)',
              color: loading ? C.muted : C.ink,
            }}>
              {loading ? 'Please wait...' :
               mode === 'signup' ? '✦ Create Free Account' :
               mode === 'forgot' ? '✉️ Send Reset Email' :
               '✦ Sign In'}
            </button>

            {mode === 'signin' && (
              <button onClick={() => { setMode('forgot'); setError(null) }}
                style={{ marginTop: 14, background: 'none', border: 'none',
                  color: C.dim, cursor: 'pointer', fontSize: 13,
                  fontFamily: "'EB Garamond',Georgia,serif", display: 'block',
                  width: '100%', textAlign: 'center', touchAction: 'manipulation' }}>
                Forgot your password?
              </button>
            )}

            {mode === 'forgot' && (
              <button onClick={() => { setMode('signin'); setError(null) }}
                style={{ marginTop: 14, background: 'none', border: 'none',
                  color: C.dim, cursor: 'pointer', fontSize: 13,
                  fontFamily: "'EB Garamond',Georgia,serif", display: 'block',
                  width: '100%', textAlign: 'center', touchAction: 'manipulation' }}>
                ← Back to Sign In
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
