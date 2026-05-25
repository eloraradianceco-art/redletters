import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabaseClient'
import { THEMES, ALL_SAYINGS, GOSPEL_LABELS } from './data.js'
import { toPng } from 'html-to-image'

const C = {
  bg:'#F7F2EA', bgCard:'rgba(0,0,0,0.04)', bgMid:'#EDE6D6',
  red:'#8B1A1A', redL:'#A52020', redF:'rgba(139,26,26,0.1)', redB:'rgba(139,26,26,0.25)',
  words:'#8B1A1A',   // color of the red letter text
  gold:'#8B6A2E', goldL:'#A07840', goldF:'rgba(139,106,46,0.1)', goldB:'rgba(139,106,46,0.28)',
  cream:'#2A1A0E', text:'#3D2E1A', muted:'#7A6248', dim:'#9A8268',
  border:'rgba(0,0,0,0.08)', borderGold:'rgba(139,106,46,0.2)',
  green:'#2E6040', greenF:'rgba(46,96,64,0.1)', greenB:'rgba(46,96,64,0.3)',
}

const TABS = [
  { id:'words',   label:'The Words', icon:'📖', free:true  },
  { id:'setting', label:'Setting',   icon:'🧭', free:true  },
  { id:'meaning', label:'Meaning',   icon:'💡', free:true  },
  { id:'obey',    label:'Live It',   icon:'⚡', free:false },
  { id:'journal', label:'Journal',   icon:'📝', free:false },
  { id:'pray',    label:'Pray It',   icon:'🙏', free:false },
]

// ── Utilities ─────────────────────────────────────────────────────────────────
const getTodaySaying = () => {
  const day = Math.floor(Date.now() / 86400000)
  return ALL_SAYINGS[day % ALL_SAYINGS.length]
}

// ── Upgrade Prompt ─────────────────────────────────────────────────────────────
function UpgradePrompt({ onUpgrade, C }) {
  return (
    <div style={{background:`linear-gradient(145deg,${C.redF},rgba(155,32,32,0.06))`,
      border:`1px solid ${C.redB}`,borderRadius:16,padding:24,textAlign:'center',marginTop:8}}>
      <div style={{fontSize:28,marginBottom:10}}>✦</div>
      <div style={{fontSize:14,color:C.cream,fontFamily:"'Cinzel',Georgia,serif",
        letterSpacing:'0.06em',marginBottom:8}}>Unlock the Full Experience</div>
      <p style={{fontSize:13,color:C.muted,lineHeight:1.7,marginBottom:16,fontStyle:'italic'}}>
        Live It, Journal, Pray It, Memorization, and Progress tracking — one-time access.
      </p>
      <button onClick={onUpgrade} style={{
        background:`linear-gradient(135deg,${C.redF},rgba(155,32,32,0.08))`,
        border:`1px solid ${C.redB}`,color:C.redL,padding:'12px 28px',
        borderRadius:50,cursor:'pointer',fontSize:12,
        fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.1em',
      }}>
        Upgrade — $9 One-Time →
      </button>
    </div>
  )
}

