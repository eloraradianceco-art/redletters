import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"

const C = {
  bg: "#F7F2EA",
  bgMid: "#EFE7D8",
  cream: "#FAF5EC",
  text: "#2C1810",
  gold: "#8B6A2E",
  goldB: "rgba(139,106,46,0.32)",
  goldF: "rgba(139,106,46,0.08)",
  red: "#8B1A1A",
  redB: "rgba(139,26,26,0.32)",
  redF: "rgba(139,26,26,0.08)",
  green: "#4A6B3F",
  greenB: "rgba(74,107,63,0.32)",
  greenF: "rgba(74,107,63,0.08)",
  muted: "#6F5E48",
  dim: "#9A8B72",
  border: "rgba(139,106,46,0.24)",
}

const INP = {
  width: "100%", background: "rgba(255,255,255,0.6)",
  border: `1px solid ${C.border}`, borderRadius: 8,
  color: C.text, fontSize: 16, padding: "12px 14px", outline: "none",
  fontFamily: "EB Garamond,Georgia,serif", marginBottom: 12,
}
const LBL = {
  fontSize: 10, color: C.gold, letterSpacing: "0.15em",
  textTransform: "uppercase", marginBottom: 8, display: "block",
  fontFamily: "Cinzel,serif",
}

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.includes("access_token")) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setSessionReady(true)
      })
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setSessionReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleReset = async () => {
    setError(""); setMessage("")
    if (password.length < 6) { setError("Password must be at least 6 characters."); return }
    if (password !== confirm) { setError("Passwords do not match."); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setMessage("Password updated. Taking you back to the Red Letters...")
      setTimeout(() => { window.location.href = "https://redletters.vercel.app" }, 2000)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(155deg, ${C.bg} 0%, ${C.bgMid} 55%, ${C.bg} 100%)`,
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "24px",
      fontFamily: "EB Garamond,Georgia,serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;1,400&family=Cinzel:wght@400;500;600&display=swap" rel="stylesheet" />

      <div style={{ fontSize: 36, color: C.red, marginBottom: 12 }}>&#10013;</div>
      <div style={{ fontFamily: "Cinzel,serif", fontSize: 22, fontWeight: 600, color: C.text, marginBottom: 4 }}>The Red Letters</div>
      <div style={{ fontSize: 12, color: C.muted, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 28 }}>Reset Your Password</div>

      <div style={{
        background: C.cream, border: `1px solid ${C.goldB}`,
        borderRadius: 16, padding: "32px", width: "100%", maxWidth: 400,
        boxShadow: "0 6px 22px rgba(0,0,0,0.07)",
      }}>
        {!sessionReady ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>&#8987;</div>
            <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 12 }}>Verifying your reset link...</p>
            <p style={{ color: C.dim, fontSize: 13, fontStyle: "italic" }}>If this page stays stuck, go back to the app and request a new password reset link.</p>
          </div>
        ) : (
          <div>
            <p style={{ color: C.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 20, textAlign: "center", fontStyle: "italic" }}>Choose a new password for your account.</p>

            {error && (<div style={{ background: C.redF, border: `1px solid ${C.redB}`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: C.red, textAlign: "center" }}>{error}</div>)}
            {message && (<div style={{ background: C.greenF, border: `1px solid ${C.greenB}`, borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: C.green, textAlign: "center" }}>{message}</div>)}

            <label style={LBL}>New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="min 6 characters" style={INP} />
            <label style={LBL}>Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="re-enter new password" onKeyDown={e => e.key === "Enter" && handleReset()} style={{ ...INP, marginBottom: 20 }} />

            <button onClick={handleReset} disabled={loading} style={{
              width: "100%",
              background: `linear-gradient(135deg, ${C.red}, ${C.gold})`,
              border: "none", color: "#FFF", padding: "13px",
              borderRadius: 8, cursor: "pointer", fontSize: 14,
              fontFamily: "Cinzel,serif", letterSpacing: "0.1em", opacity: loading ? 0.7 : 1,
            }}>{loading ? "Updating..." : "Update Password"}</button>
          </div>
        )}
      </div>
    </div>
  )
}
