import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabaseClient'
import { speak as readAloud, stopSpeaking } from './speech.js'
import { THEMES, ALL_PASSAGES, GOSPEL_COLORS } from './data.js'
import Settings from './components/Settings'



// ── Premium section components for passage views (RL) ─────────────────────
function SectionHeader({ label, C }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20,marginTop:4}}>
      <div style={{flex:1,height:1,background:`linear-gradient(90deg, transparent, ${C.goldB})`}}/>
      <div style={{fontSize:10,letterSpacing:'0.26em',color:C.gold,fontFamily:"'Cinzel',Georgia,serif",textTransform:'uppercase',whiteSpace:'nowrap'}}>{label}</div>
      <div style={{flex:1,height:1,background:`linear-gradient(90deg, ${C.goldB}, transparent)`}}/>
    </div>
  );
}

function ProseSection({ label, text, accent, C }) {
  if (!text) return null;
  const paras = text.split('\n\n');
  const isRed = accent === 'red';
  return (
    <div>
      <SectionHeader label={label} C={C} />
      <div style={{
        background: isRed
          ? 'linear-gradient(145deg,rgba(139,26,26,0.055),rgba(139,26,26,0.012))'
          : 'linear-gradient(145deg,rgba(139,106,46,0.07),rgba(139,106,46,0.018))',
        border:`1px solid ${isRed ? C.redB : C.goldB}`,
        borderRadius:18,
        padding:'30px 28px 26px',
        boxShadow:'0 6px 22px rgba(0,0,0,0.07)',
        position:'relative',
      }}>
        <div style={{textAlign:'center',color:C.gold,fontSize:11,opacity:0.45,marginBottom:18,letterSpacing:'1.2em',paddingLeft:'1.2em',fontFamily:'Georgia,serif'}}>✦ ✦ ✦</div>
        {paras.map((para, i) => {
          const isFirst = i === 0 && para.length > 0;
          const ch = isFirst ? para.charAt(0) : '';
          const rest = isFirst ? para.slice(1) : para;
          return (
            <p key={i} style={{
              fontSize:17.5,
              color:C.text,
              lineHeight:1.92,
              marginBottom: i < paras.length - 1 ? 16 : 0,
              fontFamily:"'EB Garamond',Georgia,serif",
              textIndent:0,
            }}>
              {isFirst && (
                <span style={{
                  float:'left',
                  fontFamily:"'Cinzel',Georgia,serif",
                  fontSize:52,
                  lineHeight:0.9,
                  color: isRed ? C.red : C.gold,
                  paddingRight:10,
                  paddingTop:6,
                  marginTop:-2,
                  fontWeight:500,
                }}>{ch}</span>
              )}
              {rest}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function PrayerSection({ text, C }) {
  if (!text) return null;
  return (
    <div>
      <SectionHeader label="Pray It" C={C} />
      <div style={{
        background:'linear-gradient(145deg,rgba(139,106,46,0.11),rgba(139,106,46,0.025))',
        border:`1px solid ${C.goldB}`,
        borderRadius:18,
        padding:'34px 30px 30px',
        boxShadow:'0 6px 22px rgba(0,0,0,0.08)',
        textAlign:'center',
      }}>
        <div style={{color:C.gold,fontSize:18,opacity:0.55,marginBottom:20,fontFamily:'Georgia,serif',lineHeight:1}}>✦</div>
        <p style={{
          fontSize:18.5,
          color:C.cream,
          lineHeight:1.95,
          margin:0,
          fontStyle:'italic',
          fontFamily:"'EB Garamond',Georgia,serif",
          textAlign:'left',
        }}>{text}</p>
        <div style={{color:C.gold,fontSize:18,opacity:0.55,marginTop:22,fontFamily:'Georgia,serif',lineHeight:1}}>✦</div>
      </div>
      <p style={{fontSize:12,color:C.dim,textAlign:'center',fontStyle:'italic',marginTop:14,fontFamily:"'EB Garamond',Georgia,serif",letterSpacing:'0.02em'}}>Pray this aloud. The spoken prayer has weight.</p>
    </div>
  );
}

// Safari (iOS 26) colors the status-bar area and its bottom bar from the page background,
// and the phone's Reduce Transparency setting decides whether that area is see-through
// (blurred page) or solid. Keeping the page background, the header and theme-color one
// solid color makes the top of the app look the same with the setting on or off.
function paintChrome(color) {
  try {
    document.documentElement.style.backgroundColor = color;
    document.body.style.backgroundColor = color;
    let m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement("meta"); m.setAttribute("name", "theme-color"); document.head.appendChild(m); }
    m.setAttribute("content", color);
  } catch { /* no DOM */ }
}

// Gospel badge colors that stay readable on the dark theme
const GOSPEL_COLORS_DARK = { matthew:'#EE8A8A', mark:'#6CC9A0', luke:'#8DB4EA', john:'#C9A3E6' }

// ── Color tokens — warm parchment light theme ─────────────────────────────
const LIGHT_C = {
  bg:'#F7F2EA', bgCard:'rgba(139,26,26,0.04)', bgMid:'#EDE8DC',
  red:'#8B1A1A', redL:'#A52020',
  redF:'rgba(139,26,26,0.08)', redB:'rgba(139,26,26,0.22)',
  gold:'#6B4E18', goldF:'rgba(139,106,46,0.1)', goldB:'rgba(139,106,46,0.28)',
  cream:'#2A1A0E', ink:'#1C150A', text:'#3D2E1A', muted:'#5E4E3C', dim:'#6E6052',
  border:'rgba(139,26,26,0.12)', borderGold:'rgba(139,106,46,0.2)',
  green:'#2E6040', greenF:'rgba(46,96,64,0.1)', greenB:'rgba(46,96,64,0.3)',
}

const DARK_C = {
  bg:'#0F0A06', bgCard:'rgba(201,64,64,0.07)', bgMid:'#1A0E08',
  red:'#E36464', redL:'#EE8A8A',
  redF:'rgba(201,64,64,0.12)', redB:'rgba(201,64,64,0.32)',
  gold:'#CFA968', goldF:'rgba(176,138,78,0.11)', goldB:'rgba(176,138,78,0.28)',
  cream:'#EDE6D6', ink:'#EDE6D6', text:'rgba(220,210,195,0.9)', muted:'#B5A58A', dim:'#8F8068',
  border:'rgba(201,64,64,0.12)', borderGold:'rgba(176,138,78,0.28)',
  green:'#7C9284', greenF:'rgba(124,146,132,0.12)', greenB:'rgba(124,146,132,0.35)',
}

// The seven study sections of every passage (name: section title; short: back button; hint: in the section list)
const TABS = [
  {id:'passage', icon:'📖', name:'The Passage', short:'Passage', hint:'His words'},
  {id:'context', icon:'🧭', name:'Context',     short:'Context', hint:'Where and why'},
  {id:'meaning', icon:'💡', name:'Meaning',     short:'Meaning', hint:'What He meant'},
  {id:'lexicon', icon:'📚', name:'Word Study',  short:'Words',   hint:'The original language'},
  {id:'apply',   icon:'⚡', name:'Live It',     short:'Live It', hint:'This week'},
  {id:'prayer',  icon:'🙏', name:'Pray It',     short:'Pray It', hint:'Pray it back'},
  {id:'journal', icon:'📝', name:'Journal',     short:'Journal', hint:'Your reflection'},
]



// ── Share Card ──────────────────────────────────────────────────────────────
const TAGLINE = 'The complete words of Jesus — redletters.eloraradiance.com'

function ShareCard({ passage, theme, onClose, C }) {
  const cardRef = useRef(null)
  const [cardType, setCardType] = useState('passage')
  const [lightCard, setLightCard] = useState(true) // RL defaults to light
  const [sharing, setSharing] = useState(false)
  const [copiedCaption, setCopiedCaption] = useState(false)

  const p = passage

  const TYPES = [
    { id: 'passage',  label: '📖 The Passage' },
    { id: 'context',  label: '🧭 Context' },
    { id: 'meaning',  label: '💡 Meaning' },
    { id: 'apply',    label: '⚡ Live It' },
    { id: 'prayer',   label: '🙏 Pray It' },
  ]

  const getContent = (type) => {
    const firstPara = (txt) => txt
    if (type === 'passage') return {
      label: p.ref,
      sublabel: `${theme?.icon || ''} ${theme?.title || ''}`,
      main: p.text,
      caption: `"${p.text}"\n\n— ${p.ref}\n\nThe Red Letters · ${theme?.title}\nredletters.eloraradiance.com`,
    }
    if (type === 'context') return {
      label: 'Setting & Context',
      sublabel: p.ref,
      main: firstPara(p.context),
      caption: `${p.title} — Context\n\n${firstPara(p.context)}\n\nThe Red Letters · redletters.eloraradiance.com`,
    }
    if (type === 'meaning') return {
      label: 'What Jesus Meant',
      sublabel: p.ref,
      main: firstPara(p.meaning),
      caption: `${p.title} — Meaning\n\n${firstPara(p.meaning)}\n\nThe Red Letters · redletters.eloraradiance.com`,
    }
    if (type === 'apply') return {
      label: 'Live It Out',
      sublabel: p.ref,
      main: p.apply,
      caption: `${p.title} — Live It Out\n\n${p.apply}\n\nThe Red Letters · redletters.eloraradiance.com`,
    }
    if (type === 'prayer') return {
      label: 'Pray It',
      sublabel: p.ref,
      main: p.prayer,
      caption: `${p.title} — Prayer\n\n${p.prayer}\n\nThe Red Letters · redletters.eloraradiance.com`,
    }
    return { label: '', sublabel: '', main: '', caption: '' }
  }

  const content = getContent(cardType)

  // Light theme — parchment (default for RL)
  const th = lightCard ? {
    bg: '#F7F2EA',
    bgGrad: 'linear-gradient(155deg, #F7F2EA 0%, #EDE6D6 100%)',
    border: 'rgba(139,26,26,0.3)',
    borderInner: 'rgba(139,26,26,0.12)',
    brand: 'rgba(139,26,26,0.7)',
    title: '#1C0A06',
    sublabel: 'rgba(139,106,46,0.85)',
    divider: 'rgba(139,26,26,0.25)',
    label: 'rgba(139,26,26,0.6)',
    body: '#2A1A0E',
    ref: '#6B4E18',
    footer: 'rgba(139,26,26,0.8)',
    tagline: 'rgba(80,60,40,0.5)',
    quote: 'rgba(139,26,26,0.15)',
  } : {
    bg: '#1A0C06',
    bgGrad: 'linear-gradient(155deg, #1A0C06 0%, #0D0604 60%, #1A0C06 100%)',
    border: 'rgba(201,100,100,0.3)',
    borderInner: 'rgba(139,26,26,0.2)',
    brand: 'rgba(201,100,100,0.8)',
    title: '#EDE6D6',
    sublabel: 'rgba(176,138,78,0.85)',
    divider: 'rgba(201,100,100,0.3)',
    label: 'rgba(201,100,100,0.7)',
    body: '#EDE6D6',
    ref: '#B08A4E',
    footer: 'rgba(201,100,100,0.85)',
    tagline: 'rgba(160,140,120,0.5)',
    quote: 'rgba(201,100,100,0.12)',
  }

  const isPassage = cardType === 'passage'

  const handleShare = async () => {
    if (!cardRef.current || sharing) return
    setSharing(true)
    try {
      const { toPng } = await import('html-to-image')
      // Wait for fonts + 2 RAFs so the first share captures aligned layout
      try { await document.fonts.ready } catch {}
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: lightCard ? '#F7F2EA' : '#1A0C06',
      })
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], 'red-letters.png', { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'The Red Letters' })
      } else {
        const a = document.createElement('a')
        a.href = dataUrl; a.download = 'red-letters.png'; a.click()
      }
    } catch (err) { console.error(err) }
    setSharing(false)
  }

  const UI = {
    bg: '#1A0C06', red: '#8B1A1A', redL: '#C04040',
    redF: 'rgba(139,26,26,0.1)', redB: 'rgba(139,26,26,0.3)',
    gold: '#6B4E18', goldF: 'rgba(139,106,46,0.1)', goldB: 'rgba(139,106,46,0.28)',
    cream: '#EDE6D6', muted: '#9A8268', border: 'rgba(255,255,255,0.1)',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 600,
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
      padding: '16px 16px 40px',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        maxWidth: 440, width: '100%', margin: '0 auto',
        background: '#1A0C06', borderRadius: 20,
        border: '1px solid rgba(139,26,26,0.3)',
        padding: '20px 16px',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Cinzel',Georgia,serif", fontSize: 11, color: UI.redL, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Share This Card
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: UI.muted, cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Card Type Selector */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 12, flexWrap: 'wrap' }}>
          {TYPES.map(t => (
            <button key={t.id} onClick={() => setCardType(t.id)} style={{
              flex: '1 1 auto', minWidth: 0,
              padding: '7px 4px', borderRadius: 8, cursor: 'pointer', fontSize: 10,
              fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.03em',
              background: cardType === t.id ? UI.redF : 'rgba(255,255,255,0.04)',
              border: `1px solid ${cardType === t.id ? UI.redB : UI.border}`,
              color: cardType === t.id ? UI.redL : UI.muted, transition: 'all .2s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Light / Dark toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: UI.muted, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.06em', flexShrink: 0 }}>Style:</span>
          {[['☀️ Light', true], ['🌙 Dark', false]].map(([label, val]) => (
            <button key={label} onClick={() => setLightCard(val)} style={{
              flex: 1, padding: '7px', borderRadius: 8, cursor: 'pointer', fontSize: 11,
              fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.06em',
              background: lightCard === val ? UI.redF : 'rgba(255,255,255,0.04)',
              border: `1px solid ${lightCard === val ? UI.redB : UI.border}`,
              color: lightCard === val ? UI.redL : UI.muted, transition: 'all .2s',
            }}>{label}</button>
          ))}
        </div>

        {/* ── THE CARD ─────────────────────────────────────────────── */}
        <div ref={cardRef} style={{
          background: th.bgGrad,
          borderRadius: 18,
          padding: '22px 22px 18px',
          textAlign: 'center',
          fontFamily: "'EB Garamond', Georgia, serif",
          border: `2px solid ${th.border}`,
          boxShadow: `inset 0 0 0 1px ${th.borderInner}`,
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background accent */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: `radial-gradient(ellipse at 20% 0%, ${th.quote} 0%, transparent 60%)`,
            pointerEvents: 'none',
          }}/>

          {/* Header — icon + app name (matches AS1/AS2 pattern) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid ' + th.divider }}>
            <img src="/icon.png" alt="" style={{ width: 42, height: 42, borderRadius: 8 }}/>
            <div>
              <div style={{ fontSize: 15, color: th.brand, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.06em' }}>The Red Letters</div>
              <div style={{ fontSize: 12, color: th.sublabel }}>{theme?.icon} {theme?.title}</div>
            </div>
          </div>

          {/* Label */}
          <div style={{ fontSize: 12, color: th.label, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: "'Cinzel',Georgia,serif", marginBottom: 10 }}>
            {content.label}
          </div>

          {/* Opening quote for passage */}
          {isPassage && (
            <div style={{ fontSize: 28, color: th.divider, lineHeight: 1, marginBottom: 4, fontFamily: 'Georgia,serif', opacity: 0.6 }}>"</div>
          )}

          {/* Main text */}
          <p style={{
            fontSize: (content.main||'').length > 200 ? 20 : 23,
            color: isPassage ? th.brand.replace('0.7','0.9').replace('0.8','0.95') : th.body,
            lineHeight: 1.85, marginBottom: 12,
            fontStyle: 'italic', letterSpacing: '0.01em',
            textAlign: isPassage ? 'left' : 'center',
            whiteSpace: 'pre-line',
          }}>
            {content.main}
          </p>

          {/* Reference */}
          <div style={{ height: 1, background: th.divider, opacity: 0.5, margin: '8px 40px 10px' }} />
          <div style={{ fontSize: 13, color: th.ref, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14 }}>
            {content.sublabel}
          </div>

          {/* Footer */}
          <div style={{ height: 1, background: th.divider, opacity: 0.4, marginBottom: 10 }} />
          <div style={{ fontSize: 13, color: th.footer, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.05em', marginBottom: 3 }}>
            ✦ The Red Letters ✦
          </div>
          <div style={{ fontSize: 11, color: th.tagline, letterSpacing: '0.05em' }}>
            {TAGLINE}
          </div>
        </div>

        {/* Share / Copy */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <button onClick={handleShare} disabled={sharing} style={{
            background: 'linear-gradient(135deg, rgba(139,26,26,0.4), rgba(139,26,26,0.2))',
            border: '1px solid rgba(139,26,26,0.4)', color: UI.redL,
            padding: '13px', borderRadius: 12, cursor: 'pointer', fontSize: 12,
            fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.08em',
            opacity: sharing ? 0.6 : 1,
          }}>
            {sharing ? 'Preparing…' : '🔗 Share Image'}
          </button>
          <button onClick={() => navigator.clipboard.writeText(content.main)} style={{
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${UI.border}`,
            color: UI.muted, padding: '13px', borderRadius: 12, cursor: 'pointer',
            fontSize: 12, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.08em',
          }}>
            Copy Text
          </button>
        </div>

        {/* Suggested Caption */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${UI.border}`, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, color: UI.gold, fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
            Suggested Caption
          </div>
          <p style={{ fontSize: 13, color: UI.muted, lineHeight: 1.7, margin: '0 0 12px', fontStyle: 'italic', whiteSpace: 'pre-line' }}>
            {content.caption}
          </p>
          <button onClick={() => { navigator.clipboard.writeText(content.caption); setCopiedCaption(true); setTimeout(() => setCopiedCaption(false), 2000) }} style={{
            width: '100%',
            background: copiedCaption ? 'rgba(46,96,64,0.15)' : 'transparent',
            border: `1px solid ${copiedCaption ? 'rgba(46,96,64,0.4)' : 'rgba(139,106,46,0.3)'}`,
            color: copiedCaption ? '#2E6040' : UI.gold,
            padding: '9px', borderRadius: 8, cursor: 'pointer', fontSize: 11,
            fontFamily: "'Cinzel',Georgia,serif", letterSpacing: '0.08em', transition: 'all .25s',
          }}>
            {copiedCaption ? '✓ Copied' : 'Copy Caption'}
          </button>
        </div>

      </div>
    </div>
  )
}
// ── Memorize Modal ─────────────────────────────────────────────────────────
function MemorizeModal({text, reference, onClose, isMemorized, onMark, C}) {
  const [mode,setMode]=useState(null)
  const [revealed,setRevealed]=useState(false)
  const [typed,setTyped]=useState('')
  const [score,setScore]=useState(null)
  const words=text.split(' ')
  const blanked=words.map((w,i)=>(i+1)%3===0?'___':w)
  const checkScore=()=>{
    const norm=s=>s.toLowerCase().replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim()
    const tw=norm(typed).split(' '),ow=norm(text).split(' ')
    const pct=Math.round(tw.filter(w=>ow.includes(w)).length/ow.length*100)
    setScore(pct); if(pct>=70) onMark()
  }
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:700,display:'flex',alignItems:'center',justifyContent:'center',padding:16,overflowY:'auto'}} onClick={()=>{if(!mode)onClose()}}>
      <div onClick={e=>e.stopPropagation()} style={{background:`linear-gradient(145deg,${C.bg},${C.bgMid})`,border:`1px solid ${C.goldB}`,borderRadius:16,padding:24,maxWidth:420,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
          <div style={{fontSize:11,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.14em',textTransform:'uppercase'}}>✦ Memorize</div>
          <button onClick={onClose} style={{background:'transparent',border:'none',color:C.muted,cursor:'pointer',fontSize:20}}>×</button>
        </div>
        <div style={{fontSize:12,color:C.gold,fontFamily:"'Cinzel',Georgia,serif",letterSpacing:'0.1em',marginBottom:14,paddingBottom:12,borderBottom:`1px solid ${C.goldB}`,textAlign:'center'}}>{reference}{isMemorized&&<span style={{display:'block',fontSize:10,color:C.green,marginTop:3}}>✓ Memorized</span>}</div>
        {!mode?(
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {[{id:'recall',icon:'🧠',title:'Read & Recall',desc:'Recite aloud, then reveal'},{id:'blanks',icon:'✏️',title:'Fill the Gaps',desc:'Every 3rd word blanked'},{id:'write',icon:'✍️',title:'Write it Out',desc:'Type from memory, get a score'}].map(m=>(
              <button key={m.id} onClick={()=>setMode(m.id)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:10,cursor:'pointer',textAlign:'left',background:C.redF,border:`1px solid ${C.redB}`}}>
                <span style={{fontSize:20}}>{m.icon}</span>
                <span><span style={{display:'block',fontSize:12,color:C.cream,fontFamily:"'Cinzel',Georgia,serif",marginBottom:1}}>{m.title}</span><span style={{fontSize:11,color:C.muted}}>{m.desc}</span></span>
              </button>
            ))}
          </div>
        ):mode==='recall'?(
          !revealed?(<div style={{textAlign:'center'}}><p style={{fontSize:13,color:C.muted,marginBottom:16,fontStyle:'italic',lineHeight:1.7}}>Say the passage aloud from memory, then reveal to check.</p><button onClick={()=>setRevealed(true)} style={{background:C.goldF,border:`1px solid ${C.goldB}`,color:C.gold,padding:'10px 24px',borderRadius:50,cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif"}}>Reveal</button></div>)
          :(<div><p style={{fontSize:16,color:C.red,fontStyle:'italic',lineHeight:1.8,marginBottom:16}}>"{text}"</p><button onClick={onMark} style={{width:'100%',background:C.greenF,border:`1px solid ${C.greenB}`,color:C.green,padding:'12px',borderRadius:10,cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",marginBottom:8}}>✓ Mark Memorized</button><button onClick={()=>setRevealed(false)} style={{width:'100%',background:'transparent',border:'none',color:C.muted,cursor:'pointer',fontSize:13}}>Try Again</button></div>)
        ):mode==='blanks'?(
          <div><div style={{background:'rgba(0,0,0,0.04)',borderRadius:10,padding:14,marginBottom:12}}><p style={{fontSize:17,lineHeight:2,margin:0}}>{blanked.map((w,i)=><span key={i} style={{color:w==='___'?C.gold:C.text,borderBottom:w==='___'?`1px solid ${C.gold}`:undefined}}>{w}{i<blanked.length-1?' ':''}</span>)}</p></div>
          {!revealed?<button onClick={()=>setRevealed(true)} style={{width:'100%',background:C.goldF,border:`1px solid ${C.goldB}`,color:C.gold,padding:'11px',borderRadius:10,cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",marginBottom:8}}>Reveal Missing Words</button>:<div style={{background:C.greenF,border:`1px solid ${C.greenB}`,borderRadius:10,padding:12,marginBottom:10}}><p style={{fontSize:13,lineHeight:1.8,margin:0}}>{words.map((w,i)=><span key={i} style={{color:(i+1)%3===0?C.green:C.text,fontWeight:(i+1)%3===0?600:400}}>{w}{i<words.length-1?' ':''}</span>)}</p></div>}
          <button onClick={onMark} style={{width:'100%',background:C.greenF,border:`1px solid ${C.greenB}`,color:C.green,padding:'11px',borderRadius:10,cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif"}}>✓ Mark Memorized</button></div>
        ):mode==='write'?(
          score===null?(<div><textarea rows={5} value={typed} onChange={e=>setTyped(e.target.value)} placeholder="Type the passage from memory..." style={{width:'100%',background:'rgba(0,0,0,0.04)',border:`1px solid ${C.border}`,borderRadius:10,color:C.cream,fontSize:15,padding:'12px',fontFamily:"'EB Garamond',Georgia,serif",outline:'none',resize:'none',boxSizing:'border-box',marginBottom:10,lineHeight:1.7}}/><button onClick={checkScore} disabled={!typed.trim()} style={{width:'100%',background:C.goldF,border:`1px solid ${C.goldB}`,color:C.gold,padding:'11px',borderRadius:10,cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",opacity:typed.trim()?1:0.4}}>Check My Score</button></div>)
          :(<div style={{textAlign:'center'}}><div style={{fontSize:48,fontWeight:700,color:score>=80?C.green:score>=50?C.gold:C.red,fontFamily:"'Cinzel',Georgia,serif",marginBottom:4}}>{score}%</div><div style={{fontSize:13,color:C.muted,marginBottom:14}}>{score>=90?'Nearly perfect!':score>=70?'Great progress!':score>=50?'Good start!':'Keep practicing!'}</div>{score>=70&&<button onClick={onMark} style={{width:'100%',background:C.greenF,border:`1px solid ${C.greenB}`,color:C.green,padding:'11px',borderRadius:10,cursor:'pointer',fontSize:12,fontFamily:"'Cinzel',Georgia,serif",marginBottom:8}}>✓ Mark Memorized</button>}<button onClick={()=>{setTyped('');setScore(null)}} style={{width:'100%',background:'transparent',border:'none',color:C.muted,cursor:'pointer',fontSize:13}}>Try Again</button></div>)
        ):(null)}
      </div>
    </div>
  )
}

// ── Layout and daily rotation (same patterns as Armed & Anchored and Anchored Steps) ───────────
const CZ = "'Cinzel',Georgia,serif"
const GA = "'EB Garamond',Georgia,serif"
const TAB_BAR_H = 60
const PAD_BOTTOM = `calc(${TAB_BAR_H + 48}px + env(safe-area-inset-bottom, 0px))`
const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const dayNumber = (ymd = localDay()) => { const [y, m, d] = ymd.split('-').map(Number); return Math.floor(Date.UTC(y, m - 1, d) / 86400000) }
// Today's Words: one passage a day (changes at local midnight), cycling through all of them in order.
const todaysPassage = () => ALL_PASSAGES[((dayNumber() % ALL_PASSAGES.length) + ALL_PASSAGES.length) % ALL_PASSAGES.length]
const themeOf = (p) => THEMES.find(t => t.id === p?.themeId)
const firstPara = (text = '') => text.split('\n\n')[0]
// The lines shown on a card: the passage's own highlight when its opening isn't Jesus speaking, else its first paragraph
const excerpt = (p) => (p.highlight || firstPara(p.text)).replace(/\n/g, ' ')
const clamp = (n) => ({ display: '-webkit-box', WebkitLineClamp: n, WebkitBoxOrient: 'vertical', overflow: 'hidden' })

// ── Main App ───────────────────────────────────────────────────────────────
export default function RedLetters({ session, profile }) {
  const userId = session?.user?.id

  const [darkMode,setDarkMode]=useState(()=>{try{return localStorage.getItem('rl_dark')==='1'}catch{return false}})
  // Page background, header and theme-color share one solid color (see paintChrome).
  // Sign-in and onboarding are light, so leaving the app puts it back to light.
  useEffect(()=>{ paintChrome(darkMode?'#0F0A06':'#F7F2EA'); return ()=>paintChrome('#F7F2EA') },[darkMode])
  const C = darkMode ? DARK_C : LIGHT_C
  const LBL = {fontSize:9,color:C.gold,letterSpacing:'0.16em',textTransform:'uppercase',fontFamily:CZ,marginBottom:12,display:'block'}

  const [nav,setNav]=useState('read')       // bottom tab: 'read'|'search'|'saved'|'progress'|'settings'
  const [view,setView]=useState('home')     // inside Read: 'home'|'theme'|'passage'
  const [selTheme,setSelTheme]=useState(null)
  const [selPassage,setSelPassage]=useState(null)
  const [tab,setTab]=useState('passage')    // study section inside a passage
  const [entries,setEntries]=useState([])
  const [savedIds,setSavedIds]=useState(()=>{try{return JSON.parse(localStorage.getItem('rl_saved')||'[]')}catch{return[]}})
  const [searchQ,setSearchQ]=useState('')
  const [searchResults,setSearchResults]=useState([])
  const [sharePassage,setSharePassage]=useState(null)
  const [showThemeJump,setShowThemeJump]=useState(false)
  const [showSections,setShowSections]=useState(false)
  const [memorizing,setMemorizing]=useState(false)
  const [journalSaved,setJournalSaved]=useState(false)
  const [speaking,setSpeaking]=useState(false)       // Word Study pronunciation
  const [listening,setListening]=useState(null)      // id of the passage being read aloud
  const [lastId,setLastId]=useState(()=>{try{return localStorage.getItem('rl_last')||''}catch{return ''}})

  // Word Study pronunciation (read-aloud fixes live in speech.js)
  const speak = entry => {
    let text = entry.transliteration || "";
    if (!text && entry.original) {
      const m = entry.original.match(/\(([^)]+)\)/);
      text = m ? m[1].trim() : entry.original;
    }
    if (!text) return;
    readAloud(text, { rate: 0.72, onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false), onError: () => setSpeaking(false) });
  };
  // Listen: reads the passage itself aloud; tap again to stop.
  const listen = (p) => {
    if (listening === p.id) { stopSpeaking(); setListening(null); return }
    stopSpeaking()
    setListening(p.id)
    readAloud(p.text, { rate: 0.9, onEnd: () => setListening(null), onError: () => setListening(null) })
  }
  const quiet = () => { if (listening) { stopSpeaking(); setListening(null) } }
  const saveTimers=useRef({})

  useEffect(()=>{
    if(!userId) return
    supabase.from('rl_entries').select('*').eq('user_id',userId).then(({data})=>{
      if(!data) return
      setEntries(data)
      // Cross-device sync: hydrate savedIds from entries where field_key='saved' and field_value='true'
      const serverSaved = data.filter(e=>e.field_key==='saved'&&e.field_value==='true').map(e=>e.saying_id)
      const serverUnsaved = data.filter(e=>e.field_key==='saved'&&e.field_value!=='true').map(e=>e.saying_id)
      // Stars saved only on this device (auto-save didn't reach the account before 2026-11-12): keep them and upload them.
      let local=[]; try { local=JSON.parse(localStorage.getItem('rl_saved')||'[]') } catch {}
      const localOnly = (Array.isArray(local)?local:[]).filter(id=>!serverSaved.includes(id)&&!serverUnsaved.includes(id))
      const merged = [...serverSaved, ...localOnly]
      if (merged.length > 0) {
        setSavedIds(merged)
        try { localStorage.setItem('rl_saved', JSON.stringify(merged)) } catch {}
      }
      if (localOnly.length > 0) {
        const now = new Date().toISOString()
        supabase.from('rl_entries').upsert(localOnly.map(pid=>({user_id:userId,saying_id:pid,field_key:'saved',field_value:'true',updated_at:now})),{onConflict:'user_id,saying_id,field_key'})
          .then(({error})=>{ if(error) console.warn('saved upload:', error.message) })
      }
      // Cross-device sync: dark mode preference (stored as saying_id='__user_prefs__', field_key='dark_mode')
      const dm = data.find(e=>e.saying_id==='__user_prefs__'&&e.field_key==='dark_mode')
      if (dm) {
        const isDark = dm.field_value === '1'
        setDarkMode(isDark)
        try { localStorage.setItem('rl_dark', isDark?'1':'0') } catch {}
      }
    })
  },[userId])

  // Stop reading aloud when the app closes or this screen goes away
  useEffect(()=>()=>stopSpeaking(),[])

  const get=(pid,key)=>entries.find(e=>e.saying_id===pid&&e.field_key===key)?.field_value||''
  const set=useCallback((pid,key,val)=>{
    if(!userId) return
    setEntries(prev=>{const i=prev.findIndex(e=>e.saying_id===pid&&e.field_key===key);if(i>=0){const u=[...prev];u[i]={...u[i],field_value:val};return u;}return[...prev,{user_id:userId,saying_id:pid,field_key:key,field_value:val}]})
    const tk=`${pid}__${key}`;clearTimeout(saveTimers.current[tk])
    saveTimers.current[tk]=setTimeout(()=>{supabase.from('rl_entries').upsert({user_id:userId,saying_id:pid,field_key:key,field_value:val,updated_at:new Date().toISOString()},{onConflict:'user_id,saying_id,field_key'}).then(({error})=>{if(error)console.warn('save:',error.message)})},1000) // .then() sends it: an unawaited Supabase query never runs
  },[userId])

  const toggleSave=(pid)=>{const wasIn=savedIds.includes(pid);const next=wasIn?savedIds.filter(x=>x!==pid):[...savedIds,pid];setSavedIds(next);try{localStorage.setItem('rl_saved',JSON.stringify(next))}catch{};if(userId)set(pid,'saved',wasIn?'':'true')}
  const isSaved=(pid)=>savedIds.includes(pid)
  const isMemorized=(pid)=>get(pid,'mem')==='true'
  const isRead=(pid)=>get(pid,'read')==='true'
  const readCount=ALL_PASSAGES.filter(p=>isRead(p.id)).length

  // ── Navigation ────────────────────────────────────────────────────────────
  const top=()=>window.scrollTo(0,0)
  const openTheme=(t)=>{quiet();setSelTheme(t);setView('theme');setNav('read');setShowThemeJump(false);top()}
  const openPassage=(p,t=themeOf(p),section='passage')=>{
    quiet();setSelPassage(p);setSelTheme(t);setTab(section);setView('passage');setNav('read');setShowSections(false);top()
    setLastId(p.id);try{localStorage.setItem('rl_last',p.id)}catch{}
    if(userId&&!isRead(p.id))set(p.id,'read','true')
  }
  const goHome=()=>{quiet();setView('home');setNav('read');top()}
  const goSection=(id)=>{quiet();setTab(id);setShowSections(false);top()}
  // Read returns to where you were; tapping it again while there goes to the home screen.
  const goTab=(id)=>{
    quiet();setShowThemeJump(false);setShowSections(false)
    if(id==='read'){ if(nav==='read')setView('home'); setNav('read'); top(); return }
    if(id==='search'){setSearchQ('');setSearchResults([])}
    setNav(id);top()
  }

  const doSearch=(q)=>{
    setSearchQ(q);if(!q.trim()){setSearchResults([]);return}
    const term=q.toLowerCase()
    setSearchResults(ALL_PASSAGES.filter(p=>p.text.toLowerCase().includes(term)||p.title.toLowerCase().includes(term)||p.ref.toLowerCase().includes(term)||p.themeTitle.toLowerCase().includes(term)||p.context.toLowerCase().includes(term)).map(p=>({passage:p,theme:themeOf(p)})))
  }

  // ── Shared pieces ─────────────────────────────────────────────────────────
  const btnPrimary={flex:1,background:C.red,color:darkMode?'#1A0C06':'#FBF6EE',border:'none',borderRadius:12,padding:'14px 16px',fontSize:14,fontWeight:600,fontFamily:CZ,letterSpacing:'0.06em',cursor:'pointer',touchAction:'manipulation',boxShadow:darkMode?'none':'0 6px 16px rgba(139,26,26,0.22)'}
  const btnSecondary={background:'transparent',border:`1px solid ${C.redB}`,color:C.red,borderRadius:12,padding:'13px 16px',fontSize:13,fontFamily:CZ,letterSpacing:'0.04em',cursor:'pointer',touchAction:'manipulation',whiteSpace:'nowrap'}
  const iconBtn=(on)=>({width:40,height:40,borderRadius:11,background:on?C.goldF:'transparent',border:`1px solid ${on?C.goldB:C.border}`,color:on?C.gold:C.muted,cursor:'pointer',fontSize:17,display:'flex',alignItems:'center',justifyContent:'center',touchAction:'manipulation'})
  const navBtn={background:C.bgCard,border:`1px solid ${C.border}`,color:C.muted,width:36,height:36,borderRadius:9,cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',touchAction:'manipulation',flexShrink:0}
  const backLink={background:'transparent',border:'none',color:C.muted,fontFamily:CZ,fontSize:12,letterSpacing:'0.06em',padding:'8px 0',cursor:'pointer',touchAction:'manipulation',maxWidth:'70%',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',textAlign:'left'}
  const kicker={fontSize:10,color:C.red,letterSpacing:'0.16em',textTransform:'uppercase',fontFamily:CZ,marginBottom:4}
  const badge=(p)=>{const gc=(darkMode?GOSPEL_COLORS_DARK:GOSPEL_COLORS)[p.gospel]||C.red;return <span style={{fontSize:9,color:gc,background:`${gc}18`,border:`1px solid ${gc}40`,borderRadius:6,padding:'1px 7px',fontFamily:CZ,letterSpacing:'0.1em',textTransform:'uppercase'}}>{p.translation}</span>}
  const refText=(p)=><span style={{fontSize:11,color:C.gold,fontFamily:CZ,fontWeight:500,letterSpacing:'0.08em',textTransform:'uppercase'}}>{p.ref}</span>
  const pageTitle=(eyebrow,title)=>(<div style={{marginBottom:18}}><div style={kicker}>{eyebrow}</div><h1 style={{fontSize:24,fontWeight:700,color:C.cream,fontFamily:CZ,letterSpacing:'0.03em',margin:0}}>{title}</h1></div>)
  // One row in Search and Saved. The optional action (Saved's ★) sits beside the row, not inside it.
  const passageRow=(ps,th,action=null)=>(
    <div key={ps.id} style={{display:'flex',alignItems:'stretch',gap:8,marginBottom:8}}>
      <button onClick={()=>openPassage(ps,th)} style={{flex:1,minWidth:0,display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderRadius:12,cursor:'pointer',textAlign:'left',background:C.bgCard,border:`1px solid ${C.border}`,touchAction:'manipulation'}}>
        <span style={{fontSize:20,flexShrink:0}}>{th?.icon}</span>
        <span style={{flex:1,minWidth:0}}>
          <span style={{display:'block',fontSize:10,color:C.muted,fontFamily:CZ,marginBottom:2}}>{th?.title}</span>
          <span style={{display:'block',fontSize:14,color:C.cream,fontFamily:CZ,marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ps.title}</span>
          <span style={{display:'block',fontSize:11,color:C.gold,fontFamily:CZ,letterSpacing:'0.06em'}}>{ps.ref}</span>
        </span>
        {!action&&<span style={{color:C.red,fontSize:18}}>›</span>}
      </button>
      {action}
    </div>
  )

  const header=()=>(
    <header style={{position:'sticky',top:0,zIndex:200,paddingTop:'var(--top-band, 0px)',background:darkMode?'#0F0A06':'#F7F2EA',borderBottom:`1px solid ${C.border}`}}>
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 18px',maxWidth:860,margin:'0 auto'}}>
        <img src="/icon.png" alt="" style={{width:36,height:36,borderRadius:9,boxShadow:'0 2px 8px rgba(0,0,0,0.2)',flexShrink:0}}/>
        <div style={{minWidth:0}}>
          <div style={{fontSize:15,fontWeight:600,color:C.cream,fontFamily:CZ,letterSpacing:'0.04em',lineHeight:1.1,whiteSpace:'nowrap'}}>The Red Letters</div>
          <div style={{fontSize:9,color:C.muted,letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:CZ}}>The Words of Jesus</div>
        </div>
        <span title="Passages read" style={{fontSize:11,color:C.red,background:C.redF,border:`1px solid ${C.redB}`,borderRadius:20,padding:'2px 9px',fontFamily:CZ,letterSpacing:'0.04em',whiteSpace:'nowrap',flexShrink:0}}>✦ {readCount}/{ALL_PASSAGES.length}</span>
        <span style={{marginLeft:'auto',fontSize:10,color:C.muted,fontFamily:CZ,letterSpacing:'0.06em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:110}}>{session?.user?.email?.split('@')[0]}</span>
      </div>
    </header>
  )

  const tabBar=()=>(
    <nav aria-label="Main" style={{position:'fixed',left:0,right:0,bottom:0,zIndex:450,background:darkMode?'rgba(15,10,6,0.97)':'rgba(247,242,234,0.97)',backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)',borderTop:`1px solid ${C.border}`,boxShadow:darkMode?'0 -8px 28px rgba(0,0,0,0.35)':'0 -8px 28px rgba(60,30,10,0.08)',paddingBottom:'env(safe-area-inset-bottom, 0px)'}}>
      <div style={{display:'flex',maxWidth:560,margin:'0 auto'}}>
        {[['read','📖','Read'],['search','🔍','Search'],['saved','⭐','Saved'],['progress','📊','Progress'],['settings','⚙️','Settings']].map(([id,icon,label])=>{
          const on=nav===id
          return (
            <button key={id} onClick={()=>goTab(id)} aria-current={on?'page':undefined}
              style={{flex:1,minHeight:TAB_BAR_H,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,background:'transparent',border:'none',cursor:'pointer',touchAction:'manipulation',padding:'8px 2px 6px',position:'relative'}}>
              {on&&<span style={{position:'absolute',top:0,left:'28%',right:'28%',height:2,borderRadius:2,background:C.red}}/>}
              <span style={{fontSize:21,lineHeight:1,filter:on?'none':'saturate(0.55)',opacity:on?1:0.78}}>{icon}</span>
              <span style={{fontSize:11,letterSpacing:'0.08em',textTransform:'uppercase',fontFamily:CZ,fontWeight:on?700:500,color:on?C.red:C.muted}}>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )

  const page=(content)=>(
    <div style={{minHeight:'100vh',background:C.bg,fontFamily:GA,color:C.text}}>
      {header()}
      {content}
      {sharePassage&&<ShareCard passage={sharePassage} theme={themeOf(sharePassage)} onClose={()=>setSharePassage(null)} C={C}/>}
      {memorizing&&selPassage&&<MemorizeModal text={firstPara(selPassage.text)} reference={selPassage.ref} isMemorized={isMemorized(selPassage.id)} onMark={()=>{if(userId)set(selPassage.id,'mem','true');setMemorizing(false)}} onClose={()=>setMemorizing(false)} C={C}/>}
      {tabBar()}
    </div>
  )

  // ── SETTINGS ──────────────────────────────────────────────────────────────
  if (nav==='settings') return (
    <>
      <Settings
        profile={profile}
        userId={userId}
        entries={entries}
        passages={ALL_PASSAGES}
        darkMode={darkMode}
        onToggleDarkMode={()=>{const n=!darkMode;setDarkMode(n);try{localStorage.setItem('rl_dark',n?'1':'0')}catch{};if(userId)set('__user_prefs__','dark_mode',n?'1':'0')}}
        onClose={()=>goTab('read')}
      />
      {tabBar()}
    </>
  )

  // ── PROGRESS ──────────────────────────────────────────────────────────────
  if (nav==='progress') {
    const passagesMem   = ALL_PASSAGES.filter(p => isMemorized(p.id)).length
    const journalCount  = entries.filter(e => e.field_key==='journal' && (e.field_value||'').trim()).length
    const themesExplored= THEMES.filter(t => t.passages.some(p => isRead(p.id))).length
    const total = ALL_PASSAGES.length
    const pct   = Math.round((readCount/total)*100)
    const tile = {background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14}
    return page(
      <div style={{maxWidth:560,margin:'0 auto',padding:`22px 18px ${PAD_BOTTOM}`}}>
        {pageTitle('The Red Letters','Your Progress')}
        <div style={{...tile,padding:18,border:`1px solid ${C.redB}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10}}>
            <div style={{fontSize:14,color:C.cream,fontFamily:CZ,letterSpacing:'0.04em'}}>Passages Studied</div>
            <div style={{fontSize:22,fontWeight:700,color:C.red,fontFamily:CZ}}>{readCount}<span style={{fontSize:13,color:C.muted,fontWeight:400}}> / {total}</span></div>
          </div>
          <div style={{height:6,background:C.redF,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',background:`linear-gradient(90deg,${C.red},${C.redL})`,width:`${pct}%`,transition:'width .4s ease'}}/></div>
          <div style={{fontSize:12,color:C.muted,textAlign:'center',marginTop:8}}>{pct}% complete</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10,marginTop:12}}>
          {[['🧠',passagesMem,'Memorized'],['📝',journalCount,'Journal Entries'],['⭐',savedIds.length,'Saved'],['🏛',`${themesExplored}/${THEMES.length}`,'Themes Explored']].map(([icon,val,label])=>(
            <div key={label} style={{...tile,padding:'16px 14px',textAlign:'center'}}>
              <div style={{fontSize:20,marginBottom:6}}>{icon}</div>
              <div style={{fontSize:26,fontWeight:700,color:C.red,fontFamily:CZ,lineHeight:1}}>{val}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:4}}>{label}</div>
            </div>
          ))}
        </div>
        <div style={{...LBL,marginTop:26,marginBottom:10}}>By Theme</div>
        <div style={{...tile,overflow:'hidden'}}>
          {THEMES.map((t,ti)=>{
            const done=t.passages.filter(p=>isRead(p.id)).length
            const tp=Math.round((done/t.passages.length)*100)
            return (
              <button key={t.id} onClick={()=>openTheme(t)} style={{width:'100%',textAlign:'left',background:'transparent',border:'none',borderBottom:ti<THEMES.length-1?`1px solid ${C.border}`:'none',padding:'14px 16px',cursor:'pointer',touchAction:'manipulation'}}>
                <span style={{display:'flex',alignItems:'center',gap:12,marginBottom:7}}>
                  <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
                  <span style={{flex:1,fontSize:14,color:C.cream,fontFamily:CZ,letterSpacing:'0.04em'}}>{t.title}</span>
                  <span style={{fontSize:12,color:done===t.passages.length?C.red:C.muted,fontFamily:CZ}}>{done}/{t.passages.length}</span>
                </span>
                <span style={{display:'block',height:4,background:C.border,borderRadius:2,overflow:'hidden'}}><span style={{display:'block',height:'100%',background:C.red,width:`${tp}%`,transition:'width .4s'}}/></span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── SEARCH ────────────────────────────────────────────────────────────────
  if (nav==='search') return page(
    <div style={{maxWidth:640,margin:'0 auto',padding:`22px 18px ${PAD_BOTTOM}`}}>
      {pageTitle('The Red Letters','Search')}
      <input autoFocus value={searchQ} onChange={e=>doSearch(e.target.value)} placeholder="A word, a theme or a reference…" aria-label="Search the words of Jesus" enterKeyHint="search"
        style={{width:'100%',background:darkMode?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.65)',border:`1px solid ${C.redB}`,borderRadius:12,color:C.cream,fontSize:17,padding:'13px 15px',fontFamily:GA,outline:'none',boxSizing:'border-box',marginBottom:16}}/>
      {searchQ?(
        <div>
          <div style={{fontSize:10,color:C.muted,fontFamily:CZ,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:10}}>{searchResults.length} {searchResults.length===1?'result':'results'}</div>
          {searchResults.length===0&&<p style={{fontSize:15,color:C.muted,fontStyle:'italic',textAlign:'center',padding:'16px 0'}}>No results. Try a different word.</p>}
          {searchResults.map(({passage:ps,theme:th})=>passageRow(ps,th))}
        </div>
      ):(
        <div style={{textAlign:'center',padding:'18px 0'}}>
          <p style={{fontSize:16,color:C.muted,fontStyle:'italic',marginBottom:14}}>Search all {ALL_PASSAGES.length} passages of the words of Jesus.</p>
          <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
            {['peace','forgive','worry','I am','Matthew 5','prayer'].map(s=>(
              <button key={s} onClick={()=>doSearch(s)} style={{background:C.redF,border:`1px solid ${C.redB}`,color:C.red,borderRadius:20,padding:'7px 14px',fontSize:14,fontFamily:GA,cursor:'pointer',touchAction:'manipulation'}}>{s}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  // ── SAVED ─────────────────────────────────────────────────────────────────
  if (nav==='saved') return page(
    <div style={{maxWidth:640,margin:'0 auto',padding:`22px 18px ${PAD_BOTTOM}`}}>
      {pageTitle('The Red Letters','Saved Passages')}
      {savedIds.length===0?(
        <div style={{textAlign:'center',padding:'36px 0'}}><div style={{fontSize:34,marginBottom:10,color:C.gold}}>☆</div><p style={{fontSize:16,color:C.muted,fontStyle:'italic'}}>Nothing saved yet. Tap ☆ on any passage to keep it here.</p></div>
      ):savedIds.map(sid=>{
        const found=ALL_PASSAGES.find(p=>p.id===sid);if(!found)return null
        return passageRow(found,themeOf(found),
          <button onClick={()=>toggleSave(sid)} aria-label="Remove from saved" style={{...iconBtn(true),width:48,height:'auto',borderRadius:12,fontSize:18}}>★</button>)
      })}
    </div>
  )

  // ── READ: HOME ────────────────────────────────────────────────────────────
  if (view==='home'||!selTheme) {
    const today=todaysPassage(), todayTheme=themeOf(today)
    const last=lastId&&lastId!==today.id?ALL_PASSAGES.find(p=>p.id===lastId):null
    return page(
      <div style={{maxWidth:860,margin:'0 auto',padding:`20px 18px ${PAD_BOTTOM}`}}>
        {/* Today's Words: the one focal card */}
        <section aria-label="Today's words" style={{background:darkMode?'linear-gradient(150deg,rgba(201,64,64,0.15),rgba(201,64,64,0.04))':'linear-gradient(150deg,rgba(139,26,26,0.09),rgba(139,26,26,0.025))',border:`1px solid ${C.redB}`,borderRadius:18,padding:'18px 20px 20px',marginBottom:12,boxShadow:darkMode?'none':'0 10px 28px rgba(80,30,10,0.07)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginBottom:10}}>
            <span style={{fontSize:10,color:C.red,letterSpacing:'0.18em',textTransform:'uppercase',fontFamily:CZ}}>Today's Words</span>
            <span style={{fontSize:13,color:C.muted,fontStyle:'italic',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{todayTheme?.icon} {todayTheme?.title}</span>
          </div>
          <h2 style={{fontSize:20,fontWeight:600,color:C.cream,fontFamily:CZ,letterSpacing:'0.03em',lineHeight:1.25,margin:'0 0 4px'}}>{today.title}</h2>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>{refText(today)}{badge(today)}{isRead(today.id)&&<span style={{fontSize:11,color:C.muted}}>✓ Read</span>}</div>
          <p style={{fontSize:19,lineHeight:1.75,color:C.red,fontStyle:'italic',margin:'0 0 16px',...clamp(4)}}>“{excerpt(today)}”</p>
          <div style={{display:'flex',gap:10,alignItems:'stretch'}}>
            <button onClick={()=>openPassage(today,todayTheme)} style={btnPrimary}>Read &amp; Study</button>
            <button onClick={()=>listen(today)} aria-pressed={listening===today.id} style={btnSecondary}>{listening===today.id?'■ Stop':'🔊 Listen'}</button>
          </div>
        </section>

        {last&&(
          <button onClick={()=>openPassage(last)} style={{width:'100%',display:'flex',alignItems:'center',gap:12,textAlign:'left',background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,padding:'13px 16px',cursor:'pointer',touchAction:'manipulation'}}>
            <span style={{fontSize:22,flexShrink:0}}>{themeOf(last)?.icon}</span>
            <span style={{flex:1,minWidth:0}}>
              <span style={{display:'block',fontSize:9,color:C.muted,letterSpacing:'0.16em',textTransform:'uppercase',fontFamily:CZ,marginBottom:3}}>Pick up where you left off</span>
              <span style={{display:'block',fontSize:15,color:C.cream,fontFamily:CZ,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{last.title}</span>
            </span>
            <span style={{color:C.red,fontSize:18}}>›</span>
          </button>
        )}

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',margin:'26px 0 12px'}}>
          <span style={{...LBL,marginBottom:0}}>Themes</span>
          <span style={{fontSize:11,color:C.muted,fontFamily:CZ,letterSpacing:'0.04em'}}>{readCount} of {ALL_PASSAGES.length} read</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:10}}>
          {THEMES.map(t=>{
            const done=t.passages.filter(p=>isRead(p.id)).length
            const full=done===t.passages.length
            return (
              <button key={t.id} onClick={()=>openTheme(t)} style={{textAlign:'left',background:C.bgCard,border:`1px solid ${full?C.redB:C.border}`,borderRadius:14,padding:'14px 14px 12px',cursor:'pointer',display:'flex',flexDirection:'column',gap:6,minHeight:132,touchAction:'manipulation'}}>
                <span style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',width:'100%'}}>
                  <span style={{fontSize:24,lineHeight:1}}>{t.icon}</span>
                  {full&&<span style={{fontSize:11,color:C.red,fontFamily:CZ}}>✓</span>}
                </span>
                <span style={{fontSize:14,fontWeight:600,color:C.cream,fontFamily:CZ,letterSpacing:'0.03em',lineHeight:1.2}}>{t.title}</span>
                <span style={{fontSize:14,color:C.muted,fontStyle:'italic',lineHeight:1.35,...clamp(2)}}>{t.subtitle}</span>
                <span style={{marginTop:'auto',display:'flex',alignItems:'center',gap:8,width:'100%'}}>
                  <span style={{flex:1,height:3,background:C.border,borderRadius:2,overflow:'hidden'}}><span style={{display:'block',height:'100%',width:`${Math.round(done/t.passages.length*100)}%`,background:C.red}}/></span>
                  <span style={{fontSize:10,color:C.muted,fontFamily:CZ}}>{done}/{t.passages.length}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── READ: THEME ───────────────────────────────────────────────────────────
  if (view==='theme'||!selPassage) {
    const idx=THEMES.findIndex(t=>t.id===selTheme.id), prevT=THEMES[idx-1], nextT=THEMES[idx+1]
    const done=selTheme.passages.filter(p=>isRead(p.id)).length
    return page(
      <div style={{maxWidth:860,margin:'0 auto',padding:`10px 18px ${PAD_BOTTOM}`}}>
        <button onClick={goHome} style={backLink}>‹ All themes</button>
        <div style={{display:'flex',alignItems:'center',gap:12,margin:'8px 0 6px'}}>
          <button onClick={()=>prevT&&openTheme(prevT)} disabled={!prevT} aria-label="Previous theme" style={{...navBtn,opacity:prevT?1:0.3}}>‹</button>
          <div style={{flex:1,textAlign:'center'}}>
            <div style={kicker}>{selTheme.icon} Theme {idx+1} of {THEMES.length}</div>
            <button onClick={()=>setShowThemeJump(v=>!v)} aria-expanded={showThemeJump} style={{background:'transparent',border:'none',cursor:'pointer',padding:0,touchAction:'manipulation'}}>
              <h2 style={{fontSize:23,fontWeight:700,color:C.cream,fontFamily:CZ,letterSpacing:'0.03em',lineHeight:1.15,margin:0}}>{selTheme.title} <span style={{fontSize:12,color:C.muted}}>{showThemeJump?'▲':'▼'}</span></h2>
            </button>
            <p style={{fontSize:15,color:C.muted,fontStyle:'italic',margin:'4px 0 0'}}>{selTheme.subtitle}</p>
          </div>
          <button onClick={()=>nextT&&openTheme(nextT)} disabled={!nextT} aria-label="Next theme" style={{...navBtn,opacity:nextT?1:0.3}}>›</button>
        </div>
        {showThemeJump&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(96px,1fr))',gap:6,background:C.bgMid,border:`1px solid ${C.border}`,borderRadius:14,padding:10,margin:'10px 0'}}>
            {THEMES.map(t=><button key={t.id} onClick={()=>openTheme(t)} style={{background:t.id===selTheme.id?C.redF:'transparent',border:`1px solid ${t.id===selTheme.id?C.redB:C.border}`,color:t.id===selTheme.id?C.red:C.muted,borderRadius:10,padding:'10px 6px',cursor:'pointer',fontSize:10,fontFamily:CZ,textAlign:'center',lineHeight:1.35,touchAction:'manipulation'}}><div style={{fontSize:18,marginBottom:3}}>{t.icon}</div><div>{t.title}</div></button>)}
          </div>
        )}
        <div style={{display:'flex',alignItems:'center',gap:10,margin:'14px 0 18px'}}>
          <div style={{flex:1,height:3,background:C.border,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',background:C.red,width:`${done/selTheme.passages.length*100}%`,transition:'width .4s ease'}}/></div>
          <span style={{fontSize:11,color:C.muted,fontFamily:CZ}}>{done} of {selTheme.passages.length} read</span>
        </div>
        {selTheme.passages.map((p,i)=>(
          <div key={p.id} role="button" tabIndex={0} onClick={()=>openPassage(p,selTheme)} onKeyDown={e=>{if(e.key==='Enter')openPassage(p,selTheme)}}
            style={{background:C.bgCard,border:`1px solid ${C.redB}`,borderRadius:16,padding:'18px 20px 16px',marginBottom:12,cursor:'pointer',boxShadow:darkMode?'none':'0 6px 18px rgba(80,30,10,0.05)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:8}}>
              <div>
                <div style={{fontSize:10,color:C.muted,fontFamily:CZ,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:3}}>Passage {i+1}</div>
                <div style={{fontSize:15,fontWeight:600,color:C.cream,fontFamily:CZ,letterSpacing:'0.03em',lineHeight:1.3}}>{p.title}</div>
              </div>
              <button onClick={e=>{e.stopPropagation();toggleSave(p.id)}} aria-label={isSaved(p.id)?'Remove from saved':'Save passage'} style={{...iconBtn(isSaved(p.id)),width:36,height:36,flexShrink:0}}>{isSaved(p.id)?'★':'☆'}</button>
            </div>
            <p style={{fontSize:18,lineHeight:1.75,color:C.red,fontStyle:'italic',margin:'0 0 12px',...clamp(3)}}>{excerpt(p)}</p>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              {refText(p)}{badge(p)}
              <span style={{marginLeft:'auto',display:'flex',gap:10,fontSize:11,fontFamily:CZ}}>
                {isMemorized(p.id)&&<span style={{color:C.green}}>✦ Memorized</span>}
                {isRead(p.id)&&<span style={{color:C.muted}}>✓ Read</span>}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── READ: PASSAGE ─────────────────────────────────────────────────────────
  const p=selPassage, t=selTheme
  const pIdx=t.passages.findIndex(x=>x.id===p.id), prevP=t.passages[pIdx-1], nextP=t.passages[pIdx+1]
  const sIdx=Math.max(0,TABS.findIndex(x=>x.id===tab)), sec=TABS[sIdx], prevS=TABS[sIdx-1], nextS=TABS[sIdx+1]
  const journalVal=get(p.id,'journal')
  return page(
    <div style={{maxWidth:760,margin:'0 auto',padding:`6px 18px ${PAD_BOTTOM}`}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
        <button onClick={()=>{quiet();setView('theme');top()}} style={backLink}>‹ {t.icon} {t.title}</button>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>toggleSave(p.id)} aria-label={isSaved(p.id)?'Remove from saved':'Save passage'} style={iconBtn(isSaved(p.id))}>{isSaved(p.id)?'★':'☆'}</button>
          <button onClick={()=>setSharePassage(p)} aria-label="Share this passage" style={iconBtn(false)}>↗</button>
        </div>
      </div>

      <div style={{display:'flex',alignItems:'center',gap:12,margin:'10px 0 4px'}}>
        <button onClick={()=>prevP&&openPassage(prevP,t)} disabled={!prevP} aria-label="Previous passage" style={{...navBtn,opacity:prevP?1:0.3}}>‹</button>
        <div style={{flex:1,textAlign:'center'}}>
          <div style={kicker}>Passage {pIdx+1} of {t.passages.length}</div>
          <h2 style={{fontSize:21,fontWeight:700,color:C.cream,fontFamily:CZ,letterSpacing:'0.03em',lineHeight:1.2,margin:'0 0 6px'}}>{p.title}</h2>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>{refText(p)}{badge(p)}</div>
        </div>
        <button onClick={()=>nextP&&openPassage(nextP,t)} disabled={!nextP} aria-label="Next passage" style={{...navBtn,opacity:nextP?1:0.3}}>›</button>
      </div>

      {/* Study sections: one segment each, tap any to jump; the name opens the full list */}
      <div style={{margin:'16px 0 8px'}}>
        <div role="tablist" aria-label="Study sections" style={{display:'flex',gap:4}}>
          {TABS.map((s,i)=>(
            <button key={s.id} role="tab" aria-selected={i===sIdx} aria-label={s.name} onClick={()=>goSection(s.id)} style={{flex:1,background:'transparent',border:'none',padding:'9px 0',cursor:'pointer',touchAction:'manipulation'}}>
              <span style={{display:'block',height:4,borderRadius:2,background:i<=sIdx?C.red:C.border,opacity:i<sIdx?0.5:1}}/>
            </button>
          ))}
        </div>
        <button onClick={()=>setShowSections(v=>!v)} aria-expanded={showSections} style={{display:'flex',alignItems:'center',gap:8,margin:'2px auto 0',background:'transparent',border:'none',cursor:'pointer',fontFamily:CZ,color:C.cream,fontSize:15,letterSpacing:'0.04em',padding:'6px 10px',touchAction:'manipulation'}}>
          <span style={{fontSize:16}}>{sec.icon}</span>{sec.name}<span style={{fontSize:11,color:C.muted}}>{sIdx+1} of {TABS.length} {showSections?'▲':'▼'}</span>
        </button>
        {showSections&&(
          <div style={{marginTop:8,background:C.bgMid,border:`1px solid ${C.border}`,borderRadius:14,overflow:'hidden'}}>
            {TABS.map((s,i)=>(
              <button key={s.id} onClick={()=>goSection(s.id)} style={{width:'100%',display:'flex',alignItems:'center',gap:12,textAlign:'left',background:i===sIdx?C.redF:'transparent',border:'none',borderBottom:i<TABS.length-1?`1px solid ${C.border}`:'none',padding:'12px 16px',cursor:'pointer',touchAction:'manipulation'}}>
                <span style={{fontSize:17,width:22,textAlign:'center'}}>{s.icon}</span>
                <span style={{flex:1,fontSize:14,fontFamily:CZ,letterSpacing:'0.04em',color:i===sIdx?C.red:C.cream}}>{s.name}</span>
                <span style={{fontSize:13,color:C.muted,fontStyle:'italic'}}>{s.hint}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{marginTop:14}}>
        {tab==='passage'&&(
          <div>
            <div style={{background:darkMode?'linear-gradient(145deg,rgba(201,64,64,0.12),rgba(201,64,64,0.03))':'linear-gradient(145deg,rgba(139,26,26,0.08),rgba(139,26,26,0.02))',border:`1px solid ${C.redB}`,borderRadius:18,padding:'26px 24px 22px',boxShadow:darkMode?'none':'0 8px 24px rgba(80,30,10,0.06)'}}>
              <div style={{textAlign:'center',color:C.gold,fontSize:11,opacity:0.5,marginBottom:16,letterSpacing:'1.2em',paddingLeft:'1.2em'}}>✦ ✦ ✦</div>
              {p.text.split('\n\n').map((para,i,all)=>(
                <p key={i} style={{fontSize:20,lineHeight:1.9,color:C.red,fontStyle:'italic',margin:i<all.length-1?'0 0 18px':0,letterSpacing:'0.01em',whiteSpace:'pre-line'}}>{para}</p>
              ))}
              <div style={{marginTop:16,textAlign:'right'}}>{refText(p)}</div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:14,flexWrap:'wrap'}}>
              <button onClick={()=>listen(p)} aria-pressed={listening===p.id} style={{...btnSecondary,flex:1}}>{listening===p.id?'■ Stop':'🔊 Listen'}</button>
              <button onClick={()=>setMemorizing(true)} style={{...btnSecondary,flex:1,color:isMemorized(p.id)?C.green:C.red,borderColor:isMemorized(p.id)?C.greenB:C.redB}}>{isMemorized(p.id)?'✦ Memorized':'🧠 Memorize'}</button>
            </div>
          </div>
        )}

        {tab==='context'&&(<ProseSection label="Setting & Context" text={p.context} accent="gold" C={C} />)}

        {tab==='meaning'&&(<ProseSection label="What Jesus Meant" text={p.meaning} accent="gold" C={C} />)}

        {tab==='lexicon'&&(
          <div>
            <SectionHeader label="Word Study" C={C} />
            <p style={{fontSize:15,color:C.muted,fontStyle:'italic',margin:'-6px 0 16px',lineHeight:1.7,textAlign:'center'}}>The Greek (or Aramaic) behind the English.</p>
            {(p.lexicon || []).map((entry, i) => (
              <div key={i} style={{background:'linear-gradient(145deg,rgba(139,106,46,0.08),rgba(139,106,46,0.02))',border:`1px solid ${C.goldB}`,borderRadius:14,padding:'20px 22px 18px',marginBottom:14}}>
                <div style={{fontSize:18,fontFamily:CZ,color:C.cream,letterSpacing:'0.04em',marginBottom:6}}>{entry.word}</div>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:2}}>
                  <div style={{fontSize:16,color:C.gold,fontFamily:GA,fontStyle:'italic',flex:1}}>{entry.original}</div>
                  <button onClick={() => speak(entry)} aria-label="Hear pronunciation" style={{background:speaking?C.redF:'transparent',border:`1px solid ${C.goldB}`,color:C.gold,width:36,height:36,borderRadius:"50%",cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,padding:0,touchAction:"manipulation"}}>{speaking?"▶":"🔊"}</button>
                </div>
                <div style={{fontSize:10,color:C.muted,fontFamily:CZ,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:12}}>{entry.language}</div>
                <div style={{height:1,background:C.goldB,marginBottom:12}} />
                <p style={{fontSize:17,color:C.text,lineHeight:1.85,marginBottom:entry.note?12:0,fontFamily:GA}}>{entry.meaning}</p>
                {entry.note && <p style={{fontSize:15,color:C.muted,lineHeight:1.8,fontStyle:'italic',fontFamily:GA,margin:0}}>{entry.note}</p>}
              </div>
            ))}
            {(!p.lexicon || p.lexicon.length === 0) && (
              <p style={{fontSize:15,color:C.muted,fontStyle:'italic',textAlign:'center',padding:'24px 0'}}>No word study for this passage yet.</p>
            )}
          </div>
        )}

        {tab==='apply'&&(<ProseSection label="Live It Out" text={p.apply} accent="red" C={C} />)}

        {tab==='prayer'&&(<PrayerSection text={p.prayer} C={C} />)}

        {tab==='journal'&&(
          <div>
            <SectionHeader label="Journal" C={C} />
            <p style={{fontSize:16,color:C.muted,fontStyle:'italic',lineHeight:1.7,margin:'-6px 0 14px',textAlign:'center'}}>What is Jesus saying to you through this passage? What does it ask of you?</p>
            <textarea rows={10} value={journalVal} onChange={e=>set(p.id,'journal',e.target.value)} placeholder="Write your reflection here…" aria-label="Journal"
              style={{width:'100%',background:darkMode?'rgba(255,255,255,0.03)':'rgba(255,255,255,0.6)',border:`1px solid ${C.borderGold}`,borderRadius:14,color:C.cream,fontSize:17,lineHeight:1.9,padding:'16px 18px',fontFamily:GA,outline:'none',resize:'vertical',boxSizing:'border-box',minHeight:220}}/>
            <button onClick={async()=>{if(userId){await supabase.from('rl_entries').upsert({user_id:userId,saying_id:p.id,field_key:'journal',field_value:journalVal,updated_at:new Date().toISOString()},{onConflict:'user_id,saying_id,field_key'})}setJournalSaved(true);setTimeout(()=>setJournalSaved(false),2000)}}
              style={{width:'100%',marginTop:12,background:journalSaved?C.greenF:'transparent',border:`1px solid ${journalSaved?C.greenB:C.redB}`,color:journalSaved?C.green:C.red,padding:'13px',borderRadius:12,cursor:'pointer',fontSize:13,fontFamily:CZ,letterSpacing:'0.08em',transition:'all .25s'}}>
              {journalSaved?'✓ Saved':'Save Entry'}
            </button>
          </div>
        )}
      </div>

      {/* Step through: previous / next section, then the next passage */}
      <div style={{display:'flex',gap:10,marginTop:28}}>
        {prevS&&<button onClick={()=>goSection(prevS.id)} style={{...btnSecondary,flex:'0 1 auto',maxWidth:'45%',overflow:'hidden',textOverflow:'ellipsis'}}>‹ {prevS.short}</button>}
        {nextS
          ?<button onClick={()=>goSection(nextS.id)} style={btnPrimary}>{nextS.name} ›</button>
          :nextP
            ?<button onClick={()=>openPassage(nextP,t)} style={btnPrimary}>Next Passage ›</button>
            :<button onClick={()=>{quiet();setView('theme');top()}} style={btnPrimary}>Back to {t.title}</button>}
      </div>
    </div>
  )
}