// ── Memorize Modal ─────────────────────────────────────────────────────────────
function MemorizeModal({ saying, onClose, isMemorized, onMarkMemo }) {
  const [mode, setMode] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [typed, setTyped] = useState('')
  const [score, setScore] = useState(null)
  const words = saying.text.split(' ')
  const blanked = words.map((w,i) => (i+1)%3===0 ? '___' : w)

  const checkScore = () => {
    const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim()
    const tw = norm(typed).split(' '), ow = norm(saying.text).split(' ')
    const pct = Math.round(tw.filter(w=>ow.includes(w)).length / ow.length * 100)
    setScore(pct)
    if (pct >= 70) onMarkMemo()
  }
  const close = () => { onClose(); setMode(null); setRevealed(false); setTyped(''); setScore(null) }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.9)',zIndex:700,
      display:'flex',alignItems:'center',justifyContent:'center',padding:16,overflowY:'auto'}}
      onClick={()=>{ if(!mode) close() }}>
      <div onClick={e=>e.stopPropagation()} style={{background:`linear-gradient(145deg,${C.bg},#101820)`,
        border:`1px solid ${C.goldB}`,borderRadius:20,padding:24,maxWidth:420,width:'100%',
        boxShadow:'0 20px 60px rgba(0,0,0,0.7)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{fontSize:11,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",
            letterSpacing:'0.16em',textTransform:'uppercase'}}>{mode ? '← ' : ''}✦ Memorize</div>
          <button onClick={close} style={{background:'transparent',border:'none',color:C.muted,
            cursor:'pointer',fontSize:20,lineHeight:1}}>×</button>
        </div>
        <div style={{fontSize:13,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",
          letterSpacing:'0.1em',marginBottom:16,paddingBottom:14,
          borderBottom:`1px solid rgba(176,138,78,0.2)`,textAlign:'center'}}>
          {saying.ref}
          {isMemorized && <span style={{display:'block',fontSize:11,color:C.green,marginTop:4}}>✓ Memorized</span>}
        </div>
        {!mode ? (
          <div>
            <p style={{fontSize:14,color:C.muted,textAlign:'center',marginBottom:16,fontStyle:'italic',lineHeight:1.6}}>
              Choose your memorization method:
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[{id:'recall',icon:'🧠',title:'Read & Recall',desc:'See the reference, recite aloud, then reveal to check'},
                {id:'blanks',icon:'✏️',title:'Fill the Gaps',desc:'Read the verse with every 3rd word blanked out'},
                {id:'type',icon:'⌨️',title:'Write it Out',desc:'Type the verse from memory and get a score'},
              ].map(m => (
                <button key={m.id} onClick={()=>{ setMode(m.id); setRevealed(false); setTyped(''); setScore(null) }}
                  style={{display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:12,
                    cursor:'pointer',textAlign:'left',background:C.redF,border:`1px solid ${C.redB}`}}>
                  <span style={{fontSize:22,flexShrink:0}}>{m.icon}</span>
                  <span>
                    <span style={{display:'block',fontSize:13,color:C.cream,fontFamily:"'Cinzel',Georgia,serif",
                      letterSpacing:'0.06em',marginBottom:2}}>{m.title}</span>
                    <span style={{display:'block',fontSize:12,color:C.muted,fontStyle:'italic'}}>{m.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : mode === 'recall' ? (
          <div>
            {!revealed ? (
              <div style={{textAlign:'center'}}>
                <p style={{fontSize:14,color:C.muted,fontStyle:'italic',marginBottom:20,lineHeight:1.7}}>
                  Say the verse aloud from memory, then reveal to check yourself.
                </p>
                <button onClick={()=>setRevealed(true)} style={{background:C.goldF,border:`1px solid ${C.goldB}`,
                  color:C.gold,padding:'12px 28px',borderRadius:50,cursor:'pointer',fontSize:12,
                  fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.08em'}}>Reveal Verse</button>
              </div>
            ) : (
              <div>
                <p style={{fontSize:17,color:C.words,fontStyle:'italic',lineHeight:1.85,
                  marginBottom:20,textAlign:'center'}}>"{saying.text}"</p>
                <button onClick={onMarkMemo} style={{width:'100%',background:C.greenF,
                  border:`1px solid ${C.greenB}`,color:C.green,padding:'13px',borderRadius:12,
                  cursor:'pointer',fontSize:13,fontFamily:"'Cinzel',Georgia,serif",
                  letterSpacing:'0.08em',marginBottom:10}}>✓ Mark Memorized</button>
                <button onClick={()=>setRevealed(false)} style={{width:'100%',background:'transparent',
                  border:'none',color:C.muted,cursor:'pointer',fontSize:13,
                  fontFamily:"'EB Garamond',Georgia,serif"}}>Try Again</button>
              </div>
            )}
          </div>
        ) : mode === 'blanks' ? (
          <div>
            <div style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${C.border}`,
              borderRadius:12,padding:'16px',marginBottom:14}}>
              <p style={{fontSize:16,color:C.cream,fontStyle:'italic',lineHeight:2.1,margin:0}}>
                {blanked.map((w,i) => (
                  <span key={i} style={{color:w==='___'?C.gold:C.cream,
                    borderBottom:w==='___'?`1px solid ${C.gold}`:undefined,
                    padding:w==='___'?'0 4px':undefined}}>{w}{i<blanked.length-1?' ':''}</span>
                ))}
              </p>
            </div>
            {!revealed ? (
              <button onClick={()=>setRevealed(true)} style={{width:'100%',background:C.goldF,
                border:`1px solid ${C.goldB}`,color:C.gold,padding:'12px',borderRadius:12,
                cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",
                letterSpacing:'0.08em',marginBottom:10}}>Reveal Missing Words</button>
            ) : (
              <div style={{background:C.greenF,border:`1px solid ${C.greenB}`,borderRadius:10,
                padding:'12px 14px',marginBottom:12}}>
                <p style={{fontSize:14,color:C.text,fontStyle:'italic',lineHeight:1.8,margin:0}}>
                  {words.map((w,i) => (
                    <span key={i} style={{color:(i+1)%3===0?C.green:C.text,
                      fontWeight:(i+1)%3===0?600:400}}>{w}{i<words.length-1?' ':''}</span>
                  ))}
                </p>
              </div>
            )}
            <button onClick={onMarkMemo} style={{width:'100%',background:C.greenF,
              border:`1px solid ${C.greenB}`,color:C.green,padding:'12px',borderRadius:12,
              cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",
              letterSpacing:'0.08em'}}>✓ Mark as Memorized</button>
          </div>
        ) : (
          <div>
            <p style={{fontSize:14,color:C.muted,fontStyle:'italic',marginBottom:12,lineHeight:1.6,textAlign:'center'}}>
              Type the verse from memory.
            </p>
            {score === null ? (
              <div>
                <textarea rows={5} value={typed} onChange={e=>setTyped(e.target.value)}
                  placeholder="Type the verse here from memory..."
                  style={{width:'100%',background:'rgba(255,255,255,0.04)',border:`1px solid ${C.border}`,
                    borderRadius:10,color:C.cream,fontSize:15,padding:'12px',
                    fontFamily:"'EB Garamond',Georgia,serif",outline:'none',resize:'none',
                    boxSizing:'border-box',marginBottom:10,lineHeight:1.7}}/>
                <button onClick={checkScore} disabled={!typed.trim()} style={{width:'100%',
                  background:C.goldF,border:`1px solid ${C.goldB}`,color:C.gold,padding:'12px',
                  borderRadius:12,cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",
                  letterSpacing:'0.08em',opacity:typed.trim()?1:0.4}}>Check My Score</button>
              </div>
            ) : (
              <div style={{textAlign:'center'}}>
                <div style={{fontSize:48,fontWeight:700,fontFamily:"'Cinzel',Georgia,serif",
                  marginBottom:4,color:score>=80?C.green:score>=50?C.gold:C.redL}}>{score}%</div>
                <div style={{fontSize:13,color:C.muted,marginBottom:16}}>
                  {score>=90?'Nearly perfect!':score>=70?'Great progress!':score>=50?'Good start!':'Keep practicing!'}
                </div>
                {score >= 70 && <button onClick={onMarkMemo} style={{width:'100%',background:C.greenF,
                  border:`1px solid ${C.greenB}`,color:C.green,padding:'12px',borderRadius:12,
                  cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",
                  letterSpacing:'0.08em',marginBottom:10}}>✓ Mark as Memorized</button>}
                <button onClick={()=>{ setTyped(''); setScore(null) }} style={{width:'100%',
                  background:'transparent',border:'none',color:C.muted,cursor:'pointer',
                  fontSize:13,fontFamily:"'EB Garamond',Georgia,serif"}}>Try Again</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Share Card ─────────────────────────────────────────────────────────────────
function ShareCard({ saying, theme, onClose }) {
  const cardRef = useRef(null)
  const [light, setLight] = useState(false)
  const [sharing, setSharing] = useState(false)
  const gospelInfo = GOSPEL_LABELS[saying.gospel] || {}

  const cBg = light ? 'linear-gradient(155deg,#F5F0E8 0%,#EDE6D6 100%)' : 'linear-gradient(155deg,#080D14 0%,#101820 100%)'
  const cBorder = light ? 'rgba(0,0,0,0.1)' : 'rgba(155,32,32,0.3)'
  const cText = light ? '#2A0808' : '#E8D0D0'
  const cWords = light ? '#8B1A1A' : '#E8A0A0'
  const cMuted = light ? '#8B7060' : '#A8B0BC'

  const handleShare = async () => {
    if (!cardRef.current) return
    setSharing(true)
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust:true, pixelRatio:2, backgroundColor: light?'#F5F0E8':'#080D14' })
      const res = await fetch(dataUrl); const blob = await res.blob()
      const file = new File([blob], 'red-letters.png', { type:'image/png' })
      const caption = `"${saying.text}" \u2014 ${saying.ref}\n\nThe Red Letters \u2014 the words of Jesus.\n\nred-letters.vercel.app`
      if (navigator.canShare?.({ files:[file] })) {
        await navigator.share({ files:[file], title:'The Red Letters', text:caption })
      } else {
        const a = document.createElement('a'); a.href = dataUrl; a.download = 'red-letters.png'; a.click()
      }
    } catch(e) { console.error(e) }
    setSharing(false)
  }

  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:600,
      display:'flex',alignItems:'flex-start',justifyContent:'center',
      overflowY:'auto',padding:'16px 16px 48px'}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:'linear-gradient(145deg,#080D14,#101820)',
        border:`1px solid ${C.redB}`,borderRadius:20,padding:22,width:'100%',maxWidth:420,
        marginTop:24,boxShadow:'0 20px 60px rgba(0,0,0,0.7)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{fontSize:10,color:C.redL,fontFamily:"'Cinzel',Georgia,serif",
            letterSpacing:'0.18em',textTransform:'uppercase'}}>✦ Share Card</div>
          <button onClick={onClose} style={{background:'transparent',border:'none',
            color:C.muted,cursor:'pointer',fontSize:20,lineHeight:1,padding:0}}>×</button>
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
          <button onClick={()=>setLight(!light)} style={{background:light?'rgba(255,255,255,0.1)':C.redF,
            border:`1px solid ${light?'rgba(255,255,255,0.2)':C.redB}`,
            color:light?'#2A0808':C.redL,padding:'5px 13px',borderRadius:20,cursor:'pointer',
            fontSize:11,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.06em'}}>
            {light ? '☀ Light' : '🌙 Dark'}
          </button>
        </div>
        {/* Card rendered to image */}
        <div ref={cardRef} style={{background:cBg,border:`1px solid ${cBorder}`,borderRadius:18,
          padding:'28px 24px',marginBottom:18,textAlign:'center',fontFamily:"'EB Garamond',Georgia,serif"}}>
          <img src="/icon.png" alt="" style={{width:36,height:36,borderRadius:9,marginBottom:10}}/>
          <div style={{fontSize:9,color:cWords,fontFamily:"'Cinzel',Georgia,serif",
            letterSpacing:'0.22em',textTransform:'uppercase',marginBottom:4}}>The Red Letters</div>
          <div style={{fontSize:9,color:cMuted,fontFamily:"'Cinzel',Georgia,serif",
            letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:14,paddingBottom:14,
            borderBottom:`1px solid ${cBorder}`}}>
            {theme?.title} · {gospelInfo.label}
          </div>
          <p style={{fontSize:17,color:cWords,fontStyle:'italic',lineHeight:1.9,margin:'0 0 14px',
            letterSpacing:'0.01em'}}>"{saying.text}"</p>
          <p style={{fontSize:10,color:cMuted,fontFamily:"'Cinzel',Georgia,serif",
            letterSpacing:'0.14em',textTransform:'uppercase',margin:'0 0 16px'}}>{saying.ref}</p>
          <p style={{fontSize:9,color:cMuted,margin:0,letterSpacing:'0.05em'}}>
            The words of Jesus — eloraradiance.com
          </p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
          <button onClick={handleShare} disabled={sharing} style={{background:`linear-gradient(135deg,${C.redF},rgba(155,32,32,0.06))`,
            border:`1px solid ${C.redB}`,color:C.redL,padding:'12px',borderRadius:10,cursor:'pointer',
            fontSize:12,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.08em',opacity:sharing?0.6:1}}>
            {sharing ? 'Saving...' : 'Share Image ↗'}
          </button>
          <button onClick={()=>navigator.clipboard?.writeText(`"${saying.text}" — ${saying.ref}`).then(()=>alert('Copied!'))}
            style={{background:'transparent',border:`1px solid ${C.border}`,color:C.muted,
              padding:'12px',borderRadius:10,cursor:'pointer',fontSize:12,
              fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.08em'}}>
            Copy Text
          </button>
        </div>
        <button onClick={onClose} style={{width:'100%',background:'transparent',border:'none',
          color:C.dim,cursor:'pointer',fontSize:13,fontFamily:"'EB Garamond',Georgia,serif",paddingTop:4}}>
          Close
        </button>
      </div>
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function RedLetters({ session, profile }) {
  const userId = session?.user?.id
  const isPremium = profile?.premium === true

  const [view, setView] = useState('home')   // 'home' | 'theme' | 'saying'
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [selectedSaying, setSelectedSaying] = useState(null)
  const [tab, setTab] = useState('words')
  const [entries, setEntries] = useState([])
  const [showMemo, setShowMemo] = useState(false)
  const [shareCard, setShareCard] = useState(null)
  const [journalSaved, setJournalSaved] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [savedSayings, setSavedSayings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rl_saved') || '[]') } catch { return [] }
  })
  const [showSaved, setShowSaved] = useState(false)
  const [showThemeJump, setShowThemeJump] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showSettings, setShowSettings] = useState(false)

  const todaySaying = getTodaySaying()
  const saveTimers = useRef({})

  // Load all entries
  useEffect(() => {
    if (!userId) return
    supabase.from('rl_entries').select('*').eq('user_id', userId)
      .order('updated_at', { ascending:false })
      .then(({ data }) => { if (data) setEntries(data) })
  }, [userId])

  const get = (sayingId, key) => {
    const e = entries.find(e => e.saying_id === sayingId && e.field_key === key)
    return e?.field_value || ''
  }

  const set = useCallback((sayingId, key, value) => {
    if (!userId) return
    setEntries(prev => {
      const idx = prev.findIndex(e => e.saying_id === sayingId && e.field_key === key)
      if (idx >= 0) {
        const u = [...prev]; u[idx] = {...u[idx], field_value:value, updated_at:new Date().toISOString()}; return u
      }
      return [...prev, {user_id:userId, saying_id:sayingId, field_key:key, field_value:value, updated_at:new Date().toISOString()}]
    })
    const tk = `${sayingId}__${key}`
    clearTimeout(saveTimers.current[tk])
    saveTimers.current[tk] = setTimeout(() => {
      supabase.from('rl_entries').upsert({
        user_id:userId, saying_id:sayingId, field_key:key,
        field_value:value, updated_at:new Date().toISOString()
      }, { onConflict:'user_id,saying_id,field_key' })
    }, 1000)
  }, [userId])

  const doSearch = (q) => {
    setSearchQ(q)
    if (!q.trim()) { setSearchResults([]); return }
    const term = q.toLowerCase()
    const results = []
    THEMES.forEach(t => {
      t.sayings.forEach(s => {
        if (s.text.toLowerCase().includes(term) || s.ref.toLowerCase().includes(term) ||
            t.title.toLowerCase().includes(term) || s.context.toLowerCase().includes(term) ||
            s.meaning.toLowerCase().includes(term)) {
          results.push({ saying:s, theme:t })
        }
      })
    })
    setSearchResults(results)
  }

  const toggleSave = (sayingId) => {
    const next = savedSayings.includes(sayingId)
      ? savedSayings.filter(id => id !== sayingId)
      : [...savedSayings, sayingId]
    setSavedSayings(next)
    localStorage.setItem('rl_saved', JSON.stringify(next))
  }
  const isSaved = (sayingId) => savedSayings.includes(sayingId)

  const openSaying = (saying, theme) => {
    setSelectedSaying(saying)
    setSelectedTheme(theme)
    setTab('words')
    setView('saying')
    window.scrollTo(0,0)
  }

  const goBack = () => {
    if (view === 'saying') { setView(selectedTheme ? 'theme' : 'home'); window.scrollTo(0,0) }
    else if (view === 'theme') { setView('home'); window.scrollTo(0,0) }
  }

  // ── HOME ────────────────────────────────────────────────────────────────────
  const HomeView = () => {
    const gospelInfo = GOSPEL_LABELS[todaySaying.gospel] || {}
    const todayTheme = THEMES.find(t => t.id === todaySaying.themeId)

    return (
      <div style={{padding:'0 0 100px',maxWidth:720,margin:'0 auto',width:'100%'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',
          padding:'20px 20px 0',marginBottom:8}}>
          <div>
            <div style={{fontSize:22,fontWeight:700,color:C.cream,
              fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.06em'}}>The Red Letters</div>
            <div style={{fontSize:11,color:C.redL,letterSpacing:'0.14em',textTransform:'uppercase',
              fontFamily:"'Cinzel',Georgia,serif",marginTop:2}}>The Words of Jesus</div>
          </div>
          <button onClick={()=>setShowSettings(true)}
            style={{background:C.bgCard,border:`1px solid ${C.border}`,color:C.muted,
              borderRadius:10,padding:'8px 12px',cursor:'pointer',fontSize:14}}>⚙️</button>
        </div>

        {/* AS1-style under-header nav */}
        <div style={{display:'flex',justifyContent:'center',gap:3,padding:'6px 14px 12px',
          flexWrap:'nowrap',overflowX:'auto',borderBottom:`1px solid ${C.border}`,marginBottom:16}}>
          {[['search','🔍 Search'],['saved','★ Saved'],['settings','⚙️ Settings']].map(([v,l])=>(
            <button key={v} onClick={()=>{
              if(v==='search'){setShowSearch(true);setSearchQ('');setSearchResults([])}
              else if(v==='saved'){setShowSaved(true)}
              else if(v==='settings'){setShowSettings(true)}
            }} style={{background:'transparent',border:'none',color:C.muted,padding:'4px 10px',
              borderRadius:6,cursor:'pointer',fontSize:10,fontFamily:"'Cinzel',Georgia,serif",
              letterSpacing:'0.06em',whiteSpace:'nowrap',flexShrink:0,touchAction:'manipulation'}}>
              {l}
            </button>
          ))}
        </div>

        {/* Today's Word */}
        <div style={{margin:'0 20px 28px'}}>
          <div style={{fontSize:9,color:C.redL,fontFamily:"'Cinzel',Georgia,serif",
            letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:10}}>✦ Today's Word</div>
          <div style={{background:`linear-gradient(145deg,rgba(155,32,32,0.1),rgba(155,32,32,0.04))`,
            border:`1px solid ${C.redB}`,borderRadius:18,padding:22,cursor:'pointer',position:'relative',
            overflow:'hidden'}}
            onClick={() => openSaying(todaySaying, todayTheme)}>
            <div style={{position:'absolute',top:-10,right:-10,fontSize:60,opacity:0.04}}>✦</div>
            {/* Gospel tag */}
            <div style={{display:'inline-block',fontSize:9,color:gospelInfo.color||C.redL,
              background:`${gospelInfo.color||C.redL}18`,border:`1px solid ${gospelInfo.color||C.redL}40`,
              borderRadius:6,padding:'2px 8px',fontFamily:"'Cinzel',Georgia,serif",
              letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:14}}>
              {gospelInfo.label}
            </div>
            <p style={{fontSize:'clamp(17px,2.5vw,22px)',color:C.words,fontStyle:'italic',lineHeight:1.9,
              marginBottom:14,letterSpacing:'0.01em'}}>"{todaySaying.text}"</p>
            <div style={{fontSize:11,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",
              letterSpacing:'0.1em',marginBottom:4}}>{todaySaying.ref}</div>
            <div style={{fontSize:11,color:C.muted,fontFamily:"'Cinzel',Georgia,serif",
              letterSpacing:'0.06em'}}>{todaySaying.themeIcon} {todaySaying.themeTitle}</div>
          </div>
        </div>

        {/* Theme grid */}
        <div style={{padding:'0 20px'}}>
          <div style={{fontSize:9,color:C.muted,fontFamily:"'Cinzel',Georgia,serif",
            letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:12}}>Browse by Theme</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {THEMES.map(t => {
              const done = t.sayings.filter(s => get(s.id,'read')==='true').length
              return (
                <button key={t.id} onClick={()=>{ setSelectedTheme(t); setView('theme'); window.scrollTo(0,0) }}
                  style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,
                    padding:'18px 16px',cursor:'pointer',textAlign:'left',transition:'all .2s',
                    position:'relative',overflow:'hidden'}}>
                  <div style={{fontSize:22,marginBottom:8}}>{t.icon}</div>
                  <div style={{fontSize:12,color:C.cream,fontFamily:"'Cinzel',Georgia,serif",
                    letterSpacing:'0.04em',marginBottom:4,lineHeight:1.3}}>{t.title}</div>
                  <div style={{fontSize:11,color:C.muted,fontStyle:'italic',
                    lineHeight:1.4,marginBottom:8}}>{t.subtitle}</div>
                  <div style={{fontSize:9,color:C.dim,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.08em'}}>
                    {done}/{t.sayings.length} read
                  </div>
                  {done === t.sayings.length && done > 0 && (
                    <div style={{position:'absolute',top:10,right:10,fontSize:10,color:C.green}}>✓</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Premium bar */}
        {!isPremium && (
          <div style={{margin:'28px 20px 0',background:`linear-gradient(135deg,${C.redF},rgba(155,32,32,0.04))`,
            border:`1px solid ${C.redB}`,borderRadius:14,padding:'14px 16px',
            display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
            <div>
              <div style={{fontSize:11,color:C.redL,fontFamily:"'Cinzel',Georgia,serif",
                letterSpacing:'0.08em',marginBottom:3}}>Unlock Full Access</div>
              <div style={{fontSize:12,color:C.muted}}>Journal, Pray It, Memorize & more</div>
            </div>
            <button onClick={()=>window.location.href='https://buy.stripe.com/STRIPE_LINK'}
              style={{background:`linear-gradient(135deg,${C.redF},rgba(155,32,32,0.08))`,
                border:`1px solid ${C.redB}`,color:C.redL,padding:'9px 16px',borderRadius:50,
                cursor:'pointer',fontSize:11,fontFamily:"'Cinzel',Georgia,serif",
                letterSpacing:'0.08em',whiteSpace:'nowrap'}}>
              $9 →
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── THEME VIEW ──────────────────────────────────────────────────────────────
  const ThemeView = () => {
    if (!selectedTheme) return null
    return (
      <div style={{padding:'0 0 100px'}}>
        <div style={{padding:'20px 20px 0',marginBottom:24}}>
          <button onClick={goBack} style={{background:C.bgCard,border:`1px solid ${C.border}`,
            color:C.muted,borderRadius:10,padding:'8px 14px',cursor:'pointer',
            fontSize:12,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.08em',marginBottom:16}}>
            ← Back
          </button>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:6,position:'relative'}}>
            <span style={{fontSize:28}}>{selectedTheme.icon}</span>
            <div style={{flex:1}}>
              <button onClick={()=>setShowThemeJump(v=>!v)} style={{background:'transparent',border:'none',cursor:'pointer',padding:0,textAlign:'left',touchAction:'manipulation'}}>
                <div style={{fontSize:18,fontWeight:700,color:C.cream,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.06em'}}>{selectedTheme.title} <span style={{fontSize:12,color:C.muted}}>{showThemeJump?'▲':'▼'}</span></div>
              </button>
              <div style={{fontSize:12,color:C.muted,fontStyle:'italic'}}>{selectedTheme.subtitle}</div>
            </div>
          </div>
          {showThemeJump && (
            <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:12,padding:10,marginBottom:14,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,maxHeight:220,overflowY:'auto',boxShadow:'0 8px 24px rgba(0,0,0,0.4)'}}>
              {THEMES.map(t=>(
                <button key={t.id} onClick={()=>{setSelectedTheme(t);setShowThemeJump(false);window.scrollTo(0,0);}} style={{background:t.id===selectedTheme.id?C.redF:'transparent',border:`1px solid ${t.id===selectedTheme.id?C.redB:C.border}`,color:t.id===selectedTheme.id?C.redL:C.muted,borderRadius:10,padding:'8px 6px',cursor:'pointer',fontSize:9,fontFamily:"'Cinzel',Georgia,serif",textAlign:'center',lineHeight:1.4,touchAction:'manipulation'}}>
                  <div style={{fontSize:18,marginBottom:2}}>{t.icon}</div>
                  <div>{t.title}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{padding:'0 20px',display:'flex',flexDirection:'column',gap:12}}>
          {selectedTheme.sayings.map(s => {
            const gospelInfo = GOSPEL_LABELS[s.gospel] || {}
            const isRead = get(s.id,'read') === 'true'
            const isMemo = get(s.id,'memo') === 'true'
            return (
              <button key={s.id} onClick={()=>openSaying(s,selectedTheme)}
                style={{background:isRead?`linear-gradient(145deg,${C.redF},rgba(155,32,32,0.04))`:C.bgCard,
                  border:`1px solid ${isRead?C.redB:C.border}`,borderRadius:16,padding:18,
                  cursor:'pointer',textAlign:'left',transition:'all .2s',position:'relative'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <div style={{fontSize:9,color:gospelInfo.color||C.redL,
                    background:`${gospelInfo.color||C.redL}18`,border:`1px solid ${gospelInfo.color||C.redL}40`,
                    borderRadius:6,padding:'2px 8px',fontFamily:"'Cinzel',Georgia,serif",
                    letterSpacing:'0.1em',textTransform:'uppercase'}}>
                    {gospelInfo.label}
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    {isRead && <span style={{fontSize:10,color:C.redL}}>✓</span>}
                    {isMemo && <span style={{fontSize:10,color:C.green}}>✦</span>}
                    <button onClick={(e)=>{e.stopPropagation();toggleSave(s.id);}} style={{background:'transparent',border:'none',color:isSaved(s.id)?C.gold:C.dim,cursor:'pointer',fontSize:16,lineHeight:1,touchAction:'manipulation'}}>{isSaved(s.id)?'★':'☆'}</button>
                  </div>
                </div>
                <p style={{fontSize:16,color:C.words,fontStyle:'italic',lineHeight:1.8,
                  marginBottom:10}}>{s.text.length > 120 ? s.text.slice(0,120)+'...' : s.text}</p>
                <div style={{fontSize:11,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",
                  letterSpacing:'0.1em'}}>{s.ref}</div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── SAYING VIEW ─────────────────────────────────────────────────────────────
  const SayingView = () => {
    if (!selectedSaying) return null
    const s = selectedSaying
    const t = selectedTheme
    const gospelInfo = GOSPEL_LABELS[s.gospel] || {}
    const isMemo = get(s.id,'memo') === 'true'
    const journalVal = get(s.id,'journal')

    // Mark as read when opened
    useEffect(() => {
      if (get(s.id,'read') !== 'true') set(s.id,'read','true')
    }, [s.id])

    const VISIBLE_TABS = TABS.filter(tb => isPremium || tb.free)

    return (
      <div>
        {/* Header */}
        <div style={{padding:'20px 20px 0',marginBottom:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <button onClick={goBack} style={{background:C.bgCard,border:`1px solid ${C.border}`,
              color:C.muted,borderRadius:10,padding:'7px 13px',cursor:'pointer',
              fontSize:12,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.08em'}}>
              ← {t?.title || 'Back'}
            </button>
            <div style={{display:'flex',gap:8}}>
              {isPremium && (
                <button onClick={()=>setShowMemo(true)}
                  style={{background:isMemo?C.greenF:C.bgCard,
                    border:`1px solid ${isMemo?C.greenB:C.border}`,
                    color:isMemo?C.green:C.muted,borderRadius:10,padding:'7px 12px',
                    cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif"}}>
                  {isMemo ? '✦ Memorized' : '✦ Memorize'}
                </button>
              )}
              <button onClick={()=>setShareCard({saying:s, theme:t})}
                style={{background:C.bgCard,border:`1px solid ${C.border}`,color:C.muted,
                  borderRadius:10,padding:'7px 12px',cursor:'pointer',fontSize:12}}>
                🖼
              </button>
            </div>
          </div>
          {/* Gospel tag */}
          <div style={{display:'inline-block',fontSize:9,color:gospelInfo.color||C.redL,
            background:`${gospelInfo.color||C.redL}18`,border:`1px solid ${gospelInfo.color||C.redL}40`,
            borderRadius:6,padding:'2px 8px',fontFamily:"'Cinzel',Georgia,serif",
            letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>
            {gospelInfo.label} · {t?.title}
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:0,padding:'0 20px',marginBottom:0,
          borderBottom:`1px solid ${C.border}`,overflowX:'auto'}}>
          {TABS.map(tb => {
            const locked = !isPremium && !tb.free
            return (
              <button key={tb.id}
                onClick={()=>{ if (!locked) setTab(tb.id) }}
                style={{flex:'0 0 auto',padding:'10px 14px',cursor:locked?'default':'pointer',
                  background:'transparent',border:'none',
                  borderBottom:`2px solid ${tab===tb.id?C.redL:'transparent'}`,
                  color:tab===tb.id?C.redL:locked?C.dim:C.muted,
                  fontSize:11,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.06em',
                  transition:'all .2s',whiteSpace:'nowrap'}}>
                {tb.icon} {tb.label}{locked?' 🔒':''}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div style={{padding:'24px 20px 120px',maxWidth:700,margin:'0 auto'}}>

          {tab === 'words' && (
            <div>
              <div style={{background:`linear-gradient(145deg,rgba(155,32,32,0.08),rgba(155,32,32,0.03))`,
                border:`1px solid ${C.redB}`,borderRadius:16,padding:24,marginBottom:16,
                position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-10,right:-10,fontSize:70,
                  opacity:0.04,color:C.redL,pointerEvents:'none'}}>✦</div>
                <p style={{fontSize:20,color:C.words,fontStyle:'italic',lineHeight:1.95,
                  margin:'0 0 16px',letterSpacing:'0.01em'}}>"{s.text}"</p>
                <div style={{fontSize:12,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",
                  letterSpacing:'0.12em',textTransform:'uppercase'}}>{s.ref}</div>
              </div>
              {/* Gospel source info */}
              <div style={{background:C.bgCard,border:`1px solid ${C.border}`,
                borderRadius:12,padding:'12px 16px',marginBottom:16}}>
                <div style={{fontSize:9,color:C.muted,fontFamily:"'Cinzel',Georgia,serif",
                  letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:4}}>Source</div>
                <div style={{fontSize:13,color:C.text,display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:10,color:gospelInfo.color||C.redL,
                    background:`${gospelInfo.color||C.redL}18`,border:`1px solid ${gospelInfo.color||C.redL}40`,
                    borderRadius:6,padding:'2px 8px',fontFamily:"'Cinzel',Georgia,serif",
                    letterSpacing:'0.1em',textTransform:'uppercase'}}>
                    {gospelInfo.label}
                  </span>
                  <span>{s.ref}</span>
                </div>
              </div>
            </div>
          )}

          {tab === 'setting' && (
            <div>
              <div style={{fontSize:9,color:C.redL,fontFamily:"'Cinzel',Georgia,serif",
                letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:12}}>🧭 Setting</div>
              {s.context.split('\n\n').map((para,i) => (
                <p key={i} style={{fontSize:16,color:C.text,lineHeight:1.9,
                  marginBottom:16,fontStyle:i===0?'normal':'italic'}}>{para}</p>
              ))}
            </div>
          )}

          {tab === 'meaning' && (
            <div>
              <div style={{fontSize:9,color:C.redL,fontFamily:"'Cinzel',Georgia,serif",
                letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:12}}>💡 Meaning</div>
              {s.meaning.split('\n\n').map((para,i) => (
                <p key={i} style={{fontSize:16,color:C.text,lineHeight:1.9,marginBottom:16}}>{para}</p>
              ))}
            </div>
          )}

          {tab === 'obey' && isPremium && (
            <div>
              <div style={{fontSize:9,color:C.redL,fontFamily:"'Cinzel',Georgia,serif",
                letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:12}}>⚡ Live It</div>
              <div style={{background:C.redF,border:`1px solid ${C.redB}`,borderRadius:14,
                padding:20,marginBottom:8}}>
                <p style={{fontSize:16,color:C.text,lineHeight:1.9,margin:0}}>{s.obey}</p>
              </div>
            </div>
          )}

          {tab === 'obey' && !isPremium && <UpgradePrompt C={C} onUpgrade={()=>window.location.href='https://buy.stripe.com/STRIPE_LINK'}/>}

          {tab === 'journal' && isPremium && (
            <div>
              <div style={{fontSize:9,color:C.redL,fontFamily:"'Cinzel',Georgia,serif",
                letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:10}}>📝 Journal</div>
              <p style={{fontSize:13,color:C.muted,fontStyle:'italic',lineHeight:1.7,marginBottom:12}}>
                What is Jesus saying to you through these words? What do you notice? What does it ask of you?
              </p>
              <textarea rows={10} value={journalVal}
                onChange={e=>set(s.id,'journal',e.target.value)}
                placeholder="Write your reflection here..."
                style={{width:'100%',background:'rgba(255,255,255,0.03)',border:`1px solid ${C.borderGold}`,
                  borderRadius:14,color:C.cream,fontSize:17,lineHeight:1.9,padding:'14px 16px',
                  fontFamily:"'EB Garamond',Georgia,serif",outline:'none',resize:'vertical',
                  boxSizing:'border-box',minHeight:200}}/>
              <button onClick={async()=>{
                  if (userId && selectedSaying) {
                    await supabase.from('rl_entries').upsert({
                      user_id:userId, saying_id:s.id, field_key:'journal',
                      field_value:journalVal, updated_at:new Date().toISOString()
                    },{ onConflict:'user_id,saying_id,field_key' })
                  }
                  setJournalSaved(true); setTimeout(()=>setJournalSaved(false),2000)
                }}
                style={{width:'100%',marginTop:12,
                  background:journalSaved?C.greenF:`linear-gradient(135deg,${C.redF},rgba(255,255,255,0.01))`,
                  border:`1px solid ${journalSaved?C.greenB:C.redB}`,
                  color:journalSaved?C.green:C.redL,padding:'12px',borderRadius:12,
                  cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",
                  letterSpacing:'0.08em',transition:'all .25s'}}>
                {journalSaved ? '✓ Saved' : 'Save Entry'}
              </button>
            </div>
          )}

          {tab === 'journal' && !isPremium && <UpgradePrompt C={C} onUpgrade={()=>window.location.href='https://buy.stripe.com/STRIPE_LINK'}/>}

          {tab === 'pray' && isPremium && (
            <div>
              <div style={{fontSize:9,color:C.redL,fontFamily:"'Cinzel',Georgia,serif",
                letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:12}}>🙏 Pray It</div>
              <div style={{background:C.goldF,border:`1px solid ${C.goldB}`,
                borderRadius:16,padding:22,marginBottom:16}}>
                <p style={{fontSize:17,color:C.cream,lineHeight:1.95,margin:0,fontStyle:'italic'}}>
                  {s.prayer}
                </p>
              </div>
              <p style={{fontSize:12,color:C.dim,textAlign:'center',fontStyle:'italic'}}>
                Pray this aloud. The spoken prayer has weight.
              </p>
            </div>
          )}

          {tab === 'pray' && !isPremium && <UpgradePrompt C={C} onUpgrade={()=>window.location.href='https://buy.stripe.com/STRIPE_LINK'}/>}
        </div>

        {/* Bottom nav */}
        <div style={{position:'fixed',bottom:0,left:0,right:0,
          background:C.bg,borderTop:`1px solid ${C.border}`,
          display:'flex',alignItems:'center',justifyContent:'center',
          padding:'12px 20px 20px',gap:10}}>
          {/* Prev tab */}
          {(() => {
            const visTabs = TABS.filter(tb => isPremium || tb.free)
            const i = visTabs.findIndex(tb => tb.id === tab)
            const prev = visTabs[i-1]
            if (!prev) return (
              <button onClick={goBack} style={{width:44,height:44,borderRadius:50,
                background:C.goldF,border:`1px solid ${C.goldB}`,color:C.gold,
                cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',
                boxShadow:'0 4px 20px rgba(0,0,0,0.4)'}}>🏠</button>
            )
            return (
              <button onClick={()=>{setTab(prev.id);window.scrollTo(0,0)}}
                style={{width:44,height:44,borderRadius:50,
                  background:`linear-gradient(135deg,${C.redF},rgba(155,32,32,0.06))`,
                  border:`1px solid ${C.redB}`,color:C.redL,cursor:'pointer',fontSize:18,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  boxShadow:'0 4px 20px rgba(0,0,0,0.4)'}}>‹</button>
            )
          })()}
          {/* Center info */}
          <div style={{flex:1,textAlign:'center'}}>
            <div style={{fontSize:9,color:C.dim,fontFamily:"'Cinzel',Georgia,serif",
              letterSpacing:'0.14em',textTransform:'uppercase'}}>
              {TABS.find(tb=>tb.id===tab)?.label}
            </div>
          </div>
          {/* Next tab */}
          {(() => {
            const visTabs = TABS.filter(tb => isPremium || tb.free)
            const i = visTabs.findIndex(tb => tb.id === tab)
            const next = visTabs[i+1]
            if (!next) return <div style={{width:44}}/>
            return (
              <button onClick={()=>{setTab(next.id);window.scrollTo(0,0)}}
                style={{width:44,height:44,borderRadius:50,
                  background:`linear-gradient(135deg,${C.redF},rgba(155,32,32,0.06))`,
                  border:`1px solid ${C.redB}`,color:C.redL,cursor:'pointer',fontSize:18,
                  display:'flex',alignItems:'center',justifyContent:'center',
                  boxShadow:'0 4px 20px rgba(0,0,0,0.4)'}}>›</button>
            )
          })()}
        </div>
      </div>
    )
  }

  // ── SEARCH MODAL ────────────────────────────────────────────────────────────
  const SearchModal = () => (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:700,
      display:'flex',alignItems:'flex-start',justifyContent:'center',
      overflowY:'auto',padding:'16px 16px 48px'}} onClick={()=>setShowSearch(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:`linear-gradient(145deg,${C.bg},${C.bgMid})`,
        border:`1px solid ${C.redB}`,borderRadius:20,padding:22,width:'100%',maxWidth:460,
        marginTop:20,boxShadow:'0 20px 60px rgba(0,0,0,0.7)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{fontSize:10,color:C.redL,fontFamily:"'Cinzel',Georgia,serif",
            letterSpacing:'0.18em',textTransform:'uppercase'}}>🔍 Search</div>
          <button onClick={()=>setShowSearch(false)} style={{background:'transparent',border:'none',
            color:C.muted,cursor:'pointer',fontSize:20,lineHeight:1,padding:0}}>×</button>
        </div>
        <input autoFocus value={searchQ} onChange={e=>doSearch(e.target.value)}
          placeholder="Search the words of Jesus..."
          style={{width:'100%',background:'rgba(255,255,255,0.05)',border:`1px solid ${C.redB}`,
            borderRadius:12,color:C.cream,fontSize:16,padding:'13px 16px',
            fontFamily:"'EB Garamond',Georgia,serif",outline:'none',
            boxSizing:'border-box',marginBottom:16}}/>
        {searchQ && (
          <div>
            <div style={{fontSize:10,color:C.muted,fontFamily:"'Cinzel',Georgia,serif",
              letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:12}}>
              {searchResults.length} result{searchResults.length!==1?'s':''} found
            </div>
            {searchResults.length === 0 && (
              <p style={{fontSize:14,color:C.muted,fontStyle:'italic',textAlign:'center',padding:'20px 0'}}>
                No results. Try a different word.
              </p>
            )}
            {searchResults.map(({saying:s,theme:t}) => {
              const gi = GOSPEL_LABELS[s.gospel]||{}
              return (
                <button key={s.id} onClick={()=>{ openSaying(s,t); setShowSearch(false) }}
                  style={{width:'100%',display:'flex',alignItems:'flex-start',gap:12,padding:'12px 14px',
                    borderRadius:12,marginBottom:8,cursor:'pointer',textAlign:'left',
                    background:C.redF,border:`1px solid ${C.redB}`,transition:'all .2s'}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:9,color:gi.color||C.redL,fontFamily:"'Cinzel',Georgia,serif",
                      letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:3}}>{gi.label} · {t.title}</div>
                    <div style={{fontSize:13,color:C.words,fontStyle:'italic',lineHeight:1.6,
                      marginBottom:4,overflow:'hidden',display:'-webkit-box',
                      WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>"{s.text}"</div>
                    <div style={{fontSize:11,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",
                      letterSpacing:'0.1em'}}>{s.ref}</div>
                  </div>
                  <span style={{color:C.redL,fontSize:14,marginTop:4}}>›</span>
                </button>
              )
            })}
          </div>
        )}
        {!searchQ && (
          <div style={{textAlign:'center',padding:'24px 0'}}>
            <div style={{fontSize:32,marginBottom:10}}>✦</div>
            <p style={{fontSize:14,color:C.muted,fontStyle:'italic'}}>
              Search across all the words of Jesus.
            </p>
          </div>
        )}
      </div>
    </div>
  )

  // ── SETTINGS ────────────────────────────────────────────────────────────────
  const SettingsView = () => {
    const totalSayings = ALL_SAYINGS.length
    const readCount = ALL_SAYINGS.filter(s=>get(s.id,'read')==='true').length
    const memoCount = ALL_SAYINGS.filter(s=>get(s.id,'memo')==='true').length

    return (
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:700,
        display:'flex',alignItems:'flex-start',justifyContent:'center',
        overflowY:'auto',padding:'16px 16px 48px'}} onClick={()=>setShowSettings(false)}>
        <div onClick={e=>e.stopPropagation()} style={{background:`linear-gradient(145deg,${C.bg},${C.bgMid})`,
          border:`1px solid ${C.border}`,borderRadius:20,padding:22,width:'100%',maxWidth:420,
          marginTop:20}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
            <div style={{fontSize:10,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",
              letterSpacing:'0.18em',textTransform:'uppercase'}}>⚙️ Settings</div>
            <button onClick={()=>setShowSettings(false)} style={{background:'transparent',border:'none',
              color:C.muted,cursor:'pointer',fontSize:20,lineHeight:1,padding:0}}>×</button>
          </div>
          {/* Progress */}
          <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,
            padding:'16px',marginBottom:16}}>
            <div style={{fontSize:10,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",
              letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:12}}>Your Progress</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {[[readCount,'Sayings Read','📖'],[memoCount,'Memorized','✦'],
                [THEMES.length,'Themes','👑'],[totalSayings,'Total Sayings','✝️']
              ].map(([val,lbl,icon])=>(
                <div key={lbl} style={{background:C.redF,border:`1px solid ${C.redB}`,
                  borderRadius:10,padding:'12px',textAlign:'center'}}>
                  <div style={{fontSize:24,fontWeight:700,color:C.words,
                    fontFamily:"'Cinzel',Georgia,serif"}}>{val}</div>
                  <div style={{fontSize:10,color:C.muted}}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Premium status */}
          {isPremium ? (
            <div style={{background:C.greenF,border:`1px solid ${C.greenB}`,borderRadius:12,
              padding:'12px 16px',marginBottom:16,textAlign:'center'}}>
              <div style={{fontSize:12,color:C.green,fontFamily:"'Cinzel',Georgia,serif"}}>
                ✓ Full Access Unlocked
              </div>
            </div>
          ) : (
            <button onClick={()=>window.location.href='https://buy.stripe.com/STRIPE_LINK'}
              style={{width:'100%',background:`linear-gradient(135deg,${C.redF},rgba(155,32,32,0.06))`,
                border:`1px solid ${C.redB}`,color:C.redL,padding:'14px',borderRadius:12,
                cursor:'pointer',fontSize:13,fontFamily:"'Cinzel',Georgia,serif",
                letterSpacing:'0.08em',marginBottom:16}}>
              ✦ Upgrade to Full Access — $9 One-Time
            </button>
          )}
          {/* Sign out */}
          <button onClick={()=>supabase.auth.signOut()}
            style={{width:'100%',background:'transparent',border:`1px solid ${C.border}`,
              color:C.muted,padding:'13px',borderRadius:12,cursor:'pointer',fontSize:12,
              fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.08em'}}>
            Sign Out
          </button>
          <div style={{marginTop:16,textAlign:'center',fontSize:11,color:C.dim}}>
            The Red Letters · Elora Radiance Co.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{minHeight:'100vh',background:`radial-gradient(ellipse at 50% 0%,rgba(139,26,26,0.06) 0%,transparent 55%),${C.bg}`,
      fontFamily:"'EB Garamond',Georgia,serif",width:'100%',minHeight:'100vh'}}>

      {view === 'home'   && <HomeView/>}
      {view === 'theme'  && <ThemeView/>}
      {view === 'saying' && <SayingView/>}

      {showSaved && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.88)',zIndex:700,
          display:'flex',alignItems:'flex-start',justifyContent:'center',
          overflowY:'auto',padding:'16px 16px 48px'}} onClick={()=>setShowSaved(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:`linear-gradient(145deg,${C.bg},#101820)`,
            border:`1px solid ${C.border}`,borderRadius:20,padding:22,width:'100%',maxWidth:460,marginTop:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:10,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",
                letterSpacing:'0.18em',textTransform:'uppercase'}}>★ Saved Sayings</div>
              <button onClick={()=>setShowSaved(false)} style={{background:'transparent',border:'none',
                color:C.muted,cursor:'pointer',fontSize:20,lineHeight:1,padding:0}}>×</button>
            </div>
            {savedSayings.length === 0 ? (
              <div style={{textAlign:'center',padding:'32px 0'}}>
                <div style={{fontSize:36,marginBottom:12}}>☆</div>
                <p style={{fontSize:14,color:C.muted,fontStyle:'italic'}}>No saved sayings yet. Tap ☆ on any saying to save it here.</p>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {savedSayings.map(sid => {
                  const found = ALL_SAYINGS.find(s=>s.id===sid)
                  if (!found) return null
                  const theme = THEMES.find(t=>t.id===found.themeId)
                  const gi = GOSPEL_LABELS[found.gospel]||{}
                  return (
                    <button key={sid} onClick={()=>{openSaying(found,theme);setShowSaved(false);}}
                      style={{display:'flex',alignItems:'flex-start',gap:12,padding:'13px 16px',
                        borderRadius:12,cursor:'pointer',textAlign:'left',
                        background:C.redF,border:`1px solid ${C.redB}`}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:9,color:gi.color||C.redL,fontFamily:"'Cinzel',Georgia,serif",
                          letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:3}}>
                          {gi.label} · {found.themeIcon} {found.themeTitle}
                        </div>
                        <div style={{fontSize:13,color:C.words,fontStyle:'italic',lineHeight:1.6,
                          marginBottom:4,overflow:'hidden',display:'-webkit-box',
                          WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>"{found.text}"</div>
                        <div style={{fontSize:11,color:C.gold,fontFamily:"'Cinzel',Georgia,serif"}}>{found.ref}</div>
                      </div>
                      <button onClick={(e)=>{e.stopPropagation();toggleSave(sid);}}
                        style={{background:'transparent',border:'none',color:C.gold,
                          cursor:'pointer',fontSize:16,flexShrink:0,touchAction:'manipulation'}}>★</button>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {showSearch && <SearchModal/>}
      {showSettings && <SettingsView/>}

      {showMemo && selectedSaying && isPremium && (
        <MemorizeModal
          saying={selectedSaying}
          isMemorized={get(selectedSaying.id,'memo')==='true'}
          onMarkMemo={()=>{ set(selectedSaying.id,'memo','true'); setShowMemo(false) }}
          onClose={()=>setShowMemo(false)}
        />
      )}

      {shareCard && (
        <ShareCard
          saying={shareCard.saying}
          theme={shareCard.theme}
          onClose={()=>setShareCard(null)}
        />
      )}
    </div>
  )
}
