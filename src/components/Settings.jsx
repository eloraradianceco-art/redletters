import { useState } from 'react'
import { supabase } from '../supabaseClient'
import Reviews from './Reviews'

export default function Settings({ profile, userId, entries, passages, darkMode, onToggleDarkMode, onClose }) {
  const C = darkMode ? {
    bg:'#0F0A06', bgCard:'rgba(201,64,64,0.07)', bgMid:'#1A0E08',
    red:'#C94040', redL:'#D96060', redF:'rgba(201,64,64,0.12)', redB:'rgba(201,64,64,0.32)',
    gold:'#B08A4E', goldF:'rgba(176,138,78,0.11)', goldB:'rgba(176,138,78,0.28)',
    cream:'#EDE6D6', ink:'#EDE6D6', text:'rgba(220,210,195,0.9)', muted:'rgba(176,160,130,0.65)', dim:'rgba(150,130,100,0.4)',
    border:'rgba(201,64,64,0.12)',
    green:'#7C9284', greenF:'rgba(124,146,132,0.12)', greenB:'rgba(124,146,132,0.35)',
  } : {
    bg:'#F7F2EA', bgCard:'rgba(139,26,26,0.04)', bgMid:'#EDE8DC',
    red:'#8B1A1A', redL:'#A52020', redF:'rgba(139,26,26,0.08)', redB:'rgba(139,26,26,0.22)',
    gold:'#8B6A2E', goldF:'rgba(139,106,46,0.1)', goldB:'rgba(139,106,46,0.28)',
    cream:'#2A1A0E', ink:'#1C150A', text:'#3D2E1A', muted:'#7A6248', dim:'#B09A80',
    border:'rgba(139,26,26,0.12)',
    green:'#2E6040', greenF:'rgba(46,96,64,0.1)', greenB:'rgba(46,96,64,0.3)',
  }
  const [copiedShare, setCopiedShare] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [resetDone, setResetDone] = useState(false)


  const read = passages ? passages.filter(p => entries?.find(e => e.saying_id === p.id && e.field_key === 'read')?.field_value === 'true').length : 0
  const mem  = passages ? passages.filter(p => entries?.find(e => e.saying_id === p.id && e.field_key === 'mem')?.field_value === 'true').length : 0
  const total = passages?.length || 0

  const shareText = 'The Red Letters — study the complete words of Jesus by theme. Every passage, with context, meaning, and prayer. Free.\n\nhttps://redletters.vercel.app'

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'The Red Letters', text: shareText, url: 'https://redletters.vercel.app' }) }
      catch {}
    } else {
      try {
        await navigator.clipboard.writeText(shareText)
        setCopiedShare(true)
        setTimeout(() => setCopiedShare(false), 2500)
      } catch {}
    }
  }

  const handleExport = async () => {
    if (!userId || exporting) return
    setExporting(true)
    try {
      const { data } = await supabase.from('rl_entries').select('*').eq('user_id', userId)
      const get = (pid, key) => data?.find(e => e.saying_id === pid && e.field_key === key)?.field_value || ''
      const lines = []
      lines.push('THE RED LETTERS — STUDY JOURNAL')
      lines.push('Elora Radiance Co. | redletters.vercel.app')
      lines.push(`Exported: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`)
      lines.push('='.repeat(50))
      if (passages) {
        for (const p of passages) {
          const journal = get(p.id, 'journal')
          const isRead  = get(p.id, 'read') === 'true'
          const isMem   = get(p.id, 'mem') === 'true'
          if (!journal && !isMem) continue
          lines.push('')
          lines.push(`${p.themeIcon || ''} ${p.themeTitle || ''} — ${p.title}`)
          lines.push(`${p.ref}`)
          lines.push('-'.repeat(40))
          if (isMem)   lines.push('✦ Memorized')
          if (isRead)  lines.push('✓ Read')
          if (journal) {
            lines.push('')
            lines.push('JOURNAL:')
            lines.push(journal)
          }
        }
      }
      lines.push('')
      lines.push('='.repeat(50))
      lines.push('The words of Jesus — redletters.vercel.app')
      const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `red-letters-journal-${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { console.error(e) }
    setExporting(false)
  }

  const handlePrintPDF = async () => {
    if (!userId) return
    const { data } = await supabase.from('rl_entries').select('*').eq('user_id', userId)
    const get = (pid, key) => data?.find(e => e.saying_id === pid && e.field_key === key)?.field_value || ''
    let html = `<!DOCTYPE html><html><head><title>The Red Letters Journal</title>
    <style>
      body{font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:40px;color:#2A1A0E;line-height:1.8;background:#F7F2EA}
      h1{font-size:26px;color:#8B1A1A;text-align:center;margin-bottom:4px}
      .sub{text-align:center;color:#8B6A2E;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:36px}
      h2{font-size:17px;color:#2A1A0E;border-bottom:1px solid rgba(139,26,26,0.25);padding-bottom:6px;margin-top:32px}
      h3{font-size:12px;color:#8B6A2E;letter-spacing:0.1em;text-transform:uppercase;margin:16px 0 6px}
      p{line-height:1.85;margin:0 0 12px;font-style:italic;color:#3D2E1A}
      .badge{font-size:11px;color:#2E6040;margin:3px 0}
      @media print{body{padding:20px}}
    </style></head><body>
    <h1>The Red Letters</h1>
    <p class="sub">Study Journal &mdash; Exported ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>`
    if (passages) {
      for (const p of passages) {
        const journal = get(p.id, 'journal')
        const isMem   = get(p.id, 'mem') === 'true'
        if (!journal && !isMem) continue
        html += `<h2>${p.themeIcon || ''} ${p.title} <span style="font-size:12px;color:#8B6A2E">${p.ref}</span></h2>`
        if (isMem) html += `<p class="badge">✦ Memorized</p>`
        if (journal) html += `<h3>Journal Entry</h3><p>${journal.split('\n').join('<br/>')}</p>`
      }
    }
    html += `<hr style="border-color:rgba(139,26,26,0.2);margin-top:32px"/><p style="text-align:center;font-size:12px;color:#7A6248;font-style:normal">The words of Jesus — redletters.vercel.app</p></body></html>`
    // Print via a hidden iframe so we never navigate away or trap the user (critical in standalone PWA mode)
    const frame = document.createElement('iframe')
    frame.setAttribute('aria-hidden', 'true')
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0'
    document.body.appendChild(frame)
    const cleanup = () => setTimeout(() => { try { frame.remove() } catch (e) {} }, 1500)
    const fdoc = frame.contentWindow.document
    fdoc.open(); fdoc.write(html); fdoc.close()
    frame.contentWindow.onafterprint = cleanup
    setTimeout(() => {
      try { frame.contentWindow.focus(); frame.contentWindow.print() } catch (e) { console.error(e) }
      cleanup()
    }, 400)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await supabase.auth.signOut()
  }

  const [showReviews, setShowReviews] = useState(false)

  const Row = ({ icon, label, children, border = true }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 0',
      borderBottom: border ? `1px solid ${C.border}` : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18, width: 26, textAlign: 'center' }}>{icon}</span>
        <span style={{ fontSize: 16, color: C.text, fontFamily: "'EB Garamond',Georgia,serif" }}>{label}</span>
      </div>
      {children}
    </div>
  )

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: C.bg,
      fontFamily: "'EB Garamond',Georgia,serif",
      overflowY: 'auto',
    }}>
      {showReviews && <Reviews app="rl" appName="The Red Letters" eyebrow="The Red Letters" userEmail={profile?.email} C={C} lightMode={!darkMode} onClose={() => setShowReviews(false)} />}
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 0 80px' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${C.border}`,
          position: 'sticky', top: 0, zIndex: 10,
          background: 'rgba(247,242,234,0.97)', backdropFilter: 'blur(12px)',
        }}>
          <div>
            <div style={{ fontSize: 9, color: C.redL, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: "'Cinzel',Georgia,serif" }}>The Red Letters</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: C.cream, fontFamily: "'Cinzel',Georgia,serif" }}>Settings</div>
          </div>
          <button onClick={onClose} style={{ background: C.bgCard, border: `1px solid ${C.border}`, color: C.muted, width: 36, height: 36, borderRadius: 9, cursor: 'pointer', fontSize: 18 }}>←</button>
        </div>

        <div style={{ padding: '8px 20px' }}>

          {/* Progress */}
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Cinzel',Georgia,serif", marginBottom: 4 }}>Your Progress</div>
          </div>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 14 }}>
              {[[read, 'Passages Read'], [mem, 'Memorized'], [total, 'Total Passages']].map(([v, l]) => (
                <div key={l} style={{ background: C.redF, border: `1px solid ${C.redB}`, borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: C.red, fontFamily: "'Cinzel',Georgia,serif", lineHeight: 1 }}>{v}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ height: 6, background: C.redF, borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', background: `linear-gradient(90deg,${C.red},${C.redL})`, width: `${total > 0 ? Math.round((read / total) * 100) : 0}%`, transition: 'width .4s ease' }} />
            </div>
            <div style={{ fontSize: 12, color: C.muted, textAlign: 'center', marginBottom: 14 }}>
              {total > 0 ? `${Math.round((read / total) * 100)}% complete` : 'Begin reading'}
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset all reading and memorization progress? Journal entries will be kept.')) {
                  supabase.from('rl_entries').delete().eq('user_id', userId).in('field_key', ['read', 'mem']).then(() => setResetDone(true))
                }
              }}
              style={{ width: '100%', background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, padding: '10px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.06em' }}>
              {resetDone ? '✓ Progress Reset' : '↺ Reset Reading Progress'}
            </button>
          </div>

          {/* Account */}
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Cinzel',Georgia,serif", marginBottom: 4 }}>Account</div>
          </div>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: '0 16px' }}>
            <Row icon="✉️" label={profile?.email || 'Your account'}>
              <span style={{ fontSize: 11, color: C.green }}>✦ Free Access</span>
            </Row>
            <Row icon="⭐" label="Ratings & Reviews">
              <button onClick={() => setShowReviews(true)} style={{ background: C.goldF, border: `1px solid ${C.goldB}`, color: C.gold, padding: '6px 16px', borderRadius: 10, fontSize: 12, fontFamily: "'Cinzel',Georgia,serif", cursor: 'pointer', letterSpacing: '0.06em' }}>Open</button>
            </Row>
            <Row icon="🛟" label="Email Support">
              <a href="mailto:eloraradiance.co@gmail.com" style={{ background: C.goldF, border: `1px solid ${C.goldB}`, color: C.gold, padding: '6px 16px', borderRadius: 10, fontSize: 12, fontFamily: "'Cinzel',Georgia,serif", textDecoration: 'none', display: 'inline-block', letterSpacing: '0.06em' }}>Contact</a>
            </Row>
            <Row icon="🚪" label="Sign Out" border={false}>
              <button onClick={handleSignOut} disabled={signingOut} style={{ background: C.redF, border: `1px solid ${C.redB}`, color: C.redL, padding: '6px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.07em' }}>
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </Row>
          </div>

          {/* Share */}
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Cinzel',Georgia,serif", marginBottom: 4 }}>Share</div>
          </div>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px' }}>
            <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, marginBottom: 14 }}>
              Know someone who wants to go deeper in the words of Jesus? Share The Red Letters with them — it's completely free.
            </p>
            <div style={{ background: 'rgba(139,26,26,0.04)', border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', marginBottom: 12, fontSize: 13, color: C.muted, fontStyle: 'italic', lineHeight: 1.7 }}>
              "{shareText.split('\n')[0]}"
            </div>
            <button onClick={handleShare} style={{ width: '100%', background: copiedShare ? C.greenF : `linear-gradient(135deg,${C.redF},rgba(255,255,255,0.01))`, border: `1px solid ${copiedShare ? C.greenB : C.redB}`, color: copiedShare ? C.green : C.redL, padding: '13px', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.08em', transition: 'all .25s' }}>
              {copiedShare ? '✓ Copied — Send It to Someone' : '🔗 Share The Red Letters'}
            </button>
          </div>

          {/* More from Elora Radiance */}
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Cinzel',Georgia,serif", marginBottom: 4 }}>More from Elora Radiance Co.</div>
          </div>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: '12px 16px' }}>
            <p style={{ fontSize: 13, color: C.muted, fontStyle: 'italic', lineHeight: 1.7, marginBottom: 14 }}>
              The rest of the Elora Radiance ecosystem — Scripture-based tools for the whole Christian life.
            </p>
            {[
              { label: 'Armed & Anchored', desc: 'Spiritual warfare training journal', url: 'https://armedandanchored.vercel.app/', icon: '⚔️' },
              { label: 'Anchored Steps · Year 1', desc: 'Daily devotional · Year 1', url: 'https://anchored-steps.vercel.app/', icon: '⚓' },
              { label: 'Anchored Steps · Year 2', desc: 'Daily devotional · Year 2', url: 'https://anchored-steps-year2.vercel.app/', icon: '⚓' },
              { label: 'Anchored Verse', desc: 'Scripture for every emotion — free', url: 'https://anchoredverse.vercel.app/', icon: '📖' },
              { label: 'The Living Planner', desc: 'Faith-centered life planner', url: 'https://the-living-planner.vercel.app/', icon: '📓' },
            ].map(app => (
              <a key={app.url} href={app.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 14px', borderRadius: 12, marginBottom: 8, background: C.goldF, border: `1px solid ${C.goldB}`, textDecoration: 'none', transition: 'all .2s' }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{app.icon}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: 13, color: C.cream, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.05em', marginBottom: 2 }}>{app.label}</span>
                  <span style={{ display: 'block', fontSize: 12, color: C.muted, fontStyle: 'italic' }}>{app.desc}</span>
                </span>
                <span style={{ fontSize: 13, color: C.gold }}>↗</span>
              </a>
            ))}
          </div>

          {/* Export */}
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Cinzel',Georgia,serif", marginBottom: 4 }}>Your Data</div>
          </div>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px' }}>
            <p style={{ fontSize: 14, color: C.text, lineHeight: 1.7, marginBottom: 14 }}>
              Download all your journal entries and memorized passages as a text file.
            </p>
            <button onClick={handleExport} disabled={exporting} style={{ width: '100%', background: exporting ? 'transparent' : C.goldF, border: `1px solid ${exporting ? C.border : C.goldB}`, color: exporting ? C.muted : C.gold, padding: '13px', borderRadius: 12, cursor: exporting ? 'default' : 'pointer', fontSize: 13, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.08em', transition: 'all .25s', marginBottom: 8 }}>
              {exporting ? 'Preparing Export…' : '📥 Export Journal'}
            </button>
            <button onClick={handlePrintPDF} style={{ width: '100%', padding: '13px', borderRadius: 12, cursor: 'pointer', background: C.bgCard, border: `1px solid ${C.border}`, color: C.muted, fontSize: 12, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.08em' }}>
              🖨️ Print as PDF
            </button>
          </div>

          {/* Appearance */}
      <div style={{ marginTop:24, marginBottom:8 }}>
        <div style={{ fontSize:9, color:C.muted, letterSpacing:'0.14em', textTransform:'uppercase',
          fontFamily:"'Cinzel',Georgia,serif", marginBottom:4 }}>Appearance</div>
      </div>
      <div style={{ background:C.bgCard, border:`1px solid ${C.border}`, borderRadius:14, padding:'0 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'16px 0', borderBottom:'none' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:18, width:26, textAlign:'center' }}>{darkMode ? '🌙' : '☀️'}</span>
            <span style={{ fontSize:16, color:C.text, fontFamily:"'EB Garamond',Georgia,serif" }}>
              {darkMode ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
          <div onClick={onToggleDarkMode} style={{ width:48, height:28, borderRadius:14, cursor:'pointer',
            background: darkMode ? C.red : C.bgCard,
            border:`1px solid ${darkMode ? C.redB : C.border}`,
            position:'relative', transition:'all .25s' }}>
            <div style={{ position:'absolute', top:3, left: darkMode ? 22 : 3, width:20, height:20,
              borderRadius:'50%', background: darkMode ? '#fff' : C.muted,
              transition:'left .25s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }}/>
          </div>
        </div>
      </div>

      {/* About */}
          <div style={{ marginTop: 24, marginBottom: 8 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Cinzel',Georgia,serif", marginBottom: 4 }}>About</div>
          </div>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: '0 16px' }}>
            <Row icon="✦" label="The Red Letters">
              <span style={{ fontSize: 11, color: C.dim }}>v1.0</span>
            </Row>
            <Row icon="🌿" label="Elora Radiance Co." border={false}>
              <span style={{ fontSize: 11, color: C.dim }}>eloraradiance.com</span>
            </Row>
          </div>

        </div>
      </div>
    </div>
  )
}
